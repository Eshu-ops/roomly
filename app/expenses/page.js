'use client';
import { useState } from 'react';
import AppShell from '../../components/AppShell';
import { useHouseData } from '../../lib/useHouseData';
import { supabase, fmtMoney, logActivity } from '../../lib/supabaseClient';

export default function ExpensesPage() {
  const { loading, house, members, me, categories, expenses, refresh } = useHouseData();
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(initialForm());

  if (loading) return null;

  function initialForm() {
    return { description: '', category_id: '', amount: '', paid_by: '', date: new Date().toISOString().slice(0, 10), status: 'paid', split_mode: 'equal', is_recurring: false, notes: '' };
  }

  async function addExpense(e) {
    e.preventDefault();
    if (!form.description || !form.amount || !form.category_id || !form.paid_by) return;

    const month = new Date(form.date).toISOString().slice(0, 8) + '01';
    const { data: ledgerId } = await supabase.rpc('get_or_create_ledger', { p_house_id: house.id, p_month: month });

    const { data: inserted, error } = await supabase.from('expenses').insert({
      house_id: house.id,
      ledger_id: ledgerId,
      category_id: form.category_id,
      description: form.description,
      amount: parseFloat(form.amount),
      paid_by: form.paid_by,
      date: form.date,
      status: form.status,
      split_mode: form.split_mode,
      is_recurring: form.is_recurring,
      recurrence_interval: form.is_recurring ? 'monthly' : null,
      notes: form.notes,
      created_by: me.id,
    }).select().single();

    if (!error) {
      await logActivity(house.id, me.id, 'added_expense', 'expense', inserted.id, { description: form.description, amount: form.amount });
      setForm(initialForm());
      setShowForm(false);
      refresh();
    }
  }

  async function deleteExpense(id, desc) {
    await supabase.from('expenses').delete().eq('id', id);
    await logActivity(house.id, me.id, 'deleted_expense', 'expense', id, { description: desc });
    refresh();
  }

  async function uploadReceipt(expenseId, file) {
    const path = `${house.id}/${expenseId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('attachments').upload(path, file);
    if (!error) {
      await supabase.from('attachments').insert({ house_id: house.id, expense_id: expenseId, storage_path: path, file_name: file.name, uploaded_by: me.id });
    }
  }

  const visible = expenses
    .filter((e) => filterCat === 'all' || e.category_id === filterCat)
    .filter((e) => e.description.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell house={house}>
      <header className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Expenses</h1>
          <p className="text-sm text-ink/60 mt-1">Every shared cost, synced live</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="bg-accent text-white text-sm font-semibold px-4 py-2.5 rounded-lg">
          {showForm ? 'Close' : '+ Add expense'}
        </button>
      </header>

      {showForm && (
        <form onSubmit={addExpense} className="card p-5 mb-6 grid md:grid-cols-2 gap-3">
          <Field label="Description"><input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" placeholder="e.g. Electricity bill" /></Field>
          <Field label="Category">
            <select required value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input">
              <option value="">Select…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label={`Amount (${house.currency})`}><input required type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input" /></Field>
          <Field label="Paid by">
            <select required value={form.paid_by} onChange={(e) => setForm({ ...form, paid_by: e.target.value })} className="input">
              <option value="">Select…</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Field>
          <Field label="Date"><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" /></Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input">
              <option value="paid">Paid</option><option value="due">Due</option>
            </select>
          </Field>
          <Field label="Split mode">
            <select value={form.split_mode} onChange={(e) => setForm({ ...form, split_mode: e.target.value })} className="input">
              <option value="equal">Equal split — everyone</option>
              <option value="selected">Selected roommates only (edit after saving)</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm self-end pb-2">
            <input type="checkbox" checked={form.is_recurring} onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })} />
            Repeats monthly
          </label>
          <Field label="Notes (optional)"><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" /></Field>
          <div className="md:col-span-2">
            <button type="submit" className="bg-accent text-white text-sm font-semibold px-5 py-2.5 rounded-lg">Save expense</button>
          </div>
        </form>
      )}

      <div className="flex gap-3 mb-4 flex-wrap">
        <input placeholder="Search expenses…" value={search} onChange={(e) => setSearch(e.target.value)} className="input max-w-xs" />
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="input max-w-[200px]">
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-ink/50 border-b border-line">
              <th className="p-3">Item</th><th className="p-3">Category</th><th className="p-3">Paid by</th>
              <th className="p-3">Date</th><th className="p-3">Status</th><th className="p-3">Receipt</th>
              <th className="p-3 text-right">Amount</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((e) => {
              const cat = categories.find((c) => c.id === e.category_id);
              const paidBy = members.find((m) => m.id === e.paid_by);
              return (
                <tr key={e.id} className="border-b border-line last:border-0">
                  <td className="p-3">{e.description}{e.is_recurring && <span className="ml-2 text-xs text-accent">↻ monthly</span>}</td>
                  <td className="p-3">{cat?.name}</td>
                  <td className="p-3">{paidBy?.name}</td>
                  <td className="p-3 text-ink/60">{e.date}</td>
                  <td className="p-3"><span className={`text-xs font-semibold px-2 py-1 rounded ${e.status === 'paid' ? 'bg-accent/10 text-accent' : 'bg-amber-500/10 text-amber-600'}`}>{e.status}</span></td>
                  <td className="p-3">
                    <input type="file" id={`file-${e.id}`} className="hidden" onChange={(ev) => ev.target.files[0] && uploadReceipt(e.id, ev.target.files[0])} />
                    <label htmlFor={`file-${e.id}`} className="text-xs underline cursor-pointer text-ink/50">upload</label>
                  </td>
                  <td className="p-3 text-right font-semibold">{fmtMoney(e.amount, house.currency)}</td>
                  <td className="p-3"><button onClick={() => deleteExpense(e.id, e.description)} className="text-xs text-red-500">delete</button></td>
                </tr>
              );
            })}
            {visible.length === 0 && <tr><td colSpan={8} className="text-center text-ink/40 py-10">No expenses match</td></tr>}
          </tbody>
        </table>
      </div>

      <style jsx global>{`.input{border:1px solid var(--line); border-radius:10px; padding:9px 12px; background:var(--card); font-size:14px; width:100%; outline:none;}`}</style>
    </AppShell>
  );
}

function Field({ label, children }) {
  return <div><label className="block text-xs font-semibold text-ink/60 mb-1">{label}</label>{children}</div>;
}
