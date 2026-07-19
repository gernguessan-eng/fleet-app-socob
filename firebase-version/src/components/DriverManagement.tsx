import { useState, useMemo } from 'react';
import { useDrivers } from '../store/DriverStore';
import { useVehicles } from '../store/VehicleStore';
import { usePersistedState } from '../hooks/usePersistedState';
import type { Driver, Mission, PlanningEvent } from '../types';
import {
  Users, ClipboardList, CalendarDays, Plus, Pencil, Search,
  Phone, Mail, Car, MapPin, Printer, ChevronRight,
  CheckCircle2, AlertTriangle, X, Upload,
} from 'lucide-react';
import DeleteGuardButton from './DeleteGuardButton';

function fmtDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtMoney(n: number) { return n.toLocaleString('fr-FR') + ' FCFA'; }

const STATUT_DRIVER_COLORS: Record<string, string> = {
  Disponible: 'bg-green-100 text-green-700',
  'En mission': 'bg-blue-100 text-blue-700',
  'En congé': 'bg-amber-100 text-amber-700',
  Indisponible: 'bg-red-100 text-red-700',
};
const STATUT_MISSION_COLORS: Record<string, string> = {
  Planifiée: 'bg-blue-100 text-blue-700',
  'En cours': 'bg-amber-100 text-amber-700',
  Terminée: 'bg-green-100 text-green-700',
  Annulée: 'bg-red-100 text-red-700',
};
const EVENT_COLORS: Record<string, string> = {
  Mission: '#10b981', Congé: '#f59e0b', Formation: '#06b6d4', Repos: '#94a3b8', Autre: '#8b5cf6',
};

// ─────────────────────────────────────────────────────────
// Formulaire générique pour chauffeurs
// ─────────────────────────────────────────────────────────
const emptyDriver: Omit<Driver, 'id'> = { nom: '', prenom: '', telephone: '', email: '', numero_permis: '', categorie_permis: 'B', date_expiration_permis: '', date_embauche: '', vehicule_affecte_id: '', statut: 'Disponible', photo_url: '', notes: '' };

