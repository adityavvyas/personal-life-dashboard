'use client';

import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/context/SupabaseContext';
import AnimatedBackground from '@/components/AnimatedBackground';

export default function ConfirmPage() {
  const router = useRouter();
  const { authState } = useSupabase();
  const [status, setStatus] = useState('processing'); // processing, success

  useEffect(() => {
    // Supabase automatically processes the URL hash token.
    // We just wait for authState to change to anything other than unauthenticated/loading
    if (authState === 'needs_pin_setup' || authState === 'authenticated' || authState === 'needs_pin') {
      setStatus('success');
    }
  }, [authState]);

  return (
    <div className="login-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <AnimatedBackground />
      <div className="login-form-card" style={{ maxWidth: '400px', textAlign: 'center', padding: '3rem 2rem' }}>
        {status === 'processing' ? (
          <div>
            <div className="spinner" style={{ margin: '0 auto 1.5rem auto' }}></div>
            <h2 style={{ marginBottom: '0.5rem' }}>Verifying...</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Please wait while we confirm your email.</p>
          </div>
        ) : (
          <div>
            <CheckCircle size={64} color="var(--accent-success, #10ac84)" style={{ margin: '0 auto 1.5rem auto' }} />
            <h2 style={{ marginBottom: '1rem' }}>Email Confirmed!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.5' }}>
              Your account has been successfully verified. 
              <br/><br/>
              <strong>You can now close this tab and return to your original window</strong> to set up your PIN.
            </p>
            <button 
              onClick={() => router.push('/login')} 
              className="btn-primary"
              style={{ width: '100%', padding: '0.875rem' }}
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
