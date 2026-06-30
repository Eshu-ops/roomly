'use client';
import AppShell from '../../components/AppShell';
import { useHouseData } from '../../lib/useHouseData';
import { memberShare, totalsByCategory } from '../../lib/calc';
import { fmtMoney } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function Dashboard() {
  const { loading, house, members, me, categories, expenses, meals, payments } = useHouseData();
  if (loading) return <Centered>Loading your house…</Centered>;

  const cats = totalsByCategory(expenses, categories);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const myShare = memberShare({ memberId: me.id, members, categories, expenses, meals, payments, splits: [] });

  return (
    <AppShell house={house}>
      <header className="flex items-center justify-between mb-7 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold">{house.name}</h1>
          <p className="text-sm text-ink/60 mt-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" /> Live · {members.length} roommates connected
          </p>
        </div>
        <Link href="/expenses" className="bg-accent text-white text-sm font-semibold px-4 py-2.5 rounded-lg">+ Add expense</Link>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Total expenses" value={fmtMoney(totalExpenses, house.currency)} sub={`${expenses.length} entries`} />
        <Stat label="Total paid" value={fmtMoney(expenses.reduce((s, e) => s + Number(e.amount), 0) + payments.reduce((s, p) => s + Number(p.amount), 0), house.currency)} sub="across the house" />
        <Stat label="Meal rate" value={fmtMoney(myShare.rate, house.currency)} sub="per meal, live" />
        <Stat label="Your balance" value={fmtMoney(Math.abs(myShare.balance), house.currency)} sub={myShare.balance >= 0 ? 'You will receive' : 'You need to pay'} accent={myShare.balance >= 0} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-serif font-semibold mb-3">Spending by category</h2>
          <div className="space-y-2">
            {Object.values(cats).filter((c) => c.total > 0).sort((a, b) => b.total - a.total).map((c) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <span className="text-ink/70">{c.name}</span>
                <span className="font-semibold">{fmtMoney(c.total, house.currency)}</span>
              </div>
            ))}
            {expenses.length === 0 && <Empty text="No expenses logged yet" />}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-serif font-semibold mb-3">House balances</h2>
          <div className="space-y-2">
            {members.map((m) => {
              const s = memberShare({ memberId: m.id, members, categories, expenses, meals, payments, splits: [] });
              return (
                <div key={m.id} className="flex items-center justify-between text-sm py-1.5 border-b border-line last:border-0">
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: m.color }}>
                      {m.name.slice(0, 2).toUpperCase()}
                    </span>
                    {m.name}
                  </span>
                  <span className={`font-bold ${s.balance >= 0 ? 'text-accent' : 'text-red-500'}`}>
                    {s.balance >= 0 ? '+' : '−'}{fmtMoney(Math.abs(s.balance), house.currency)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card p-5 mt-4">
        <h2 className="font-serif font-semibold mb-3">Recent activity</h2>
        <div className="divide-y divide-line">
          {expenses.slice(0, 6).map((e) => (
            <div key={e.id} className="flex justify-between items-center py-2.5 text-sm">
              <span>{e.description}</span>
              <span className="text-ink/50">{e.date}</span>
              <span className="font-semibold">{fmtMoney(e.amount, house.currency)}</span>
            </div>
          ))}
          {expenses.length === 0 && <Empty text="Nothing yet — add your first expense" />}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, sub, accent }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold text-ink/50 uppercase tracking-wide">{label}</div>
      <div className="font-serif text-2xl font-semibold mt-2">{value}</div>
      <div className={`text-xs mt-1.5 ${accent ? 'text-accent' : 'text-ink/50'}`}>{sub}</div>
    </div>
  );
}
function Centered({ children }) {
  return <div className="min-h-screen flex items-center justify-center text-ink/50 text-sm">{children}</div>;
}
function Empty({ text }) {
  return <p className="text-sm text-ink/40 text-center py-8">{text}</p>;
}
