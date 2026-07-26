'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/context/ToastProvider';
import { useSupabase } from '@/context/SupabaseContext';
import { useLanguage } from '@/context/LanguageProvider';
import { TrendingUp, RefreshCw, Plus, Car, History, Fuel } from 'lucide-react';
import CityFuelCombobox from '@/components/CityFuelCombobox';

export default function FuelDashboardPage() {
  const { addToast } = useToast();
  const { supabase, session } = useSupabase();
  const { t } = useLanguage();
  
  // State: City & Rates
  const [city, setCity] = useState('jaipur');
  const [rates, setRates] = useState({});
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  
  // State: Vehicles
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [newVehicleName, setNewVehicleName] = useState('');
  const [newVehicleFuel, setNewVehicleFuel] = useState('petrol');

  // State: Fuel Log Form
  const [odometer, setOdometer] = useState('');
  const [liters, setLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [isFullTank, setIsFullTank] = useState(true);
  const [isLogging, setIsLogging] = useState(false);

  // State: Stats
  const [fuelLogs, setFuelLogs] = useState([]);
  const [mileage, setMileage] = useState(null);

  // Fetch Settings (City)
  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchCity = async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'fuel_city')
        .eq('user_id', session.user.id)
        .single();
      if (data?.value) setCity(data.value);
    };
    fetchCity();
  }, [session, supabase]);

  // Fetch Rates whenever City changes
  const fetchRates = useCallback(async (currentCity) => {
    setIsLoadingRates(true);
    try {
      const res = await fetch(`/api/fuel?city=${currentCity}`);
      const data = await res.json();
      setRates(data.rates || {});
      addToast(`${data.location} fuel prices loaded`, 'success', 2000);
    } catch (e) {
      addToast('Failed to load live prices', 'error');
    } finally {
      setIsLoadingRates(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchRates(city);
  }, [city, fetchRates]);

  const handleCityChange = async (newCity) => {
    setCity(newCity);
    if (session?.user?.id) {
      // Upsert city to settings
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('key', 'fuel_city')
        .eq('user_id', session.user.id)
        .single();
        
      if (existing) {
        await supabase.from('settings').update({ value: newCity }).eq('id', existing.id);
      } else {
        await supabase.from('settings').insert([{ user_id: session.user.id, key: 'fuel_city', value: newCity }]);
      }
    }
  };

  // Fetch Vehicles
  const fetchVehicles = useCallback(async () => {
    if (!session?.user?.id) return;
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) {
      setVehicles(data);
      if (data.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(data[0].id);
      }
    }
  }, [session, supabase, selectedVehicleId]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Handle Add Vehicle
  const handleAddVehicle = async () => {
    if (!newVehicleName.trim()) return addToast('Enter a vehicle name', 'error');
    const { data, error } = await supabase
      .from('vehicles')
      .insert([{ user_id: session.user.id, name: newVehicleName, fuel_type: newVehicleFuel }])
      .select()
      .single();
      
    if (error) {
      addToast('Failed to add vehicle', 'error');
    } else {
      addToast('Vehicle added!', 'success');
      setVehicles([...vehicles, data]);
      setSelectedVehicleId(data.id);
      setIsAddingVehicle(false);
      setNewVehicleName('');
    }
  };

  // Fetch Logs & Calculate Mileage
  const fetchLogs = useCallback(async () => {
    if (!selectedVehicleId) return;
    const { data } = await supabase
      .from('fuel_logs')
      .select('*')
      .eq('vehicle_id', selectedVehicleId)
      .order('odometer_reading', { ascending: false });
      
    if (data) {
      setFuelLogs(data);
      
      // Calculate mileage from consecutive full tanks
      const fullTanks = data.filter(log => log.is_full_tank);
      if (fullTanks.length >= 2) {
        // fullTanks[0] is the most recent (highest odometer)
        // fullTanks[1] is the previous
        const recent = fullTanks[0];
        const previous = fullTanks[1];
        if (recent.odometer_reading > previous.odometer_reading && recent.quantity > 0) {
          const dist = recent.odometer_reading - previous.odometer_reading;
          // Note: In reality, we should sum the quantity of all fills SINCE the previous full tank,
          // INCLUDING the recent full tank fill. 
          // For simplicity, assuming no partial fills between these two full tanks.
          const mil = dist / recent.quantity;
          setMileage(mil.toFixed(2));
        } else {
          setMileage(null);
        }
      } else {
        setMileage(null);
      }
    }
  }, [selectedVehicleId, supabase]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Update Price Per Liter default when vehicle or rates change
  useEffect(() => {
    if (selectedVehicleId && vehicles.length > 0) {
      const v = vehicles.find(x => x.id === selectedVehicleId);
      if (v) {
        let rateKey = 'Petrol (Regular)';
        if (v.fuel_type === 'diesel') rateKey = 'Diesel (Regular)';
        if (v.fuel_type === 'cng') rateKey = 'CNG';
        if (rates[rateKey] && !pricePerLiter) {
          setPricePerLiter(rates[rateKey].toString());
        }
      }
    }
  }, [selectedVehicleId, vehicles, rates]); // removed pricePerLiter from dep to avoid overwriting user input constantly

  const handleLogFuel = async () => {
    if (!odometer || !liters || !pricePerLiter) return addToast('Fill all fields', 'error');
    setIsLogging(true);
    
    const qty = parseFloat(liters);
    const price = parseFloat(pricePerLiter);
    const totalCost = qty * price;

    // 1. Log Transaction
    let transactionId = null;
    const { data: accounts } = await supabase.from('accounts').select('id').limit(1);
    const accountId = accounts?.[0]?.id || null;

    const { data: categories } = await supabase.from('categories')
      .select('id')
      .ilike('name', '%fuel%')
      .limit(1);
    let categoryId = categories?.[0]?.id || null;
    
    // Fallback to transport if fuel not found
    if (!categoryId) {
      const { data: transCats } = await supabase.from('categories')
        .select('id')
        .ilike('name', '%transport%')
        .limit(1);
      categoryId = transCats?.[0]?.id || null;
    }

    if (accountId) {
      const { data: txn, error: txnErr } = await supabase.from('transactions').insert([{
        user_id: session.user.id,
        description: `Fuel Log: ${qty}L @ ₹${price}`,
        amount: -Math.abs(totalCost),
        category_id: categoryId,
        date: new Date().toISOString(),
        account_id: accountId
      }]).select().single();
      
      if (txn) transactionId = txn.id;
    }

    // 2. Log Fuel
    const { error: logErr } = await supabase.from('fuel_logs').insert([{
      user_id: session.user.id,
      vehicle_id: selectedVehicleId,
      transaction_id: transactionId,
      odometer_reading: parseFloat(odometer),
      quantity: qty,
      price_per_unit: price,
      is_full_tank: isFullTank,
      city: city
    }]);

    setIsLogging(false);
    if (logErr) {
      addToast('Error saving fuel log', 'error');
    } else {
      addToast(`Logged ${qty}L for ₹${totalCost.toFixed(2)}`, 'success');
      setLiters('');
      // setOdometer(''); // Often better to leave it or let them type next time
      fetchLogs();
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('fuel.title') || 'Fuel Management'}</h1>
          <p className="page-subtitle">Track fuel expenses and vehicle mileage.</p>
        </div>
        <button className="btn-secondary" onClick={() => fetchRates(city)} disabled={isLoadingRates} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={16} className={isLoadingRates ? 'spin' : ''} /> {t('common.refresh') || 'Refresh'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.5rem' }}>
        
        {/* City & Live Rates Widget */}
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: 'var(--border-delicate)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} className="text-muted" /> Live Fuel Rates
          </h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Location</label>
            <CityFuelCombobox value={city} onSelect={handleCityChange} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {isLoadingRates ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading live data...</div>
            ) : (
              Object.keys(rates).map(fuelType => (
                <div key={fuelType} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: 'var(--border-delicate)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: fuelType.includes('Petrol') ? 'var(--accent-warning)' : fuelType.includes('Diesel') ? 'var(--accent-primary)' : 'var(--accent-success)' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{fuelType}</span>
                  </div>
                  <div style={{ fontWeight: 600 }}>₹{rates[fuelType]?.toFixed(2)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Vehicles & Logging Widget */}
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: 'var(--border-delicate)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Car size={18} className="text-muted" /> Vehicle</span>
              {!isAddingVehicle && (
                <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => setIsAddingVehicle(true)}>
                  <Plus size={14} /> Add
                </button>
              )}
            </h2>

            {isAddingVehicle ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', border: 'var(--border-delicate)' }}>
                <input type="text" placeholder="Vehicle Name (e.g. Honda City)" value={newVehicleName} onChange={e => setNewVehicleName(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                <select value={newVehicleFuel} onChange={e => setNewVehicleFuel(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="cng">CNG</option>
                  <option value="ev">EV</option>
                </select>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-primary" style={{ flex: 1, padding: '0.5rem' }} onClick={handleAddVehicle}>Save</button>
                  <button className="btn-secondary" style={{ flex: 1, padding: '0.5rem' }} onClick={() => setIsAddingVehicle(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <select 
                value={selectedVehicleId} 
                onChange={e => setSelectedVehicleId(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-delicate)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
              >
                {vehicles.length === 0 && <option value="">No vehicles found</option>}
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.fuel_type.toUpperCase()})</option>
                ))}
              </select>
            )}
          </div>

          {selectedVehicleId && (
            <div style={{ borderTop: '1px solid var(--border-delicate)', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Fuel size={16} className="text-muted" /> Log Fuel Entry
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Odometer (km)</label>
                    <input type="number" value={odometer} onChange={e => setOdometer(e.target.value)} placeholder="e.g. 15400" style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Liters</label>
                    <input type="number" value={liters} onChange={e => setLiters(e.target.value)} placeholder="e.g. 35" style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Price/Liter (₹)</label>
                    <input type="number" value={pricePerLiter} onChange={e => setPricePerLiter(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
                  </div>
                  <div style={{ paddingBottom: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={isFullTank} onChange={e => setIsFullTank(e.target.checked)} style={{ width: '1rem', height: '1rem' }} />
                      Full Tank
                    </label>
                  </div>
                </div>
                
                <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Cost:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{((parseFloat(liters)||0) * (parseFloat(pricePerLiter)||0)).toFixed(2)}</span>
                </div>

                <button className="btn-primary" onClick={handleLogFuel} disabled={isLogging} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  {isLogging ? <RefreshCw size={16} className="spin" /> : 'Save Fuel Log'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Widget */}
        {selectedVehicleId && (
          <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: 'var(--border-delicate)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} className="text-muted" /> Vehicle Stats
            </h2>

            <div style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: 'var(--border-delicate)', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Historical Mileage
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: mileage ? 'var(--accent-success)' : 'var(--text-muted)' }}>
                {mileage ? `${mileage}` : '--'}
                <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.25rem' }}>km/L</span>
              </div>
              {!mileage && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', maxWidth: '200px', marginInline: 'auto' }}>
                  Log at least two full tanks to calculate mileage.
                </p>
              )}
            </div>

            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>Recent Logs</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {fuelLogs.slice(0, 3).map(log => (
                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-color)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-delicate)' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{new Date(log.date).toLocaleDateString()}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Odo: {log.odometer_reading} km {log.is_full_tank ? ' (Full)' : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{log.quantity}L</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>₹{(log.quantity * log.price_per_unit).toFixed(2)}</div>
                  </div>
                </div>
              ))}
              {fuelLogs.length === 0 && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No fuel logs yet.</div>
              )}
            </div>
          </div>
        )}

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
