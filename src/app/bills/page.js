'use client';
import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Receipt, AlertCircle, CheckCircle2, MoreVertical, Trash2, Home, Zap, Film, Wifi } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';
import CustomDatePicker from '@/components/CustomDatePicker';
import { useSupabase } from '@/context/SupabaseContext';
import { useLanguage } from '@/context/LanguageProvider';
import { useToast } from '@/context/ToastProvider';

export default function BillsPage() {
  const { supabase } = useSupabase();
  const { t } = useLanguage();
  const [bills, setBills] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newBill, setNewBill] = useState({ name: '', amount: '', due_date: '', frequency: 'monthly' });
  const [accounts, setAccounts] = useState([]);
  const [payModalBill, setPayModalBill] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState('');
  const { addToast } = useToast();

  const fetchAccounts = useCallback(async () => {
    const { data } = await supabase.from('accounts').select('*').order('name');
    if (data) {
      setAccounts(data);
      if (data.length > 0) setSelectedAccount(data[0].id);
    }
  }, [supabase]);

  const fetchBills = useCallback(async () => {
    const { data } = await supabase.from('bills').select('*').order('due_date', { ascending: true });
    if (data) setBills(data);
  }, [supabase]);

  useEffect(() => {
    fetchBills();
    fetchAccounts();
  }, [fetchBills, fetchAccounts]);

  const handleAddBill = async () => {
    if (!newBill.name || !newBill.amount || !newBill.due_date) return;
    await supabase.from('bills').insert([{
      name: newBill.name,
      amount: Number(newBill.amount),
      due_date: newBill.due_date,
      frequency: newBill.frequency,
      is_paid: false
    }]);
    setIsAdding(false);
    setNewBill({ name: '', amount: '', due_date: '', frequency: 'monthly' });
    fetchBills();
  };

  const handleMarkPaidClick = (bill) => {
    if (bill.is_paid) {
      handleUnmarkPaid(bill.id);
    } else {
      setPayModalBill(bill);
    }
  };

  const handleUnmarkPaid = async (id) => {
    try {
      await supabase.from('bills').update({ is_paid: false }).eq('id', id);
      fetchBills();
    } catch (err) {
      addToast(t('bills.errorUnmark') || 'Failed to unmark bill', 'error');
    }
  };

  const confirmPayBill = async () => {
    if (!payModalBill || !selectedAccount) return;
    try {
      const bill = payModalBill;
      
      const { error: txError } = await supabase.from('transactions').insert([{
        amount: -Math.abs(Number(bill.amount)),
        category_id: bill.category_id || null,
        date: new Date().toISOString(),
        description: `Paid Bill: ${bill.name}`,
        account_id: selectedAccount
      }]);
      if (txError) throw txError;

      const account = accounts.find(a => a.id === selectedAccount);
      if (account) {
        const { error: accError } = await supabase.from('accounts')
          .update({ balance: Number(account.balance) - Number(bill.amount) })
          .eq('id', selectedAccount);
        if (accError) throw accError;
      }

      let updates = { is_paid: true };
      
      if (bill.frequency && bill.frequency !== 'one-time') {
        const nextDate = new Date(bill.due_date);
        if (bill.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        else if (bill.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
        else if (bill.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        
        updates.next_due_date = nextDate.toISOString().split('T')[0];
      }

      const { error: billError } = await supabase.from('bills').update(updates).eq('id', bill.id);
      if (billError) throw billError;

      addToast(t('bills.paidSuccess') || 'Bill marked as paid successfully!', 'success');
      setPayModalBill(null);
      fetchBills();
      fetchAccounts();
    } catch (err) {
      addToast(err.message || 'Error processing payment', 'error');
    }
  };

  const handleDeleteBill = async (id) => {
    if (window.confirm(t('accounts.confirmDelete') || "Are you sure you want to delete this bill?")) {
      await supabase.from('bills').delete().eq('id', id);
      fetchBills();
    }
  };

  const totalBills = bills.reduce((sum, bill) => sum + Number(bill.amount), 0);
  const dueThisWeek = bills.filter(b => {
    const daysUntilDue = Math.ceil((new Date(b.due_date) - new Date()) / (1000 * 60 * 60 * 24));
    return !b.is_paid && daysUntilDue >= 0 && daysUntilDue <= 7;
  }).reduce((sum, bill) => sum + Number(bill.amount), 0);
  const pendingCount = bills.filter(b => !b.is_paid).length;

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
          <h1 className="page-title">{t('bills.title') || 'Bills & Subscriptions'}</h1>
          <p className="page-subtitle">{t('bills.subtitle') || 'Never miss a due date again.'}</p>
        </div>
        <div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAdding(!isAdding)}
            className={isAdding ? "btn-secondary" : "btn-primary"}
            style={{ padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-full)' }}
          >
            {isAdding ? (t('bills.cancel') || 'Cancel') : <><Plus size={14} /> {t('bills.addBill') || 'Add Bill'}</>}
          </motion.button>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid-cards" 
        style={{ marginBottom: '3rem' }}
      >
        <motion.div variants={itemVariants} className="stat-card">
          <div className="stat-card-header">
            <span>{t('bills.totalBills') || 'Total Bills'}</span>
          </div>
          <div className="stat-card-value">₹{totalBills.toLocaleString('en-IN')}</div>
          <div className="stat-card-footer">{bills.length} {t('bills.subscriptionsTracked') || 'subscriptions tracked'}</div>
        </motion.div>
        <motion.div variants={itemVariants} className="stat-card">
          <div className="stat-card-header">
            <span>{t('bills.dueThisWeek') || 'Due This Week'}</span>
          </div>
          <div className="stat-card-value" style={{ color: dueThisWeek > 0 ? 'var(--accent-warning)' : 'var(--accent-success)' }}>₹{dueThisWeek.toLocaleString('en-IN')}</div>
          <div className="stat-card-footer">{pendingCount} {t('bills.billsPending') || 'bills pending overall'}</div>
        </motion.div>
      </motion.div>

      {isAdding && (
        <motion.div variants={itemVariants} className="soft-panel" style={{ padding: '1.5rem', marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px dashed var(--border-strong)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{t('bills.addBill') || 'New Bill'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <input type="text" placeholder={t('bills.name') || "Bill Name (e.g. Netflix)"} value={newBill.name} onChange={e => setNewBill({...newBill, name: e.target.value})} required />
            <input type="number" placeholder={t('bills.amount') || "Amount (₹)"} value={newBill.amount} onChange={e => setNewBill({...newBill, amount: e.target.value})} required />
            <CustomDatePicker 
              value={newBill.due_date} 
              onChange={val => setNewBill({...newBill, due_date: val})} 
            />
            <CustomSelect 
              options={[
                { value: 'monthly', label: t('bills.frequencies.Monthly') || 'Monthly' },
                { value: 'yearly', label: t('bills.frequencies.Yearly') || 'Yearly' },
                { value: 'weekly', label: t('bills.frequencies.Weekly') || 'Weekly' }
              ]}
              value={newBill.frequency}
              onChange={(val) => setNewBill({...newBill, frequency: val})}
            />
          </div>
          <button className="btn-primary" onClick={handleAddBill} style={{ alignSelf: 'flex-start' }}>{t('bills.addBill') || 'Save Bill'}</button>
        </motion.div>
      )}

      <div>
        <h2 className="section-title">{t('bills.allBills') || 'All Bills'}</h2>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="list-group"
        >
          {bills.length === 0 && !isAdding && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>{t('bills.noBills') || 'No bills found. Click "Add Bill" to start tracking.'}</div>
          )}
          {bills.map((bill) => {
            const daysUntilDue = Math.ceil((new Date(bill.due_date) - new Date()) / (1000 * 60 * 60 * 24));
            let status = t('bills.statusUpcoming') || 'Upcoming';
            let statusClass = 'neutral';
            
            if (bill.is_paid) {
              status = t('bills.statusPaid') || 'Paid';
              statusClass = 'success';
            } else if (daysUntilDue < 0) {
              status = t('bills.statusOverdue') || 'Overdue';
              statusClass = 'danger';
            } else if (daysUntilDue <= 7) {
              status = t('bills.statusDueSoon') || 'Due Soon';
              statusClass = 'warning';
            }

            return (
              <motion.div key={bill.id} variants={itemVariants} className="list-item" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: bill.is_paid ? 0.6 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                  <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f4f5', color: 'var(--text-secondary)', flexShrink: 0 }}>
                    <Zap size={14} />
                  </div>
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: bill.is_paid ? 'line-through' : 'none' }}>
                      {bill.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <span className={`status-pill ${statusClass}`} style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>
                        {status}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {t('bills.due') || 'Due'} {new Date(bill.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '1rem' }}>
                    ₹{Number(bill.amount).toLocaleString('en-IN')}
                  </div>
                  <motion.button onClick={() => handleMarkPaidClick(bill)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={bill.is_paid ? "btn-secondary" : "btn-primary"} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', height: 'auto' }}>
                    {bill.is_paid ? (t('bills.unmark') || 'Unmark') : (t('bills.markPaid') || 'Mark Paid')}
                  </motion.button>
                  <button onClick={() => handleDeleteBill(bill.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      <AnimatePresence>
        {payModalBill && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', width: '90%', maxWidth: '400px', boxShadow: 'var(--shadow-lg)', border: 'var(--border-delicate)' }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{t('bills.payTitle') || 'Pay Bill'}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                {t('bills.payDesc') || 'Select an account to pay from.'}
              </p>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t('bills.account') || 'Account'}</label>
                <CustomSelect 
                  options={accounts.map(acc => ({ value: acc.id, label: `${acc.name} (₹${Number(acc.balance).toLocaleString('en-IN')})` }))}
                  value={selectedAccount}
                  onChange={setSelectedAccount}
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button className="btn-secondary" onClick={() => setPayModalBill(null)}>{t('bills.cancel') || 'Cancel'}</button>
                <button className="btn-primary" onClick={confirmPayBill}>{t('bills.confirm') || 'Confirm Payment'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
