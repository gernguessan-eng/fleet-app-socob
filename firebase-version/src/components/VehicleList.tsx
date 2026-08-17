import { useState, useMemo } from 'react';
import { useVehicles } from '../store/VehicleStore';
import { usePersistedState } from '../hooks/usePersistedState';
import type { Vehicle } from '../types';
import { getCell, parseAmount, readTabularFile, exportRowsToExcel } from '../utils/excelIO';
import {
  Search, Plus, Pencil, Trash2, ChevronRight, ChevronDown,
  ChevronLeft as ChevronLeftIcon, Printer, FolderTree, CheckSquare, Square, Upload, Download,
} from 'lucide-react';
import VehicleForm from './VehicleForm';
import VehicleDetailPanel from './VehicleDetailPanel';
import DeleteGuardButton from './DeleteGuardButton';
import { useAuth } from '../store/AuthContext';
import { useDeletionRequests } from '../store/DeletionRequestsStore';
import { getVehicleMaintenanceForecast } from '../utils/maintenance';

function fmtMoney(v: number) {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' M FCFA';
  if (v >= 1_000) return (v / 1_000).toFixed(0) + ' K FCFA';
  return v.toLocaleString('fr-FR') + ' FCFA';
}

export default function VehicleList() {
  const { vehicles, expenseRecords, deleteVehicle, deleteMultipleVehicles, importVehicles } = useVehicles();
  const { profile } = useAuth();
  const { requestDeletion } = useDeletionRequests();
  const [importMessage, setImportMessage] = useState('');
  const [importPreview, setImportPreview] = useState<Vehicle[]>([]);

  const exportExcel = () => {
    const rows = filtered.map((v) => ({
      'Immatriculation': v.numero_immatriculation, 'N° carte grise': v.numero_carte_grise, 'Marque': v.marque,
      'Genre': v.genre, 'Type commercial': v.type_commercial, 'Couleur': v.couleur, 'Énergie': v.energie,
      'Date mise en circulation': v.date_mise_circulation, 'Statut': v.statut, 'Kilométrage': v.kilometrage,
      'Affectation': v.affectation, 'Zone': v.zone_affectation || '', 'Zone de travail': v.zone_travail || '',
      'Conducteur': v.conducteur, 'Date achat': v.date_achat, 'Coût achat (FCFA)': v.cout_achat,
      'Date assurance': v.date_assurance, 'Coût assurance annuel (FCFA)': v.cout_assurance_annuel,
      'Date vignette': v.date_vignette, 'Consommation (L/100km)': v.consommation_100km || '', 'Observations': v.observations,
    }));
    exportRowsToExcel(rows, 'vehicules.xlsx', 'Véhicules');
  };

  const buildVehicleFromRow = (row: Record<string, unknown>, index: number): Vehicle | null => {
    const immat = getCell(row, ['immatriculation', 'numero_immatriculation', 'plaque']);
    if (!immat) return null;
    return {
      id: 'v-import-' + Date.now() + '-' + index,
      numero_immatriculation: immat,
      numero_carte_grise: getCell(row, ['n° carte grise', 'numero_carte_grise', 'carte grise']),
      code_parc_entreprise: getCell(row, ['code_parc_entreprise', 'code parc']),
      nom_proprietaire: getCell(row, ['nom_proprietaire', 'propriétaire']),
      rdc: getCell(row, ['rdc']),
      marque: getCell(row, ['marque']),
      genre: getCell(row, ['genre']),
      type_commercial: getCell(row, ['type commercial', 'type_commercial', 'modele', 'modèle']),
      couleur: getCell(row, ['couleur']),
      carrosserie: getCell(row, ['carrosserie']),
      date_mise_circulation: getCell(row, ['date mise en circulation', 'date_mise_circulation']),
      date_edition: getCell(row, ['date_edition']),
      usage_vehicule: getCell(row, ['usage_vehicule', 'usage']),
      energie: getCell(row, ['énergie', 'energie']) || 'Essence',
      places_assises: Math.round(parseAmount(getCell(row, ['places_assises', 'places']))) || 0,
      ptac_kg: parseAmount(getCell(row, ['ptac_kg', 'ptac'])),
      nombre_essieux: Math.round(parseAmount(getCell(row, ['nombre_essieux', 'essieux']))) || 0,
      cylindree_cc: parseAmount(getCell(row, ['cylindree_cc', 'cylindrée'])),
      puissance_fiscale_cv: parseAmount(getCell(row, ['puissance_fiscale_cv', 'puissance'])),
      pv_kg: parseAmount(getCell(row, ['pv_kg'])),
      cu_kg: parseAmount(getCell(row, ['cu_kg'])),
      vin_chassis: getCell(row, ['vin_chassis', 'chassis', 'châssis']),
      numero_moteur: getCell(row, ['numero_moteur', 'n° moteur']),
      type_technique: getCell(row, ['type_technique']),
      numero_immatriculation_precedent: getCell(row, ['numero_immatriculation_precedent']),
      societe_credit: getCell(row, ['societe_credit', 'société de crédit']),
      statut: (['Actif', 'En maintenance', 'Hors service', 'Réformé'].includes(getCell(row, ['statut'])) ? getCell(row, ['statut']) : 'Actif') as Vehicle['statut'],
      kilometrage: Math.round(parseAmount(getCell(row, ['kilometrage', 'kilométrage']))),
      date_achat: getCell(row, ['date achat', 'date_achat']),
      cout_achat: parseAmount(getCell(row, ['cout achat (fcfa)', 'cout_achat', 'coût achat'])),
      date_assurance: getCell(row, ['date assurance', 'date_assurance']),
      date_vignette: getCell(row, ['date vignette', 'date_vignette']),
      validite_carte_transport: getCell(row, ['validite_carte_transport']),
      validite_patente: getCell(row, ['validite_patente']),
      validite_carte_stationnement: getCell(row, ['validite_carte_stationnement']),
      cout_assurance_annuel: parseAmount(getCell(row, ['cout assurance annuel (fcfa)', 'cout_assurance_annuel'])),
      affectation: getCell(row, ['affectation']),
      zone_affectation: (getCell(row, ['zone', 'zone_affectation']) || undefined) as Vehicle['zone_affectation'],
      zone_travail: getCell(row, ['zone de travail', 'zone_travail']),
      conducteur: getCell(row, ['conducteur']),
      observations: getCell(row, ['observations']),
      consommation_100km: parseAmount(getCell(row, ['consommation (l/100km)', 'consommation_100km'])) || undefined,
    };
  };

  const processImportFile = async (file: File) => {
    setImportMessage('Traitement du fichier en cours...');
    setImportPreview([]);
    try {
      const rows = await readTabularFile(file);
      const imported = rows.map((row, index) => buildVehicleFromRow(row, index)).filter((v): v is Vehicle => Boolean(v));
      setImportPreview(imported);
      setImportMessage(imported.length > 0 ? `${imported.length} véhicule(s) valide(s) détecté(s).` : 'Aucun véhicule valide détecté (colonne « Immatriculation » requise).');
    } catch (error) {
      setImportMessage('Erreur : ' + (error as Error).message);
    }
  };

  const confirmImport = () => {
    importVehicles([...vehicles, ...importPreview]);
    setImportMessage(`${importPreview.length} véhicule(s) importé(s) avec succès.`);
    setImportPreview([]);
  };
  const [search, setSearch]           = usePersistedState('fleetgest_filter_vehicles_search', '');
  const [filterStatus, setFilterStatus] = usePersistedState('fleetgest_filter_vehicles_status', '');
  const [showForm, setShowForm]       = usePersistedState('fleetgest_draft_vehicle_form_open', false);
  const [editVehicleId, setEditVehicleId] = usePersistedState<string | null>('fleetgest_draft_vehicle_edit_id', null);
  const editVehicle = editVehicleId ? vehicles.find(v => v.id === editVehicleId) : undefined;
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [printOnlyId, setPrintOnlyId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 8;

  // Impression d'une fiche véhicule individuelle :
  // 1. on déplie la ligne et on isole l'impression à ce véhicule
  // 2. on déclenche window.print() une fois le DOM mis à jour
  const handlePrintVehicle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setPrintOnlyId(id);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintOnlyId(null), 500);
    }, 200);
  };

  const filtered = useMemo(() => vehicles.filter((v) => {
    const q = search.toLowerCase();
    return (
      (!search ||
        v.numero_immatriculation.toLowerCase().includes(q) ||
        v.marque.toLowerCase().includes(q) ||
        v.type_commercial.toLowerCase().includes(q) ||
        v.conducteur.toLowerCase().includes(q) ||
        v.vin_chassis.toLowerCase().includes(q)) &&
      (!filterStatus || v.statut === filterStatus)
    );
  }), [vehicles, search, filterStatus]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated  = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const expensesByVehicle = useMemo(() => {
    const map = new Map<string, number>();
    expenseRecords.forEach((e) => map.set(e.vehicleId, (map.get(e.vehicleId) ?? 0) + e.montant));
    return map;
  }, [expenseRecords]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedIds(new Set(paginated.map((v) => v.id)));
  const collapseAll = () => setExpandedIds(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length && paginated.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((v) => v.id)));
    }
  };

  const handleDeleteSelected = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const isAdmin = profile?.role === 'Administrateur';
    if (isAdmin) {
      if (confirm(`Supprimer ${ids.length} véhicule(s) sélectionné(s) ? Cette action est irréversible.`)) {
        deleteMultipleVehicles(ids);
        setSelectedIds(new Set());
        setExpandedIds(new Set());
      }
      return;
    }
    if (confirm(`Vous n'êtes pas administrateur : une demande de suppression pour ces ${ids.length} véhicule(s) sera envoyée pour validation. Continuer ?`)) {
      ids.forEach((id) => {
        const v = vehicles.find((x) => x.id === id);
        requestDeletion({ module: 'vehicules', recordId: id, recordLabel: `Véhicule ${v?.numero_immatriculation || id}`, requestedBy: profile?.displayName || profile?.email || 'Utilisateur' });
      });
      setSelectedIds(new Set());
      alert(`${ids.length} demande(s) de suppression envoyée(s) à l'administrateur.`);
    }
  };

  const handleEdit = (v: Vehicle) => { setEditVehicleId(v.id); setShowForm(true); };
  const handleAdd  = () => { setEditVehicleId(null); setShowForm(true); };

  const statusOptions = [
    { value: '', label: 'Tous' },
    { value: 'Actif', label: 'Actif' },
    { value: 'En maintenance', label: 'En maintenance' },
    { value: 'Hors service', label: 'Hors service' },
    { value: 'Réformé', label: 'Réformé' },
  ];

  const allSelected = paginated.length > 0 && selectedIds.size === paginated.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < paginated.length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Parc Automobile</h2>
          <p className="mt-1 text-sm text-slate-500">
            {vehicles.length} véhicule(s) — {filtered.length} affiché(s)
            {selectedIds.size > 0 && <span className="ml-2 text-emerald-600 font-semibold">({selectedIds.size} sélectionné(s))</span>}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer ({selectedIds.size})
            </button>
          )}
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Ajouter
          </button>
          <label className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50 cursor-pointer" title="Importer">
            <Upload className="h-4 w-4" />
            <input type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={(event) => event.target.files?.[0] && processImportFile(event.target.files[0])} />
          </label>
          <button
            onClick={exportExcel}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50"
            title="Exporter"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" /> Imprimer
          </button>
        </div>
      </div>

      {importMessage && <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600 print:hidden">{importMessage}</p>}
      {importPreview.length > 0 && (
        <div className="rounded-lg bg-emerald-50 px-4 py-3 flex items-center justify-between print:hidden">
          <span className="text-sm text-emerald-800">{importPreview.length} véhicule(s) prêt(s)</span>
          <button onClick={confirmImport} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Confirmer l'import</button>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Immatriculation, marque, modèle, conducteur, VIN…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* ── Arborescence controls ── */}
      <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-2">
        <FolderTree className="h-4 w-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-600">Arborescence des fiches</span>
        <div className="ml-auto flex gap-2">
          <button onClick={expandAll} className="rounded-md bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">
            Tout déplier
          </button>
          <button onClick={collapseAll} className="rounded-md bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">
            Tout replier
          </button>
        </div>
      </div>

      {/* ── Arborescence ── */}
      <div className="space-y-3">
        {/* Header row with select all */}
        {paginated.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-600"
            >
              {allSelected ? (
                <CheckSquare className="h-5 w-5 text-emerald-600" />
              ) : someSelected ? (
                <div className="relative h-5 w-5">
                  <Square className="h-5 w-5 text-emerald-600" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />
                  </div>
                </div>
              ) : (
                <Square className="h-5 w-5 text-slate-400" />
              )}
              <span>{allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}</span>
            </button>
          </div>
        )}

        {paginated.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
            Aucun véhicule trouvé
          </div>
        ) : paginated.map((v) => {
          const isExpanded = expandedIds.has(v.id);
          const isSelected = selectedIds.has(v.id);
          const maintenanceForecast = getVehicleMaintenanceForecast(v, expenseRecords);
          const nextMaintenanceDateLabel = maintenanceForecast.estimatedNextDate
            ? new Date(maintenanceForecast.estimatedNextDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
            : maintenanceForecast.hasHistory
              ? 'À estimer'
              : 'Non renseignée';
          const nextMaintenanceKmLabel = maintenanceForecast.hasHistory
            ? `${maintenanceForecast.nextMaintenanceKm.toLocaleString('fr-FR')} km`
            : 'Non renseigné';
          const isPrintHidden = printOnlyId !== null && printOnlyId !== v.id;
          return (
            <div
              key={v.id}
              className={`rounded-xl border bg-white shadow-sm overflow-hidden ${isSelected ? 'border-emerald-400 ring-1 ring-emerald-200' : 'border-slate-200'} ${isPrintHidden ? 'print:hidden' : ''}`}
            >
              {/* ── Node header ── */}
              <div
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  isExpanded ? 'bg-emerald-50 border-b border-emerald-100' : 'hover:bg-slate-50'
                }`}
                onClick={() => toggleExpand(v.id)}
              >
                {/* Checkbox */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSelect(v.id); }}
                  className="flex-shrink-0"
                >
                  {isSelected ? (
                    <CheckSquare className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Square className="h-5 w-5 text-slate-400" />
                  )}
                </button>

                <button className="flex-shrink-0 rounded-md p-1 text-slate-400 hover:text-emerald-600">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>

                {/* Photo miniature */}
                <div className="flex-shrink-0">
                  {v.photo_url ? (
                    <img src={v.photo_url} alt={v.numero_immatriculation} className="h-10 w-14 rounded-lg object-cover border border-slate-200" />
                  ) : (
                    <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-slate-100 border border-slate-200">
                      <span className="text-[10px] text-slate-400">Photo</span>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-emerald-600">{v.numero_immatriculation}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      v.statut === 'Actif' ? 'bg-green-100 text-green-700' :
                      v.statut === 'En maintenance' ? 'bg-amber-100 text-amber-700' :
                      v.statut === 'Hors service' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{v.statut}</span>
                  </div>
                  <p className="text-xs text-slate-500">{v.marque} {v.type_commercial} — {v.couleur} — {v.energie}</p>
                </div>

                <div className="hidden sm:flex items-center gap-6 text-right">
                  <div>
                    <p className="text-[10px] text-slate-400">Km</p>
                    <p className="text-xs font-semibold text-slate-700">{v.kilometrage.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Dépenses</p>
                    <p className="text-xs font-semibold text-slate-700">{fmtMoney(expensesByVehicle.get(v.id) ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Proch. entretien</p>
                    <p className={`text-xs font-semibold ${
                      maintenanceForecast.alertLevel === 'critical'
                        ? 'text-red-600'
                        : maintenanceForecast.alertLevel === 'warning'
                          ? 'text-amber-600'
                          : 'text-slate-700'
                    }`}>{nextMaintenanceDateLabel}</p>
                    <p className="text-[10px] text-slate-400">{nextMaintenanceKmLabel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Conducteur</p>
                    <p className="text-xs font-semibold text-slate-700">{v.conducteur || '—'}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleEdit(v)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                    title="Modifier"
                  ><Pencil className="h-4 w-4" /></button>
                  <DeleteGuardButton
                    module="vehicules"
                    recordId={v.id}
                    label={`le véhicule ${v.numero_immatriculation}`}
                    onDelete={() => deleteVehicle(v.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    title="Supprimer"
                    size="md"
                  />
                  <button
                    onClick={() => handlePrintVehicle(v.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700"
                    title="Imprimer la fiche"
                  ><Printer className="h-4 w-4" /></button>
                </div>
              </div>

              {/* ── Expanded fiche ── */}
              {isExpanded && (
                <div className="border-t border-slate-100">
                  <VehicleDetailPanel vehicle={v} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm text-slate-500">Page {currentPage} / {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}
              className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-slate-100">
              <ChevronLeftIcon className="h-4 w-4" /> Précédent
            </button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}
              className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-slate-100">
              Suivant <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Formulaire ── */}
      {showForm && (
        <VehicleForm
          vehicle={editVehicle}
          onSave={() => { setShowForm(false); setEditVehicleId(null); setCurrentPage(1); }}
          onClose={() => { setShowForm(false); setEditVehicleId(null); }}
        />
      )}
    </div>
  );
}
