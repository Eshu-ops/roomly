'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(''); setSuccess('');
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess('Account created! Check your email to confirm, then sign in.');
        setMode('login');
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/join');
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSuccess('Password reset email sent! Check your inbox.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="card w-full max-w-sm p-8">

        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-serif font-semibold">R</div>
          <span className="font-serif text-lg font-semibold">Roomly</span>
        </div>

        <h1 className="font-serif text-xl font-semibold mb-1">
          {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset your password'}
        </h1>
        <p className="text-sm text-ink/60 mb-6">
          {mode === 'login' ? 'Sign in to your house dashboard.' :
           mode === 'signup' ? 'Email and password — no Google login required.' :
           "Enter your email and we'll send you a reset link."}
        </p>

        {success && (
          <div className="bg-accent/10 border border-accent/30 text-accent text-sm rounded-lg px-4 py-3 mb-4">{success}</div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-ink/60 mb-1">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 bg-card outline-none focus:border-accent"
              placeholder="you@example.com" />
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-ink/60">Password</label>
                {mode === 'login' && (
                  <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                    className="text-xs text-accent hover:underline">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-line rounded-lg px-3 py-2 pr-10 bg-card outline-none focus:border-accent"
                  placeholder="At least 6 characters" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink text-xs font-semibold select-none">
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button disabled={busy} type="submit"
            className="w-full bg-accent text-white rounded-lg py-2.5 font-semibold text-sm mt-2 disabled:opacity-60">
            {busy ? 'Please wait…' :
             mode === 'login' ? 'Sign in' :
             mode === 'signup' ? 'Sign up' :
             'Send reset link'}
          </button>
        </form>

        <div className="mt-5 flex flex-col items-center gap-2">
          {mode === 'forgot' ? (
            <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className="text-xs text-ink/60 underline">
              Back to sign in
            </button>
          ) : (
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); }}
              className="text-xs text-ink/60 underline">
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
