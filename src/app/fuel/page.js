'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastProvider';
import { useSupabase } from '@/context/SupabaseContext';
import { useLanguage } from '@/context/LanguageProvider';
import { Fuel, Settings, Calculator, Droplet, TrendingUp, RefreshCw, MapPin, Plus } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';
import { motion } from 'framer-motion';

export default function FuelCalculatorPage() {
  const { addToast } = useToast();
  const { supabase } = useSupabase();
  const { t } = useLanguage();
  const [rates, setRates] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedFuel, setSelectedFuel] = useState('Petrol (Regular)');
  const [inputMode, setInputMode] = useState('rupees'); // 'rupees' or 'liters'
  const [amount, setAmount] = useState('');
  
  // Trip Calculator State
  const [distance, setDistance] = useState('');
  const [efficiency, setEfficiency] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  const fetchRates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/fuel');
      const data = await res.json();
      setRates(data.rates);
      addToast(`Live Jaipur fuel prices loaded`, 'success', 2000);
    } catch (e) {
      addToast('Failed to load live prices, using fallbacks', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const calculateResult = () => {
    if (!amount || isNaN(amount) || !rates[selectedFuel]) return 0;
    
    const rate = rates[selectedFuel];
    if (inputMode === 'rupees') {
      // You have rupees, how many liters?
      return (parseFloat(amount) / rate).toFixed(2);
    } else {
      // You have liters, how many rupees?
      return (parseFloat(amount) * rate).toFixed(2);
    }
  };

  const tripLiters = (distance && efficiency && !isNaN(distance) && !isNaN(efficiency)) ? (parseFloat(distance) / parseFloat(efficiency)).toFixed(2) : 0;
  const tripCost = (tripLiters > 0 && rates[selectedFuel]) ? (tripLiters * rates[selectedFuel]).toFixed(2) : 0;

  const logFuelExpense = async () => {
    if (!tripCost || tripCost <= 0) {
      addToast('Calculate a valid trip cost first', 'error');
      return;
    }
    
    setIsLogging(true);
    
    // Attempt to get a default account to log against (just picking the first one for simplicity)
    const { data: accounts } = await supabase.from('accounts').select('id').limit(1);
    const accountId = accounts?.[0]?.id || null;

    // Attempt to find a 'Fuel' or 'Transport' category
    const { data: categories } = await supabase.from('categories')
      .select('id')
      .ilike('name', '%fuel%')
      .limit(1);
    const categoryId = categories?.[0]?.id || null;

    const { error } = await supabase.from('transactions').insert([{
      description: `Fuel for ${distance}km trip`,
      amount: -Math.abs(parseFloat(tripCost)), // Ensure it's a negative amount for expense
      type: 'expense',
      category_id: categoryId,
      date: new Date().toISOString(),
      account_id: accountId
    }]);

    setIsLogging(false);

    if (error) {
      addToast('Failed to log fuel expense', 'error');
    } else {
      addToast(`₹${tripCost} logged as Fuel Expense!`, 'success');
      setDistance('');
      setEfficiency('');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('fuel.title') || 'Fuel Calculator'}</h1>
          <p className="page-subtitle">{t('fuel.subtitle') || 'Calculate trip costs based on live prices.'}</p>
        </div>
        <button className="btn-secondary" onClick={fetchRates} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={16} className={isLoading ? 'spin' : ''} /> {t('common.refresh') || 'Refresh Live Rates'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.5rem' }}>

        {/* Trip Calculator & Expense Logger */}
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: 'var(--border-delicate)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={18} className="text-muted" /> {t('fuel.tripCostEstimator') || 'Trip Cost Estimator'}
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('fuel.distance') || 'Trip Distance'}</span>
              <div style={{ position: 'relative', width: '120px' }}>
                <input type="number" placeholder={t('fuel.enterKm') || 'Enter km'} value={distance} onChange={(e) => setDistance(e.target.value)} style={{ paddingRight: '2rem' }} />
                <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>km</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('fuel.efficiency') || 'Fuel Efficiency'}</span>
              <div style={{ position: 'relative', width: '120px' }}>
                <input type="number" placeholder={t('fuel.enterKml') || 'Enter km/l'} value={efficiency} onChange={(e) => setEfficiency(e.target.value)} style={{ paddingRight: '2rem' }} />
                <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>km/l</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('fuel.liveFuelPrice') || 'Live Fuel Price'}</span>
              <div style={{ position: 'relative', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <CustomSelect 
                  style={{ maxWidth: '140px' }}
                  options={Object.keys(rates).map(f => ({ value: f, label: f }))}
                  value={selectedFuel}
                  onChange={setSelectedFuel}
                />
                <div style={{ position: 'relative', width: '90px' }}>
                  <input type="text" value={rates[selectedFuel] ? rates[selectedFuel].toFixed(2) : '0.00'} readOnly style={{ paddingLeft: '1.25rem', background: 'var(--bg-color)', color: 'var(--text-muted)' }} />
                  <span style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '0.5rem', padding: '1rem', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {t('fuel.tripSummary1') || 'This trip will require'} <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{tripLiters} {t('fuel.volume') || 'liters'}</span> {t('fuel.tripSummary2') || 'of fuel, which amounts to a fuel cost of'} <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>₹{tripCost}</span>
              </p>
            </div>

            <button 
              className="btn-primary" 
              style={{ width: '100%', marginTop: '0.5rem', background: 'var(--accent-primary)', color: 'var(--bg-surface)' }}
              onClick={logFuelExpense}
              disabled={isLogging || tripCost <= 0}
            >
              {isLogging ? (
                <RefreshCw size={16} className="spin" />
              ) : (
                <>
                  <Plus size={16} />
                  {t('fuel.addAsExpense') || 'Add this as Fuel Expense'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Prices Widget */}
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: 'var(--border-delicate)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} className="text-muted" /> {t('fuel.jaipurRates') || 'Live Jaipur Rates'}
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {isLoading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading live data...</div>
            ) : (
              Object.keys(rates).map(fuel => (
                <div key={fuel} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: 'var(--border-delicate)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: fuel.includes('Petrol') ? 'var(--accent-warning)' : fuel.includes('Diesel') ? 'var(--accent-primary)' : 'var(--accent-success)' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{fuel}</span>
                  </div>
                  <div style={{ fontWeight: 600 }}>₹{rates[fuel]?.toFixed(2)}</div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Calculator Widget */}
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: 'var(--border-delicate)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calculator size={18} className="text-muted" /> {t('fuel.converter') || 'Cost Converter'}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t('fuel.selectFuelType') || 'Select Fuel Type'}</label>
              <CustomSelect 
                options={Object.keys(rates).map(fuel => ({ value: fuel, label: `${fuel} (₹${rates[fuel]?.toFixed(2)})` }))}
                value={selectedFuel}
                onChange={setSelectedFuel}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t('fuel.iWantToInput') || 'I want to input...'}</label>
              <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.03)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: 'var(--border-delicate)' }}>
                <button 
                  style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: 'none', background: inputMode === 'rupees' ? 'var(--bg-surface)' : 'transparent', color: inputMode === 'rupees' ? 'var(--text-primary)' : 'var(--text-secondary)', boxShadow: inputMode === 'rupees' ? 'var(--shadow-sm)' : 'none', cursor: 'pointer', fontWeight: inputMode === 'rupees' ? 500 : 400, transition: 'var(--transition-fast)' }}
                  onClick={() => setInputMode('rupees')}
                >
                  {t('common.amount') || 'Amount'} (₹)
                </button>
                <button 
                  style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: 'none', background: inputMode === 'liters' ? 'var(--bg-surface)' : 'transparent', color: inputMode === 'liters' ? 'var(--text-primary)' : 'var(--text-secondary)', boxShadow: inputMode === 'liters' ? 'var(--shadow-sm)' : 'none', cursor: 'pointer', fontWeight: inputMode === 'liters' ? 500 : 400, transition: 'var(--transition-fast)' }}
                  onClick={() => setInputMode('liters')}
                >
                  {t('fuel.volume') || 'Volume'} (L/kg)
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                {t('common.enter') || 'Enter'} {inputMode === 'rupees' ? t('common.amount') : t('fuel.volume')}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  {inputMode === 'rupees' ? '₹' : 'L'}
                </span>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2rem', background: 'transparent', border: 'var(--border-strong)', borderRadius: 'var(--radius-md)', fontSize: '1rem', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div style={{ background: 'var(--bg-color)', padding: '1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: 'var(--border-delicate)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                {t('fuel.youWillGet') || 'You will get/pay'}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {inputMode === 'rupees' ? calculateResult() : `₹${calculateResult()}`}
                <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                  {inputMode === 'rupees' ? (selectedFuel === 'CNG' ? ' kg' : ' L') : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
