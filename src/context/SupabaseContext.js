'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

const SupabaseContext = createContext(null);

// ─── PIN Session Constants ───────────────────────────────────────────────────
const PIN_SESSION_KEY = 'pin_session';
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const IDLE_CHECK_INTERVAL_MS = 30 * 1000; // Check every 30 seconds

// ─── localStorage helpers (safe for Safari private mode) ─────────────────────
const safeGetPinSession = () => {
  try {
    const raw = localStorage.getItem(PIN_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const safeSetPinSession = (userId) => {
  try {
    localStorage.setItem(PIN_SESSION_KEY, JSON.stringify({
      unlockedAt: Date.now(),
      userId,
    }));
  } catch {
    // localStorage unavailable — session won't persist across refresh
  }
};

const safeClearPinSession = () => {
  try {
    localStorage.removeItem(PIN_SESSION_KEY);
  } catch {
    // Ignore
  }
};

const safeRefreshActivity = () => {
  try {
    const raw = localStorage.getItem(PIN_SESSION_KEY);
    if (!raw) return;
    const session = JSON.parse(raw);
    session.unlockedAt = Date.now();
    localStorage.setItem(PIN_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore
  }
};

const isPinSessionValid = (userId) => {
  const session = safeGetPinSession();
  if (!session) return false;
  if (session.userId !== userId) return false;
  if (Date.now() - session.unlockedAt > IDLE_TIMEOUT_MS) return false;
  return true;
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════
export const SupabaseProvider = ({ children }) => {
  // Auth states: 'loading' | 'unauthenticated' | 'needs_pin_setup' | 'needs_pin' | 'authenticated'
  const [authState, setAuthState] = useState('loading');
  const [userProfile, setUserProfile] = useState(null);
  const router = useRouter();
  const pathname = usePathname();
  const idleTimerRef = useRef(null);
  const currentUserIdRef = useRef(null);

  // ─── Core session check ──────────────────────────────────────────────────
  const checkSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthState('unauthenticated');
        return;
      }

      // Verify session is valid on the server (catches deleted users)
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        await supabase.auth.signOut();
        setAuthState('unauthenticated');
        return;
      }

      currentUserIdRef.current = user.id;

      // Fetch profile (exclude pin_hash — handled by RPCs)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, user_id, username, name, failed_attempts, locked_until')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
      }

      // Check if PIN is setup
      const { data: hasPin, error: rpcError } = await supabase.rpc('has_pin_setup');

      if (rpcError) {
        console.warn('has_pin_setup RPC failed:', rpcError);
      }

      const pinIsSetup = hasPin === true;

      if (!pinIsSetup) {
        setAuthState('needs_pin_setup');
        return;
      }

      // ── PhonePe-style: check localStorage for a valid PIN session ──
      if (isPinSessionValid(user.id)) {
        // PIN was entered recently and hasn't expired — skip PIN screen
        setAuthState('authenticated');
      } else {
        // PIN exists but session expired or missing — require PIN entry
        safeClearPinSession(); // Clean up any stale session
        setAuthState('needs_pin');
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setAuthState('unauthenticated');
    }
  }, []);

  // ─── Idle timeout: lock after 15 min of inactivity ───────────────────────
  const startIdleTimer = useCallback(() => {
    // Clear any existing timer
    if (idleTimerRef.current) clearInterval(idleTimerRef.current);

    idleTimerRef.current = setInterval(() => {
      const userId = currentUserIdRef.current;
      if (!userId) return;

      if (!isPinSessionValid(userId)) {
        setAuthState('needs_pin');
        safeClearPinSession();
      }
    }, IDLE_CHECK_INTERVAL_MS);
  }, []);

  const stopIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearInterval(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  // ─── Activity tracking: refresh idle timestamp on user interaction ───────
  useEffect(() => {
    if (authState !== 'authenticated') return;

    const handleActivity = () => safeRefreshActivity();

    // Throttle: update at most once per 10 seconds to avoid localStorage thrash
    let lastUpdate = 0;
    const throttledActivity = () => {
      const now = Date.now();
      if (now - lastUpdate > 10000) {
        lastUpdate = now;
        handleActivity();
      }
    };

    window.addEventListener('click', throttledActivity, { passive: true });
    window.addEventListener('keydown', throttledActivity, { passive: true });
    window.addEventListener('scroll', throttledActivity, { passive: true });
    window.addEventListener('touchstart', throttledActivity, { passive: true });

    return () => {
      window.removeEventListener('click', throttledActivity);
      window.removeEventListener('keydown', throttledActivity);
      window.removeEventListener('scroll', throttledActivity);
      window.removeEventListener('touchstart', throttledActivity);
    };
  }, [authState]);

  // ─── Page Visibility API: re-check timeout when tab becomes visible ──────
  useEffect(() => {
    if (authState !== 'authenticated') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const userId = currentUserIdRef.current;
        if (userId && !isPinSessionValid(userId)) {
          setAuthState('needs_pin');
          safeClearPinSession();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [authState]);

  // ─── Cross-tab sync: listen for localStorage changes from other tabs ─────
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key !== PIN_SESSION_KEY) return;

      if (e.newValue === null) {
        // Another tab cleared the session (logout)
        setAuthState((prev) => {
          if (prev === 'authenticated') return 'needs_pin';
          return prev;
        });
      } else {
        // Another tab set/refreshed the session (login)
        try {
          const session = JSON.parse(e.newValue);
          const userId = currentUserIdRef.current;
          if (userId && session.userId === userId) {
            setAuthState((prev) => {
              if (prev === 'needs_pin') return 'authenticated';
              return prev;
            });
          }
        } catch {
          // Malformed data, ignore
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // ─── Initialization & auth listener ──────────────────────────────────────
  useEffect(() => {
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        safeClearPinSession();
        stopIdleTimer();
        setAuthState('unauthenticated');
        setUserProfile(null);
        currentUserIdRef.current = null;
      } else if (event === 'SIGNED_IN') {
        checkSession();
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [checkSession, stopIdleTimer]);

  // ─── Start/stop idle timer based on auth state ───────────────────────────
  useEffect(() => {
    if (authState === 'authenticated') {
      startIdleTimer();
    } else {
      stopIdleTimer();
    }

    return () => stopIdleTimer();
  }, [authState, startIdleTimer, stopIdleTimer]);

  // ─── Route protection ────────────────────────────────────────────────────
  useEffect(() => {
    if (authState === 'loading') return;

    if (authState !== 'authenticated' && pathname !== '/login' && pathname !== '/confirm') {
      router.push('/login');
    } else if (authState === 'authenticated' && pathname === '/login') {
      router.push('/');
    }
  }, [authState, pathname, router]);

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const signUp = async (email, password, username, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, name },
          emailRedirectTo: `${window.location.origin}/confirm`
        }
      });
      if (error) throw error;
      return { success: true, data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const signInWithEmail = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { success: true, data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (e) {
      console.error(e);
    }
  };

  const setupPin = async (pin) => {
    try {
      const { error } = await supabase.rpc('setup_pin', { new_pin: pin });
      if (error) throw error;

      // PIN created — unlock this session
      const userId = currentUserIdRef.current;
      if (userId) safeSetPinSession(userId);
      setAuthState('authenticated');
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const loginPin = async (pin) => {
    try {
      const { data, error } = await supabase.rpc('verify_pin', { pin_attempt: pin });
      if (error) throw error;

      if (data === true) {
        // PIN correct — unlock this session and persist to localStorage
        const userId = currentUserIdRef.current;
        if (userId) safeSetPinSession(userId);
        setAuthState('authenticated');
        return { success: true };
      }
      return { success: false, error: 'Incorrect PIN' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const sendRecoveryOtp = async (email) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const verifyPinResetOtp = async (email, otp) => {
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
      if (error) throw error;
      setAuthState('needs_pin_setup');
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const logout = async () => {
    safeClearPinSession();
    stopIdleTimer();
    await supabase.auth.signOut();
  };

  const sendPasswordResetEmail = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?type=recovery`,
      });
      if (error) throw error;
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const updateProfile = async (updates) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userProfile.user_id);
      if (error) throw error;
      setUserProfile(prev => ({ ...prev, ...updates }));
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const isAuthenticated = authState === 'authenticated';
  const isLoading = authState === 'loading';

  return (
    <SupabaseContext.Provider value={{
      supabase,
      authState,
      isAuthenticated,
      isLoading,
      userProfile,
      signUp,
      signInWithEmail,
      signInWithGoogle,
      setupPin,
      loginPin,
      sendRecoveryOtp,
      verifyPinResetOtp,
      sendPasswordResetEmail,
      logout,
      updateProfile
    }}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  return useContext(SupabaseContext);
};
