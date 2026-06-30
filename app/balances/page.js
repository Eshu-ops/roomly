'use client';
import { useState } from 'react';
import AppShell from '../../components/AppShell';
import { useHouseData } from '../../lib/useHouseData';
import { memberShare } from '../../lib/calc';
import { supabase, fmtMoney, logActivity } from '../../lib/supabaseClient';

export default function BalancesPage() {
  const { loading, house, members, me, categories, expenses, meals, payments, refresh } = useHouseData();
  const [form, setForm] = useState({ member_id: '', amount: '', method: 'cash', purpose: '' });
  const [showForm, setShowForm] = useState(false);

  if (loading) return null;

  async function recordPayment(e) {
    e.preventDefault();
    if (!form.member_id || !form.amount) return;
    const { data, error } = await supabase.from('payments').insert({
      house_id: house.id, member_id: form.member_id, amount: parseFloat(form.amount),
      method: form.method, purpose: form.purpose || 'Settlement', date: new Date().toISOString().slice(0, 10),
    }).select().single();
    if (!error) {
      await logActivity(house.id, me.id, 'recorded_payment', 'payment', data.id, form);
      setForm({ member_id: '', amount: '', method: 'cash', purpose: '' });
      setShowForm(false);
      refresh();
    }
  }

  return (
    <AppShell house={house}>
      <header className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Balances</h1>
          <p className="text-sm text-ink/60 mt-1">Who owes what — settled automatically</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="bg-accent text-white text-sm font-semibold px-4 py-2.5 rounded-lg">
          {showForm ? 'Close' : '+ Record payment'}
        </button>
      </header>

      {showForm && (
        <form onSubmit={recordPayment} className="card p-5 mb-6 grid md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-ink/60 mb-1">Paid by</label>
            <select className="input" value={form.member_id} onChange={(e) => setForm({ ...form, member_id: e.target.value })}>
              <option value="">Select…</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink/60 mb-1">Amount</label>
            <input type="number" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink/60 mb-1">Method</label>
            <select className="input" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              <option value="cash">Cash</option><option value="bank">Bank</option><option value="mobile_banking">Mobile banking</option><option value="card">Card</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink/60 mb-1">Purpose</label>
            <input className="input" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="e.g. June settlement" />
          </div>
          <button type="submit" className="bg-accent text-white text-sm font-semibold px-4 py-2.5 rounded-lg md:col-span-4 md:w-fit">Save</button>
        </form>
      )}

      <div className="card overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase text-ink/50 border-b border-line">
            <th className="p-3">Roommate</th><th className="p-3">Owed (rent + bills + meals)</th><th className="p-3">Already paid</th><th className="p-3 text-right">Net balance</th>
          </tr></thead>
          <tbody>
            {members.map((m) => {
              const s = memberShare({ memberId: m.id, members, categories, expenses, meals, payments, splits: [] });
              return (
                <tr key={m.id} className="border-b border-line last:border-0">
                  <td className="p-3">{m.name}</td>
                  <td className="p-3">{fmtMoney(s.owedTotal, house.currency)}</td>
                  <td className="p-3">{fmtMoney(s.paid, house.currency)}</td>
                  <td className={`p-3 text-right font-bold ${s.balance >= 0 ? 'text-accent' : 'text-red-500'}`}>
                    {s.balance >= 0 ? 'Receives ' : 'Owes '}{fmtMoney(Math.abs(s.balance), house.currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase text-ink/50 border-b border-line">
            <th className="p-3">Date</th><th className="p-3">Paid by</th><th className="p-3">Purpose</th><th className="p-3">Method</th><th className="p-3 text-right">Amount</th>
          </tr></thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0">
                <td className="p-3">{p.date}</td><td className="p-3">{members.find((m) => m.id === p.member_id)?.name}</td>
                <td className="p-3">{p.purpose}</td><td className="p-3 capitalize">{p.method.replace('_', ' ')}</td>
                <td className="p-3 text-right font-semibold">{fmtMoney(p.amount, house.currency)}</td>
              </tr>
            ))}
            {payments.length === 0 && <tr><td colSpan={5} className="text-center text-ink/40 py-8">No payments recorded yet</td></tr>}
          </tbody>
        </table>
      </div>
      <style jsx global>{`.input{border:1px solid var(--line); border-radius:10px; padding:8px 12px; background:var(--card); font-size:14px; width:100%; outline:none;}`}</style>
    </AppShell>
  );
}
