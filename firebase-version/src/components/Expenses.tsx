import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Paperclip, Plus, Search, Upload, Pencil, Printer, TrendingUp, X } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import { useVehicles } from '../store/VehicleStore';
import { usePersistedState } from '../hooks/usePersistedState';
import type { ExpenseCategory, ExpenseRecord } from '../types';

const categoryOptions: ExpenseCategory[] = [
  'Carburant', 'Entretien', 'Réparation', 'Assurance', 'Vignette',
  'Péage', 'Parking', 'Lavage', 'Amende', 'Pièces', 'Autre',
];

const PAYMENT_OPTIONS = ['Espèces', 'Chèque', 'BC', 'Virement', 'Carte', 'Carte carburant', 'Mobile Money'];

function formatMoney(value: number) { return value.toLocaleString('fr-FR') + ' FCFA'; }
function formatDate(value: string) { if (!value) return '-'; return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }
function getCell(row: Record<string, unknown>, keys: string[]) {
  const n = Object.entries(row).reduce<Record<string, unknown>>((a, [k, v]) => { a[k.trim().toLowerCase()] = v; return a; }, {});
  for (const k of keys) { const v = n[k.trim().toLowerCase()]; if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim(); }
  return '';
}
function parseAmount(value: string) { const c = value.replace(/\s/g, '').replace(',', '.').replace(/[A-Za-z]/g, ''); return Number(c) || 0; }

