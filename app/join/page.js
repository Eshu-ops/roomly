'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function JoinPage() {
  const router = useRouter();
  const [tab, setTab] = useState('create');
  const [name, setName] = useState('');
  const [houseName, setHouseName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If they already have a house, skip straight to the dashboard.
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      const { data } = await supabase.from('members').select('id').eq('user_id', user.id).maybeSingle();
      if (data) router.replace('/dashboard');
    })();
  }, [router]);

  async function createHouse(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: house, error: hErr } = await supabase
        .from('houses').insert({ name: houseName, created_by: user.id }).select().single();
      if (hErr) throw hErr;
      const { error: mErr } = await supabase.from('members').insert({
        house_id: house.id, user_id: user.id, name, role: 'admin', color: '#1F6F54',
      });
      if (mErr) throw mErr;
      router.push('/dashboard');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function joinHouse(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { error } = await supabase.rpc('join_house', { p_invite_code: inviteCode.trim(), p_name: name });
      if (error) throw error;
      router.push('/dashboard');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="card w-full max-w-sm p-8">
        <h1 className="font-serif text-xl font-semibold mb-1">One more step</h1>
        <p className="text-sm text-ink/60 mb-6">Create a new house, or join one with an invite code.</p>
        <div className="flex gap-2 mb-5 border-b border-line">
          <button onClick={() => setTab('create')} className={`pb-2 text-sm font-semibold border-b-2 ${tab === 'create' ? 'border-accent' : 'border-transparent text-ink/50'}`}>Create house</button>
          <button onClick={() => setTab('join')} className={`pb-2 text-sm font-semibold border-b-2 ${tab === 'join' ? 'border-accent' : 'border-transparent text-ink/50'}`}>Join with code</button>
        </div>

        {tab === 'create' ? (
          <form onSubmit={createHouse} className="space-y-3">
            <Field label="Your name" value={name} onChange={setName} placeholder="e.g. Tanvir" />
            <Field label="House name" value={houseName} onChange={setHouseName} placeholder="e.g. Maple House" />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Submit busy={busy} label="Create house" />
          </form>
        ) : (
          <form onSubmit={joinHouse} className="space-y-3">
            <Field label="Your name" value={name} onChange={setName} placeholder="e.g. Adiba" />
            <Field label="Invite code" value={inviteCode} onChange={setInviteCode} placeholder="e.g. 7f2a9c1d" />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Submit busy={busy} label="Join house" />
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink/60 mb-1">{label}</label>
      <input required value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-line rounded-lg px-3 py-2 bg-card outline-none focus:border-accent" />
    </div>
  );
}
function Submit({ busy, label }) {
  return (
    <button disabled={busy} type="submit" className="w-full bg-accent text-white rounded-lg py-2.5 font-semibold text-sm mt-2 disabled:opacity-60">
      {busy ? 'Please wait…' : label}
    </button>
  );
}
