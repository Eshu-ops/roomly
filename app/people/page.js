'use client';
import AppShell from '../../components/AppShell';
import { useHouseData } from '../../lib/useHouseData';
import { memberShare } from '../../lib/calc';
import { supabase, fmtMoney } from '../../lib/supabaseClient';

export default function PeoplePage() {
  const { loading, house, members, me, categories, expenses, meals, payments, refresh } = useHouseData();
  if (loading) return null;
  const isAdmin = me.role === 'admin';

  async function setRole(memberId, role) {
    await supabase.from('members').update({ role }).eq('id', memberId);
    refresh();
  }
  async function removeMember(memberId) {
    if (members.length <= 1) return;
    await supabase.from('members').delete().eq('id', memberId);
    refresh();
  }
  function copyInvite() {
    navigator.clipboard.writeText(house.invite_code);
  }

  return (
    <AppShell house={house}>
      <header className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Roommates</h1>
          <p className="text-sm text-ink/60 mt-1">Manage who's part of {house.name}</p>
        </div>
        <button onClick={copyInvite} className="border border-line text-sm font-semibold px-4 py-2.5 rounded-lg">
          Copy invite code: {house.invite_code}
        </button>
      </header>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase text-ink/50 border-b border-line">
            <th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3">Paid</th><th className="p-3">Owed</th><th className="p-3 text-right">Balance</th>{isAdmin && <th className="p-3"></th>}
          </tr></thead>
          <tbody>
            {members.map((m) => {
              const s = memberShare({ memberId: m.id, members, categories, expenses, meals, payments, splits: [] });
              return (
                <tr key={m.id} className="border-b border-line last:border-0">
                  <td className="p-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: m.color }}>{m.name.slice(0, 2).toUpperCase()}</span>
                    {m.name}
                  </td>
                  <td className="p-3">
                    {isAdmin ? (
                      <select value={m.role} onChange={(e) => setRole(m.id, e.target.value)} className="text-xs border border-line rounded px-2 py-1 bg-card">
                        <option value="admin">Admin</option><option value="member">Member</option>
                      </select>
                    ) : <span className="capitalize">{m.role}</span>}
                  </td>
                  <td className="p-3">{fmtMoney(s.paid, house.currency)}</td>
                  <td className="p-3">{fmtMoney(s.owedTotal, house.currency)}</td>
                  <td className={`p-3 text-right font-bold ${s.balance >= 0 ? 'text-accent' : 'text-red-500'}`}>{s.balance >= 0 ? '+' : '−'}{fmtMoney(Math.abs(s.balance), house.currency)}</td>
                  {isAdmin && <td className="p-3"><button onClick={() => removeMember(m.id)} className="text-xs text-red-500">remove</button></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
