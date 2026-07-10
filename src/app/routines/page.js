'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Flame, Star, Trophy, ArrowRight, Plus, Trash2, Activity } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';
import AnimatedNumber from '@/components/AnimatedNumber';
import { useSupabase } from '@/context/SupabaseContext';
import { useLanguage } from '@/context/LanguageProvider';

export default function RoutinesPage() {
  const { supabase } = useSupabase();
  const { t } = useLanguage();
  const [routines, setRoutines] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newRoutine, setNewRoutine] = useState({ name: '', category: 'Health', targetTime: '' });

  useEffect(() => {
    fetchRoutines();
  }, []);

  const fetchRoutines = async () => {
    const { data } = await supabase.from('routines').select('*').order('created_at', { ascending: true });
    if (data) {
      const todayStr = new Date().toISOString().split('T')[0];
      const mapped = data.map(r => {
        const lastCompletedStr = r.last_completed_at ? new Date(r.last_completed_at).toISOString().split('T')[0] : null;
        let parsedName = r.name;
        let parsedCategory = 'Health';
        let parsedTargetTime = '';
        if (r.name && r.name.includes('||')) {
          const parts = r.name.split('||');
          parsedName = parts[0];
          parsedCategory = parts[1] || 'Health';
          parsedTargetTime = parts[2] || '';
        }
        return {
          ...r,
          name: parsedName,
          category: parsedCategory,
          targetTime: parsedTargetTime,
          completedToday: lastCompletedStr === todayStr
        };
      });
      setRoutines(mapped);
    }
  };

  const toggleRoutine = async (id, currentCompleted, currentStreak) => {
    const today = new Date();
    
    let newStreak = currentStreak;
    let newLastCompleted = null;

    if (!currentCompleted) {
      newStreak += 1;
      newLastCompleted = today.toISOString();
    } else {
      newStreak = Math.max(0, newStreak - 1);
      newLastCompleted = null; 
    }

    setRoutines(routines.map(r => r.id === id ? { ...r, completedToday: !currentCompleted, streak_count: newStreak } : r));

    await supabase.from('routines').update({
      streak_count: newStreak,
      last_completed_at: newLastCompleted
    }).eq('id', id);
    
    fetchRoutines();
  };

  const handleAddRoutine = async () => {
    if (!newRoutine.name) return;
    await supabase.from('routines').insert([{
      name: `${newRoutine.name}||${newRoutine.category}||${newRoutine.targetTime}`
    }]);
    setIsAdding(false);
    setNewRoutine({ name: '', category: 'Health', targetTime: '' });
    fetchRoutines();
  };

  const handleDeleteRoutine = async (id) => {
    if (window.confirm(t('accounts.confirmDelete') || "Are you sure you want to delete this routine?")) {
      await supabase.from('routines').delete().eq('id', id);
      fetchRoutines();
    }
  };

  const completionRate = routines.length > 0 ? Math.round((routines.filter(r => r.completedToday).length / routines.length) * 100) : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('routines.title') || 'Daily Routines'}</h1>
          <p className="page-subtitle">{t('routines.subtitle') || 'Build habits that last.'}</p>
        </div>
        <div>
          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: '#facc15', color: '#1a1a1a' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAdding(!isAdding)}
            className={isAdding ? "btn-secondary" : "btn-primary"}
            style={{ 
              padding: '0.75rem 1.5rem', 
              borderRadius: '99px',
              backgroundColor: isAdding ? 'var(--bg-surface)' : '#fbbf24',
              color: isAdding ? 'var(--text-primary)' : '#111827',
              border: 'none',
              fontWeight: 600,
              boxShadow: isAdding ? 'none' : '0 8px 16px -4px rgba(251, 191, 36, 0.4)'
            }}
          >
            {isAdding ? (t('routines.cancel') || 'Cancel') : <><Plus size={16} /> {t('routines.addRoutine') || 'New Routine'}</>}
          </motion.button>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="dashboard-grid"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isAdding && (
          <motion.div variants={itemVariants} className="soft-panel" style={{ padding: '1.5rem', marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px dashed var(--border-strong)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{t('routines.addRoutine') || 'New Routine'}</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="text" placeholder={t('routines.name') || "Routine Name (e.g. Read 10 Pages)"} value={newRoutine.name} onChange={e => setNewRoutine({...newRoutine, name: e.target.value})} style={{ flex: 1, minWidth: '200px' }} autoFocus />
              <CustomSelect 
                style={{ width: '160px' }}
                options={[
                  { value: 'Health', label: t('routines.categories.Health') || 'Health' },
                  { value: 'Learning', label: t('routines.categories.Learning') || 'Learning' },
                  { value: 'Mindfulness', label: t('routines.categories.Mindfulness') || 'Mindfulness' },
                  { value: 'Work', label: t('routines.categories.Work') || 'Work' }
                ]}
                value={newRoutine.category}
                onChange={(e) => setNewRoutine({...newRoutine, category: e.target.value})}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CustomSelect
                  options={[
                    { value: '', label: 'HH' },
                    ...Array.from({length: 24}, (_, i) => ({ value: String(i).padStart(2, '0'), label: String(i).padStart(2, '0') }))
                  ]}
                  value={newRoutine.targetTime ? newRoutine.targetTime.split(':')[0] : ''}
                  onChange={(e) => {
                    const h = e.target.value;
                    if (!h) {
                      setNewRoutine({...newRoutine, targetTime: ''});
                    } else {
                      const m = newRoutine.targetTime ? newRoutine.targetTime.split(':')[1] : '00';
                      setNewRoutine({...newRoutine, targetTime: `${h}:${m}`});
                    }
                  }}
                  style={{ minWidth: '70px' }}
                />
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>:</span>
                <CustomSelect
                  options={[
                    { value: '', label: 'MM' },
                    ...Array.from({length: 60}, (_, i) => ({ value: String(i).padStart(2, '0'), label: String(i).padStart(2, '0') }))
                  ]}
                  value={newRoutine.targetTime ? newRoutine.targetTime.split(':')[1] : ''}
                  onChange={(e) => {
                    const m = e.target.value;
                    if (!m) {
                      setNewRoutine({...newRoutine, targetTime: ''});
                    } else {
                      const h = newRoutine.targetTime ? newRoutine.targetTime.split(':')[0] : '12';
                      setNewRoutine({...newRoutine, targetTime: `${h}:${m}`});
                    }
                  }}
                  style={{ minWidth: '70px' }}
                />
              </div>
              <button className="btn-primary" onClick={handleAddRoutine}>{t('routines.addRoutine') || 'Save Routine'}</button>
            </div>
          </motion.div>
        )}

          {routines.length === 0 && !isAdding && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>{t('routines.noRoutines') || 'No routines found. Click "Add Routine" to get started.'}</div>
          )}

          {routines.map(routine => (
            <motion.div 
              key={routine.id} 
              variants={itemVariants}
              whileHover={{ y: -2 }}
              className="soft-panel" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '1.25rem 1.5rem',
                borderRadius: '24px',
                border: 'none',
                boxShadow: routine.completedToday ? '0 10px 30px -10px rgba(0,0,0,0.05)' : 'none',
                background: routine.completedToday 
                  ? 'var(--bg-surface)' 
                  : (document.documentElement.getAttribute('data-theme') === 'dark' ? '#18181b' : '#f4f4f5')
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <motion.button 
                  onClick={() => toggleRoutine(routine.id, routine.completedToday, routine.streak_count || 0)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  style={{ 
                    width: '2rem', 
                    height: '2rem', 
                    borderRadius: '50%', 
                    border: routine.completedToday ? 'none' : '2px solid var(--text-muted)',
                    background: routine.completedToday ? 'var(--text-primary)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--bg-color)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                >
                  {routine.completedToday && <Check size={14} strokeWidth={3} />}
                </motion.button>
                <div>
                  <div style={{ 
                    fontWeight: 600, 
                    color: routine.completedToday ? 'var(--text-secondary)' : 'var(--text-primary)',
                    textDecoration: routine.completedToday ? 'line-through' : 'none',
                    fontSize: '1.05rem',
                    letterSpacing: '-0.01em',
                    marginBottom: '0.2rem'
                  }}>
                    {routine.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{t(`routines.categories.${routine.category}`) || routine.category}</span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                {routine.targetTime && (
                  <span style={{ fontWeight: 600, fontSize: '0.8rem', padding: '0.3rem 0.75rem', background: 'var(--bg-color)', borderRadius: '99px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                    {routine.targetTime}
                  </span>
                )}
                <button onClick={() => handleDeleteRoutine(routine.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.35rem', marginLeft: '0.25rem', borderRadius: '50%', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div variants={itemVariants}>
          <div 
            className="soft-panel" 
            style={{ 
              position: 'relative',
              background: 'linear-gradient(145deg, #18181b 0%, #09090b 100%)', 
              color: 'white', 
              padding: '2.5rem 2rem',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'
            }}
          >
            {/* Background glowing orb */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.15, 0.3, 0.15]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '180px',
                height: '180px',
                background: 'radial-gradient(circle, rgba(23,185,110,0.4) 0%, rgba(0,0,0,0) 70%)',
                borderRadius: '50%',
                zIndex: 0,
                pointerEvents: 'none'
              }}
            />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
                <Activity size={20} color="#fbbf24" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'white', letterSpacing: '0.02em' }}>Daily Progress</h3>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'center', margin: '2.5rem 0' }}>
                <div style={{ position: 'relative', width: '140px', height: '140px' }}>
                  <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0px 0px 12px rgba(251,191,36,0.3))' }}>
                    <defs>
                      <linearGradient id="circleGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#fde68a" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="2.5"
                    />
                    <motion.path
                      initial={{ strokeDasharray: "0, 100" }}
                      animate={{ strokeDasharray: ["0, 100", "100, 100", `${completionRate}, 100`] }}
                      transition={{ duration: 3.5, times: [0, 0.5, 1], ease: "easeInOut", delay: 0.2 }}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="url(#circleGradient)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.5)', lineHeight: 1 }}>
                      {routines.filter(r => r.completedToday).length}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginTop: '0.2rem' }}>
                      / {routines.length} Tasks
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
