'use client';
import { useState } from 'react';
import AppShell from '../../components/AppShell';
import { useHouseData } from '../../lib/useHouseData';
import { supabase } from '../../lib/supabaseClient';

export default function NotesPage() {
  const { loading, house, me, notes, refresh } = useHouseData();
  const [text, setText] = useState('');
  if (loading) return null;

  async function addNote() {
    if (!text.trim()) return;
    await supabase.from('notes').insert({ house_id: house.id, member_id: me.id, text: text.trim() });
    setText('');
    refresh();
  }
  async function toggle(n) {
    await supabase.from('notes').update({ done: !n.done }).eq('id', n.id);
    refresh();
  }
  async function remove(id) {
    await supabase.from('notes').delete().eq('id', id);
    refresh();
  }

  return (
    <AppShell house={house}>
      <header className="mb-6">
        <h1 className="font-serif text-2xl font-semibold">Shared notes</h1>
        <p className="text-sm text-ink/60 mt-1">Syncs instantly with everyone in the house</p>
      </header>
      <div className="card p-5 max-w-xl">
        <div className="flex gap-2 mb-5">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addNote()}
            placeholder="Buy rice, pay internet bill, clean kitchen…" className="input flex-1" />
          <button onClick={addNote} className="bg-accent text-white text-sm font-semibold px-4 rounded-lg">Add</button>
        </div>
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="flex items-start gap-3 border border-line rounded-xl p-3">
              <button onClick={() => toggle(n)} className={`w-4.5 h-4.5 rounded border mt-0.5 flex-shrink-0 ${n.done ? 'bg-accent border-accent' : 'border-line'}`} style={{ width: 18, height: 18 }} />
              <div className="flex-1">
                <p className={`text-sm ${n.done ? 'line-through text-ink/40' : ''}`}>{n.text}</p>
              </div>
              <button onClick={() => remove(n.id)} className="text-xs text-ink/30 hover:text-red-500">✕</button>
            </div>
          ))}
          {notes.length === 0 && <p className="text-sm text-ink/40 text-center py-8">No notes yet. Leave one for the house.</p>}
        </div>
      </div>
      <style jsx global>{`.input{border:1px solid var(--line); border-radius:10px; padding:9px 12px; background:var(--card); font-size:14px; outline:none;}`}</style>
    </AppShell>
  );
}
