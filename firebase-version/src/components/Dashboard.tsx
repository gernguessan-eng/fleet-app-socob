import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDrivers } from '../store/DriverStore';
import type { Vehicle } from '../types';
import { useVehicles } from '../store/VehicleStore';
import { getVehicleMaintenanceForecast } from '../utils/maintenance';
import IvoryCoastZoneMap from './IvoryCoastZoneMap';
import {
  Car, CheckCircle2, Wrench, AlertTriangle, TrendingUp, Calendar,
  DollarSign, Printer, Shield, Filter, ParkingCircle, Activity, Clock, Settings2, X, ExternalLink, ChevronRight,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LabelList,
} from 'recharts';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
const KPI_PRINT_HIDDEN_KEY = 'parc_auto_dashboard_kpi_print_hidden';
const ALL_KPI_TITLES = [
  'Total Véhicules', 'Véhicules Actifs', 'En Maintenance', 'Hors Service', 'Kilométrage Moyen', 'Coût Opérationnel',
  'Taux de Disponibilité', "Taux d'Immobilisation",
  'TCO Global', 'Sinistres', 'Immobilisations',
  'Flotte / Type de véhicule', 'Flotte / Genre', 'Flotte / Zone de travail', 'Flotte / Âge', 'Répartition de la flotte / Usage', 'Carte de répartition',
  'Répartition par Marque', 'Dépenses par Catégorie', 'Évolution mensuelle des dépenses',
  'Alertes entretiens', 'Alertes échéances',
];

function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' M FCFA';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + ' K FCFA';
  return n.toString() + ' FCFA';
}
function fmtKPI(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + ' Md FCFA';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + ' M FCFA';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + ' K FCFA';
  return n.toString() + ' FCFA';
}

function getAge(d: string) { if (!d) return 0; return Math.floor((Date.now() - new Date(d).getTime()) / (365.25 * 86400000)); }


// ── Boîtes de dialogue des KPI cliquables ─────────────────────────────────────

function fmtDateFr(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function daysSince(d?: string) {
  if (!d) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86400000));
}

function KpiModal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden" onClick={onClose}>
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700" title="Fermer"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-5 p-6">{children}</div>
      </div>
    </div>
  );
}

type ImmoLite = { id: string; vehicleId: string; garage: string; date_entree: string; date_sortie_prevue: string; travaux: string; statut: string; cout_estime: number };
type SinLite = { id: string; vehicleId: string; date_sinistre: string; type: string; description: string; statut: string; cout_estime: number };

