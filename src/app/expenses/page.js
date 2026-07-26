'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, MoreVertical, Trash2, ArrowUpRight, ArrowDownRight, IndianRupee, ShoppingCart, Fuel, Lightbulb, Receipt } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';
import CustomDatePicker from '@/components/CustomDatePicker';
import { emojiToLucide } from '@/utils/iconMap';

import { useEffect } from 'react';
import { useSupabase } from '@/context/SupabaseContext';
import { useLanguage } from '@/context/LanguageProvider';

export default function ExpensesPage() {
  const { supabase } = useSupabase();
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: cats } = await supabase.from('categories').select('*').eq('type', 'expense');
    if (cats) {
      setCategories(cats);
      if (cats.length > 0 && !category) setCategory(cats[0].id);
    }

    const { data: txs } = await supabase.from('transactions')
      .select('*, categories(name, type, icon, color)')
      .order('date', { ascending: false });
    if (txs) setExpenses(txs.filter(tx => tx.categories?.type === 'expense'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !date || !category) return;
    
    await supabase.from('transactions').insert([{
      amount: -Math.abs(parseFloat(amount)), // store expenses as negative
      category_id: category,
      date,
      description: note || 'New Expense'
    }]);
    
    setAmount('');
    setNote('');
    fetchData();
  };
  const handleDelete = async (id) => {
    await supabase.from('transactions').delete().eq('id', id);
    setOpenDropdownId(null);
    fetchData();
  };

  const handlePriority = async (expense) => {
    await supabase.from('transactions').update({ is_priority: !expense.is_priority }).eq('id', expense.id);
    setOpenDropdownId(null);
    fetchData();
  };

  const handleEditAmount = async (expense) => {
    const newAmount = window.prompt(t('expenses.enterNewAmount') || "Enter new amount for expense:", Math.abs(expense.amount));
    if (newAmount !== null && !isNaN(newAmount)) {
      await supabase.from('transactions').update({ amount: -Math.abs(parseFloat(newAmount)) }).eq('id', expense.id);
      setOpenDropdownId(null);
      fetchData();
    }
  };
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('expenses.title') || 'Expenses'}</h1>
          <p className="page-subtitle">{t('expenses.subtitle') || 'Track and categorize your spending.'}</p>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}
      >
        {/* Top - Add Expense Form */}
        <div>
          <motion.div variants={itemVariants} className="soft-panel">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>{t('expenses.addNew') || 'Add New Expense'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t('expenses.amount') || 'Amount (₹)'}</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={t('expenses.newAmountDesc') || "e.g. 1500"}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t('expenses.category') || 'Category'}</label>
                <CustomSelect 
                  options={categories.map(cat => ({ value: cat.id, label: t(`expenses.categories.${cat.name}`) || cat.name }))}
                  value={category}
                  onChange={setCategory}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t('expenses.date') || 'Date'}</label>
                <CustomDatePicker 
                  value={date}
                  onChange={setDate}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t('expenses.note') || 'Note (Optional)'}</label>
                <input 
                  type="text" 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('expenses.noteDesc') || "What was this for?"}
                />
              </div>
              <div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit" 
                  className="btn-primary" 
                  style={{ width: '100%', height: '42px' }}
                >
                  <Plus size={14} /> {t('expenses.add') || 'Add'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Bottom - Recent Expenses Table */}
        <div>
          <h2 className="section-title">{t('expenses.recent') || 'Recent Expenses'}</h2>
          <div className="list-group">
            {expenses.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>{t('expenses.noExpenses') || 'No expenses recorded yet.'}</div>
            )}
            {expenses.map((expense) => (
              <motion.div key={expense.id} variants={itemVariants} className="list-item" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                  <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: expense.categories?.color ? `${expense.categories.color}20` : '#f4f4f5', color: expense.categories?.color || 'var(--text-primary)', flexShrink: 0 }}>
                    {expense.categories?.icon ? emojiToLucide(expense.categories.icon) : emojiToLucide('📄')}
                  </div>
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {expense.description}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <span className="status-pill neutral" style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>
                        {expense.categories ? (t(`expenses.categories.${expense.categories.name}`) || expense.categories.name) : 'Uncategorized'}
                      </span>
                      {expense.is_priority && (
                        <span className="status-pill" style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem', background: 'var(--accent-warning)', color: 'var(--bg-surface)' }}>
                          Priority
                        </span>
                      )}
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0, position: 'relative' }}>
                  <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
                    ₹{Math.abs(expense.amount).toLocaleString('en-IN')}
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.1 }} 
                    whileTap={{ scale: 0.9 }} 
                    style={{ color: 'var(--text-muted)', padding: '0.25rem', cursor: 'pointer' }}
                    onClick={() => setOpenDropdownId(openDropdownId === expense.id ? null : expense.id)}
                  >
                    <MoreVertical size={16} />
                  </motion.button>
                  
                  {openDropdownId === expense.id && (
                    <div className="dropdown-menu">
                      <button 
                        className="dropdown-item"
                        onClick={() => handlePriority(expense)}
                      >
                        {expense.is_priority ? 'Remove Priority' : 'Set Priority'}
                      </button>
                      <button 
                        className="dropdown-item"
                        onClick={() => handleEditAmount(expense)}
                      >
                        {t('expenses.editAmount') || 'Edit Amount'}
                      </button>
                      <button 
                        className="dropdown-item danger"
                        onClick={() => handleDelete(expense.id)}
                      >
                        {t('expenses.delete') || 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
