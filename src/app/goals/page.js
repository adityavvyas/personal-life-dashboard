'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, TrendingUp, MoreVertical, Calendar, CheckCircle } from 'lucide-react';
import CustomDatePicker from '@/components/CustomDatePicker';

import { useEffect } from 'react';
import { useSupabase } from '@/context/SupabaseContext';
import { useLanguage } from '@/context/LanguageProvider';

export default function GoalsPage() {
  const { supabase } = useSupabase();
  const { t } = useLanguage();
  const [goals, setGoals] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', target_amount: '', current_amount: '0', target_date: '' });
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [updatingGoal, setUpdatingGoal] = useState(null);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    const { data } = await supabase.from('goals').select('*');
    if (data) {
      const mapped = data.map(g => {
        let parsedName = g.name;
        let parsedDate = g.target_date || '';
        let parsedColor = 'var(--text-primary)';
        if (g.name && g.name.includes('||')) {
          const parts = g.name.split('||');
          parsedName = parts[0];
          parsedDate = parts[1] || parsedDate;
          parsedColor = parts[2] || 'var(--text-primary)';
        }
        return {
          ...g,
          name: parsedName,
          target_date: parsedDate,
          color: parsedColor
        };
      });
      mapped.sort((a, b) => new Date(a.target_date || 0) - new Date(b.target_date || 0));
      setGoals(mapped);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.name || !newGoal.target_amount || !newGoal.target_date) return;
    await supabase.from('goals').insert([{
      name: `${newGoal.name}||${newGoal.target_date}||var(--text-primary)`,
      target_amount: Number(newGoal.target_amount),
      current_amount: Number(newGoal.current_amount) || 0
    }]);
    setIsAdding(false);
    setNewGoal({ name: '', target_amount: '', current_amount: '0', target_date: '' });
    fetchGoals();
  };

  const handleDeleteGoal = async (id) => {
    if (window.confirm("Are you sure you want to delete this goal?")) {
      await supabase.from('goals').delete().eq('id', id);
      setOpenDropdownId(null);
      fetchGoals();
    }
  };

  const handleUpdateProgressSubmit = async () => {
    if (updatingGoal && !isNaN(updatingGoal.current_amount)) {
      await supabase.from('goals').update({ current_amount: Number(updatingGoal.current_amount) }).eq('id', updatingGoal.id);
      setUpdatingGoal(null);
      fetchGoals();
    }
  };

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
          <h1 className="page-title">{t('goals.title') || 'Financial Goals'}</h1>
          <p className="page-subtitle">{t('goals.subtitle') || 'Track your progress towards your dreams.'}</p>
        </div>
        <div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAdding(!isAdding)}
            className={isAdding ? "btn-secondary" : "btn-primary"}
            style={{ padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-full)' }}
          >
            {isAdding ? (t('goals.cancel') || 'Cancel') : <><Plus size={14} /> {t('goals.newGoal') || 'New Goal'}</>}
          </motion.button>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="dashboard-grid"
      >
        {isAdding && (
          <motion.div variants={itemVariants} className="soft-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px dashed var(--border-strong)', gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{t('goals.newGoal') || 'New Financial Goal'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <input type="text" placeholder={t('goals.goalName') || "Goal Name"} value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} required />
              <input type="number" placeholder={t('goals.targetAmount') || "Target Amount (₹)"} value={newGoal.target_amount} onChange={e => setNewGoal({...newGoal, target_amount: e.target.value})} required />
              <input type="number" placeholder={t('goals.currentAmount') || "Current Amount (₹)"} value={newGoal.current_amount} onChange={e => setNewGoal({...newGoal, current_amount: e.target.value})} />
              <CustomDatePicker 
                value={newGoal.target_date} 
                onChange={val => setNewGoal({...newGoal, target_date: val})} 
                style={{ flex: 1, minWidth: '150px' }} 
              />
            </div>
            <button className="btn-primary" onClick={handleAddGoal} style={{ alignSelf: 'flex-start' }}>{t('goals.addGoal') || 'Save Goal'}</button>
          </motion.div>
        )}

        {goals.length === 0 && !isAdding && (
          <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
            {t('goals.noGoals') || 'No goals found. Click "New Goal" to get started!'}
          </div>
        )}

        {goals.map(goal => {
          const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
          const isCompleted = progress >= 100;

          return (
            <motion.div 
              key={goal.id} 
              variants={itemVariants}
              whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400 } }}
              className="soft-panel" 
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', background: isCompleted ? 'var(--accent-success-light)' : '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isCompleted ? 'var(--accent-success)' : 'var(--text-primary)' }}>
                    {isCompleted ? <CheckCircle size={16} /> : <Target size={16} />}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.1rem' }}>{goal.name}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target: {new Date(goal.target_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      ₹{Number(goal.current_amount).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      of ₹{Number(goal.target_amount).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <button 
                      onClick={() => setOpenDropdownId(openDropdownId === goal.id ? null : goal.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                    >
                      <MoreVertical size={16} />
                    </button>
                    <AnimatePresence>
                    {openDropdownId === goal.id && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        style={{ 
                          position: 'absolute', top: 'calc(100% + 0.25rem)', right: 0, 
                          background: 'var(--bg-surface)', border: '1px solid var(--border-delicate)', 
                          borderRadius: 'var(--radius-lg)', padding: '0.25rem 0', zIndex: 100, 
                          minWidth: '160px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)', overflow: 'hidden' 
                        }}
                      >
                        <button 
                          onClick={() => { setUpdatingGoal({ id: goal.id, current_amount: goal.current_amount }); setOpenDropdownId(null); }} 
                          className="custom-select-option" 
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'left', padding: '0.75rem 1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem' }}
                        >
                          <TrendingUp size={14} /> Update Progress
                        </button>
                        <button 
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="custom-select-option"
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'left', padding: '0.75rem 1rem', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.875rem' }}
                        >
                          Delete Goal
                        </button>
                      </motion.div>
                    )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div style={{ width: '100%', height: '6px', background: '#f4f4f5', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.2 }}
                  style={{ 
                    height: '100%', 
                    background: goal.color || 'var(--text-primary)',
                    borderRadius: 'var(--radius-full)',
                  }} 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                <span>{progress.toFixed(1)}%</span>
                {isCompleted ? (
                  <span style={{ color: 'var(--accent-success)' }}>Completed!</span>
                ) : (
                  <span>₹{(Number(goal.target_amount) - Number(goal.current_amount)).toLocaleString('en-IN')} left</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <AnimatePresence>
        {updatingGoal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="soft-panel"
              style={{ width: '90%', maxWidth: '400px', padding: '2rem', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-lg)' }}
            >
              <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Update Progress</h3>
              <input 
                type="number" 
                value={updatingGoal.current_amount} 
                onChange={(e) => setUpdatingGoal({...updatingGoal, current_amount: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', background: 'var(--bg-color)', border: '1px solid var(--border-delicate)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={() => setUpdatingGoal(null)}>Cancel</button>
                <button className="btn-primary" onClick={handleUpdateProgressSubmit}>Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
