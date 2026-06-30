'use client';
import AppShell from '../../components/AppShell';
import { useHouseData } from '../../lib/useHouseData';
import { totalsByCategory, memberShare } from '../../lib/calc';
import { fmtMoney } from '../../lib/supabaseClient';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const PALETTE = ['#1F6F54', '#B5742B', '#5B6FA8', '#B14A3E', '#7D6CC0', '#3D8B6E', '#C99452'];

export default function AnalyticsPage() {
  const { loading, house, members, categories, expenses, meals, payments } = useHouseData();
  if (loading) return null;

  const cats = totalsByCategory(expenses, categories);
  const pieData = Object.values(cats).filter((c) => c.total > 0).map((c) => ({ name: c.name, value: c.total }));
  const contribData = members.map((m) => {
    const s = memberShare({ memberId: m.id, members, categories, expenses, meals, payments, splits: [] });
    return { name: m.name, paid: Math.round(s.paid) };
  });
  const utilNames = ['Electricity', 'Gas bill', 'Water', 'Internet/WiFi'];
  const utilData = Object.values(cats).filter((c) => utilNames.includes(c.name)).map((c) => ({ name: c.name, total: Math.round(c.total) }));

  return (
    <AppShell house={house}>
      <header className="mb-6">
        <h1 className="font-serif text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-ink/60 mt-1">Trends across the household</p>
      </header>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="card p-5">
          <h2 className="font-serif font-semibold mb-3">Spending by category</h2>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                  {pieData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtMoney(v, house.currency)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-serif font-semibold mb-3">Individual contributions</h2>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contribData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => fmtMoney(v, house.currency)} />
                <Bar dataKey="paid" fill="#1F6F54" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-serif font-semibold mb-3">Utility cost breakdown</h2>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={utilData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => fmtMoney(v, house.currency)} />
              <Bar dataKey="total" fill="#B5742B" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AppShell>
  );
}
