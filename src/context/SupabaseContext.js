'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

const SupabaseContext = createContext(null);

export const SupabaseProvider = ({ children }) => {
  // 'loading', 'unauthenticated', 'needs_pin_setup', 'needs_pin', 'authenticated'
  const [authState, setAuthState] = useState('loading'); 
  const [userProfile, setUserProfile] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthState('unauthenticated');
        return;
      }

      // Verify the session is still valid on the server (handles deleted users)
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        await supabase.auth.signOut();
        setAuthState('unauthenticated');
        return;
      }
      
      // Fetch profile (explicitly excluding pin_hash to avoid RLS permissions error)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, user_id, username, name, failed_attempts, locked_until')
        .eq('user_id', session.user.id)
        .single();
        
      if (profile) {
        setUserProfile(profile);
      }

      // Check if PIN is setup using the custom RPC
      const { data: hasPin, error: rpcError } = await supabase.rpc('has_pin_setup');
      
      if (rpcError) {
        console.warn("has_pin_setup RPC failed (might need to run the updated SQL). Defaulting to checking if profile exists.", rpcError);
      }
      
      // If we don't know for sure, we default to needing setup if there's no profile, else needs pin
      const pinIsSetup = hasPin === true;

      if (pinIsSetup) {
        // We know they have a PIN, and because this is a highly secure dashboard,
        // we deliberately force them to enter it on every refresh or new tab.
        setAuthState('needs_pin');
      } else {
        setAuthState('needs_pin_setup');
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      setAuthState('unauthenticated');
    }
  };

  useEffect(() => {
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem('pin_verified');
        setAuthState('unauthenticated');
        setUserProfile(null);
      } else if (event === 'SIGNED_IN') {
        checkSession();
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Route protection based on authState
    if (authState === 'loading') return;
    
    // Only allow access to non-login pages if fully authenticated
    if (authState !== 'authenticated' && pathname !== '/login') {
      router.push('/login');
    } else if (authState === 'authenticated' && pathname === '/login') {
      router.push('/');
    }
  }, [authState, pathname, router]);

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