export default function Expenses() {
  const { vehicles, expenseRecords, addExpenseRecord, updateExpenseRecord, importExpenseRecords, getDashboardStats } = useVehicles();
  const stats = getDashboardStats();
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | undefined>();
  const [search, setSearch] = usePersistedState('fleetgest_filter_expenses_search', '');
  const [filterCategory, setFilterCategory] = usePersistedState('fleetgest_filter_expenses_category', '');
  const [filterVehicle, setFilterVehicle] = usePersistedState('fleetgest_filter_expenses_vehicle', '');
  const [periodFrom, setPeriodFrom] = usePersistedState('fleetgest_filter_expenses_from', '');
  const [periodTo, setPeriodTo] = usePersistedState('fleetgest_filter_expenses_to', '');
  const [importMessage, setImportMessage] = useState('');
  const [preview, setPreview] = useState<ExpenseRecord[]>([]);
  const vehicleById = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles]);

  const filteredExpenses = useMemo(() => expenseRecords.filter((expense) => {
    const vehicle = vehicleById.get(expense.vehicleId);
    const text = `${expense.libelle} ${expense.categorie} ${expense.fournisseur} ${expense.numero_piece} ${vehicle?.numero_immatriculation ?? ''}`.toLowerCase();
    const matchSearch = !search || text.includes(search.toLowerCase());
    const matchCat = !filterCategory || expense.categorie === filterCategory;
    const matchVeh = !filterVehicle || expense.vehicleId === filterVehicle;
    const matchFrom = !periodFrom || expense.date >= periodFrom;
    const matchTo = !periodTo || expense.date <= periodTo;
    return matchSearch && matchCat && matchVeh && matchFrom && matchTo;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [expenseRecords, filterCategory, filterVehicle, search, vehicleById, periodFrom, periodTo]);

  // Historique des fournisseurs déjà saisis, pour une saisie intuitive (autocomplétion)
  const knownSuppliers = useMemo(() => Array.from(new Set(expenseRecords.map(e => e.fournisseur).filter(Boolean))).sort(), [expenseRecords]);

  const totalFiltered = filteredExpenses.reduce((sum, e) => sum + e.montant, 0);
  const monthlyAverage = expenseRecords.length > 0 ? Math.round(stats.totalExpenseCost / Math.max(stats.monthlyExpenses.length, 1)) : 0;
  const monthlyExpenseEvolution = useMemo(() => {
    const map = new Map<string, number>();
    expenseRecords.forEach((e) => { if (!e.date) return; const d = new Date(e.date); const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; map.set(key, (map.get(key) || 0) + e.montant); });
    const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-12).map(([key, montant]) => { const [year, month] = key.split('-'); return { mois: `${labels[Number(month) - 1]} ${year.slice(-2)}`, montant }; });
  }, [expenseRecords]);

  const handleEdit = (expense: ExpenseRecord) => { setEditingExpense(expense); setShowForm(true); };
  const handleAddNew = () => { setEditingExpense(undefined); setShowForm(true); };

  const handleSaveExpense = (data: Omit<ExpenseRecord, 'id'>, id?: string) => {
    if (id) updateExpenseRecord(id, data);
    else addExpenseRecord({ ...data, id: 'e' + Date.now() });
    setShowForm(false);
    setEditingExpense(undefined);
  };

  const handlePrint = () => window.print();
  const exportExcel = () => {
    const rows = filteredExpenses.map(e => { const v = vehicleById.get(e.vehicleId); return { 'Date': e.date, 'Véhicule': v?.numero_immatriculation || '', 'Catégorie': e.categorie, 'Libellé': e.libelle, 'Montant (FCFA)': e.montant, 'Fournisseur': e.fournisseur, 'Paiement': e.mode_paiement, 'N° pièce': e.numero_piece, 'Notes': e.notes }; });
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Dépenses'); XLSX.writeFile(wb, 'depenses_vehicules.xlsx');
  };
  const importPreview = () => { importExpenseRecords(preview); setImportMessage(`${preview.length} dépense(s) importée(s) avec succès.`); setPreview([]); };

  const buildExpenseFromRow = (row: Record<string, unknown>, index: number): ExpenseRecord | null => {
    const plate = getCell(row, ['immatriculation', 'numero_immatriculation', 'plaque', 'vehicule', 'véhicule']);
    const vehicle = vehicles.find((item) => item.numero_immatriculation.toLowerCase() === plate.toLowerCase());
    if (!vehicle) return null;
    const rawCategory = getCell(row, ['categorie', 'catégorie', 'type', 'nature']);
    const categorie = categoryOptions.includes(rawCategory as ExpenseCategory) ? (rawCategory as ExpenseCategory) : 'Autre';
    const montant = parseAmount(getCell(row, ['montant', 'cout', 'coût', 'prix', 'amount']));
    if (!montant) return null;
    const dateExpense = getCell(row, ['date', 'date_depense', 'date_dépense']) || new Date().toISOString().slice(0, 10);
    return { id: 'e-import-' + Date.now() + '-' + index, vehicleId: vehicle.id, date: dateExpense, categorie, libelle: getCell(row, ['libelle', 'libellé', 'description', 'objet']) || categorie, montant, fournisseur: getCell(row, ['fournisseur', 'garage', 'station', 'prestataire']), mode_paiement: getCell(row, ['mode_paiement', 'paiement', 'mode']) || 'Non précisé', numero_piece: getCell(row, ['numero_piece', 'n_piece', 'facture', 'recu', 'reçu']), justificatif_nom: getCell(row, ['justificatif', 'piece_jointe', 'pièce_jointe']), notes: getCell(row, ['notes', 'observation', 'observations']), date_entretien: categorie === 'Entretien' ? (getCell(row, ['date_entretien', 'date entretien']) || dateExpense) : '', kilometrage_entretien: categorie === 'Entretien' ? parseAmount(getCell(row, ['kilometrage_entretien', 'kilometrage', 'kilométrage', 'km_entretien', 'km'])) : 0 };
  };

  const processImportFile = async (file: File) => {
    setImportMessage('Traitement du fichier en cours...'); setPreview([]);
    try {
      let rows: Record<string, unknown>[] = [];
      if (file.name.endsWith('.csv')) { rows = Papa.parse(await file.text(), { header: true, skipEmptyLines: true }).data as Record<string, unknown>[]; }
      else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) { const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' }); rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as Record<string, unknown>[]; }
      else { setImportMessage('Format non supporté. Utilisez CSV, XLS ou XLSX.'); return; }
      const imported = rows.map((row, index) => buildExpenseFromRow(row, index)).filter((e): e is ExpenseRecord => Boolean(e));
      setPreview(imported);
      setImportMessage(imported.length > 0 ? `${imported.length} dépense(s) valide(s) détectée(s).` : 'Aucune dépense valide détectée.');
    } catch (error) { setImportMessage('Erreur: ' + (error as Error).message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-white p-6 shadow-sm print:hidden">
        <div><h2 className="text-2xl font-bold text-slate-900">Dépenses véhicules</h2><p className="mt-1 text-sm text-slate-500">Saisissez et suivez toutes les dépenses par véhicule.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleAddNew} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"><Plus className="h-4 w-4" /> Ajouter une dépense</button>
          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer" title="Importer">
            <Upload className="h-4 w-4" /> Importer
            <input type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={(event) => event.target.files?.[0] && processImportFile(event.target.files[0])} />
          </label>
          <button onClick={exportExcel} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50" title="Exporter"><Download className="h-4 w-4" /> Exporter</button>
          <button onClick={handlePrint} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"><Printer className="h-4 w-4" /> Imprimer</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {[
          { label: 'Dépenses totales', value: formatMoney(stats.totalExpenseCost) },
          { label: 'Moyenne par véhicule', value: formatMoney(stats.avgExpensePerVehicle) },
          { label: 'Moyenne mensuelle', value: formatMoney(monthlyAverage) },
          { label: 'Filtre affiché', value: formatMoney(totalFiltered) },
        ].map(k => <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">{k.label}</p><p className="mt-2 text-xl font-bold text-slate-900">{k.value}</p></div>)}
      </div>

      {importMessage && <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600 print:hidden">{importMessage}</p>}
      {preview.length > 0 && <div className="rounded-lg bg-emerald-50 px-4 py-3 flex items-center justify-between print:hidden"><span className="text-sm text-emerald-800">{preview.length} dépense(s) prête(s)</span><button onClick={importPreview} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Importer</button></div>}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 print:hidden">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-base font-semibold text-slate-800">Détail des écritures</h3>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
              <select value={filterVehicle} onChange={(e) => setFilterVehicle(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                <option value="">Tous les véhicules</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.numero_immatriculation}</option>)}
              </select>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                <option value="">Toutes catégories</option>{categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} title="Période du" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" />
              <input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} title="Période au" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50"><tr>{['Date', 'Véhicule', 'Dépense', 'Fournisseur', 'Paiement', 'Montant', 'Action'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">Aucune dépense trouvée</td></tr> :
                filteredExpenses.map((expense) => {
                  const vehicle = vehicleById.get(expense.vehicleId);
                  return (
                    <tr key={expense.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(expense.date)}</td>
                      <td className="px-4 py-3">{vehicle ? <Link to={`/vehicule/${vehicle.id}`} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">{vehicle.numero_immatriculation}</Link> : <span className="text-sm text-slate-400">Supprimé</span>}</td>
                      <td className="px-4 py-3"><p className="text-sm font-semibold text-slate-800">{expense.libelle}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5">{expense.categorie}</span>
                          {expense.categorie === 'Entretien' && expense.kilometrage_entretien ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">{expense.kilometrage_entretien.toLocaleString('fr-FR')} km</span> : null}
                          {expense.justificatif_nom && <span className="inline-flex items-center gap-1"><Paperclip className="h-3 w-3" />{expense.justificatif_nom}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{expense.fournisseur || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{expense.mode_paiement || '-'}</td>
                      <td className={`px-4 py-3 text-right text-sm font-bold ${expense.montant < 0 ? 'text-emerald-600' : 'text-slate-800'}`}>{formatMoney(expense.montant)}</td>
                      <td className="px-4 py-3 text-center print:hidden"><div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleEdit(expense)} className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600" title="Modifier"><Pencil className="h-4 w-4" /></button>
                      </div></td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800"><TrendingUp className="h-5 w-5 text-emerald-500" />Évolution mensuelle des dépenses</h3>
          {monthlyExpenseEvolution.length > 0 ? (
            <div className="h-80 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={monthlyExpenseEvolution} margin={{ top: 20, right: 24, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="mois" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
              <Tooltip formatter={(v: any) => [formatMoney(Number(v)), 'Dépenses']} /><Legend />
              <Line type="monotone" dataKey="montant" stroke="#10b981" strokeWidth={3} name="Dépenses" dot={{ r: 4 }}>
                <LabelList dataKey="montant" position="top" formatter={(v: any) => `${Math.round(Number(v) / 1000)}k`} style={{ fontSize: 10, fill: '#475569' }} />
              </Line>
            </LineChart></ResponsiveContainer></div>
          ) : <p className="text-sm text-slate-400">Pas assez de données.</p>}
        </div>
      </div>

      {showForm && (
        <ExpenseFormModal
          expense={editingExpense}
          vehicles={vehicles}
          knownSuppliers={knownSuppliers}
          onSave={handleSaveExpense}
          onClose={() => { setShowForm(false); setEditingExpense(undefined); }}
        />
      )}
    </div>
  );
}

function ExpenseFormModal({ expense, vehicles, knownSuppliers, onSave, onClose }: {
  expense?: ExpenseRecord;
  vehicles: { id: string; numero_immatriculation: string; marque: string; type_commercial: string }[];
  knownSuppliers: string[];
  onSave: (data: Omit<ExpenseRecord, 'id'>, id?: string) => void;
  onClose: () => void;
}) {
  const isKnownPayment = (mode: string) => PAYMENT_OPTIONS.includes(mode);
  const [f, setF] = useState({
    vehicleId: expense?.vehicleId || '',
    date: expense?.date || new Date().toISOString().slice(0, 10),
    categorie: (expense?.categorie || 'Carburant') as ExpenseCategory,
    libelle: expense?.libelle || '',
    montant: expense ? String(expense.montant) : '',
    fournisseur: expense?.fournisseur || '',
    mode_paiement: expense ? (isKnownPayment(expense.mode_paiement) ? expense.mode_paiement : 'Autre') : 'Espèces',
    numero_piece: expense?.numero_piece || '',
    justificatif_nom: expense?.justificatif_nom || '',
    notes: expense?.notes || '',
    date_entretien: expense?.date_entretien || expense?.date || new Date().toISOString().slice(0, 10),
    kilometrage_entretien: expense?.kilometrage_entretien ? String(expense.kilometrage_entretien) : '',
  });
  const [customPaiement, setCustomPaiement] = useState(expense && !isKnownPayment(expense.mode_paiement) ? expense.mode_paiement : '');
  const up = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.vehicleId || !f.libelle || !f.montant) return;
    const finalPaiement = f.mode_paiement === 'Autre' ? (customPaiement.trim() || 'Autre') : f.mode_paiement;
    const data = {
      vehicleId: f.vehicleId, date: f.date, categorie: f.categorie, libelle: f.libelle, montant: Number(f.montant),
      fournisseur: f.fournisseur, mode_paiement: finalPaiement, numero_piece: f.numero_piece, justificatif_nom: f.justificatif_nom,
      notes: f.notes, date_entretien: f.categorie === 'Entretien' ? f.date_entretien || f.date : '',
      kilometrage_entretien: f.categorie === 'Entretien' ? Number(f.kilometrage_entretien) || 0 : 0,
    };
    onSave(data, expense?.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <h3 className="text-lg font-bold">{expense ? 'Modifier la dépense' : 'Ajouter une dépense'}</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 p-6">
          <label className="col-span-2 block text-xs font-medium text-slate-600">Véhicule
            <select required value={f.vehicleId} onChange={(e) => up('vehicleId', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option value="">Sélectionner un véhicule</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.numero_immatriculation} - {v.marque} {v.type_commercial}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-600">Date<input type="date" required value={f.date} onChange={(e) => setF(p => ({ ...p, date: e.target.value, date_entretien: p.categorie === 'Entretien' ? e.target.value : p.date_entretien }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" /></label>
          <label className="block text-xs font-medium text-slate-600">Catégorie
            <select value={f.categorie} onChange={(e) => setF(p => ({ ...p, categorie: e.target.value as ExpenseCategory, date_entretien: e.target.value === 'Entretien' ? p.date : p.date_entretien }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          {f.categorie === 'Entretien' && (
            <div className="col-span-2 grid grid-cols-2 gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <label className="block text-xs font-medium text-slate-600">Date de l'entretien<input type="date" required value={f.date_entretien} onChange={(e) => up('date_entretien', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500" /></label>
              <label className="block text-xs font-medium text-slate-600">Kilométrage<input type="number" min="0" required placeholder="85000" value={f.kilometrage_entretien} onChange={(e) => up('kilometrage_entretien', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500" /></label>
            </div>
          )}
          <label className="col-span-2 block text-xs font-medium text-slate-600">Libellé<input required value={f.libelle} onChange={(e) => up('libelle', e.target.value)} placeholder="Ex: Vidange, carburant..." className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" /></label>
          <label className="block text-xs font-medium text-slate-600">
            Montant (FCFA)
            <input type="number" required value={f.montant} onChange={(e) => up('montant', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            <span className="mt-1 block text-[10px] leading-snug text-slate-400">Un montant négatif (ex : -15000) enregistre un avoir ou une correction : il vient diminuer automatiquement tous les totaux concernés.</span>
          </label>
          <label className="block text-xs font-medium text-slate-600">Fournisseur
            <input list="expense-suppliers" value={f.fournisseur} onChange={(e) => up('fournisseur', e.target.value)} placeholder="Ex: Station TotalEnergies" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            <datalist id="expense-suppliers">{knownSuppliers.map(s => <option key={s} value={s} />)}</datalist>
          </label>
          <label className="block text-xs font-medium text-slate-600">Paiement
            <select value={f.mode_paiement} onChange={(e) => up('mode_paiement', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              {PAYMENT_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
              <option value="Autre">Autre (préciser)…</option>
            </select>
          </label>
          {f.mode_paiement === 'Autre' && (
            <label className="block text-xs font-medium text-slate-600">Préciser le mode de paiement
              <input required value={customPaiement} onChange={(e) => setCustomPaiement(e.target.value)} placeholder="Ex: Chèque différé, Traite…" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            </label>
          )}
          <label className="block text-xs font-medium text-slate-600">N° pièce<input value={f.numero_piece} onChange={(e) => up('numero_piece', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" /></label>
          <label className="block text-xs font-medium text-slate-600">Justificatif<input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => up('justificatif_nom', e.target.files?.[0]?.name ?? '')} className="mt-1 w-full text-xs text-slate-500 file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-2 file:py-1.5 file:text-xs file:font-medium file:text-slate-600" /></label>
          <label className="col-span-2 block text-xs font-medium text-slate-600">Notes<textarea rows={2} value={f.notes} onChange={(e) => up('notes', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" /></label>
          <div className="col-span-2 flex justify-end gap-3 border-t pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
            <button type="submit" className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700">{expense ? 'Mettre à jour' : 'Enregistrer la dépense'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
