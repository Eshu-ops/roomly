'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login'); // login | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // Supabase sends a confirmation email by default; once confirmed, user lands back here and signs in.
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.push('/join');
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
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-sm text-ink/60 mb-6">
          {mode === 'login' ? 'Sign in to your house dashboard.' : 'Email and password — no Google login required.'}
        </p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-ink/60 mb-1">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 bg-card outline-none focus:border-accent"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink/60 mb-1">Password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 bg-card outline-none focus:border-accent"
              placeholder="At least 6 characters" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button disabled={busy} type="submit"
            className="w-full bg-accent text-white rounded-lg py-2.5 font-semibold text-sm mt-2 disabled:opacity-60">
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Sign up'}
          </button>
        </form>
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="text-xs text-ink/60 mt-5 underline w-full text-center">
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
