'use client';
import { useState } from 'react';
import AppShell from '../../components/AppShell';
import { useHouseData } from '../../lib/useHouseData';
import { supabase } from '../../lib/supabaseClient';

export default function CalendarPage() {
  const { loading, house, me, events, refresh } = useHouseData();
  const [form, setForm] = useState({ title: '', type: 'custom', date: new Date().toISOString().slice(0, 10) });
  if (loading) return null;

  async function addEvent(e) {
    e.preventDefault();
    if (!form.title) return;
    await supabase.from('events').insert({ house_id: house.id, title: form.title, type: form.type, date: form.date, created_by: me.id });
    setForm({ title: '', type: 'custom', date: new Date().toISOString().slice(0, 10) });
    refresh();
  }
  async function removeEvent(id) {
    await supabase.from('events').delete().eq('id', id);
    refresh();
  }

  const upcoming = [...events].filter((e) => e.date >= new Date().toISOString().slice(0, 10)).sort((a, b) => a.date.localeCompare(b.date));
  const TYPE_LABEL = { rent: 'Rent due', utility: 'Utility due', grocery: 'Grocery shopping', maid: 'Maid salary', custom: 'Custom' };

  return (
    <AppShell house={house}>
      <header className="mb-6">
        <h1 className="font-serif text-2xl font-semibold">Calendar</h1>
        <p className="text-sm text-ink/60 mt-1">Rent, bills, and reminders for the house</p>
      </header>

      <form onSubmit={addEvent} className="card p-5 mb-6 grid md:grid-cols-4 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-ink/60 mb-1">Title</label>
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Rent due" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink/60 mb-1">Type</label>
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="rent">Rent</option><option value="utility">Utility</option><option value="grocery">Grocery</option><option value="maid">Maid</option><option value="custom">Custom</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink/60 mb-1">Date</label>
          <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </div>
        <button type="submit" className="bg-accent text-white text-sm font-semibold px-4 py-2.5 rounded-lg md:col-span-4 md:w-fit">Add event</button>
      </form>

      <div className="card divide-y divide-line">
        {upcoming.map((e) => (
          <div key={e.id} className="flex items-center justify-between p-4 text-sm">
            <div>
              <p className="font-semibold">{e.title}</p>
              <p className="text-xs text-ink/50">{TYPE_LABEL[e.type]} · {e.date}</p>
            </div>
            <button onClick={() => removeEvent(e.id)} className="text-xs text-red-500">remove</button>
          </div>
        ))}
        {upcoming.length === 0 && <p className="text-sm text-ink/40 text-center py-10">No upcoming events</p>}
      </div>
      <style jsx global>{`.input{border:1px solid var(--line); border-radius:10px; padding:8px 12px; background:var(--card); font-size:14px; width:100%; outline:none;}`}</style>
    </AppShell>
  );
}
