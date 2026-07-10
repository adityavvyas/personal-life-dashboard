'use client';
import { useState, useEffect } from 'react';
import { useSupabase } from '@/context/SupabaseContext';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/context/ToastProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { useNotifications } from '@/context/NotificationProvider';
import { LogOut, RefreshCw, Key, Shield, User, Globe, Moon, Database, Home, Sliders, LayoutGrid, Settings as SettingsIcon, Users, ArrowUpCircle, ShieldCheck, Camera, X, UserCircle, Link as LinkIcon, Unlink } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';

export default function SettingsPage() {
  const { supabase, logout, setupPin, loginPin, sendRecoveryOtp, verifyPinResetOtp, userProfile, updateProfile } = useSupabase();
  const { theme, setTheme } = useTheme();
  const { addToast } = useToast();
  const { language, changeLanguage, t, languages } = useLanguage();
  const { isNotificationsEnabled, requestPermission, disableNotifications } = useNotifications();
  
  const [activeTab, setActiveTab] = useState('general');
  const [newPin, setNewPin] = useState('');
  const [oldPin, setOldPin] = useState('');
  const [pinStep, setPinStep] = useState('initial'); // initial, verify_old, otp, new_pin
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  
  // Profile state
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Auth providers
  const [linkedProviders, setLinkedProviders] = useState([]);
  const [isLinking, setIsLinking] = useState(false);
  
  // Toggles state
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    let themeName = newTheme.charAt(0).toUpperCase() + newTheme.slice(1);
    addToast(`Appearance updated to ${themeName}`);
  };

  if (userProfile && !initialized) {
    setEditName(userProfile.name || '');
    setEditUsername(userProfile.username || '');
    setInitialized(true);
  }

  // Load identities and profile photo
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.identities) {
        setLinkedProviders(user.identities.map(i => i.provider));
      }
      const { data } = await supabase.from('settings').select('value').eq('key', 'profile_photo').maybeSingle();
      if (data && data.value) setProfilePhoto(data.value);
    };
    loadData();
  }, [supabase]);

  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => setOtpTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleStartPinChange = () => {
    setPinStep('verify_old');
    setOldPin('');
    setNewPin('');
    setOtpCode('');
  };

  const handleVerifyOldPin = async () => {
    if (oldPin.length !== 4) return addToast('PIN must be 4 digits', 'error');
    const { success, error } = await loginPin(oldPin);
    if (success) {
      setPinStep('new_pin');
    } else {
      addToast(error || 'Incorrect PIN', 'error');
    }
  };

  const handleSendOtp = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return addToast('No email found', 'error');
    
    const { success, error } = await sendRecoveryOtp(user.email);
    if (!success) {
      addToast(error || 'Failed to send OTP.', 'error');
    } else {
      setOtpTimer(60);
      setPinStep('otp');
      addToast('OTP sent to your email', 'success');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) return addToast('Enter OTP', 'error');
    const { data: { user } } = await supabase.auth.getUser();
    const { success, error } = await verifyPinResetOtp(user.email, otpCode);
    if (!success) {
      addToast('Invalid or expired OTP', 'error');
    } else {
      setPinStep('new_pin');
      addToast('OTP verified', 'success');
    }
  };

  const handlePinSave = async () => {
    if (newPin.length !== 4) {
      addToast('New PIN must be exactly 4 digits', 'error');
      return;
    }
    const { success, error } = await setupPin(newPin);
    if (success) {
      addToast('Dashboard PIN successfully updated!', 'success');
      setNewPin('');
      setPinStep('initial');
    } else {
      addToast(error || 'Failed to update PIN', 'error');
    }
  };
  
  const handleProfileSave = async () => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,15}$/;
    if (!usernameRegex.test(editUsername)) {
      addToast('Username must be 3-15 chars, letters/numbers/underscores only', 'error');
      return;
    }
    
    setIsSavingProfile(true);
    const { success, error } = await updateProfile({ name: editName, username: editUsername });
    setIsSavingProfile(false);
    if (success) {
      addToast('Profile updated!', 'success');
    } else {
      addToast(error || 'Failed to update profile settings. Username might be taken.', 'error');
    }
  };
  
  const handleLinkGoogle = async () => {
    setIsLinking(true);
    try {
      const { data, error } = await supabase.auth.linkIdentity({ provider: 'google', options: { redirectTo: window.location.href } });
      if (error) throw error;
      addToast('Redirecting to Google...', 'success');
    } catch (e) {
      addToast(e.message, 'error');
      setIsLinking(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    setIsLinking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const googleIdentity = user.identities.find(i => i.provider === 'google');
      if (googleIdentity) {
        const { error } = await supabase.auth.unlinkIdentity(googleIdentity);
        if (error) throw error;
        setLinkedProviders(prev => prev.filter(p => p !== 'google'));
        addToast('Google account unlinked', 'success');
      }
    } catch (e) {
      addToast(e.message, 'error');
    }
    setIsLinking(false);
  };

  const handleToggle = (setter, currentValue, name) => {
    setter(!currentValue);
    addToast(`${name} ${!currentValue ? 'enabled' : 'disabled'}`);
  };

  const handleNotificationToggle = async () => {
    if (isNotificationsEnabled) {
      disableNotifications();
      addToast(t('settings.notificationsDisabled') || 'Desktop notifications disabled');
    } else {
      const granted = await requestPermission();
      if (granted) {
        addToast(t('settings.notificationsEnabled') || 'Desktop notifications enabled', 'success');
      } else {
        addToast(t('settings.notificationsDenied') || 'Permission denied by browser', 'error');
      }
    }
  };

  const handleCheckbox = (name, e) => {
    addToast(`Notification preference for "${name}" updated`);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return addToast('Image must be under 5MB', 'error');
    
    setIsUploadingPhoto(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise(resolve => { img.onload = resolve; });
      const size = 200;
      canvas.width = size;
      canvas.height = size;
      const scale = Math.max(size / img.width, size / img.height);
      const x = (size - img.width * scale) / 2;
      const y = (size - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      await supabase.from('settings').upsert({ key: 'profile_photo', value: dataUrl });
      setProfilePhoto(dataUrl);
      window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { detail: dataUrl }));
      addToast('Profile photo updated!', 'success');
    } catch(err) {
      addToast('Failed to upload photo', 'error');
    }
    setIsUploadingPhoto(false);
  };

  const handleRemovePhoto = async () => {
    await supabase.from('settings').delete().eq('key', 'profile_photo');
    setProfilePhoto(null);
    window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { detail: null }));
    addToast('Profile photo removed');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Breadcrumb Header */}
      <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-delicate)', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {t('settings.title') || 'Settings'} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>›</span> <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>{activeTab === 'profile' ? (t('settings.myProfile') || 'My Profile') : (t('settings.general') || 'General')}</span>
        </h1>
      </div>

      <div className="settings-layout" style={{ display: 'flex', gap: '3rem', flex: 1, flexWrap: 'wrap', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        
        {/* Left Inner Sidebar */}
        <div className="settings-sidebar" style={{ width: '100%', minWidth: 'auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.75rem', paddingLeft: '0.75rem' }}>{t('settings.account') || 'ACCOUNT'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')} style={{ background: activeTab === 'profile' ? 'var(--bg-surface)' : 'transparent', padding: '0.5rem 0.75rem', borderRadius: '6px', color: activeTab === 'profile' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'profile' ? 500 : 400, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                <User size={16} /> {t('settings.myProfile') || 'My Profile'}
              </div>
              <div className={`sidebar-link ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')} style={{ background: activeTab === 'general' ? 'var(--bg-surface)' : 'transparent', padding: '0.5rem 0.75rem', borderRadius: '6px', color: activeTab === 'general' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'general' ? 500 : 400, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                <Home size={16} /> {t('settings.general') || 'General'}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, maxWidth: '800px', width: '100%' }}>
          
          {activeTab === 'general' ? (
            <>
              {/* My Notifications Section */}
              <div style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-delicate)' }}>{t('settings.myNotifications') || 'My Notifications'}</h2>
            
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 500 }}>{t('settings.notifyMe') || 'Notify me when...'}</h3>
                <span style={{ fontSize: '0.85rem', color: '#3b82f6', cursor: 'pointer' }}>{t('settings.aboutNotif') || 'About notifications?'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" className="custom-checkbox" defaultChecked onChange={(e) => handleCheckbox('Daily productivity update', e)} /> {t('settings.dailyUpdate') || 'Daily productivity update'}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" className="custom-checkbox" defaultChecked onChange={(e) => handleCheckbox('New event created', e)} /> {t('settings.newEvent') || 'New event created'}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" className="custom-checkbox" defaultChecked onChange={(e) => handleCheckbox('When added on new team', e)} /> {t('settings.addedTeam') || 'When added on new team'}
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 500, margin: '0 0 0.25rem 0' }}>{t('settings.pushNotif') || 'Mobile push notifications'}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('settings.pushDesc') || 'Receive push notification whenever your organisation requires your attentions'}</p>
                </div>
                <label className="custom-switch">
                  <input type="checkbox" checked={pushEnabled} onChange={() => handleToggle(setPushEnabled, pushEnabled, 'Mobile push notifications')} />
                  <span className="switch-slider"></span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 500, margin: '0 0 0.25rem 0' }}>{t('settings.notificationsTitle')}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('settings.notificationsDesc')}</p>
                </div>
                <label className="custom-switch">
                  <input type="checkbox" checked={isNotificationsEnabled} onChange={handleNotificationToggle} />
                  <span className="switch-slider"></span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 500, margin: '0 0 0.25rem 0' }}>{t('settings.emailNotif') || 'Email Notification'}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('settings.emailDesc') || 'Receive email whenever your organisation requires your attentions'}</p>
                </div>
                <label className="custom-switch">
                  <input type="checkbox" checked={emailEnabled} onChange={() => handleToggle(setEmailEnabled, emailEnabled, 'Email notifications')} />
                  <span className="switch-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* My Settings Section */}
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-delicate)' }}>{t('settings.mySettings') || 'My Settings'}</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 500, margin: '0 0 0.25rem 0' }}>{t('settings.appearance') || 'Appearance'}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('settings.appearanceDesc') || 'Customize how your theme looks on your device.'}</p>
                </div>
                <CustomSelect 
                  style={{ maxWidth: '160px' }}
                  options={[
                    { value: 'light', label: t('settings.light') || 'Light' },
                    { value: 'dark', label: t('settings.dark') || 'Dark' },
                    { value: 'system', label: t('settings.system') || 'System' }
                  ]}
                  value={theme}
                  onChange={handleThemeChange}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 500, margin: '0 0 0.25rem 0' }}>{t('settings.languageTitle')}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('settings.languageLabel')}</p>
                </div>
                <CustomSelect 
                  style={{ maxWidth: '200px' }}
                  options={languages.map(lang => ({
                    value: lang.code,
                    label: `${lang.nativeName} (${lang.name})`
                  }))}
                  value={language}
                  onChange={changeLanguage}
                />
              </div>
            </div>
          </div>
            </>
          ) : (
            <>
              {/* My Profile Section */}
              <div style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-delicate)' }}>{t('settings.myProfile') || 'My Profile'}</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  
                  {/* Profile Photo */}
                  <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: 'var(--border-delicate)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Camera size={16} /> Profile Photo
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ position: 'relative' }}>
                        <div style={{ 
                          width: '90px', height: '90px', borderRadius: '50%', 
                          background: profilePhoto ? `url(${profilePhoto}) center/cover` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: '2rem', fontWeight: 600,
                          border: '3px solid var(--border-delicate)',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}>
                          {!profilePhoto && (editName ? editName.charAt(0).toUpperCase() : 'U')}
                        </div>
                        {profilePhoto && (
                          <button 
                            onClick={handleRemovePhoto}
                            style={{ position: 'absolute', top: -4, right: -4, width: '22px', height: '22px', borderRadius: '50%', background: '#ef4444', border: '2px solid var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label className="btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', opacity: isUploadingPhoto ? 0.7 : 1 }}>
                          <Camera size={14} /> {isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                          <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} disabled={isUploadingPhoto} />
                        </label>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>JPG, PNG under 5MB. Auto-cropped to 200×200.</span>
                      </div>
                    </div>
                  </div>

                  {/* Personal Details */}
                  <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: 'var(--border-delicate)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={16} /> Personal Details
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Full Name</label>
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Enter your name" style={{ background: 'var(--bg-color)' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Username</label>
                        <div style={{ position: 'relative' }}>
                          <UserCircle size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} placeholder="username_123" style={{ background: 'var(--bg-color)', paddingLeft: '2.5rem' }} />
                        </div>
                      </div>
                      <button className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.5rem', opacity: isSavingProfile ? 0.7 : 1 }} disabled={isSavingProfile} onClick={handleProfileSave}>
                        {isSavingProfile ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Authentication Methods */}
                  <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: 'var(--border-delicate)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Shield size={16} /> Authentication Methods
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>Google Account</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Link your Google account to sign in quickly.</div>
                      </div>
                      {linkedProviders.includes('google') ? (
                        <button className="btn-secondary" onClick={handleUnlinkGoogle} disabled={isLinking} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-danger)', borderColor: 'var(--border-delicate)' }}>
                          <Unlink size={16} /> {isLinking ? 'Unlinking...' : 'Disconnect'}
                        </button>
                      ) : (
                        <button className="btn-secondary" onClick={handleLinkGoogle} disabled={isLinking} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', color: '#333' }}>
                          <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '16px', height: '16px' }} /> {isLinking ? 'Linking...' : 'Connect Google'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: 'var(--border-delicate)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={16} /> Account Actions
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>Sign Out</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Log out of this device.</div>
                        </div>
                        <button className="btn-secondary" onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <LogOut size={16} /> Sign Out
                        </button>
                      </div>
                      <div style={{ height: '1px', background: 'var(--border-delicate)' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--accent-danger)' }}>Delete Account</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Permanently delete your account and all data.</div>
                        </div>
                        <button className="btn-primary" onClick={() => { if(confirm('Are you absolutely sure you want to delete your account? This cannot be undone.')) addToast('Account deletion must be processed by an administrator.', 'error') }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-danger)' }}>
                           Delete Account
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Security & PIN */}
                  <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: 'var(--border-delicate)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Key size={16} /> Security & PIN
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>Dashboard PIN</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Change the PIN you use to access this dashboard.</div>
                      </div>
                      
                      {pinStep === 'initial' && (
                        <button className="btn-secondary" onClick={handleStartPinChange}>Change PIN</button>
                      )}

                      {pinStep === 'verify_old' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input type="password" maxLength={4} placeholder="Old 4-digit PIN" value={oldPin} onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))} style={{ width: '140px', padding: '0.4rem 0.75rem', background: 'var(--bg-color)' }} autoFocus />
                            <button className="btn-primary" onClick={handleVerifyOldPin}>Next</button>
                            <button className="btn-secondary" onClick={() => setPinStep('initial')}>Cancel</button>
                          </div>
                          <button onClick={handleSendOtp} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}>Forgot PIN?</button>
                        </div>
                      )}

                      {pinStep === 'otp' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>We sent a code to your email.</div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input type="text" placeholder="Enter OTP" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} style={{ width: '140px', padding: '0.4rem 0.75rem', background: 'var(--bg-color)' }} autoFocus />
                            <button className="btn-primary" onClick={handleVerifyOtp}>Verify</button>
                            <button className="btn-secondary" onClick={() => setPinStep('initial')}>Cancel</button>
                          </div>
                          <button onClick={handleSendOtp} disabled={otpTimer > 0} style={{ background: 'none', border: 'none', color: otpTimer > 0 ? 'var(--text-muted)' : '#3b82f6', fontSize: '0.8rem', cursor: otpTimer > 0 ? 'default' : 'pointer', padding: 0 }}>
                            {otpTimer > 0 ? `Resend code in ${otpTimer}s` : 'Resend OTP'}
                          </button>
                        </div>
                      )}

                      {pinStep === 'new_pin' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--accent-success)' }}>Verification successful. Set your new PIN.</div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input type="password" maxLength={4} placeholder="New 4-digit PIN" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} style={{ width: '140px', padding: '0.4rem 0.75rem', background: 'var(--bg-color)' }} autoFocus />
                            <button className="btn-primary" onClick={handlePinSave}>Save</button>
                            <button className="btn-secondary" onClick={() => setPinStep('initial')}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 768px) {
          .settings-sidebar { width: 220px !important; flex-shrink: 0 !important; }
          .settings-layout { flex-wrap: nowrap !important; }
        }
        @media (max-width: 767px) {
          .settings-sidebar {
            flex-direction: row !important;
            overflow-x: auto !important;
            gap: 0.5rem !important;
            padding-bottom: 0.75rem !important;
            border-bottom: var(--border-delicate) !important;
            border-right: none !important;
          }
          .settings-sidebar button,
          .settings-sidebar .sidebar-link {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
          }
        }
      `}} />
    </div>
  );
}
