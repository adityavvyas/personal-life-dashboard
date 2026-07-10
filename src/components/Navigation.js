'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSupabase } from '@/context/SupabaseContext';
import { useLanguage } from '@/context/LanguageProvider';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, 
  Wallet, 
  Receipt, 
  LineChart, 
  Target, 
  Calendar, 
  CheckCircle2, 
  MoreHorizontal,
  LayoutDashboard,
  Fuel,
  Settings,
  LogOut,
  X,
  ChevronRight
} from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const { isAuthenticated, logout, userProfile, supabase } = useSupabase();
  const { t } = useLanguage();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);

  useEffect(() => {
    if (!supabase) return;
    const loadPhoto = async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'profile_photo').maybeSingle();
      if (data && data.value) setProfilePhoto(data.value);
      else setProfilePhoto(null);
    };
    loadPhoto();

    const handlePhotoUpdate = (e) => setProfilePhoto(e.detail);
    window.addEventListener('profilePhotoUpdated', handlePhotoUpdate);
    return () => window.removeEventListener('profilePhotoUpdated', handlePhotoUpdate);
  }, [supabase]);

  // Close More menu on route change
  useEffect(() => {
    setShowMoreMenu(false);
  }, [pathname]);

  const navGroups = [
    {
      title: t('nav.groupOverview') || 'Overview',
      items: [
        { name: t('nav.dashboard') || 'Dashboard', path: '/', icon: <Home size={18} /> },
        { name: t('nav.market') || 'Market', path: '/market', icon: <LineChart size={18} /> },
      ]
    },
    {
      title: t('nav.groupFinance') || 'Finance',
      items: [
        { name: t('nav.accounts') || 'Accounts', path: '/accounts', icon: <Wallet size={18} /> },
        { name: t('nav.expenses') || 'Expenses', path: '/expenses', icon: <Receipt size={18} /> },
        { name: t('nav.bills') || 'Bills', path: '/bills', icon: <Calendar size={18} /> },
      ]
    },
    {
      title: t('nav.groupLife') || 'Life',
      items: [
        { name: t('nav.goals') || 'Goals', path: '/goals', icon: <Target size={18} /> },
        { name: t('nav.routines') || 'Routines', path: '/routines', icon: <CheckCircle2 size={18} /> },
        { name: t('nav.fuel') || 'Fuel', path: '/fuel', icon: <Fuel size={18} /> },
      ]
    }
  ];

  // Mobile: 4 primary tabs + More button
  const mobilePrimaryItems = [
    { name: 'Home', path: '/', icon: <Home size={20} /> },
    { name: 'Accounts', path: '/accounts', icon: <Wallet size={20} /> },
    { name: 'Market', path: '/market', icon: <LineChart size={20} /> },
    { name: 'Goals', path: '/goals', icon: <Target size={20} /> },
  ];

  // Items in the "More" bottom sheet
  const moreMenuItems = [
    { name: t('nav.expenses') || 'Expenses', path: '/expenses', icon: <Receipt size={20} /> },
    { name: t('nav.bills') || 'Bills', path: '/bills', icon: <Calendar size={20} /> },
    { name: t('nav.routines') || 'Routines', path: '/routines', icon: <CheckCircle2 size={20} /> },
    { name: t('nav.fuel') || 'Fuel', path: '/fuel', icon: <Fuel size={20} /> },
    { name: t('settings.title') || 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  const isMoreActive = moreMenuItems.some(item => pathname === item.path);

  if (!isAuthenticated || pathname === '/login') return null;

  return (
    <>
      {/* ===== MOBILE FLOATING NAV ===== */}
      <nav className="nav-mobile">
        <div className="nav-mobile-pill">
          {mobilePrimaryItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path}
                href={item.path}
                className="nav-mobile-tab"
                style={{ position: 'relative' }}
              >
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '0.2rem',
                    position: 'relative',
                    zIndex: 1,
                    padding: '0.4rem 0'
                  }}
                >
                  <span style={{ 
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                    transition: 'color 0.2s ease'
                  }}>
                    {item.icon}
                  </span>
                  <span style={{
                    fontSize: '0.6rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                    letterSpacing: '0.02em',
                    transition: 'color 0.2s ease'
                  }}>
                    {item.name}
                  </span>
                </motion.div>
                {isActive && (
                  <motion.div
                    layoutId="nav-mobile-indicator"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '20px',
                      height: '3px',
                      background: 'var(--accent-primary)',
                      borderRadius: '0 0 4px 4px'
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}

          {/* More Button */}
          <button 
            className="nav-mobile-tab"
            onClick={() => setShowMoreMenu(true)}
            style={{ background: 'none', border: 'none', position: 'relative' }}
          >
            <motion.div
              whileTap={{ scale: 0.85 }}
              style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '0.2rem',
                padding: '0.4rem 0'
              }}
            >
              <span style={{ 
                color: isMoreActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                transition: 'color 0.2s ease'
              }}>
                <MoreHorizontal size={20} />
              </span>
              <span style={{
                fontSize: '0.6rem',
                fontWeight: isMoreActive ? 600 : 500,
                color: isMoreActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                letterSpacing: '0.02em',
                transition: 'color 0.2s ease'
              }}>
                More
              </span>
            </motion.div>
            {isMoreActive && (
              <motion.div
                layoutId="nav-mobile-indicator"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '20px',
                  height: '3px',
                  background: 'var(--accent-primary)',
                  borderRadius: '0 0 4px 4px'
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        </div>
      </nav>

      {/* ===== MORE BOTTOM SHEET ===== */}
      <AnimatePresence>
        {showMoreMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowMoreMenu(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                zIndex: 998
              }}
              className="mobile-only"
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="mobile-only"
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'var(--bg-surface)',
                borderRadius: '1.5rem 1.5rem 0 0',
                zIndex: 999,
                padding: '0.75rem 1rem',
                paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.15)',
                border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                borderBottom: 'none',
                maxHeight: '70vh',
                overflowY: 'auto'
              }}
            >
              {/* Handle bar */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <div style={{ width: '36px', height: '4px', borderRadius: '4px', background: 'var(--text-muted)', opacity: 0.3 }} />
              </div>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>More</h3>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowMoreMenu(false)}
                  style={{
                    background: 'var(--bg-color)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-muted)'
                  }}
                >
                  <X size={16} />
                </motion.button>
              </div>

              {/* Menu Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {moreMenuItems.map((item, idx) => {
                  const isActive = pathname === item.path;
                  return (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Link
                        href={item.path}
                        onClick={() => setShowMoreMenu(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          padding: '0.9rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          textDecoration: 'none',
                          background: isActive ? 'var(--bg-color)' : 'transparent',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: 'var(--radius-md)',
                          background: isActive ? 'var(--accent-primary)' : 'var(--bg-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isActive ? '#fff' : 'var(--text-muted)',
                          transition: 'all 0.15s ease',
                          flexShrink: 0
                        }}>
                          {item.icon}
                        </div>
                        <span style={{
                          fontSize: '0.95rem',
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                          flex: 1
                        }}>
                          {item.name}
                        </span>
                        <ChevronRight size={16} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Logout */}
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: 'var(--border-delicate)' }}>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setShowMoreMenu(false); logout(); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.9rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(239,68,68,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-danger)',
                    flexShrink: 0
                  }}>
                    <LogOut size={20} />
                  </div>
                  <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--accent-danger)' }}>
                    {t('nav.logout') || 'Log Out'}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== DESKTOP SIDEBAR (unchanged) ===== */}
      <nav className="nav-desktop">
        <div className="nav-desktop-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--text-primary)', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-surface)' }}>
              <LayoutDashboard size={14} strokeWidth={2.5} />
            </div>
            <h1 className="nav-desktop-label" style={{ fontSize: '1rem', margin: 0, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Life OS</h1>
          </div>
        </div>
        
        <div className="nav-desktop-list hide-scrollbar">
          {navGroups.map((group) => (
            <div key={group.title}>
              <div className="nav-desktop-group-title">
                {group.title}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {group.items.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <li key={item.path} style={{ position: 'relative' }}>
                      <Link 
                        href={item.path}
                        className={`nav-desktop-item ${isActive ? 'active' : ''}`}
                        style={{ position: 'relative', zIndex: 1, background: 'transparent' }}
                      >
                        <div className="nav-icon-wrap" data-tooltip={item.name} style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>{item.icon}</div>
                        <span className="nav-desktop-label" style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{item.name}</span>
                      </Link>
                      {isActive && (
                        <motion.div
                          layoutId="nav-desktop-indicator"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'var(--bg-color)',
                            borderRadius: 'var(--radius-md)',
                            zIndex: 0
                          }}
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: 'var(--border-delicate)', position: 'relative' }}>
          
          {showUserMenu && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                width: '100%',
                marginBottom: '0.5rem',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                border: 'var(--border-delicate)',
                overflow: 'hidden',
                zIndex: 100
              }}
            >
              <Link
                href="/settings"
                style={{
                  display: 'block',
                  padding: '0.75rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  borderBottom: 'var(--border-delicate)'
                }}
                className="user-profile-hover"
                onClick={() => setShowUserMenu(false)}
              >
                {t('settings.title') || 'Settings'}
              </Link>

              <button 
                onClick={logout}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.75rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: 'var(--accent-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
                className="user-profile-hover"
              >
                {t('nav.logout') || 'Log Out'}
              </button>
            </motion.div>
          )}

          <div 
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'background var(--transition-fast)' }} 
            className="user-profile-hover"
          >
            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: profilePhoto ? `url(${profilePhoto}) center/cover` : 'var(--bg-color)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {!profilePhoto && <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}</span>}
            </div>
            
            <div className="nav-desktop-label" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{userProfile?.name || 'User'}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Admin</span>
            </div>
            
            <div className="nav-desktop-label" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
              <ChevronRight size={14} />
            </div>
          </div>
        </div>
      </nav>
      
      <style dangerouslySetInnerHTML={{__html: `
        .user-profile-hover:hover {
          background-color: var(--bg-color);
        }
        @media (min-width: 768px) {
          .mobile-only { display: none !important; }
        }
      `}} />
    </>
  );
}
