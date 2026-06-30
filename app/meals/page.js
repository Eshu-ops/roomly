'use client';
import { useState } from 'react';
import AppShell from '../../components/AppShell';
import { useHouseData } from '../../lib/useHouseData';
import { mealRate, totalMeals } from '../../lib/calc';
import { supabase, fmtMoney, logActivity } from '../../lib/supabaseClient';

export default function MealsPage() {
  const { loading, house, members, me, categories, expenses, meals, refresh } = useHouseData();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [form, setForm] = useState({ breakfast: 1, lunch: 1, dinner: 1, snacks: 0 });

  if (loading) return null;
  const rate = mealRate(expenses, categories, meals);

  async function logMeal(e) {
    e.preventDefault();
    const { error } = await supabase.from('meals').upsert({
      house_id: house.id, member_id: me.id, date,
      breakfast: form.breakfast, lunch: form.lunch, dinner: form.dinner, snacks: form.snacks,
    }, { onConflict: 'member_id,date' });
    if (!error) {
      await logActivity(house.id, me.id, 'logged_meal', 'meal', null, { date, ...form });
      refresh();
    }
  }

  const days = [...new Set(meals.map((m) => m.date))].sort().slice(-7);

  return (
    <AppShell house={house}>
      <header className="mb-6">
        <h1 className="font-serif text-2xl font-semibold">Meal management</h1>
        <p className="text-sm text-ink/60 mt-1">Meal rate = total food spend ÷ total meals, recalculated live</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Total meals" value={totalMeals(meals)} />
        <Stat label="Meal rate" value={fmtMoney(rate, house.currency)} sub="per meal" />
        <Stat label="Your meals" value={totalMeals(meals, me.id)} />
        <Stat label="Your meal cost" value={fmtMoney(totalMeals(meals, me.id) * rate, house.currency)} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <form onSubmit={logMeal} className="card p-5">
          <h2 className="font-serif font-semibold mb-3">Log your meals</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-ink/60 mb-1">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
            </div>
            {['breakfast', 'lunch', 'dinner', 'snacks'].map((k) => (
              <div key={k} className="flex items-center justify-between">
                <label className="text-sm capitalize">{k}</label>
                <input type="number" min="0" step="0.5" value={form[k]} onChange={(e) => setForm({ ...form, [k]: parseFloat(e.target.value) || 0 })} className="input w-24 text-center" />
              </div>
            ))}
            <button type="submit" className="w-full bg-accent text-white text-sm font-semibold py-2.5 rounded-lg mt-2">Save log</button>
          </div>
        </form>

        <div className="card p-5">
          <h2 className="font-serif font-semibold mb-3">Last 7 logged days</h2>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((d) => {
              const dayMeals = meals.filter((m) => m.date === d);
              const total = dayMeals.reduce((s, m) => s + Number(m.breakfast) + Number(m.lunch) + Number(m.dinner) + Number(m.snacks), 0);
              return (
                <div key={d} className="text-center border border-line rounded-lg p-2">
                  <div className="text-[10px] text-ink/50">{new Date(d).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div className="font-semibold text-sm">{total}</div>
                </div>
              );
            })}
            {days.length === 0 && <p className="text-sm text-ink/40 col-span-7 text-center py-6">No meals logged yet</p>}
          </div>
        </div>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase text-ink/50 border-b border-line">
            <th className="p-3">Roommate</th><th className="p-3">Breakfast</th><th className="p-3">Lunch</th><th className="p-3">Dinner</th><th className="p-3">Total</th><th className="p-3 text-right">Cost</th>
          </tr></thead>
          <tbody>
            {members.map((m) => {
              const mine = meals.filter((x) => x.member_id === m.id);
              const b = mine.reduce((s, x) => s + Number(x.breakfast), 0);
              const l = mine.reduce((s, x) => s + Number(x.lunch), 0);
              const d = mine.reduce((s, x) => s + Number(x.dinner), 0);
              const total = totalMeals(meals, m.id);
              return (
                <tr key={m.id} className="border-b border-line last:border-0">
                  <td className="p-3">{m.name}</td><td className="p-3">{b}</td><td className="p-3">{l}</td><td className="p-3">{d}</td>
                  <td className="p-3">{total}</td><td className="p-3 text-right font-semibold">{fmtMoney(total * rate, house.currency)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <style jsx global>{`.input{border:1px solid var(--line); border-radius:10px; padding:8px 12px; background:var(--card); font-size:14px; outline:none;}`}</style>
    </AppShell>
  );
}
function Stat({ label, value, sub }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold text-ink/50 uppercase">{label}</div>
      <div className="font-serif text-2xl font-semibold mt-2">{value}</div>
      {sub && <div className="text-xs text-ink/50 mt-1">{sub}</div>}
    </div>
  );
}
