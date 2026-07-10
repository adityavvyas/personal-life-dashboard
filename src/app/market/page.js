'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCcw, Landmark, Search, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useSupabase } from '@/context/SupabaseContext';
import { useToast } from '@/context/ToastProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { useTheme } from '@/context/ThemeProvider';
import { Chart as ChartJS, CategoryScale, LinearScale, TimeScale, TimeSeriesScale, Tooltip, Legend } from 'chart.js';
import { CandlestickController, CandlestickElement, OhlcController, OhlcElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-luxon';
import { Chart } from 'react-chartjs-2';
import { X } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  TimeSeriesScale,
  Tooltip,
  Legend,
  CandlestickController,
  CandlestickElement,
  OhlcController,
  OhlcElement
);

const formatVolume = (v) => {
  if (!v) return '0';
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(2) + 'K';
  return v;
};

export default function MarketPage() {
  const { resolvedTheme } = useTheme();
  const { supabase } = useSupabase();
  const { addToast } = useToast();
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [correctedQuery, setCorrectedQuery] = useState(null);

  // Chart modal state
  const [selectedStock, setSelectedStock] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [hoveredCandle, setHoveredCandle] = useState(null);

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setShowDropdown(true);
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(searchQuery)}`);
        const result = await res.json();
        if (result.quotes) {
          setSearchResults(result.quotes);
          setCorrectedQuery(result.correctedQuery || null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchMarketData = async () => {
    setLoading(true);
    try {
      const { data: settings } = await supabase.from('settings').select('value').eq('key', 'stocks').maybeSingle();
      
      let symbols = [];
      if (settings && settings.value) {
        try { symbols = JSON.parse(settings.value); } catch(e){}
      }
      
      if (symbols.length === 0) {
        setData({ stocks: [] });
        setLoading(false);
        return;
      }
      
      const symbolsStr = symbols.join(',');
      const res = await fetch(`/api/market/live?symbols=${symbolsStr}`);
      const result = await res.json();
      
      if (result.quotes) {
        const stocksWithIds = result.quotes.map(q => ({ ...q, db_id: q.symbol }));
        setData({ stocks: stocksWithIds });
      } else {
        setData({ stocks: [] });
      }
    } catch (error) {
      console.error(error);
      addToast('Failed to load live market data', 'error');
    }
    setLoading(false);
  };

  const fetchStockHistory = async (stock) => {
    setSelectedStock(stock);
    setChartLoading(true);
    try {
      const res = await fetch(`/api/market/history?symbol=${stock.symbol}`);
      const result = await res.json();
      if (result.history) {
        setChartData(result.history);
      } else {
        setChartData(null);
      }
    } catch (error) {
      console.error(error);
      setChartData(null);
    }
    setChartLoading(false);
  };

  useEffect(() => {
    fetchMarketData();
  }, []);

  const handleAddStock = async (symbol) => {
    const { data: settings } = await supabase.from('settings').select('value').eq('key', 'stocks').maybeSingle();
    let symbols = [];
    if (settings && settings.value) {
      try { symbols = JSON.parse(settings.value); } catch(e){}
    }
    if (!symbols.includes(symbol)) {
      symbols.push(symbol);
      const { error } = await supabase.from('settings').upsert({ key: 'stocks', value: JSON.stringify(symbols) });
      if (error) {
        addToast('Failed to add stock', 'error');
        return;
      }
    }
    addToast(`Added ${symbol} to watch list!`, 'success');
    setSearchQuery('');
    setShowDropdown(false);
    fetchMarketData();
  };

  const handleRemoveStock = async (id) => {
    const { data: settings } = await supabase.from('settings').select('value').eq('key', 'stocks').maybeSingle();
    let symbols = [];
    if (settings && settings.value) {
      try { symbols = JSON.parse(settings.value); } catch(e){}
    }
    const newSymbols = symbols.filter(s => s !== id);
    const { error } = await supabase.from('settings').upsert({ key: 'stocks', value: JSON.stringify(newSymbols) });
    if (!error) {
      addToast('Stock removed from tracking', 'success');
      fetchMarketData();
    }
  };

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <RefreshCcw className="animate-spin" style={{ animation: 'spin 2s linear infinite' }} />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 350, damping: 25 } }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('market.title') || 'Market Watch'}</h1>
          <p className="page-subtitle">{t('market.subtitle') || 'Live tracking for your portfolio.'}</p>
        </div>
        <div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              fetchMarketData();
              addToast('Refreshing market data...');
            }}
            className="btn-secondary"
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', minHeight: 'auto', borderRadius: 'var(--radius-full)' }}
          >
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
            <span>{t('market.refresh') || 'Refresh'}</span>
          </motion.button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedStock ? (
          <motion.div
            key="detailed-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="soft-panel"
            style={{ width: '100%', padding: '2rem', position: 'relative' }}
          >
            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', zIndex: 10 }}>
              {data && data.stocks && data.stocks.some(s => s.symbol === selectedStock.symbol) ? (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleRemoveStock(selectedStock.symbol)}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)' }}
                >
                  <Trash2 size={14} /> <span style={{ fontSize: '0.8rem' }}>Remove</span>
                </motion.button>
              ) : (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAddStock(selectedStock.symbol)}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)' }}
                >
                  <Plus size={14} /> <span style={{ fontSize: '0.8rem' }}>Add</span>
                </motion.button>
              )}
              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedStock(null)}
                style={{ background: 'var(--bg-color)', border: 'none', borderRadius: 'var(--radius-full)', padding: '0.5rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <X size={16} color="var(--text-muted)" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Close</span>
              </motion.button>
            </div>
            
            <div style={{ paddingBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{selectedStock.name}</h2>
              <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{selectedStock.symbol} &bull; {selectedStock.exchange}</div>
              
              {selectedStock.price !== undefined && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', marginBottom: '2rem' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {selectedStock.currency === 'USD' ? '$' : '₹'}{Number(selectedStock.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ color: selectedStock.change >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                    {selectedStock.change >= 0 ? '+' : ''}{Number(selectedStock.changeAmount).toFixed(2)} ({Number(selectedStock.change).toFixed(2)}%)
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>30-Day Price History</h3>
                
                {hoveredCandle && (
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>O: <strong style={{ color: 'var(--text-primary)' }}>{hoveredCandle.o.toFixed(2)}</strong></span>
                    <span>H: <strong style={{ color: 'var(--text-primary)' }}>{hoveredCandle.h.toFixed(2)}</strong></span>
                    <span>L: <strong style={{ color: 'var(--text-primary)' }}>{hoveredCandle.l.toFixed(2)}</strong></span>
                    <span>C: <strong style={{ color: 'var(--text-primary)' }}>{hoveredCandle.c.toFixed(2)}</strong></span>
                    {hoveredCandle.prevClose && (
                      <span style={{ color: hoveredCandle.c >= hoveredCandle.prevClose ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                        {hoveredCandle.c >= hoveredCandle.prevClose ? '+' : ''}
                        {(hoveredCandle.c - hoveredCandle.prevClose).toFixed(2)} 
                        ({(((hoveredCandle.c - hoveredCandle.prevClose) / hoveredCandle.prevClose) * 100).toFixed(2)}%)
                      </span>
                    )}
                    {hoveredCandle.v && (
                      <span>Vol: <strong style={{ color: 'var(--text-primary)' }}>{formatVolume(hoveredCandle.v)}</strong></span>
                    )}
                  </div>
                )}
              </div>
              <div style={{ height: '550px', width: '100%', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                {chartLoading ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RefreshCcw className="animate-spin text-muted" />
                  </div>
                ) : chartData && chartData.length > 0 ? (
                  <Chart 
                    type="candlestick"
                    data={{
                      datasets: [{
                        label: selectedStock.symbol,
                        data: chartData,
                        color: {
                          up: '#2dd4bf', 
                          down: '#f0668e', 
                          unchanged: 'rgba(161, 161, 170, 0.9)'
                        },
                        borderColor: {
                          up: '#2dd4bf', 
                          down: '#f0668e', 
                          unchanged: '#a1a1aa'
                        },
                        borderWidth: 1.5,
                        yAxisID: 'y'
                      },
                      {
                        label: 'Volume',
                        type: 'bar',
                        data: chartData.map(d => ({ x: d.x, y: d.v })),
                        backgroundColor: chartData.map(d => d.c >= (d.prevClose || d.o) ? 'rgba(45, 212, 191, 0.25)' : 'rgba(240, 102, 142, 0.25)'),
                        yAxisID: 'yVolume'
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'index',
                        intersect: false,
                      },
                      onHover: (event, chartElement) => {
                        if (chartElement.length > 0) {
                          const dataIndex = chartElement[0].index;
                          setHoveredCandle(chartData[dataIndex]);
                        } else {
                          setHoveredCandle(null);
                        }
                      },
                      plugins: {
                        legend: { display: false },
                        tooltip: { 
                          enabled: true,
                          mode: 'index',
                          intersect: false,
                          backgroundColor: 'rgba(0,0,0,0)',
                          titleColor: 'rgba(0,0,0,0)',
                          bodyColor: 'rgba(0,0,0,0)',
                          borderColor: 'rgba(0,0,0,0)',
                          displayColors: false,
                          padding: 0,
                          caretSize: 0,
                        },
                        customCrosshair: {
                          color: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                        }
                      },
                      scales: {
                        x: {
                          type: 'timeseries',
                          time: { unit: 'day' },
                          grid: { display: false },
                          ticks: { color: resolvedTheme === 'dark' ? '#71717a' : '#78716c', font: { size: 11 } }
                        },
                        y: {
                          position: 'right',
                          grid: { color: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', drawBorder: false, borderDash: [5, 5] },
                          ticks: { color: resolvedTheme === 'dark' ? '#71717a' : '#78716c', font: { size: 11 } }
                        },
                        yVolume: {
                          position: 'left',
                          display: false,
                          grid: { display: false },
                          min: 0,
                          suggestedMax: chartData ? Math.max(...chartData.map(d => d.v || 0)) * 4 : 100 // Scale volume so it occupies only bottom 25%
                        }
                      }
                    }}
                    plugins={[{
                      id: 'customCrosshair',
                      afterDraw: (chart, args, options) => {
                        if (chart.tooltip?._active?.length) {
                          // Find candlestick point since tooltip active might contain volume point too
                          const activePoints = chart.tooltip._active;
                          let activePoint = activePoints.find(p => chart.data.datasets[p.datasetIndex].type === 'candlestick');
                          if (!activePoint) activePoint = activePoints[0];
                          
                          const ctx = chart.ctx;
                          const x = activePoint.element.x;
                          const y = activePoint.element.y;
                          const topY = chart.scales.y.top;
                          const bottomY = chart.scales.y.bottom;
                          const leftX = chart.scales.x.left;
                          const rightX = chart.scales.x.right;
                          
                          ctx.save();
                          ctx.beginPath();
                          ctx.setLineDash([5, 5]);
                          ctx.moveTo(x, topY);
                          ctx.lineTo(x, bottomY);
                          ctx.moveTo(leftX, y);
                          ctx.lineTo(rightX, y);
                          ctx.lineWidth = 1;
                          ctx.strokeStyle = options.color || '#a3a3a3';
                          ctx.stroke();
                          ctx.restore();
                        }
                      }
                    }]}
                  />
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    No historical data available.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{ position: 'relative', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} className="text-muted" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder={t('market.searchPlaceholder') || "Search for a company or ticker (e.g. Reliance, TCS)..."} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            style={{ paddingLeft: '2.5rem', height: '3rem', borderRadius: 'var(--radius-lg)' }}
          />
          {isSearching && (
            <RefreshCcw size={16} className="animate-spin" style={{ position: 'absolute', right: '1rem', color: 'var(--text-muted)' }} />
          )}
        </div>
        
        <AnimatePresence>
          {showDropdown && searchResults.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ 
                position: 'absolute', top: 'calc(100% + 0.5rem)', left: 0, right: 0, 
                background: 'var(--dropdown-bg)', 
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid var(--dropdown-border)', 
                borderRadius: 'var(--radius-xl)', 
                padding: '0.5rem', 
                boxShadow: 'var(--dropdown-shadow)', 
                zIndex: 50, overflow: 'hidden'
              }}
            >
              {correctedQuery && searchResults.length > 0 && (
                <div style={{ padding: '0.5rem 1rem', background: 'var(--dropdown-icon-bg)', color: 'var(--text-secondary)', fontSize: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem' }}>
                  Did you mean <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{correctedQuery}</span>? Showing related results:
                </div>
              )}
              {searchResults.filter(r => r && r.symbol).map((result, idx) => (
                <motion.div 
                  key={`search-result-${result.symbol}-${idx}`}
                  whileHover={{ 
                    backgroundColor: 'var(--dropdown-hover)', 
                    x: 4 
                  }}
                  style={{ 
                    padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', 
                    alignItems: 'center', cursor: 'pointer', borderRadius: 'var(--radius-md)',
                    transition: 'background 0.2s ease', marginBottom: '0.1rem'
                  }}
                  onClick={() => {
                    fetchStockHistory({
                      ...result,
                      name: result.shortname || result.longname || result.symbol
                    });
                    setShowDropdown(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      width: '36px', height: '36px', borderRadius: '8px', 
                      background: 'var(--dropdown-icon-bg)', border: '1px solid var(--dropdown-border)', color: 'var(--accent-primary)' 
                    }}>
                      <Search size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{result.symbol}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{result.shortname || result.longname} &bull; {result.exchange}</div>
                    </div>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => { e.stopPropagation(); handleAddStock(result.symbol); }} 
                    className="btn-primary" 
                    style={{ padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Plus size={14} /> Add
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hover-bg-color:hover { background-color: var(--bg-color); }
      `}} />

      <div>
        <h2 className="section-title">{t('market.stockMarket') || 'Stock Market'}</h2>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: '70px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: 'var(--border-delicate)' }} className="pulse"></div>
            ))}
          </div>
        ) : !data || !data.stocks || data.stocks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
            <Search size={32} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{t('market.emptyWatchlist') || 'Your Watchlist is Empty'}</p>
            <p style={{ fontSize: '0.9rem', maxWidth: '300px', margin: '0.5rem auto' }}>{t('market.emptyWatchlistDesc') || 'Search for a company above (e.g., "Apple", "Tata", or "RELIANCE.NS") to add it to your live market tracking.'}</p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid-cards" 
            style={{ gap: '1rem', marginBottom: '2rem' }}
          >
            {data.stocks.map(stock => {
              const isPositive = stock.change >= 0;
            return (
              <motion.div 
                key={stock.symbol} 
                variants={itemVariants}
                whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400 } }}
                onClick={() => fetchStockHistory(stock)}
                className="soft-panel" 
                style={{ padding: '1.25rem', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stock.symbol}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ color: isPositive ? 'var(--accent-success)' : 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 500 }}>
                      {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {Math.abs(stock.change).toFixed(2)}%
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.1, color: 'var(--accent-danger)' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); handleRemoveStock(stock.symbol); }} 
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stock.name}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stock.currency === 'USD' ? '$' : '₹'}{Number(stock.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div style={{ fontSize: '0.75rem', color: isPositive ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                  {isPositive ? '+' : ''}{Number(stock.changeAmount).toFixed(2)} today
                </div>
              </motion.div>
            );
          })}
        </motion.div>
            )}
          </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
