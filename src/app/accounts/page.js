'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Landmark, Building2, Smartphone, Plus, MoreVertical, Briefcase } from 'lucide-react';
import { useSupabase } from '@/context/SupabaseContext';
import { useLanguage } from '@/context/LanguageProvider';
import CustomSelect from '@/components/CustomSelect';

export default function AccountsPage() {
  const { supabase } = useSupabase();
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', bank_name: '', account_type: 'savings', balance: '' });
  const [minBalances, setMinBalances] = useState({});
  const [openDropdownId, setOpenDropdownId] = useState(null);

  useEffect(() => {
    fetchAccounts();
    const saved = localStorage.getItem('min_balances');
    if (saved) setMinBalances(JSON.parse(saved));
  }, []);

  const updateMinBalance = (id, val) => {
    const updated = { ...minBalances, [id]: Number(val) };
    setMinBalances(updated);
    localStorage.setItem('min_balances', JSON.stringify(updated));
  };

  const fetchAccounts = async () => {
    const { data } = await supabase.from('accounts').select('*').order('created_at', { ascending: true });
    if (data) setAccounts(data);
  };

  const handleAddAccount = async () => {
    if (!newAccount.name || !newAccount.bank_name) return;
    await supabase.from('accounts').insert([{
      name: newAccount.name,
      bank_name: newAccount.bank_name,
      account_type: newAccount.account_type,
      balance: Number(newAccount.balance) || 0
    }]);
    setIsAdding(false);
    setNewAccount({ name: '', bank_name: '', account_type: 'savings', balance: '' });
    fetchAccounts();
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('accounts.confirmDelete') || "Are you sure you want to delete this account?")) {
      await supabase.from('accounts').delete().eq('id', id);
      setOpenDropdownId(null);
      fetchAccounts();
    }
  };

  const handleUpdateBalance = async (id, currentBalance) => {
    const newBal = window.prompt(t('accounts.enterNewBalance') || "Enter new balance:", currentBalance);
    if (newBal !== null && !isNaN(newBal)) {
      await supabase.from('accounts').update({ balance: Number(newBal) }).eq('id', id);
      setOpenDropdownId(null);
      fetchAccounts();
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 25 } }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('accounts.title') || 'Accounts'}</h1>
          <p className="page-subtitle">{t('accounts.subtitle') || 'Manage your linked bank accounts and wallets.'}</p>
        </div>
        <div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAdding(!isAdding)}
            className={isAdding ? "btn-secondary" : "btn-primary"}
            style={{ padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-full)' }}
          >
            {isAdding ? (t('accounts.cancel') || 'Cancel') : <><Plus size={14} /> {t('accounts.addAccount') || 'Add Account'}</>}
          </motion.button>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="dashboard-grid" 
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))' }}
      >
        <motion.div variants={itemVariants} className="stat-card" style={{ background: 'var(--text-primary)', color: 'var(--bg-surface)', border: 'none' }}>
          <div className="stat-card-header" style={{ color: 'var(--bg-surface)', opacity: 0.8 }}>
            <span>{t('accounts.netWorth') || 'Net Worth'}</span>
          </div>
          <div className="stat-card-value" style={{ color: 'var(--bg-surface)' }}>
            ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="stat-card-footer" style={{ color: 'var(--bg-surface)', opacity: 0.6 }}>
            {t('accounts.across') || 'Across'} {accounts.length} {t('accounts.activeAccounts') || 'active accounts'}
          </div>
        </motion.div>

        {isAdding && (
          <motion.div variants={itemVariants} className="soft-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px dashed var(--border-strong)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{t('accounts.newAccount') || 'New Account'}</h3>
            <input type="text" placeholder={t('accounts.newAccountName') || "Account Name (e.g. Savings)"} value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} />
            <input type="text" placeholder={t('accounts.bankName') || "Bank Name"} value={newAccount.bank_name} onChange={e => setNewAccount({...newAccount, bank_name: e.target.value})} />
            <CustomSelect 
              options={[
                { value: 'savings', label: 'Savings' },
                { value: 'current', label: 'Current' },
                { value: 'wallet', label: 'Wallet' }
              ]}
              value={newAccount.account_type}
              onChange={(val) => setNewAccount({...newAccount, account_type: val})}
            />
            <input type="number" placeholder="Initial Balance" value={newAccount.balance} onChange={e => setNewAccount({...newAccount, balance: e.target.value})} />
            <button className="btn-primary" onClick={handleAddAccount}>{t('accounts.saveAccount') || 'Save Account'}</button>
          </motion.div>
        )}

        {accounts.length === 0 && !isAdding && (
          <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
            {t('accounts.noAccounts') || 'No accounts found. Click "Add Account" to get started!'}
          </div>
        )}

        {accounts.map(account => (
          <motion.div 
            key={account.id} 
            variants={itemVariants}
            whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400 } }}
            className="soft-panel" 
            style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.5rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', background: '#fbfbfc', border: 'var(--border-delicate)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {account.account_type === 'wallet' ? <Smartphone size={16} className="text-muted"/> : <Landmark size={16} className="text-muted"/>}
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{account.name}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{account.bank_name} • <span style={{textTransform: 'capitalize'}}>{account.account_type}</span></div>
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setOpenDropdownId(openDropdownId === account.id ? null : account.id)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                >
                  <MoreVertical size={16} />
                </button>
                {openDropdownId === account.id && (
                  <div className="dropdown-menu">
                    <button 
                      onClick={() => handleUpdateBalance(account.id, account.balance)}
                      className="dropdown-item"
                    >
                      {t('accounts.updateBalance') || 'Update Balance'}
                    </button>
                    <button 
                      onClick={() => handleDelete(account.id)}
                      className="dropdown-item danger"
                    >
                      {t('accounts.deleteAccount') || 'Delete Account'}
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{t('accounts.currentBalance') || 'Current Balance'}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                ₹{Number(account.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: 'var(--border-delicate)' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('accounts.minBalance') || 'Min. Balance'}</div>
                  <input 
                    type="number"
                    value={minBalances[account.id] || ''}
                    onChange={(e) => updateMinBalance(account.id, e.target.value)}
                    placeholder="0"
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 500, padding: 0, width: '70px', outline: 'none' }}
                  />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('accounts.available') || 'Available'}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: (Number(account.balance) - (minBalances[account.id] || 0)) < 0 ? 'var(--accent-danger)' : 'var(--accent-mint)' }}>
                    ₹{(Number(account.balance) - (minBalances[account.id] || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
