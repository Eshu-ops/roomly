'use client';
import AppShell from '../../components/AppShell';
import { useHouseData } from '../../lib/useHouseData';
import { fmtMoney } from '../../lib/supabaseClient';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportsPage() {
  const { loading, house, members, categories, expenses, meals, payments } = useHouseData();
  if (loading) return null;

  function exportCSV() {
    const rows = expenses.map((e) => ({
      Description: e.description,
      Category: categories.find((c) => c.id === e.category_id)?.name,
      'Paid by': members.find((m) => m.id === e.paid_by)?.name,
      Date: e.date,
      Status: e.status,
      Amount: e.amount,
    }));
    const csv = Papa.unparse(rows);
    downloadFile(csv, 'roomly-expenses.csv', 'text/csv');
  }

  function exportPDF() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${house.name} — monthly expense report`, 14, 16);
    autoTable(doc, {
      startY: 24,
      head: [['Description', 'Category', 'Paid by', 'Date', 'Status', 'Amount']],
      body: expenses.map((e) => [
        e.description,
        categories.find((c) => c.id === e.category_id)?.name || '',
        members.find((m) => m.id === e.paid_by)?.name || '',
        e.date,
        e.status,
        fmtMoney(e.amount, house.currency),
      ]),
      styles: { fontSize: 9 },
    });
    doc.save('roomly-expense-report.pdf');
  }

  function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell house={house}>
      <header className="mb-6">
        <h1 className="font-serif text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-ink/60 mt-1">Export your house's records</p>
      </header>
      <div className="card p-5 flex gap-3 flex-wrap max-w-md">
        <button onClick={exportCSV} className="border border-line text-sm font-semibold px-4 py-2.5 rounded-lg">Export expenses · CSV</button>
        <button onClick={exportPDF} className="border border-line text-sm font-semibold px-4 py-2.5 rounded-lg">Export expenses · PDF</button>
      </div>
    </AppShell>
  );
}
