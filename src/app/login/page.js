'use client';

import { useState, useEffect } from 'react';
import { User, ShieldCheck, Sun, Moon, Mail, Lock, ArrowRight, UserCircle, Eye, EyeOff } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';
import { useSupabase } from '@/context/SupabaseContext';
import { useTheme } from '@/context/ThemeProvider';
import { useLanguage } from '@/context/LanguageProvider';
import AnimatedBackground from '@/components/AnimatedBackground';

export default function LoginPage() {
  const { t, language, languages, changeLanguage } = useLanguage();
  const { authState, signUp, signInWithEmail, signInWithGoogle, setupPin, loginPin, sendRecoveryOtp, verifyPinResetOtp, sendPasswordResetEmail } = useSupabase();
  const { theme, resolvedTheme, setTheme } = useTheme();

  // Internal view states for unauthenticated users
  // 'landing', 'sign-in', 'sign-up', 'forgot-pin-email', 'forgot-pin-otp', 'forgot-password', 'setup-pin', 'enter-pin'
  const [view, setView] = useState('landing');
  
  // Forms
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStage, setPinStage] = useState('create'); // 'create', 'confirm' for setup-pin
  
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [authStatus, setAuthStatus] = useState('idle'); // for pin shake animation

  // Sync view based on authState
  useEffect(() => {
    setError('');
    if (authState === 'needs_pin_setup') {
      setView('setup-pin');
      setPin('');
      setConfirmPin('');
      setPinStage('create');
    } else if (authState === 'needs_pin') {
      setView('enter-pin');
      setPin('');
    } else if (authState === 'unauthenticated' && !['landing', 'sign-in', 'sign-up', 'forgot-pin-email', 'forgot-pin-otp'].includes(view)) {
      setView('landing');
    }
  }, [authState]);


  // PIN pad handlers
  const handlePinKeyPress = (digit) => {
    if (pin.length < 4 && authStatus !== 'success') {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
      setAuthStatus('idle');
      
      if (newPin.length === 4) {
        if (view === 'enter-pin') {
          submitLoginPin(newPin);
        } else if (view === 'setup-pin') {
          if (pinStage === 'create') {
            setConfirmPin(newPin);
            setPin('');
            setPinStage('confirm');
          } else {
            submitSetupPin(newPin);
          }
        }
      }
    }
  };

  const handlePinDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((view === 'enter-pin' || view === 'setup-pin') && !loading && authStatus !== 'success') {
        if (/^[0-9]$/.test(e.key)) {
          handlePinKeyPress(e.key);
        } else if (e.key === 'Backspace') {
          handlePinDelete();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, view, loading, authStatus, pinStage, confirmPin]); 

  // Submissions
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    const usernameRegex = /^[a-zA-Z0-9_]{3,15}$/;
    if (!usernameRegex.test(username)) {
      setError('Username must be 3-15 chars, letters/numbers/underscores only');
      return;
    }
    setLoading(true);
    setError('');
    const res = await signUp(email, password, username, name);
    if (!res.success) setError(res.error);
    else {
      if (res.data?.user?.identities?.length === 0) {
          setError('Email already registered.');
      } else {
          setError('Success! Please check your email to verify your account.');
      }
    }
    setLoading(false);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await signInWithEmail(email, password);
    if (!res.success) setError('Invalid email or password');
    setLoading(false);
  };

  const submitLoginPin = async (currentPin) => {
    setLoading(true);
    const res = await loginPin(currentPin);
    if (res.success) {
      setAuthStatus('success');
    } else {
      if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100]); 
      setAuthStatus('error');
      setError(res.error || 'Incorrect PIN');
      setTimeout(() => { setPin(''); setAuthStatus('idle'); }, 500);
    }
    setLoading(false);
  };

  const submitSetupPin = async (currentPin) => {
    if (currentPin !== confirmPin) {
      setError('PINs do not match. Try again.');
      setPinStage('create');
      setPin('');
      setConfirmPin('');
      return;
    }
    setLoading(true);
    const res = await setupPin(currentPin);
    if (res.success) {
      setAuthStatus('success');
    } else {
      setError(res.error);
      setPinStage('create');
      setPin('');
      setConfirmPin('');
    }
    setLoading(false);
  };
  
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await sendRecoveryOtp(email);
    if (res.success) {
      setView('forgot-pin-otp');
    } else {
      setError(res.error);
    }
    setLoading(false);
  }
  
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await verifyPinResetOtp(email, otp);
    if (!res.success) {
      setError('Invalid OTP code');
    }
    // Success transitions authState to 'needs_pin_setup' automatically via Context
    setLoading(false);
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setLoading(true);
    setError('');
    const res = await sendPasswordResetEmail(email);
    if (res.success) {
      setError('Password reset email sent! Check your inbox.'); // Using error state as a generic message state for simplicity, or we could add a success state.
    } else {
      setError(res.error);
    }
    setLoading(false);
  };

  // UI Renderers
  const renderPinPad = () => (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          50% { transform: translateX(10px); }
          75% { transform: translateX(-10px); }
        }
        .shake-animation { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }
      `}} />
      
      {view === 'setup-pin' && (
        <p style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          {pinStage === 'create' ? 'Create a 4-digit PIN' : 'Confirm your 4-digit PIN'}
        </p>
      )}
      
      <div className={`pin-display ${authStatus === 'error' ? 'shake-animation' : ''}`}>
        {[0, 1, 2, 3].map((index) => {
          let dotClass = 'pin-dot';
          if (authStatus === 'error') dotClass += ' error';
          else if (authStatus === 'success') dotClass += ' success';
          else if (index < pin.length) dotClass += ' active';
          return <div key={index} className={dotClass} />;
        })}
      </div>

      {error && authStatus !== 'error' && <p style={{ color: 'var(--accent-danger)', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}

      <div className="numpad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <button
            key={digit}
            onClick={() => {
              if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
              handlePinKeyPress(digit.toString());
            }}
            className="numpad-btn"
            disabled={loading || authStatus === 'success'}
          >
            {digit}
          </button>
        ))}
        <div />
        <button onClick={() => {
          if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
          handlePinKeyPress('0');
        }} className="numpad-btn" disabled={loading || authStatus === 'success'}>0</button>
        <button onClick={() => {
          if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
          handlePinDelete();
        }} className="numpad-btn" style={{ color: 'var(--text-secondary)' }} disabled={loading || authStatus === 'success'}>⌫</button>
      </div>
      
      {view === 'enter-pin' && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button onClick={() => setView('forgot-pin-email')} className="text-button" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Forgot PIN?
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="login-container">
      {/* Controls */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 50, display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button 
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          style={{ background: 'var(--bg-surface)', border: 'var(--border-delicate)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', cursor: 'pointer', transition: 'var(--transition-fast)' }}
        >
          {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <CustomSelect 
          style={{ width: '150px' }}
          options={languages.map(lang => ({ value: lang.code, label: lang.nativeName }))}
          value={language}
          onChange={changeLanguage}
        />
      </div>

      <div className="login-left">
        <div className="login-form-card">
          <div className="login-header">
            <h1>{t('login.welcome') || 'Personal Life Dashboard'}</h1>
            {view === 'landing' && <p>Select an option to continue</p>}
            {view === 'sign-in' && <p>Sign in to your account</p>}
            {view === 'sign-up' && <p>Create your new account</p>}
            {view === 'forgot-password' && <p>Reset your password</p>}
            {view === 'forgot-pin-email' && <p>Reset your PIN via Email</p>}
            {view === 'forgot-pin-otp' && <p>Enter the 6-digit code</p>}
            {view === 'enter-pin' && <p>Enter your PIN to unlock</p>}
            {view === 'setup-pin' && <p>Secure your account</p>}
          </div>
          
          <div className="login-panel">
            
            {view === 'landing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button onClick={() => setView('sign-in')} className="btn-primary" style={{ width: '100%', padding: '1rem' }}>Sign In with Email</button>
                <button onClick={() => setView('sign-up')} className="btn-secondary" style={{ width: '100%', padding: '1rem' }}>Create Account</button>
                
                <div style={{ position: 'relative', margin: '1.5rem 0', textAlign: 'center' }}>
                  <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px solid var(--border-delicate)' }}></div>
                  <span style={{ position: 'relative', background: 'var(--bg-panel)', padding: '0 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>OR</span>
                </div>
                
                <button onClick={signInWithGoogle} disabled={loading} className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', background: '#fff', color: '#333', border: '1px solid #ddd' }}>
                  <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '18px', height: '18px' }} />
                  Sign in with Google
                </button>
              </div>
            )}

            {view === 'sign-in' && (
              <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email</label>
                  <div className="input-group" style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border-delicate)', borderRadius: '8px', color: 'var(--text-primary)' }} placeholder="your@email.com" />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Password</label>
                  <div className="input-group" style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '0.75rem 3rem 0.75rem 2.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border-delicate)', borderRadius: '8px', color: 'var(--text-primary)' }} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                  <button type="button" onClick={() => setView('forgot-password')} className="text-button" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Forgot password?</button>
                </div>

                {error && <p style={{ color: 'var(--accent-danger)', fontSize: '0.85rem' }}>{error}</p>}
                
                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.875rem' }}>{loading ? 'Signing in...' : 'Sign In'}</button>
                <button type="button" onClick={() => setView('landing')} className="text-button" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem', alignSelf: 'center' }}>Back to options</button>
              </form>
            )}

            {view === 'forgot-password' && (
              <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email</label>
                  <div className="input-group" style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border-delicate)', borderRadius: '8px', color: 'var(--text-primary)' }} placeholder="your@email.com" />
                  </div>
                </div>
                
                {error && <p style={{ color: error.includes('sent') ? 'var(--accent-success, #10ac84)' : 'var(--accent-danger)', fontSize: '0.85rem' }}>{error}</p>}
                
                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.875rem' }}>{loading ? 'Sending...' : 'Send Reset Link'}</button>
                <button type="button" onClick={() => { setView('sign-in'); setError(''); }} className="text-button" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem', alignSelf: 'center' }}>Back to Sign In</button>
              </form>
            )}

            {view === 'sign-up' && (
              <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Full Name</label>
                  <div className="input-group" style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border-delicate)', borderRadius: '8px', color: 'var(--text-primary)' }} placeholder="John Doe" />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Username</label>
                  <div className="input-group" style={{ position: 'relative' }}>
                    <UserCircle size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" required value={username} onChange={e => setUsername(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border-delicate)', borderRadius: '8px', color: 'var(--text-primary)' }} placeholder="john_doe_123" />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Letters, numbers, underscores (3-15 chars)</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email</label>
                  <div className="input-group" style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border-delicate)', borderRadius: '8px', color: 'var(--text-primary)' }} placeholder="your@email.com" />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Password</label>
                  <div className="input-group" style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '0.75rem 3rem 0.75rem 2.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border-delicate)', borderRadius: '8px', color: 'var(--text-primary)' }} placeholder="Min 8 characters" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                {error && <p style={{ color: error.includes('Success') ? 'var(--accent-success)' : 'var(--accent-danger)', fontSize: '0.85rem' }}>{error}</p>}
                
                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.875rem' }}>{loading ? 'Creating Account...' : 'Sign Up'}</button>
                <button type="button" onClick={() => setView('landing')} className="text-button" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem', alignSelf: 'center' }}>Back to options</button>
              </form>
            )}

            {(view === 'enter-pin' || view === 'setup-pin') && renderPinPad()}

            {view === 'forgot-pin-email' && (
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Enter the email associated with your account to receive a 6-digit recovery code.</p>
                <div>
                  <div className="input-group" style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border-delicate)', borderRadius: '8px', color: 'var(--text-primary)' }} placeholder="your@email.com" />
                  </div>
                </div>
                {error && <p style={{ color: 'var(--accent-danger)', fontSize: '0.85rem' }}>{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.875rem' }}>{loading ? 'Sending...' : 'Send Code'}</button>
                <button type="button" onClick={() => setView('enter-pin')} className="text-button" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem', alignSelf: 'center' }}>Cancel</button>
              </form>
            )}

            {view === 'forgot-pin-otp' && (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>We sent a 6-digit code to <strong>{email}</strong>.</p>
                <div>
                  <div className="input-group" style={{ position: 'relative' }}>
                    <ShieldCheck size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" required value={otp} onChange={e => setOtp(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border-delicate)', borderRadius: '8px', color: 'var(--text-primary)', letterSpacing: '4px', textAlign: 'center' }} placeholder="000000" maxLength={6} />
                  </div>
                </div>
                {error && <p style={{ color: 'var(--accent-danger)', fontSize: '0.85rem' }}>{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.875rem' }}>{loading ? 'Verifying...' : 'Verify Code'}</button>
                <button type="button" onClick={() => setView('forgot-pin-email')} className="text-button" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem', alignSelf: 'center' }}>Back</button>
              </form>
            )}

          </div>
        </div>
      </div>

      <div className="login-right">
        <AnimatedBackground />
        <div className="login-showcase">
          <div className="showcase-content">
            <h2>{t('login.showcaseTitle') || 'All-in-One Life Platform'}</h2>
            <p>{t('login.showcaseDesc') || 'Simplify your daily operations and achieve your goals. Easily manage finances, routines, bills, and analytics — everything you need to run your life smoothly in one smart system.'}</p>
          
            <div className="mockup-panel">
              <div className="mockup-header">
                <div className="mockup-bar-long"></div>
                <div className="mockup-avatar"></div>
              </div>
              <div className="mockup-grid">
                <div className="mockup-card">
                  <div className="mockup-card-title"></div>
                  <div className="mockup-card-value-primary"></div>
                </div>
                <div className="mockup-card">
                  <div className="mockup-card-title"></div>
                  <div className="mockup-card-value-mint"></div>
                </div>
              </div>
              <div className="mockup-chart">
                {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                  <div key={i} className="mockup-chart-bar" style={{ height: `${h}%` }}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