function DriverFormModal({ driver, vehicles, onSave, onClose }: {
  driver?: Driver; vehicles: { id: string; label: string }[]; onSave: (data: Omit<Driver, 'id'>) => void; onClose: () => void;
}) {
  const [f, setF] = useState<Omit<Driver, 'id'>>(driver ? { ...driver } : { ...emptyDriver });
  const up = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));
  const inp = (label: string, key: string, type = 'text', placeholder?: string) => (
    <label className="block text-xs font-medium text-slate-600">{label}
      <input
        type={type}
        value={(f as any)[key] || ''}
        onChange={e => up(key, e.target.value)}
        placeholder={placeholder || `Saisir ${label.toLowerCase()}...`}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
    </label>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <h3 className="text-lg font-bold text-slate-900">{driver ? 'Modifier le chauffeur' : 'Ajouter un chauffeur'}</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(f); }} className="grid grid-cols-2 gap-4 p-6">
          {inp('Nom', 'nom')}{inp('Prénom', 'prenom')}{inp('Téléphone', 'telephone', 'tel')}{inp('Email', 'email', 'email')}
          {inp('N° Permis', 'numero_permis')}
          <label className="block text-xs font-medium text-slate-600">Catégorie permis
            <select value={f.categorie_permis} onChange={e => up('categorie_permis', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option value="" disabled>Sélectionner la catégorie du permis...</option>
              {['A', 'B', 'B-C', 'B-C-D', 'BCDE', 'ABCDE', 'C', 'D', 'E'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          {inp('Expiration permis', 'date_expiration_permis', 'date')}{inp("Date d'embauche", 'date_embauche', 'date')}
          <label className="block text-xs font-medium text-slate-600">Véhicule affecté
            <select value={f.vehicule_affecte_id} onChange={e => up('vehicule_affecte_id', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option value="">Sélectionner un véhicule ou laisser vide...</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-600">Statut
            <select value={f.statut} onChange={e => up('statut', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option value="" disabled>Sélectionner un statut...</option>
              {['Disponible', 'En mission', 'En congé', 'Indisponible'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <div className="col-span-2">{inp('Notes', 'notes', 'text', 'Ajouter une remarque sur le chauffeur, ses disponibilités ou contraintes...')}</div>
          <div className="col-span-2 flex justify-end gap-3 border-t pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
            <button type="submit" className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700">{driver ? 'Mettre à jour' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Formulaire Mission
// ─────────────────────────────────────────────────────────
const emptyMission: Omit<Mission, 'id'> = { driverId: '', vehicleId: '', titre: '', description: '', lieu_depart: '', lieu_arrivee: '', date_debut: '', date_fin: '', heure_depart: '', heure_retour: '', km_depart: 0, km_retour: 0, statut: 'Planifiée', cout_mission: 0, observations: '' };

function MissionFormModal({ mission, drivers, vehicles, existingMissions, onSave, onClose }: {
  mission?: Mission; drivers: Driver[]; vehicles: { id: string; label: string }[]; existingMissions: Mission[]; onSave: (data: Omit<Mission, 'id'>) => void; onClose: () => void;
}) {
  const [f, setF] = useState<Omit<Mission, 'id'>>(mission ? { ...mission } : { ...emptyMission });
  const [error, setError] = useState('');
  const up = (k: string, v: string | number) => { setF(p => ({ ...p, [k]: v })); setError(''); };
  const inp = (label: string, key: string, type = 'text', placeholder?: string) => (
    <label className="block text-xs font-medium text-slate-600">{label}
      <input
        type={type}
        value={(f as any)[key] || ''}
        onChange={e => up(key, type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder || `Saisir ${label.toLowerCase()}...`}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
    </label>
  );

  // Chauffeurs disponibles uniquement (sauf le chauffeur déjà assigné en mode édition)
  const availableDrivers = drivers.filter(d => d.statut === 'Disponible' || (mission && d.id === mission.driverId));

  // Vérification chevauchement de dates
  const checkOverlap = (): string | null => {
    if (!f.driverId || !f.date_debut || !f.date_fin) return null;
    const start = f.date_debut;
    const end = f.date_fin;
    const conflict = existingMissions.find(m => {
      if (m.driverId !== f.driverId) return false;
      if (mission && m.id === mission.id) return false; // ignorer la mission en cours d'édition
      if (m.statut === 'Annulée' || m.statut === 'Terminée') return false;
      // Chevauchement : !(fin1 < début2 || début1 > fin2)
      return !(end < m.date_debut || start > m.date_fin);
    });
    if (conflict) {
      const dr = drivers.find(d => d.id === f.driverId);
      return `${dr?.prenom} ${dr?.nom} est déjà affecté(e) à la mission "${conflict.titre}" du ${conflict.date_debut} au ${conflict.date_fin}. Choisissez un autre chauffeur ou modifiez les dates.`;
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const overlap = checkOverlap();
    if (overlap) { setError(overlap); return; }
    onSave(f);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <h3 className="text-lg font-bold text-slate-900">{mission ? 'Modifier la mission' : 'Nouvelle mission'}</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 p-6">
          {error && <div className="col-span-2 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700"><AlertTriangle className="inline h-4 w-4 mr-1" />{error}</div>}
          <label className="block text-xs font-medium text-slate-600">Chauffeur
            <select required value={f.driverId} onChange={e => up('driverId', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option value="">Sélectionner le chauffeur concerné...</option>
              {availableDrivers.map(d => <option key={d.id} value={d.id}>{d.prenom} {d.nom} ({d.statut})</option>)}
              {availableDrivers.length === 0 && <option value="" disabled>Aucun chauffeur disponible</option>}
            </select>
            {drivers.filter(d => d.statut !== 'Disponible' && !(mission && d.id === mission.driverId)).length > 0 && (
              <p className="mt-1 text-[10px] text-amber-600">{drivers.filter(d => d.statut !== 'Disponible').length} chauffeur(s) non disponible(s) masqué(s)</p>
            )}
          </label>
          <label className="block text-xs font-medium text-slate-600">Véhicule
            <select required value={f.vehicleId} onChange={e => up('vehicleId', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option value="">Sélectionner le véhicule utilisé...</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </label>
          <div className="col-span-2">{inp('Titre de la mission', 'titre', 'text', 'Ex: Livraison Yamoussoukro, Visite client Bouaké...')}</div>
          {inp('Lieu de départ', 'lieu_depart', 'text', 'Ex: Abidjan, Plateau')}{inp("Lieu d'arrivée", 'lieu_arrivee', 'text', 'Ex: Yamoussoukro')}
          {inp('Date début', 'date_debut', 'date')}{inp('Date fin', 'date_fin', 'date')}
          {inp('Heure départ', 'heure_depart', 'time')}{inp('Heure retour', 'heure_retour', 'time')}
          {inp('Km départ', 'km_depart', 'number', 'Ex: 45200')}{inp('Km retour', 'km_retour', 'number', 'Ex: 45680')}
          {inp('Coût mission (FCFA)', 'cout_mission', 'number', 'Ex: 35000')}
          <label className="block text-xs font-medium text-slate-600">Statut
            <select value={f.statut} onChange={e => up('statut', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option value="" disabled>Sélectionner le statut de la mission...</option>
              {['Planifiée', 'En cours', 'Terminée', 'Annulée'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <div className="col-span-2">{inp('Observations', 'observations', 'text', 'Ajouter des consignes, contraintes ou remarques sur la mission...')}</div>
          <div className="col-span-2 flex justify-end gap-3 border-t pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
            <button type="submit" className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700">{mission ? 'Mettre à jour' : 'Créer la mission'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Formulaire Planning
// ─────────────────────────────────────────────────────────
const emptyEvent: Omit<PlanningEvent, 'id'> = { driverId: '', vehicleId: '', titre: '', type: 'Mission', date_debut: '', date_fin: '', couleur: '#10b981', notes: '' };

function PlanningFormModal({ event, drivers, vehicles, existingPlanning, onSave, onClose }: {
  event?: PlanningEvent; drivers: Driver[]; vehicles: { id: string; label: string }[]; existingPlanning: PlanningEvent[]; onSave: (data: Omit<PlanningEvent, 'id'>) => void; onClose: () => void;
}) {
  const [f, setF] = useState<Omit<PlanningEvent, 'id'>>(event ? { ...event } : { ...emptyEvent });
  const [error, setError] = useState('');
  const up = (k: string, v: string) => { setF(p => ({ ...p, [k]: v })); setError(''); };

  // Pour les missions : seuls les chauffeurs disponibles
  const isMissionType = f.type === 'Mission';
  const availableDrivers = isMissionType
    ? drivers.filter(d => d.statut === 'Disponible' || (event && d.id === event.driverId))
    : drivers;

  const checkOverlap = (): string | null => {
    if (!f.driverId || !f.date_debut || !f.date_fin) return null;
    const conflict = existingPlanning.find(ev => {
      if (ev.driverId !== f.driverId) return false;
      if (event && ev.id === event.id) return false;
      return !(f.date_fin < ev.date_debut || f.date_debut > ev.date_fin);
    });
    if (conflict) {
      const dr = drivers.find(d => d.id === f.driverId);
      return `${dr?.prenom} ${dr?.nom} est déjà planifié(e) sur "${conflict.titre}" du ${conflict.date_debut} au ${conflict.date_fin}.`;
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const overlap = checkOverlap();
    if (overlap) { setError(overlap); return; }
    onSave(f);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <h3 className="text-lg font-bold text-slate-900">{event ? 'Modifier' : 'Nouvel événement'}</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 p-6">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700"><AlertTriangle className="inline h-4 w-4 mr-1" />{error}</div>}
          <label className="block text-xs font-medium text-slate-600">Chauffeur
            <select required value={f.driverId} onChange={e => up('driverId', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option value="">Sélectionner le chauffeur à planifier...</option>
              {availableDrivers.map(d => <option key={d.id} value={d.id}>{d.prenom} {d.nom}{isMissionType ? ` (${d.statut})` : ''}</option>)}
            </select>
            {isMissionType && drivers.filter(d => d.statut !== 'Disponible' && !(event && d.id === event.driverId)).length > 0 && (
              <p className="mt-1 text-[10px] text-amber-600">{drivers.filter(d => d.statut !== 'Disponible').length} chauffeur(s) non disponible(s) masqué(s)</p>
            )}
          </label>
          <label className="block text-xs font-medium text-slate-600">Titre
            <input required value={f.titre} onChange={e => up('titre', e.target.value)} placeholder="Ex: Mission Bouaké, Congé annuel, Formation sécurité..." className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-slate-600">Type
              <select value={f.type} onChange={e => { up('type', e.target.value); up('couleur', EVENT_COLORS[e.target.value] || '#8b5cf6'); }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                <option value="" disabled>Sélectionner le type d'événement...</option>
                {['Mission', 'Congé', 'Formation', 'Repos', 'Autre'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="block text-xs font-medium text-slate-600">Véhicule
              <select value={f.vehicleId} onChange={e => up('vehicleId', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                <option value="">Sélectionner un véhicule ou laisser vide...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-slate-600">Début <input type="date" required value={f.date_debut} onChange={e => up('date_debut', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="block text-xs font-medium text-slate-600">Fin <input type="date" required value={f.date_fin} onChange={e => up('date_fin', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          </div>
          <label className="block text-xs font-medium text-slate-600">Notes <input value={f.notes} onChange={e => up('notes', e.target.value)} placeholder="Ajouter un commentaire ou une précision sur la planification..." className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <div className="flex justify-end gap-3 border-t pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
            <button type="submit" className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700">{event ? 'Mettre à jour' : 'Créer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function DriverManagement() {
  const { drivers, missions, planning, addDriver, updateDriver, deleteDriver, addMission, updateMission, deleteMission, addPlanningEvent, updatePlanningEvent, deletePlanningEvent } = useDrivers();
  const { vehicles } = useVehicles();
  const [tab, setTab] = usePersistedState<'chauffeurs' | 'missions' | 'planning'>('fleetgest_filter_drivers_tab', 'chauffeurs');
  const [search, setSearch] = usePersistedState('fleetgest_filter_drivers_search', '');

  // Modals
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | undefined>();
  const [showMissionForm, setShowMissionForm] = useState(false);
  const [editMission, setEditMission] = useState<Mission | undefined>();
  const [showPlanningForm, setShowPlanningForm] = useState(false);
  const [editEvent, setEditEvent] = useState<PlanningEvent | undefined>();

  const vehicleOptions = useMemo(() => vehicles.map(v => ({ id: v.id, label: `${v.numero_immatriculation} — ${v.marque} ${v.type_commercial}` })), [vehicles]);
  const driverById = useMemo(() => new Map(drivers.map(d => [d.id, d])), [drivers]);
  const vehicleById = useMemo(() => new Map(vehicles.map(v => [v.id, v])), [vehicles]);

  const tabs = [
    { id: 'chauffeurs' as const, label: 'Chauffeurs', icon: Users, count: drivers.length },
    { id: 'missions' as const, label: 'Missions', icon: ClipboardList, count: missions.length },
    { id: 'planning' as const, label: 'Planification', icon: CalendarDays, count: planning.length },
  ];

  // ── Stats ──
  const driverStats = useMemo(() => ({
    total: drivers.length,
    disponibles: drivers.filter(d => d.statut === 'Disponible').length,
    enMission: drivers.filter(d => d.statut === 'En mission').length,
    enConge: drivers.filter(d => d.statut === 'En congé').length,
    permisExpirant: drivers.filter(d => { if (!d.date_expiration_permis) return false; const diff = (new Date(d.date_expiration_permis).getTime() - Date.now()) / 86400000; return diff >= 0 && diff <= 90; }).length,
  }), [drivers]);

  // ── Weeks for planning calendar view ──
  const calendarWeeks = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay() + 1); // Monday
    const days: Date[] = [];
    for (let i = 0; i < 28; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const getEventsForDay = (day: Date) => {
    const dayStr = day.toISOString().slice(0, 10);
    return planning.filter(ev => ev.date_debut <= dayStr && ev.date_fin >= dayStr);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-white p-6 shadow-sm print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestion des Chauffeurs</h2>
          <p className="mt-1 text-sm text-slate-500">{driverStats.total} chauffeur(s) — {driverStats.disponibles} disponible(s) — {missions.filter(m => m.statut === 'Planifiée' || m.statut === 'En cours').length} mission(s) active(s)</p>
        </div>
        <div className="flex gap-2">
          <label className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50 cursor-pointer" title="Importer"><Upload className="h-4 w-4" /><input type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={() => {}} /></label>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"><Printer className="h-4 w-4" /> Imprimer</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { label: 'Total', value: driverStats.total, color: 'emerald' },
          { label: 'Disponibles', value: driverStats.disponibles, color: 'green' },
          { label: 'En mission', value: driverStats.enMission, color: 'blue' },
          { label: 'En congé', value: driverStats.enConge, color: 'amber' },
          { label: 'Permis < 90j', value: driverStats.permisExpirant, color: 'red' },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border p-4 bg-${k.color}-50 border-${k.color}-200`}>
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 print:hidden">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Icon className="h-4 w-4" /> {t.label} <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* ═══════ CHAUFFEURS ═══════ */}
      {tab === 'chauffeurs' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row print:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un chauffeur…" className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            </div>
            <button onClick={() => { setEditDriver(undefined); setShowDriverForm(true); }} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"><Plus className="h-4 w-4" /> Ajouter</button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {drivers.filter(d => { const q = search.toLowerCase(); return !q || `${d.nom} ${d.prenom} ${d.telephone} ${d.email}`.toLowerCase().includes(q); }).map(d => {
              const v = vehicleById.get(d.vehicule_affecte_id);
              const permisExpire = d.date_expiration_permis && new Date(d.date_expiration_permis) < new Date();
              return (
                <div key={d.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-bold text-sm">
                        {d.prenom[0]}{d.nom[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{d.prenom} {d.nom}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUT_DRIVER_COLORS[d.statut]}`}>{d.statut}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 print:hidden">
                      <button onClick={() => { setEditDriver(d); setShowDriverForm(true); }} className="p-1 text-slate-400 hover:text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>
                      <DeleteGuardButton module="chauffeurs" recordId={d.id} label={`le chauffeur ${d.prenom} ${d.nom}`} onDelete={() => deleteDriver(d.id)} className="p-1 text-slate-400 hover:text-red-600" />
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <p className="flex items-center gap-2"><Phone className="h-3 w-3 text-slate-400" />{d.telephone}</p>
                    <p className="flex items-center gap-2"><Mail className="h-3 w-3 text-slate-400" />{d.email}</p>
                    <p className="flex items-center gap-2"><Car className="h-3 w-3 text-slate-400" />{v ? v.numero_immatriculation + ' — ' + v.marque : 'Aucun véhicule'}</p>
                    <p className="flex items-center gap-2">
                      {permisExpire ? <AlertTriangle className="h-3 w-3 text-red-500" /> : <CheckCircle2 className="h-3 w-3 text-green-500" />}
                      Permis {d.categorie_permis} — expire {fmtDate(d.date_expiration_permis)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {showDriverForm && (
            <DriverFormModal
              driver={editDriver}
              vehicles={vehicleOptions}
              onClose={() => { setShowDriverForm(false); setEditDriver(undefined); }}
              onSave={data => {
                if (editDriver) updateDriver(editDriver.id, data);
                else addDriver({ ...data, id: 'dr' + Date.now() });
                setShowDriverForm(false); setEditDriver(undefined);
              }}
            />
          )}
        </div>
      )}

      {/* ═══════ MISSIONS ═══════ */}
      {tab === 'missions' && (
        <div className="space-y-4">
          <div className="flex justify-end print:hidden">
            <button onClick={() => { setEditMission(undefined); setShowMissionForm(true); }} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"><Plus className="h-4 w-4" /> Nouvelle mission</button>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['Mission', 'Chauffeur', 'Véhicule', 'Trajet', 'Dates', 'Km', 'Coût', 'Statut', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {missions.length === 0 ? (
                    <tr><td colSpan={9} className="py-10 text-center text-slate-400">Aucune mission</td></tr>
                  ) : missions.sort((a, b) => new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime()).map(m => {
                    const dr = driverById.get(m.driverId);
                    const ve = vehicleById.get(m.vehicleId);
                    return (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3"><p className="font-semibold text-slate-800">{m.titre}</p><p className="text-xs text-slate-500">{m.description}</p></td>
                        <td className="px-4 py-3">{dr ? `${dr.prenom} ${dr.nom}` : '—'}</td>
                        <td className="px-4 py-3 text-xs">{ve ? ve.numero_immatriculation : '—'}</td>
                        <td className="px-4 py-3 text-xs"><div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-emerald-500" />{m.lieu_depart}</div><div className="flex items-center gap-1"><ChevronRight className="h-3 w-3 text-slate-300" />{m.lieu_arrivee}</div></td>
                        <td className="px-4 py-3 text-xs">{fmtDate(m.date_debut)}{m.date_fin !== m.date_debut ? ` → ${fmtDate(m.date_fin)}` : ''}</td>
                        <td className="px-4 py-3 text-xs">{m.km_retour > 0 ? `${(m.km_retour - m.km_depart).toLocaleString()} km` : '—'}</td>
                        <td className="px-4 py-3 text-xs font-semibold">{m.cout_mission ? fmtMoney(m.cout_mission) : '—'}</td>
                        <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUT_MISSION_COLORS[m.statut]}`}>{m.statut}</span></td>
                        <td className="px-4 py-3 print:hidden">
                          <div className="flex gap-1">
                            <button onClick={() => { setEditMission(m); setShowMissionForm(true); }} className="p-1 text-slate-400 hover:text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>
                            <DeleteGuardButton
                              module="missions"
                              recordId={m.id}
                              label={`la mission « ${m.lieu_depart} → ${m.lieu_arrivee} » du ${fmtDate(m.date_debut)}`}
                              onDelete={() => {
                                deleteMission(m.id);
                                const linkedEvent = planning.find(ev => ev.id === `pl-mi-${m.id}`);
                                if (linkedEvent) deletePlanningEvent(linkedEvent.id);
                              }}
                              className="p-1 text-slate-400 hover:text-red-600"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {showMissionForm && (
            <MissionFormModal
              mission={editMission}
              drivers={drivers}
              vehicles={vehicleOptions}
              existingMissions={missions}
              onClose={() => { setShowMissionForm(false); setEditMission(undefined); }}
              onSave={data => {
                if (editMission) {
                  updateMission(editMission.id, data);
                } else {
                  const newId = 'mi' + Date.now();
                  const newMission = { ...data, id: newId } as Mission;
                  addMission(newMission);
                }
                setShowMissionForm(false);
                setEditMission(undefined);
                setTab('planning');
              }}
            />
          )}
        </div>
      )}

      {/* ═══════ PLANNING ═══════ */}
      {tab === 'planning' && (
        <div className="space-y-4">
          <div className="flex justify-end print:hidden">
            <button onClick={() => { setEditEvent(undefined); setShowPlanningForm(true); }} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"><Plus className="h-4 w-4" /> Nouvelle planification</button>
          </div>

          {/* Calendar Grid — 4 weeks */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="grid grid-cols-7 bg-slate-50 border-b">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-slate-500">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
              {calendarWeeks.map((day, i) => {
                const isToday = day.toDateString() === new Date().toDateString();
                const events = getEventsForDay(day);
                return (
                  <div key={i} className={`min-h-[90px] p-1.5 ${isToday ? 'bg-emerald-50' : 'bg-white'}`}>
                    <p className={`text-xs font-medium mb-1 ${isToday ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                      {day.getDate()}{day.getDate() === 1 ? '/' + (day.getMonth() + 1) : ''}
                    </p>
                    <div className="space-y-0.5">
                      {events.slice(0, 3).map(ev => {
                        const dr = driverById.get(ev.driverId);
                        return (
                          <button
                            key={ev.id}
                            onClick={() => { setEditEvent(ev); setShowPlanningForm(true); }}
                            className="w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium text-white"
                            style={{ backgroundColor: ev.couleur || '#10b981' }}
                            title={`${ev.titre} — ${dr ? dr.prenom + ' ' + dr.nom : ''}`}
                          >
                            {ev.titre}
                          </button>
                        );
                      })}
                      {events.length > 3 && <p className="text-[10px] text-slate-400">+{events.length - 3} autre(s)</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Event list below calendar */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-slate-700">Tous les événements</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {planning.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">Aucun événement planifié</p> : planning.sort((a, b) => a.date_debut.localeCompare(b.date_debut)).map(ev => {
                const dr = driverById.get(ev.driverId);
                const ve = vehicleById.get(ev.vehicleId);
                return (
                  <div key={ev.id} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <div className="h-8 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: ev.couleur }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{ev.titre}</p>
                      <p className="text-xs text-slate-500">{dr ? `${dr.prenom} ${dr.nom}` : '—'} {ve ? `• ${ve.numero_immatriculation}` : ''} • {fmtDate(ev.date_debut)} → {fmtDate(ev.date_fin)}</p>
                    </div>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">{ev.type}</span>
                    <div className="flex gap-1 print:hidden">
                      <button onClick={() => { setEditEvent(ev); setShowPlanningForm(true); }} className="p-1 text-slate-400 hover:text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>
                      <DeleteGuardButton module="planning" recordId={ev.id} label={`l'événement « ${ev.titre} »`} onDelete={() => deletePlanningEvent(ev.id)} className="p-1 text-slate-400 hover:text-red-600" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {showPlanningForm && (
            <PlanningFormModal
              event={editEvent}
              drivers={drivers}
              vehicles={vehicleOptions}
              existingPlanning={planning}
              onClose={() => { setShowPlanningForm(false); setEditEvent(undefined); }}
              onSave={(data) => {
                const eventId = editEvent?.id || 'pl' + Date.now();
                if (editEvent) updatePlanningEvent(eventId, data);
                else addPlanningEvent({ ...data, id: eventId });

                if (data.type === 'Mission') {
                  const linkedMission = {
                    id: `mi-pl-${eventId}`,
                    driverId: data.driverId,
                    vehicleId: data.vehicleId,
                    titre: data.titre,
                    description: data.notes || '',
                    lieu_depart: '',
                    lieu_arrivee: '',
                    date_debut: data.date_debut,
                    date_fin: data.date_fin,
                    heure_depart: '',
                    heure_retour: '',
                    km_depart: 0,
                    km_retour: 0,
                    statut: 'Planifiée',
                    cout_mission: 0,
                    observations: 'Créée depuis la Planification',
                  } as Mission;

                  const missionExists = missions.some(m => m.id === linkedMission.id);
                  if (missionExists) updateMission(linkedMission.id, linkedMission);
                  else addMission(linkedMission);
                  setTab('missions');
                }
                setShowPlanningForm(false);
                setEditEvent(undefined);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
