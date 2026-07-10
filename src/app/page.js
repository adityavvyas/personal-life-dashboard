'use client';
import { useEffect, useState } from 'react';
import { useSupabase } from '@/context/SupabaseContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Eye, ShieldCheck, TrendingDown, ShoppingCart, DollarSign, Fuel, Wifi, Film, Plus, HeartPulse, MoreVertical, Wallet, Landmark, CalendarRange, Target, ListTodo } from 'lucide-react';
import { emojiToLucide } from '@/utils/iconMap';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimatedNumber from '@/components/AnimatedNumber';
import { useLanguage } from '@/context/LanguageProvider';

export default function Dashboard() {
  const { supabase, isAuthenticated, isLoading } = useSupabase();
  const { t } = useLanguage();
  const [balance, setBalance] = useState(0);
  const [safeToSpend, setSafeToSpend] = useState(0);
  const [upcomingBills, setUpcomingBills] = useState([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [dailySpent, setDailySpent] = useState(0);
  const [dailyAllowance, setDailyAllowance] = useState(50);
  
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showAllowanceModal, setShowAllowanceModal] = useState(false);
  const [editWeekdayAllowance, setEditWeekdayAllowance] = useState(50);
  const [editWeekendAllowance, setEditWeekendAllowance] = useState(150);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        const { data: accounts } = await supabase.from('accounts').select('balance');
        const totalBalance = accounts?.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0) || 0;
        setBalance(totalBalance);

        const { data: bills } = await supabase.from('bills')
          .select('*')
          .eq('is_paid', false)
          .order('due_date', { ascending: true })
          .limit(5);
        setUpcomingBills(bills || []);
        
        const upcomingBillsSum = (bills || []).reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0);
        setSafeToSpend(totalBalance - upcomingBillsSum);

        const { data: transactions } = await supabase.from('transactions')
          .select('*, categories(name, icon, color)')
          .order('date', { ascending: false })
          .limit(5);
        setRecentTransactions(transactions || []);

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        const { data: allExpensesData } = await supabase.from('transactions')
          .select('amount, date')
          .eq('type', 'expense');
          
        let currentMonthExpenses = 0;
        let allTimeExpenses = 0;
        
        if (allExpensesData) {
          allExpensesData.forEach(tx => {
            const amt = Math.abs(Number(tx.amount) || 0);
            allTimeExpenses += amt;
            if (new Date(tx.date) >= startOfMonth) {
              currentMonthExpenses += amt;
            }
          });
        }
        
        setMonthlyExpenses(currentMonthExpenses);
        setTotalExpenses(allTimeExpenses);

        const today = new Date();
        const isWeekend = today.getDay() === 0 || today.getDay() === 6;
        
        const storedWeekday = localStorage.getItem('weekday_allowance');
        const storedWeekend = localStorage.getItem('weekend_allowance');
        
        let allowance = isWeekend ? 150 : 50;
        if (isWeekend && storedWeekend) allowance = Number(storedWeekend);
        if (!isWeekend && storedWeekday) allowance = Number(storedWeekday);
        
        if (storedWeekday) setEditWeekdayAllowance(Number(storedWeekday));
        if (storedWeekend) setEditWeekendAllowance(Number(storedWeekend));
        
        setDailyAllowance(allowance);

        const todayStr = today.toISOString().split('T')[0];
        const { data: todayExp } = await supabase.from('transactions')
          .select('amount')
          .eq('type', 'expense')
          .eq('date', todayStr);
          
        const spentToday = (todayExp || []).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
        setDailySpent(spentToday);
      };
      
      fetchData();
    }
  }, [isAuthenticated, supabase]);

  if (isLoading || !isAuthenticated) return null;

  const saveAllowance = () => {
    localStorage.setItem('weekday_allowance', editWeekdayAllowance);
    localStorage.setItem('weekend_allowance', editWeekendAllowance);
    const today = new Date();
    const isWeekend = today.getDay() === 0 || today.getDay() === 6;
    setDailyAllowance(isWeekend ? editWeekendAllowance : editWeekdayAllowance);
    setShowAllowanceModal(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
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
          <h1 className="page-title">{t('dashboard.greeting') || 'Overview'}</h1>
          <p className="page-subtitle">{t('dashboard.subtitle') || "Here's your financial summary."}</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', justifyContent: 'flex-end' }}>

          
          <div style={{ position: 'relative', zIndex: 100 }}>
            <motion.button 
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(255, 255, 255, 0.1)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="btn-primary" 
              style={{ 
                padding: '0.6rem 1.25rem', 
                borderRadius: 'var(--radius-full)', 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                color: 'var(--text-primary)'
              }}
            >
              <Plus size={14} color="var(--accent-primary)" /> 
              <span style={{ fontWeight: 600, letterSpacing: '0.5px' }}>{t('dashboard.add') || 'Add'}</span>
            </motion.button>
            
            <AnimatePresence>
              {showAddMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 15, scale: 0.95, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: 15, scale: 0.95, filter: 'blur(10px)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  style={{ 
                    position: 'absolute', 
                    top: 'calc(100% + 10px)', 
                    right: 0, 
                    background: 'var(--dropdown-bg)', 
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid var(--dropdown-border)', 
                    borderRadius: 'var(--radius-xl)', 
                    padding: '0.5rem', 
                    minWidth: '220px', 
                    boxShadow: 'var(--dropdown-shadow)', 
                    display: 'flex', flexDirection: 'column', gap: '0.25rem'
                  }}
                >
                  {[
                    { icon: DollarSign, label: t('dashboard.addMenu.logExpense') || 'Log Expense', path: '/expenses?add=true', color: '#ff6b6b' },
                    { icon: Fuel, label: t('dashboard.addMenu.logFuel') || 'Log Fuel', path: '/fuel?add=true', color: '#feca57' },
                    { icon: Landmark, label: t('dashboard.addMenu.addAccount') || 'Add Account', path: '/accounts?add=true', color: '#48dbfb' },
                    { icon: CalendarRange, label: t('dashboard.addMenu.addBill') || 'Add Bill', path: '/bills?add=true', color: '#ff9f43' },
                    { icon: Target, label: t('dashboard.addMenu.addGoal') || 'Add Goal', path: '/goals?add=true', color: '#1dd1a1' },
                    { icon: ListTodo, label: t('dashboard.addMenu.addRoutine') || 'Add Routine', path: '/routines?add=true', color: '#5f27cd' },
                  ].map((item, idx) => (
                    <motion.button 
                      key={idx}
                      whileHover={{ 
                        backgroundColor: 'var(--dropdown-hover)', 
                        x: 4 
                      }}
                      onClick={() => { setShowAddMenu(false); router.push(item.path); }}
                      style={{ 
                        width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', 
                        padding: '0.75rem 1rem', background: 'transparent', border: 'none', 
                        borderRadius: 'var(--radius-md)', textAlign: 'left', 
                        color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 500,
                        cursor: 'pointer', transition: 'background 0.2s ease'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        width: '32px', height: '32px', borderRadius: '8px', 
                        background: 'var(--dropdown-icon-bg)', border: '1px solid var(--dropdown-border)', color: item.color 
                      }}>
                        <item.icon size={16} />
                      </div>
                      {item.label}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Allowance Edit Modal */}
      <AnimatePresence>
        {showAllowanceModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', width: '90%', maxWidth: '400px', boxShadow: 'var(--shadow-lg)', border: 'var(--border-delicate)' }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{t('dashboard.modal.title') || 'Budget & Allowances'}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{t('dashboard.modal.desc') || 'Set your daily spending limits for the dashboard.'}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t('dashboard.modal.weekday') || 'Weekday'} (₹)</label>
                  <input type="number" value={editWeekdayAllowance} onChange={(e) => setEditWeekdayAllowance(Number(e.target.value))} style={{ width: '100%', background: 'var(--bg-color)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t('dashboard.modal.weekend') || 'Weekend'} (₹)</label>
                  <input type="number" value={editWeekendAllowance} onChange={(e) => setEditWeekendAllowance(Number(e.target.value))} style={{ width: '100%', background: 'var(--bg-color)' }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button className="btn-secondary" onClick={() => setShowAllowanceModal(false)}>{t('dashboard.modal.cancel') || 'Cancel'}</button>
                <button className="btn-primary" onClick={saveAllowance}>{t('dashboard.modal.save') || 'Save Changes'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <style dangerouslySetInnerHTML={{__html: `
        .dropdown-item {
          display: block; width: 100%; text-align: left; padding: 0.5rem 0.75rem; background: transparent; border: none; font-size: 0.85rem; color: var(--text-primary); cursor: pointer; border-radius: var(--radius-sm);
        }
        .dropdown-item:hover { background: var(--bg-color); }
        .clickable-card { cursor: pointer; display: block; text-decoration: none; color: inherit; }
      `}} />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid-cards"
      >
        <Link href="/accounts" passHref>
          <motion.div variants={itemVariants} className="stat-card clickable-card" whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300 } }}>
            <div className="stat-card-header">
              <span>{t('dashboard.kpi.totalBalance') || 'Total Balance'}</span>
              <Eye size={16} className="text-muted" />
            </div>
            <div className="stat-card-value">
              <AnimatedNumber value={balance} prefix="₹" minimumFractionDigits={2} />
            </div>
            <div className="stat-card-footer">
              {t('dashboard.kpi.totalBalanceDesc') || 'Across all accounts'}
            </div>
          </motion.div>
        </Link>
        <motion.div variants={itemVariants} className="stat-card" whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300 } }}>
          <div className="stat-card-header">
            <span>{t('dashboard.kpi.safeToSpend') || 'Safe to Spend'}</span>
            <ShieldCheck size={16} className="text-muted" />
          </div>
          <div className="stat-card-value">
            <AnimatedNumber value={safeToSpend} prefix="₹" minimumFractionDigits={2} />
          </div>
          <div className="stat-card-footer">
            {t('dashboard.kpi.safeToSpendDesc') || 'Balance - Upcoming Bills'}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="stat-card" whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300 } }}>
          <div className="stat-card-header">
            <span>{t('dashboard.kpi.notionalBalance') || 'Notional Balance'}</span>
            <Wallet size={16} className="text-muted" />
          </div>
          <div className="stat-card-value">
            <AnimatedNumber value={balance - totalExpenses} prefix="₹" minimumFractionDigits={2} />
          </div>
          <div className="stat-card-footer">
            {t('dashboard.kpi.notionalBalanceDesc') || 'After All-Time Expenses'}
          </div>
        </motion.div>

        <Link href="/expenses" passHref>
          <motion.div variants={itemVariants} className="stat-card clickable-card" whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300 } }}>
            <div className="stat-card-header">
              <span>{t('dashboard.kpi.monthlyExpenses') || 'Monthly Expenses'}</span>
              <TrendingDown size={16} className="text-muted" />
            </div>
            <div className="stat-card-value">
              <AnimatedNumber value={monthlyExpenses} prefix="₹" minimumFractionDigits={2} />
            </div>
            <div className="stat-card-footer">
              <span className="status-pill neutral">{t('dashboard.kpi.thisMonth') || 'This Month'}</span>
            </div>
          </motion.div>
        </Link>

        <motion.div variants={itemVariants} className="stat-card clickable-card" whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300 } }} onClick={() => setShowAllowanceModal(true)}>
            <div className="stat-card-header">
              <span>{t('dashboard.kpi.dailyAllowance') || 'Daily Allowance'}</span>
              <DollarSign size={16} className="text-muted" />
            </div>
            <div className="stat-card-value">
              <AnimatedNumber value={dailyAllowance} prefix="₹" minimumFractionDigits={2} />
            </div>
            <div className="stat-card-footer">
              {t('dashboard.kpi.spent') || 'Spent'} ₹{dailySpent} {t('dashboard.kpi.of') || 'of'} ₹{dailyAllowance}
              <div style={{ width: '100%', height: '4px', background: 'var(--bg-color)', borderRadius: '2px', marginTop: '0.5rem', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((dailySpent / dailyAllowance) * 100, 100)}%` }}
                  transition={{ delay: 1, duration: 1 }}
                  style={{ height: '100%', background: dailySpent > dailyAllowance ? 'var(--accent-danger)' : 'var(--text-primary)' }}
                />
              </div>
            </div>
          </motion.div>


      </motion.div>

      <div className="dashboard-grid">
        {/* Recent Transactions */}
        <div>
          <div className="section-header">
            <h2 className="section-title">{t('dashboard.recentTransactions') || 'Recent Transactions'}</h2>
            <Link href="/expenses" className="text-muted" style={{ fontSize: '0.85rem' }}>{t('dashboard.viewAll') || 'View All'}</Link>
          </div>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="list-group"
          >
            {recentTransactions.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>{t('dashboard.noRecent') || 'No recent transactions.'}</div>
            )}
            {recentTransactions.map(tx => (
              <motion.div key={tx.id} variants={itemVariants} className="list-item">
                <div className="list-item-left">
                  <div className="list-item-icon" style={{ background: tx.categories?.color ? `${tx.categories.color}20` : 'transparent', color: tx.categories?.color || 'var(--text-primary)', border: 'var(--border-delicate)', width: '2.25rem', height: '2.25rem' }}>
                    {tx.categories?.icon ? emojiToLucide(tx.categories.icon) : emojiToLucide('📄')}
                  </div>
                  <div>
                    <div className="list-item-title">{tx.description || tx.categories?.name}</div>
                    <div className="list-item-subtitle">{tx.categories?.name} • {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </div>
                </div>
                <div className="list-item-right" style={{ color: tx.type === 'income' ? 'var(--accent-success)' : 'var(--text-primary)', fontWeight: tx.type === 'income' ? 600 : 400 }}>
                  {tx.type === 'income' ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Upcoming Bills */}
        <div>
          <div className="section-header">
            <h2 className="section-title">{t('dashboard.upcomingBills') || 'Upcoming Bills'}</h2>
            <Link href="/bills" className="text-muted" style={{ fontSize: '0.85rem' }}>{t('dashboard.viewAll') || 'View All'}</Link>
          </div>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="list-group"
          >
            {upcomingBills.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>{t('dashboard.noUpcoming') || 'No upcoming bills.'}</div>
            )}
            {upcomingBills.map(bill => {
              const daysUntilDue = Math.ceil((new Date(bill.due_date) - new Date()) / (1000 * 60 * 60 * 24));
              const isUrgent = daysUntilDue <= 3;
              return (
                <motion.div key={bill.id} variants={itemVariants} className="list-item">
                  <div className="list-item-left">
                    <div className="list-item-icon" style={{ background: 'transparent', border: 'var(--border-delicate)', width: '2.25rem', height: '2.25rem' }}>
                      <Wifi size={14} className="text-muted" />
                    </div>
                    <div>
                      <div className="list-item-title">{bill.name}</div>
                      <div className="list-item-subtitle" style={{ color: isUrgent ? 'var(--accent-danger)' : 'var(--text-muted)' }}>
                        {daysUntilDue < 0 ? `Overdue by ${Math.abs(daysUntilDue)} days` : daysUntilDue === 0 ? 'Due Today' : `Due in ${daysUntilDue} days`}
                      </div>
                    </div>
                  </div>
                  <div className="list-item-right">₹{Number(bill.amount).toLocaleString('en-IN')}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 639px) {
          .add-text { display: none; }
        }
        @media (min-width: 640px) {
          .add-text { display: inline; }
        }
      `}} />
    </div>
  );
}