/** Liste détaillée des véhicules d'un statut, avec la cause de l'indisponibilité. */
function VehicleStatusTable({ list, immobilisations, sinistres, driverByVehicle, onOpen }: {
  list: Vehicle[];
  immobilisations: ImmoLite[];
  sinistres: SinLite[];
  driverByVehicle: Map<string, string>;
  onOpen: (id: string) => void;
}) {
  if (list.length === 0) return <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-400">Aucun véhicule dans cette situation ✓</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full text-xs">
        <thead className="bg-slate-50 text-left text-[10px] uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Véhicule</th><th className="px-3 py-2">Genre</th><th className="px-3 py-2">Affectation</th>
            <th className="px-3 py-2">Chauffeur</th><th className="px-3 py-2">Km</th><th className="px-3 py-2">Cause / Détails</th><th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {list.map(v => {
            const imm = immobilisations.filter(i => i.vehicleId === v.id && i.statut !== 'Terminé');
            const sin = sinistres.filter(x => x.vehicleId === v.id && x.statut === 'En réparation');
            return (
              <tr key={v.id} className="align-top hover:bg-slate-50">
                <td className="px-3 py-2"><p className="font-semibold text-slate-800">{v.numero_immatriculation}</p><p className="text-slate-500">{v.marque} {v.type_commercial}</p></td>
                <td className="px-3 py-2">{v.genre || '—'}</td>
                <td className="px-3 py-2">{v.affectation || '—'}</td>
                <td className="px-3 py-2">{driverByVehicle.get(v.id) || '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap">{(v.kilometrage || 0).toLocaleString('fr-FR')}</td>
                <td className="px-3 py-2 space-y-1.5">
                  {imm.map(i => (
                    <div key={i.id} className="rounded-md bg-amber-50 px-2 py-1 text-amber-800">
                      <p className="font-semibold">Garage : {i.garage || '—'} <span className="font-normal">({i.statut})</span></p>
                      <p>Entrée le {fmtDateFr(i.date_entree)} — {daysSince(i.date_entree)} j immobilisé · sortie prévue {fmtDateFr(i.date_sortie_prevue)}</p>
                      {i.travaux && <p>Travaux : {i.travaux}</p>}
                      {i.cout_estime > 0 && <p>Coût estimé : {fmtKPI(i.cout_estime)}</p>}
                    </div>
                  ))}
                  {sin.map(x => (
                    <div key={x.id} className="rounded-md bg-red-50 px-2 py-1 text-red-800">
                      <p className="font-semibold">Sinistre : {x.type} du {fmtDateFr(x.date_sinistre)} (en réparation)</p>
                      {x.description && <p>{x.description}</p>}
                      {x.cout_estime > 0 && <p>Coût estimé : {fmtKPI(x.cout_estime)}</p>}
                    </div>
                  ))}
                  {imm.length === 0 && sin.length === 0 && <p className="text-slate-400">Statut saisi manuellement sur la fiche (aucune immobilisation ni sinistre en cours)</p>}
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => onOpen(v.id)} className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-slate-300 px-2 py-1 text-[11px] text-slate-600 hover:bg-white">Fiche <ChevronRight className="h-3 w-3" /></button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const FILTERS_KEY = 'parc_auto_dashboard_filters';

function loadFilters(): { dept: string; from: string; to: string } {
  try {
    const r = localStorage.getItem(FILTERS_KEY);
    return r ? JSON.parse(r) : { dept: '', from: '', to: '' };
  } catch { return { dept: '', from: '', to: '' }; }
}

export default function Dashboard() {
  const { vehicles, expenseRecords, immobilisations, sinistres } = useVehicles();
  const { drivers } = useDrivers();
  const navigate = useNavigate();
  // KPI dont la boîte de dialogue est ouverte
  const [openKpi, setOpenKpi] = useState<null | 'maintenance' | 'hors-service' | 'immobilisation' | 'cout-op'>(null);
  const driverByVehicle = useMemo(() => {
    const m = new Map<string, string>();
    drivers.forEach(d => { if (d.vehicule_affecte_id) m.set(d.vehicule_affecte_id, `${d.prenom} ${d.nom}`); });
    return m;
  }, [drivers]);

  const initialFilters = useMemo(loadFilters, []);
  const [filterDept, setFilterDept] = useState(initialFilters.dept);
  const [filterPeriodFrom, setFilterPeriodFrom] = useState(initialFilters.from);
  const [filterPeriodTo, setFilterPeriodTo] = useState(initialFilters.to);

  // Les filtres sont mémorisés (localStorage) pour ne pas être effacés quand on change
  // de menu puis qu'on revient sur le Tableau de bord.
  useEffect(() => {
    localStorage.setItem(FILTERS_KEY, JSON.stringify({ dept: filterDept, from: filterPeriodFrom, to: filterPeriodTo }));
  }, [filterDept, filterPeriodFrom, filterPeriodTo]);

  // ── KPI masquables à l'impression ──
  const [hiddenKpis, setHiddenKpis] = useState<Set<string>>(() => {
    try { const r = localStorage.getItem(KPI_PRINT_HIDDEN_KEY); return r ? new Set(JSON.parse(r)) : new Set(); } catch { return new Set(); }
  });
  const [showKpiSettings, setShowKpiSettings] = useState(false);
  useEffect(() => { localStorage.setItem(KPI_PRINT_HIDDEN_KEY, JSON.stringify(Array.from(hiddenKpis))); }, [hiddenKpis]);
  const toggleKpiPrint = (title: string) => setHiddenKpis(prev => { const next = new Set(prev); if (next.has(title)) next.delete(title); else next.add(title); return next; });

  const departments = useMemo(() => {
    const s = new Set<string>(); vehicles.forEach(v => { if (v.affectation) s.add(v.affectation); }); return Array.from(s).sort();
  }, [vehicles]);

  const fv = useMemo(() => filterDept ? vehicles.filter(v => v.affectation === filterDept) : vehicles, [vehicles, filterDept]);
  const fe = useMemo(() => {
    let l = expenseRecords;
    if (filterDept) { const ids = new Set(fv.map(v => v.id)); l = l.filter(e => ids.has(e.vehicleId)); }
    if (filterPeriodFrom) l = l.filter(e => e.date >= filterPeriodFrom);
    if (filterPeriodTo) l = l.filter(e => e.date <= filterPeriodTo);
    return l;
  }, [expenseRecords, filterDept, filterPeriodFrom, filterPeriodTo, fv]);

  // sinistres — lus directement depuis le store central (toujours à jour)
  const filteredSinistres = useMemo(() => {
    let l = sinistres;
    if (filterDept) { const ids = new Set(fv.map((v: any) => v.id)); l = l.filter((s: any) => ids.has(s.vehicleId)); }
    if (filterPeriodFrom) l = l.filter((s: any) => s.date_sinistre >= filterPeriodFrom);
    if (filterPeriodTo) l = l.filter((s: any) => s.date_sinistre <= filterPeriodTo);
    return l;
  }, [sinistres, filterDept, filterPeriodFrom, filterPeriodTo, fv]);

  // immobilisations — lues directement depuis le store central (toujours à jour)
  const immobStats = useMemo(() => {
    let list = immobilisations;
    if (filterDept) { const ids = new Set(fv.map((v: any) => v.id)); list = list.filter((i: any) => ids.has(i.vehicleId)); }
    if (filterPeriodFrom) list = list.filter((i: any) => i.date_entree >= filterPeriodFrom);
    if (filterPeriodTo) list = list.filter((i: any) => i.date_entree <= filterPeriodTo);
    const enCours = list.filter((i: any) => i.statut !== 'Terminé').length;
    const termines = list.filter((i: any) => i.statut === 'Terminé').length;
    const coutTotal = list.reduce((s: number, i: any) => s + (i.cout_final || i.cout_estime || 0), 0);
    return { enCours, termines, total: list.length, coutTotal };
  }, [immobilisations, filterDept, filterPeriodFrom, filterPeriodTo, fv]);

  // KPIs de base
  const totalKm = fv.reduce((s, v) => s + v.kilometrage, 0);
  const avgKm = fv.length > 0 ? Math.round(totalKm / fv.length) : 0;
  const totalAcq = fv.reduce((s, v) => s + v.cout_achat + (v.frais_livraison || 0) + (v.frais_douane || 0) + (v.frais_installation || 0), 0);
  const totalIns = fv.reduce((s, v) => s + v.cout_assurance_annuel, 0);
  const totalExp = fe.reduce((s, e) => s + e.montant, 0);
  // NB: les coûts de maintenance ne sont plus ajoutés séparément ici — depuis la fusion
  // Historique Maintenance ↔ Dépenses, chaque intervention avec un coût existe déjà comme
  // dépense (catégorie "Entretien") et est donc déjà comptée dans totalExp.
  const totalOp = totalIns + totalExp;
  const totalIndirect = fv.reduce((s, v) => s + (v.couts_indirects || 0), 0);
  const totalResidual = fv.reduce((s, v) => s + (v.valeur_residuelle || 0), 0);
  const tcoGlobal = totalAcq + totalOp + totalIndirect - totalResidual;
  const tcoPerVeh = fv.length > 0 ? Math.round(tcoGlobal / fv.length) : 0;

  // Véhicules actifs/immobilisés pour les nouveaux KPI
  const activeVehiclesCount = fv.filter(v => v.statut === 'Actif').length;
  const immobilisedVehiclesCount = fv.filter(v => v.statut === 'En maintenance' || v.statut === 'Hors service').length;

  // Taux d'immobilisation = véhicules immobilisés / total * 100
  const tauxImmobilisation = fv.length > 0 ? ((immobilisedVehiclesCount / fv.length) * 100).toFixed(1) : '0.0';

  // Taux de disponibilité = véhicules actifs / total * 100
  const tauxDisponibilite = fv.length > 0 ? ((activeVehiclesCount / fv.length) * 100).toFixed(1) : '0.0';

  const kpiCards: { key?: 'maintenance' | 'hors-service' | 'cout-op'; title: string; value: string; sub: string; icon: typeof Car; color: string; textColor: string; bgLight: string }[] = [
    { title: 'Total Véhicules', value: fv.length.toString(), sub: 'dans le parc', icon: Car, color: 'from-emerald-500 to-emerald-600', textColor: 'text-emerald-700', bgLight: 'bg-emerald-50' },
    { title: 'Véhicules Actifs', value: fv.filter(v => v.statut === 'Actif').length.toString(), sub: 'en service', icon: CheckCircle2, color: 'from-green-500 to-green-600', textColor: 'text-green-700', bgLight: 'bg-green-50' },
    { key: 'maintenance' as const, title: 'En Maintenance', value: fv.filter(v => v.statut === 'En maintenance').length.toString(), sub: 'en atelier', icon: Wrench, color: 'from-amber-500 to-amber-600', textColor: 'text-amber-700', bgLight: 'bg-amber-50' },
    { key: 'hors-service' as const, title: 'Hors Service', value: fv.filter(v => v.statut === 'Hors service').length.toString(), sub: 'indisponibles', icon: AlertTriangle, color: 'from-red-500 to-red-600', textColor: 'text-red-700', bgLight: 'bg-red-50' },
    { title: 'Kilométrage Moyen', value: avgKm.toLocaleString('fr-FR') + ' km', sub: 'par véhicule', icon: TrendingUp, color: 'from-violet-500 to-violet-600', textColor: 'text-violet-700', bgLight: 'bg-violet-50' },
    { key: 'cout-op' as const, title: 'Coût Opérationnel', value: formatNumber(totalOp), sub: 'total exploitation', icon: DollarSign, color: 'from-slate-700 to-slate-900', textColor: 'text-slate-700', bgLight: 'bg-slate-50' },
  ];
  // NB: "Taux d'Immobilisation" et "Taux de Disponibilité" ne sont plus dupliqués ici :
  // ils disposent de leur propre carte détaillée (avec barre de progression) juste en dessous.

  // sinistres KPI
  const sinistreStats = useMemo(() => {
    const total = filteredSinistres.length;
    const now = new Date();
    const moisCourant = filteredSinistres.filter((s: any) => { const d = new Date(s.date_sinistre); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
    const tauxFlotte = fv.length > 0 ? ((total / fv.length) * 100).toFixed(1) : '0';
    const parDept: Record<string, number> = {};
    filteredSinistres.forEach((s: any) => { const v = vehicles.find((veh: any) => veh.id === s.vehicleId); parDept[v?.affectation || 'Non affecté'] = (parDept[v?.affectation || 'Non affecté'] || 0) + 1; });
    const deptList = Object.entries(parDept).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { total, moisCourant, tauxFlotte, deptList };
  }, [filteredSinistres, fv, vehicles]);

  // Répartitions
  // Flotte / Genre : basé uniquement sur la case « Genre » de la fiche véhicule.
  const fleetByGenre = useMemo(() => { const m = new Map<string, number>(); fv.forEach(v => { const g = v.genre?.trim() || 'Non renseigné'; m.set(g, (m.get(g) || 0) + 1); }); return Array.from(m.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value); }, [fv]);
  // Flotte / Type de véhicule : basé uniquement sur la case « Carrosserie ».
  const fleetByType = useMemo(() => { const m = new Map<string, number>(); fv.forEach(v => { const t = v.carrosserie?.trim() || 'Non renseigné'; m.set(t, (m.get(t) || 0) + 1); }); return Array.from(m.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value); }, [fv]);
  const fleetByZone = useMemo(() => { const m = new Map<string, number>(); fv.forEach(v => { const z = v.zone_travail || 'Non renseigné'; m.set(z, (m.get(z) || 0) + 1); }); return Array.from(m.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value); }, [fv]);
  const fleetByAge = useMemo(() => {
    const buckets: Record<string, number> = { '0-2 ans': 0, '2-4 ans': 0, '4-6 ans': 0, '6-8 ans': 0, '8+ ans': 0 };
    fv.forEach(v => { const a = getAge(v.date_mise_circulation); if (a < 2) buckets['0-2 ans']++; else if (a < 4) buckets['2-4 ans']++; else if (a < 6) buckets['4-6 ans']++; else if (a < 8) buckets['6-8 ans']++; else buckets['8+ ans']++; });
    return Object.entries(buckets).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [fv]);
  const fleetByCategory = useMemo(() => {
    const m = new Map<string, number>();
    fv.forEach(v => { const c = v.categorie_parc || 'Autre'; m.set(c, (m.get(c) || 0) + 1); });
    return Array.from(m.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [fv]);

  // Alertes
  const upcomingAlerts = useMemo(() => {
    const soon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return fv.filter(v => (v.date_assurance && new Date(v.date_assurance) <= soon) || (v.date_vignette && new Date(v.date_vignette) <= soon) || (v.validite_carte_transport && new Date(v.validite_carte_transport) <= soon) || (v.validite_patente && new Date(v.validite_patente) <= soon) || (v.validite_carte_stationnement && new Date(v.validite_carte_stationnement) <= soon)).slice(0, 8);
  }, [fv]);
  const maintenanceAlerts = fv.map(vehicle => ({ vehicle, forecast: getVehicleMaintenanceForecast(vehicle, expenseRecords) })).filter(({ forecast }) => ['critical', 'warning', 'missing'].includes(forecast.alertLevel)).sort((a, b) => { const p = { critical: 0, warning: 1, missing: 2, none: 3 }; return p[a.forecast.alertLevel] - p[b.forecast.alertLevel]; }).slice(0, 8);
  const zoneDistribution = useMemo(() => { const zones = ['Nord', 'Sud', 'Est', 'Centre', 'Ouest'] as const; const c: Record<string, number> = { Nord: 0, Sud: 0, Est: 0, Centre: 0, Ouest: 0 }; fv.forEach(v => { if (v.zone_affectation && c[v.zone_affectation] !== undefined) c[v.zone_affectation]++; }); return zones.map(z => ({ name: z, value: c[z] })); }, [fv]);
  const brandDistribution = useMemo(() => { const m = new Map<string, number>(); fv.forEach(v => m.set(v.marque, (m.get(v.marque) || 0) + 1)); return Array.from(m.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value); }, [fv]);
  const expenseCategoryDistribution = useMemo(() => { const m = new Map<string, number>(); fe.forEach(e => m.set(e.categorie, (m.get(e.categorie) || 0) + e.montant)); return Array.from(m.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value); }, [fe]);

  // Évolution mensuelle des dépenses (12 derniers mois pertinents dans les données filtrées)
  const monthlyExpenseEvolution = useMemo(() => {
    const m = new Map<string, number>();
    fe.forEach(e => { const key = (e.date || '').slice(0, 7); if (!key) return; m.set(key, (m.get(key) || 0) + e.montant); });
    return Array.from(m.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([key, value]) => {
        const [y, mo] = key.split('-');
        const label = new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        return { name: label, value };
      });
  }, [fe]);

  const isFiltered = !!filterDept || !!filterPeriodFrom || !!filterPeriodTo;

  return (
    <div className="space-y-6">
      {/* Header + Filtres */}
      <div className="rounded-xl bg-white p-6 shadow-sm print:hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-2xl font-bold text-slate-900">Tableau de bord</h2><p className="mt-1 text-sm text-slate-500">Vue d'ensemble — {fv.length} véhicule(s){isFiltered ? ' (filtré)' : ''}</p></div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowKpiSettings(s => !s)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50">
                <Settings2 className="h-4 w-4" /> Personnaliser l'impression
              </button>
              {showKpiSettings && (
                <>
                  <div className="fixed inset-0 z-10 print:hidden" onClick={() => setShowKpiSettings(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
                  <p className="mb-2 text-xs font-semibold text-slate-600">KPI à inclure dans l'impression</p>
                  <div className="max-h-64 space-y-1 overflow-y-auto">
                    {ALL_KPI_TITLES.map(title => (
                      <label key={title} className="flex items-center gap-2 rounded-md px-1.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                        <input type="checkbox" checked={!hiddenKpis.has(title)} onChange={() => toggleKpiPrint(title)} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                        {title}
                      </label>
                    ))}
                  </div>
                  <p className="mt-2 border-t border-slate-100 pt-2 text-[11px] text-slate-400">Décochez un KPI pour qu'il n'apparaisse pas sur la version imprimée (il reste visible à l'écran).</p>
                  </div>
                </>
              )}
            </div>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"><Printer className="h-4 w-4" /> Imprimer</button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg bg-slate-50 p-4 border border-slate-200">
          <Filter className="h-4 w-4 text-slate-500 flex-shrink-0 mt-5" />
          <label className="block text-xs font-medium text-slate-600">Département<select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="mt-1 block w-full min-w-[200px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"><option value="">Tous</option>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select></label>
          <label className="block text-xs font-medium text-slate-600">Période du<input type="date" value={filterPeriodFrom} onChange={e => setFilterPeriodFrom(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" /></label>
          <label className="block text-xs font-medium text-slate-600">au<input type="date" value={filterPeriodTo} onChange={e => setFilterPeriodTo(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" /></label>
          {isFiltered && <button onClick={() => { setFilterDept(''); setFilterPeriodFrom(''); setFilterPeriodTo(''); }} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 mt-5">Réinitialiser</button>}
        </div>
      </div>

      {/* TCO */}
      <div className={`rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-6 shadow-sm ${hiddenKpis.has('TCO Global') ? 'print:hidden' : ''}`}>
        <h3 className="mb-4 text-lg font-bold text-emerald-800">TCO Global</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">Acquisition</p><p className="mt-1 text-lg font-bold text-slate-900">{fmtKPI(totalAcq)}</p></div>
          <div className="rounded-lg bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">Exploitation</p><p className="mt-1 text-lg font-bold text-slate-900">{fmtKPI(totalOp)}</p></div>
          <div className="rounded-lg bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">Indirects</p><p className="mt-1 text-lg font-bold text-slate-900">{fmtKPI(totalIndirect)}</p></div>
          <div className="rounded-lg bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">Résiduelle</p><p className="mt-1 text-lg font-bold text-emerald-600">− {fmtKPI(totalResidual)}</p></div>
          <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 p-4 shadow-md"><p className="text-xs text-emerald-100">TCO Global</p><p className="mt-1 text-2xl font-bold text-white">{fmtKPI(tcoGlobal)}</p></div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-lg bg-white px-4 py-3"><p className="text-sm font-semibold text-slate-700">TCO / véhicule</p><p className="text-xl font-bold text-emerald-700">{fmtKPI(tcoPerVeh)}</p></div>
      </div>

      {/* KPI Cards — grille 3 colonnes (2 rangées propres pour 6 cartes) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpiCards.map(kpi => {
          const Icon = kpi.icon;
          const printHidden = hiddenKpis.has(kpi.title);
          return (
            <div
              key={kpi.title}
              onClick={kpi.key ? () => setOpenKpi(kpi.key!) : undefined}
              title={kpi.key ? 'Cliquer pour voir le détail' : undefined}
              className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all ${kpi.key ? 'cursor-pointer hover:border-emerald-300' : ''} ${printHidden ? 'print:hidden' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 truncate">{kpi.title}</p>
                  <p className={`mt-2 text-2xl font-extrabold leading-tight ${kpi.textColor}`}>{kpi.value}</p>
                  <p className="mt-1 text-xs text-slate-400">{kpi.sub}</p>
                </div>
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${kpi.color} shadow-md`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Barre de progression visuelle pour les 2 nouveaux KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${hiddenKpis.has('Taux de Disponibilité') ? 'print:hidden' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-500" />
              <h4 className="text-sm font-bold text-slate-800">Taux de Disponibilité</h4>
            </div>
            <span className={`text-2xl font-extrabold ${parseFloat(tauxDisponibilite) >= 80 ? 'text-emerald-600' : parseFloat(tauxDisponibilite) >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{tauxDisponibilite} %</span>
          </div>
          <div className="relative h-4 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${parseFloat(tauxDisponibilite) >= 80 ? 'bg-gradient-to-r from-emerald-400 to-green-500' : parseFloat(tauxDisponibilite) >= 60 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`}
              style={{ width: `${Math.min(100, parseFloat(tauxDisponibilite))}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>{activeVehiclesCount} véhicule(s) actif(s)</span>
            <span>sur {fv.length} total</span>
          </div>
          <div className="mt-3 flex gap-2 text-xs">
            <span className={`rounded-full px-2 py-0.5 font-medium ${parseFloat(tauxDisponibilite) >= 80 ? 'bg-emerald-100 text-emerald-700' : parseFloat(tauxDisponibilite) >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
              {parseFloat(tauxDisponibilite) >= 80 ? '✓ Bonne disponibilité' : parseFloat(tauxDisponibilite) >= 60 ? '⚠ Disponibilité moyenne' : '✗ Disponibilité faible'}
            </span>
          </div>
        </div>

        <div onClick={() => setOpenKpi('immobilisation')} title="Cliquer pour voir le détail" className={`cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-300 ${hiddenKpis.has("Taux d'Immobilisation") ? 'print:hidden' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <h4 className="text-sm font-bold text-slate-800">Taux d'Immobilisation</h4>
            </div>
            <span className={`text-2xl font-extrabold ${parseFloat(tauxImmobilisation) >= 30 ? 'text-red-600' : parseFloat(tauxImmobilisation) >= 15 ? 'text-orange-600' : 'text-teal-600'}`}>{tauxImmobilisation} %</span>
          </div>
          <div className="relative h-4 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${parseFloat(tauxImmobilisation) >= 30 ? 'bg-gradient-to-r from-red-400 to-rose-500' : parseFloat(tauxImmobilisation) >= 15 ? 'bg-gradient-to-r from-orange-400 to-amber-500' : 'bg-gradient-to-r from-teal-400 to-emerald-500'}`}
              style={{ width: `${Math.min(100, parseFloat(tauxImmobilisation))}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>{immobilisedVehiclesCount} véhicule(s) immobilisé(s)</span>
            <span>sur {fv.length} total</span>
          </div>
          <div className="mt-3 flex gap-2 text-xs">
            <span className={`rounded-full px-2 py-0.5 font-medium ${parseFloat(tauxImmobilisation) >= 30 ? 'bg-red-100 text-red-700' : parseFloat(tauxImmobilisation) >= 15 ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'}`}>
              {parseFloat(tauxImmobilisation) >= 30 ? '✗ Taux élevé — action requise' : parseFloat(tauxImmobilisation) >= 15 ? '⚠ Taux modéré — à surveiller' : '✓ Taux faible — situation normale'}
            </span>
          </div>
        </div>
      </div>

      {/* Répartitions flotte */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${hiddenKpis.has('Flotte / Type de véhicule') ? 'print:hidden' : ''}`}>
          <h3 className="text-sm font-bold text-slate-800">Flotte / Type de véhicule</h3>
          <p className="mb-4 text-[11px] text-slate-400">Selon la case « Carrosserie » de la fiche véhicule</p>
          {fleetByType.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={fleetByType} cx="50%" cy="50%" innerRadius={48} outerRadius={80} paddingAngle={4} dataKey="value">
                    {fleetByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} véh.`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {fleetByType.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-1.5 text-slate-600"><span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="truncate">{c.name}</span></span>
                    <span className="flex-shrink-0 font-semibold text-slate-800">{c.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-sm text-slate-400">—</p>}
        </div>
        <div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${hiddenKpis.has('Flotte / Genre') ? 'print:hidden' : ''}`}>
          <h3 className="text-sm font-bold text-slate-800">Flotte / Genre</h3>
          <p className="mb-4 text-[11px] text-slate-400">Selon la case « Genre » de la fiche véhicule</p>
          {fleetByGenre.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={fleetByGenre} cx="50%" cy="50%" innerRadius={48} outerRadius={80} paddingAngle={4} dataKey="value">
                    {fleetByGenre.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} véh.`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {fleetByGenre.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-1.5 text-slate-600"><span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="truncate">{c.name}</span></span>
                    <span className="flex-shrink-0 font-semibold text-slate-800">{c.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-sm text-slate-400">—</p>}
        </div>
        <div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2 ${hiddenKpis.has('Flotte / Zone de travail') ? 'print:hidden' : ''}`}>
          <h3 className="mb-4 text-sm font-bold text-slate-800">Flotte / Zone de travail</h3>
          {fleetByZone.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridAutoFlow: 'column',
                gridTemplateRows: `repeat(${Math.min(10, fleetByZone.length)}, auto)`,
                gridTemplateColumns: fleetByZone.length > 10 ? '1fr 1fr' : '1fr',
                columnGap: '1.75rem',
                rowGap: '0.6rem',
              }}
            >
              {(() => {
                const maxZoneValue = Math.max(...fleetByZone.map((z) => z.value));
                return fleetByZone.map((z) => (
                  <div key={z.name} className="flex items-center gap-2" title={`${z.name} : ${z.value} véhicule(s)`}>
                    <span className="w-[110px] flex-shrink-0 truncate text-[10.5px] text-slate-600">{z.name}</span>
                    <div className="h-[18px] flex-1 rounded bg-slate-100">
                      <div
                        className="h-full rounded bg-indigo-500"
                        style={{ width: `${Math.max(6, (z.value / maxZoneValue) * 100)}%` }}
                      />
                    </div>
                    <span className="w-6 flex-shrink-0 text-right text-[11px] font-bold text-slate-600">{z.value}</span>
                  </div>
                ));
              })()}
            </div>
          ) : <p className="text-sm text-slate-400">—</p>}
        </div>
        <div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${hiddenKpis.has('Flotte / Âge') ? 'print:hidden' : ''}`}>
          <h3 className="mb-4 text-sm font-bold text-slate-800">Flotte / Âge</h3>
          {fleetByAge.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={fleetByAge} cx="50%" cy="50%" innerRadius={48} outerRadius={80} paddingAngle={4} dataKey="value">
                    {fleetByAge.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} véh.`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {fleetByAge.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-1.5 text-slate-600"><span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="truncate">{c.name}</span></span>
                    <span className="flex-shrink-0 font-semibold text-slate-800">{c.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-sm text-slate-400">—</p>}
        </div>
        <div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${hiddenKpis.has('Répartition de la flotte / Usage') ? 'print:hidden' : ''}`}>
          <h3 className="mb-4 text-sm font-bold text-slate-800">Répartition de la flotte / Usage</h3>
          {fleetByCategory.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={fleetByCategory} cx="50%" cy="50%" innerRadius={48} outerRadius={80} paddingAngle={4} dataKey="value">
                    {fleetByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} véh.`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {fleetByCategory.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-1.5 text-slate-600"><span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="truncate">{c.name}</span></span>
                    <span className="flex-shrink-0 font-semibold text-slate-800">{c.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-sm text-slate-400">—</p>}
        </div>
      </div>

      <div className={hiddenKpis.has('Carte de répartition') ? 'print:hidden' : ''}>
        <IvoryCoastZoneMap zoneDistribution={zoneDistribution} totalVehicles={fv.length} />
      </div>

      {/* Sinistres + Immobilisations KPI */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${hiddenKpis.has('Sinistres') ? 'print:hidden' : ''}`}>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800"><Shield className="h-5 w-5 text-red-500" />Sinistres</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-red-50 p-3 border border-red-100"><p className="text-[10px] uppercase text-red-600">Ce mois</p><p className="mt-1 text-2xl font-bold text-red-700">{sinistreStats.moisCourant}</p></div>
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200"><p className="text-[10px] uppercase text-slate-500">Total</p><p className="mt-1 text-2xl font-bold text-slate-900">{sinistreStats.total}</p></div>
            <div className="rounded-lg bg-amber-50 p-3 border border-amber-100"><p className="text-[10px] uppercase text-amber-600">Taux / flotte</p><p className="mt-1 text-2xl font-bold text-amber-700">{sinistreStats.tauxFlotte}%</p></div>
            <div className="rounded-lg bg-blue-50 p-3 border border-blue-100">
              <p className="text-[10px] uppercase text-blue-600">Par département</p>
              <div className="mt-1 space-y-0.5">{sinistreStats.deptList.length > 0 ? sinistreStats.deptList.map(([dept, count]) => <div key={dept} className="flex items-center justify-between text-xs"><span className="text-slate-600 truncate max-w-[90px]">{dept}</span><span className="font-bold text-blue-700">{count}</span></div>) : <p className="text-xs text-slate-400">Aucun</p>}</div>
            </div>
          </div>
        </div>
        <div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${hiddenKpis.has('Immobilisations') ? 'print:hidden' : ''}`}>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800"><ParkingCircle className="h-5 w-5 text-amber-500" />Immobilisations</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-amber-50 p-3 border border-amber-100"><p className="text-[10px] uppercase text-amber-600">En cours</p><p className="mt-1 text-2xl font-bold text-amber-700">{immobStats.enCours}</p></div>
            <div className="rounded-lg bg-green-50 p-3 border border-green-100"><p className="text-[10px] uppercase text-green-600">Terminés</p><p className="mt-1 text-2xl font-bold text-green-700">{immobStats.termines}</p></div>
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200"><p className="text-[10px] uppercase text-slate-500">Total dossiers</p><p className="mt-1 text-2xl font-bold text-slate-900">{immobStats.total}</p></div>
            <div className="rounded-lg bg-indigo-50 p-3 border border-indigo-100"><p className="text-[10px] uppercase text-indigo-600">Coût total</p><p className="mt-1 text-lg font-bold text-indigo-700">{fmtKPI(immobStats.coutTotal)}</p></div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${hiddenKpis.has('Répartition par Marque') ? 'print:hidden' : ''}`}>
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Répartition par Marque</h3>
          {brandDistribution.length > 0 ? <ResponsiveContainer width="100%" height={280}><BarChart data={brandDistribution}><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip formatter={value => [`${value} véh.`, '']} /><Bar dataKey="value" radius={[6, 6, 0, 0]}>{brandDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}<LabelList dataKey="value" position="top" style={{ fontSize: 10, fill: '#475569' }} /></Bar></BarChart></ResponsiveContainer> : <p className="text-sm text-slate-400">—</p>}
        </div>
        <div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${hiddenKpis.has('Dépenses par Catégorie') ? 'print:hidden' : ''}`}>
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Dépenses par Catégorie</h3>
          {expenseCategoryDistribution.length > 0 ? <ResponsiveContainer width="100%" height={280}><BarChart data={expenseCategoryDistribution}><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} tickFormatter={value => `${Number(value) / 1000}K`} /><Tooltip formatter={value => [formatNumber(value as number), '']} /><Bar dataKey="value" radius={[6, 6, 0, 0]}>{expenseCategoryDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}<LabelList dataKey="value" position="top" style={{ fontSize: 10, fill: '#475569' }} formatter={(v: any) => `${Math.round(v / 1000)}k`} /></Bar></BarChart></ResponsiveContainer> : <p className="text-sm text-slate-400">—</p>}
        </div>
      </div>

      <div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${hiddenKpis.has('Évolution mensuelle des dépenses') ? 'print:hidden' : ''}`}>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800"><TrendingUp className="h-5 w-5 text-emerald-500" />Évolution mensuelle des dépenses</h3>
        {monthlyExpenseEvolution.length > 1 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyExpenseEvolution} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${Math.round(Number(v) / 1000)}k`} />
              <Tooltip formatter={(v: any) => [formatNumber(Number(v)), 'Dépenses']} />
              <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }}>
                <LabelList dataKey="value" position="top" formatter={(v: any) => `${Math.round(Number(v) / 1000)}k`} style={{ fontSize: 10, fill: '#475569' }} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="py-16 text-center text-sm text-slate-400">Pas assez d'historique de dépenses pour tracer une évolution.</p>}
      </div>

      {/* Alertes */}
      <div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${hiddenKpis.has('Alertes entretiens') ? 'print:hidden' : ''}`}>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800"><Wrench className="h-5 w-5 text-amber-500" />Alertes entretiens</h3>
        {maintenanceAlerts.length > 0 ? <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200"><thead className="bg-slate-50"><tr>{['Véhicule', 'Dernier', 'Prochain', 'Échéance', 'Statut'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{maintenanceAlerts.map(({ vehicle, forecast }) => <tr key={vehicle.id} className="hover:bg-slate-50"><td className="px-4 py-3"><Link to="/vehicules" className="text-sm font-semibold text-emerald-600">{vehicle.numero_immatriculation}</Link><p className="text-xs text-slate-500">{vehicle.marque}</p></td><td className="px-4 py-3 text-sm text-slate-600">{forecast.hasHistory ? `${forecast.lastMaintenanceKm.toLocaleString('fr-FR')} km` : '—'}</td><td className="px-4 py-3 text-sm text-slate-600">{forecast.hasHistory ? `${forecast.nextMaintenanceKm.toLocaleString('fr-FR')} km` : '—'}</td><td className="px-4 py-3 text-sm text-slate-600">{forecast.estimatedNextDate ? new Date(forecast.estimatedNextDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td><td className="px-4 py-3 text-center"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${forecast.alertLevel === 'critical' ? 'bg-red-100 text-red-700' : forecast.alertLevel === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{forecast.alertLevel === 'critical' ? 'Urgent' : forecast.alertLevel === 'warning' ? `${forecast.remainingKm.toLocaleString('fr-FR')} km` : '—'}</span></td></tr>)}</tbody></table></div> : <p className="text-sm text-slate-400">Aucune alerte</p>}
      </div>

      <div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${hiddenKpis.has('Alertes échéances') ? 'print:hidden' : ''}`}>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800"><Calendar className="h-5 w-5 text-amber-500" />Alertes échéances</h3>
        {upcomingAlerts.length > 0 ? <div className="space-y-3">{upcomingAlerts.map(v => {
          const soon = new Date(Date.now() + 30 * 86400000); const a: string[] = [];
          if (v.date_assurance && new Date(v.date_assurance) <= soon) a.push('Assurance');
          if (v.date_vignette && new Date(v.date_vignette) <= soon) a.push('Vignette');
          if (v.validite_carte_transport && new Date(v.validite_carte_transport) <= soon) a.push('Carte transport');
          if (v.validite_patente && new Date(v.validite_patente) <= soon) a.push('Patente');
          if (v.validite_carte_stationnement && new Date(v.validite_carte_stationnement) <= soon) a.push('Stationnement');
          return <Link key={v.id} to={`/vehicule/${v.id}`} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 hover:bg-amber-50 hover:border-amber-200"><div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-amber-500" /><div><p className="text-sm font-semibold text-slate-800">{v.numero_immatriculation}</p><p className="text-xs text-slate-500">{v.marque} {v.type_commercial}</p></div></div><div className="flex flex-wrap justify-end gap-1">{a.map(x => <span key={x} className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">{x}</span>)}</div></Link>;
        })}</div> : <p className="text-sm text-slate-400">Aucune alerte ✓</p>}
      </div>
      {/* ── Boîtes de dialogue des KPI ── */}
      {(openKpi === 'maintenance' || openKpi === 'hors-service') && (() => {
        const statut = openKpi === 'maintenance' ? 'En maintenance' : 'Hors service';
        const list = fv.filter(v => v.statut === statut);
        return (
          <KpiModal
            title={`${openKpi === 'maintenance' ? 'En Maintenance' : 'Hors Service'} — ${list.length} véhicule(s)`}
            subtitle={`${fv.length > 0 ? ((list.length / fv.length) * 100).toFixed(1) : '0.0'} % du parc${filterDept ? ` · département : ${filterDept}` : ''}`}
            onClose={() => setOpenKpi(null)}
          >
            <VehicleStatusTable list={list} immobilisations={immobilisations as ImmoLite[]} sinistres={sinistres as SinLite[]} driverByVehicle={driverByVehicle} onOpen={id => navigate(`/vehicule/${id}`)} />
          </KpiModal>
        );
      })()}

      {openKpi === 'immobilisation' && (() => {
        const enMaint = fv.filter(v => v.statut === 'En maintenance');
        const hs = fv.filter(v => v.statut === 'Hors service');
        return (
          <KpiModal title={`Taux d'Immobilisation — ${tauxImmobilisation} %`} subtitle={`${immobilisedVehiclesCount} véhicule(s) immobilisé(s) sur ${fv.length}${filterDept ? ` · département : ${filterDept}` : ''}`} onClose={() => setOpenKpi(null)}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { l: 'Parc total', v: fv.length, c: 'bg-slate-50 text-slate-800' },
                { l: 'En maintenance', v: enMaint.length, c: 'bg-amber-50 text-amber-700' },
                { l: 'Hors service', v: hs.length, c: 'bg-red-50 text-red-700' },
                { l: 'Disponibles (actifs)', v: activeVehiclesCount, c: 'bg-emerald-50 text-emerald-700' },
              ].map(k => <div key={k.l} className={`rounded-lg p-3 ${k.c}`}><p className="text-[11px] opacity-80">{k.l}</p><p className="text-xl font-bold">{k.v}</p></div>)}
            </div>
            <p className="text-xs text-slate-500">Calcul : (véhicules « En maintenance » + « Hors service ») ÷ parc total × 100. Séjours en garage enregistrés sur la période : {immobStats.enCours} en cours, {immobStats.termines} terminé(s), coût cumulé {fmtKPI(immobStats.coutTotal)}.</p>
            <div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">En maintenance ({enMaint.length})</h4>
              <VehicleStatusTable list={enMaint} immobilisations={immobilisations as ImmoLite[]} sinistres={sinistres as SinLite[]} driverByVehicle={driverByVehicle} onOpen={id => navigate(`/vehicule/${id}`)} /></div>
            <div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-700">Hors service ({hs.length})</h4>
              <VehicleStatusTable list={hs} immobilisations={immobilisations as ImmoLite[]} sinistres={sinistres as SinLite[]} driverByVehicle={driverByVehicle} onOpen={id => navigate(`/vehicule/${id}`)} /></div>
            <button onClick={() => navigate('/immobilisations')} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"><ExternalLink className="h-4 w-4" /> Ouvrir le Suivi des Immo-Garages</button>
          </KpiModal>
        );
      })()}

      {openKpi === 'cout-op' && (() => {
        const byCat = new Map<string, number>();
        fe.forEach(e => byCat.set(e.categorie || 'Autre', (byCat.get(e.categorie || 'Autre') || 0) + e.montant));
        const cats = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1]);
        // Ouvre le menu Dépenses avec la même période que le tableau de bord (les filtres
        // du menu Dépenses sont mémorisés dans localStorage : on les positionne avant d'y aller).
        const openExpenses = (categorie = '') => {
          const set = (k: string, v: string) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };
          set('fleetgest_filter_expenses_from', filterPeriodFrom);
          set('fleetgest_filter_expenses_to', filterPeriodTo);
          set('fleetgest_filter_expenses_category', categorie);
          set('fleetgest_filter_expenses_vehicle', '');
          set('fleetgest_filter_expenses_search', '');
          navigate('/depenses');
        };
        return (
          <KpiModal title={`Coût Opérationnel — ${fmtKPI(totalOp)}`} subtitle="Source du montant affiché : cliquez sur une ligne pour ouvrir le menu d'origine" onClose={() => setOpenKpi(null)}>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <button onClick={() => openExpenses()} className="flex w-full items-center justify-between bg-white px-4 py-3 text-left hover:bg-emerald-50">
                <div><p className="text-sm font-semibold text-slate-800">Dépenses enregistrées ({fe.length})</p><p className="text-xs text-slate-500">Menu Dépenses{filterPeriodFrom || filterPeriodTo ? ` · du ${fmtDateFr(filterPeriodFrom) } au ${fmtDateFr(filterPeriodTo)}` : ' · toutes périodes'}</p></div>
                <span className="flex items-center gap-2 text-sm font-bold text-slate-800">{fmtKPI(totalExp)} <ExternalLink className="h-4 w-4 text-emerald-600" /></span>
              </button>
              {cats.map(([c, v]) => (
                <button key={c} onClick={() => openExpenses(c)} className="flex w-full items-center justify-between border-t border-slate-100 bg-slate-50/50 py-2 pl-8 pr-4 text-left text-xs hover:bg-emerald-50">
                  <span className="text-slate-600">{c}</span><span className="flex items-center gap-2 font-medium text-slate-700">{fmtKPI(v)} <ChevronRight className="h-3 w-3" /></span>
                </button>
              ))}
              <button onClick={() => navigate('/vehicules')} className="flex w-full items-center justify-between border-t border-slate-200 bg-white px-4 py-3 text-left hover:bg-emerald-50">
                <div><p className="text-sm font-semibold text-slate-800">Assurances annuelles ({fv.filter(v => v.cout_assurance_annuel > 0).length} véhicule(s))</p><p className="text-xs text-slate-500">Menu Véhicules · case « Coût assurance annuel » de chaque fiche</p></div>
                <span className="flex items-center gap-2 text-sm font-bold text-slate-800">{fmtKPI(totalIns)} <ExternalLink className="h-4 w-4 text-emerald-600" /></span>
              </button>
              <div className="flex items-center justify-between border-t-2 border-slate-300 bg-slate-100 px-4 py-3"><span className="text-sm font-bold text-slate-900">Total</span><span className="text-sm font-extrabold text-slate-900">{fmtKPI(totalOp)}</span></div>
            </div>
            {filterDept && <p className="text-xs text-amber-700">Filtre département « {filterDept} » actif : le menu Dépenses n'a pas ce filtre, il affichera donc les dépenses de tous les départements.</p>}
          </KpiModal>
        );
      })()}
    </div>
  );
}
