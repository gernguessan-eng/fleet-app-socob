import { useState, useRef } from 'react';
import { useVehicles } from '../store/VehicleStore';
import type { Vehicle, MaintenanceRecord } from '../types';
import {
  Car, MapPin, User, Gauge, Calendar, Shield, FileText,
  Wrench, AlertCircle, DollarSign, Info, Hash, Fuel, Receipt, Camera, Upload, X,
} from 'lucide-react';
import { getVehicleMaintenanceForecast } from '../utils/maintenance';
import { uploadVehicleImage, validateImageFile } from '../utils/uploadImage';
import DeleteGuardButton from './DeleteGuardButton';

interface Props { vehicle: Vehicle; printMode?: boolean; }

function formatDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}
function formatMoney(n: number) { return n.toLocaleString('fr-FR') + ' FCFA'; }
function daysUntil(d: string) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
}

export default function VehicleDetailPanel({ vehicle, printMode = false }: Props) {
  const {
    maintenanceRecords, addMaintenanceRecord, deleteMaintenanceRecord,
    expenseRecords, deleteExpenseRecord, updateVehicle,
  } = useVehicles();

  const [showMaintForm, setShowMaintForm] = useState(false);
  const [maintForm, setMaintForm]         = useState({ date: '', type: '', description: '', cout: '', kilometrage: '' });
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [docUploading, setDocUploading] = useState<string | null>(null);

  const vehicleMaintenance = maintenanceRecords
    .filter((m) => m.vehicleId === vehicle.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const vehicleExpenses = expenseRecords
    .filter((e) => e.vehicleId === vehicle.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalExpenses    = vehicleExpenses.reduce((s, e) => s + e.montant, 0);
  const totalMaintenance = vehicleMaintenance.reduce((s, m) => s + m.cout, 0);
  const daysToAssurance  = daysUntil(vehicle.date_assurance);
  const daysToVignette   = daysUntil(vehicle.date_vignette);
  const maintenanceForecast = getVehicleMaintenanceForecast(vehicle, expenseRecords);

  const handleAddMaintenance = (ev: React.FormEvent) => {
    ev.preventDefault();
    const record: MaintenanceRecord = {
      id: 'm' + Date.now(), vehicleId: vehicle.id,
      date: maintForm.date, type: maintForm.type,
      description: maintForm.description,
      cout: Number(maintForm.cout), kilometrage: Number(maintForm.kilometrage),
    };
    addMaintenanceRecord(record);
    setShowMaintForm(false);
    setMaintForm({ date: '', type: '', description: '', cout: '', kilometrage: '' });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const error = validateImageFile(file);
    if (error) { alert(error); return; }
    setPhotoUploading(true);
    try {
      const url = await uploadVehicleImage(vehicle.id, 'photo', file);
      updateVehicle(vehicle.id, { photo_url: url });
    } catch {
      alert("Échec de l'import de la photo. Vérifiez votre connexion et réessayez.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    if (confirm('Supprimer la photo de ce véhicule ?')) {
      updateVehicle(vehicle.id, { photo_url: '' });
    }
  };

  // Import d'un document administratif (carte grise, patente, vignette, carte de transport,
  // carte de stationnement) — même mécanisme que la photo du véhicule : upload vers Firebase
  // Storage, seule l'URL (courte) est enregistrée sur le véhicule.
  const DOCUMENT_FIELDS: { key: keyof Vehicle; label: string }[] = [
    { key: 'photo_carte_grise', label: 'Carte grise' },
    { key: 'photo_patente', label: 'Patente' },
    { key: 'photo_vignette', label: 'Vignette' },
    { key: 'photo_carte_transport', label: 'Carte de transport' },
    { key: 'photo_carte_stationnement', label: 'Carte de stationnement' },
  ];

  const handleDocumentChange = async (docKey: string, fieldKey: keyof Vehicle, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const error = validateImageFile(file);
    if (error) { alert(error); return; }
    setDocUploading(docKey);
    try {
      const url = await uploadVehicleImage(vehicle.id, docKey, file);
      updateVehicle(vehicle.id, { [fieldKey]: url } as Partial<Vehicle>);
    } catch {
      alert("Échec de l'import du document. Vérifiez votre connexion et réessayez.");
    } finally {
      setDocUploading(null);
    }
  };

  const handleRemoveDocument = (fieldKey: keyof Vehicle, label: string) => {
    if (confirm(`Supprimer le document « ${label} » ?`)) {
      updateVehicle(vehicle.id, { [fieldKey]: '' } as Partial<Vehicle>);
    }
  };

  const statutColors: Record<string, string> = {
    Actif:           'bg-green-100 text-green-700 border-green-200',
    'En maintenance':'bg-amber-100 text-amber-700 border-amber-200',
    'Hors service':  'bg-red-100 text-red-700 border-red-200',
    Réformé:         'bg-slate-100 text-slate-600 border-slate-200',
  };

  const Card = ({ title, children }: { title: React.ReactNode; children: React.ReactNode }) => (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </div>
  );

  const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="flex items-start gap-3 border-b border-slate-50 py-2 last:border-0">
      <div className="mt-0.5 flex-shrink-0 text-slate-400">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );

  const EcheanceRow = ({ label, date, days }: { label: string; date: string; days: number | null }) => (
    <div className="flex items-start gap-3 border-b border-slate-50 py-2">
      <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800">{formatDate(date)}</p>
        {days !== null && (
          <p className={`mt-0.5 text-xs font-semibold ${
            days < 0 ? 'text-red-600' : days < 30 ? 'text-red-500' : days < 60 ? 'text-amber-500' : 'text-green-500'
          }`}>
            {days < 0 ? `Expirée depuis ${Math.abs(days)} j` : days === 0 ? "Expire aujourd'hui" : `Dans ${days} jours`}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* ── Banner véhicule ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {/* Photo du véhicule – zone cliquable entière */}
          <div className="relative flex-shrink-0">
            {vehicle.photo_url ? (
              <div className="relative group">
                <img
                  src={vehicle.photo_url}
                  alt={vehicle.numero_immatriculation}
                  className="h-24 w-32 rounded-xl object-cover shadow-md border border-slate-200"
                />
                {photoUploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 text-[10px] font-medium text-white">Import…</div>
                )}
                {!printMode && !photoUploading && (
                  <>
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Changer la photo"
                    >
                      <Camera className="h-6 w-6 text-white" />
                    </button>
                    <button
                      onClick={handleRemovePhoto}
                      className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Supprimer la photo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={photoUploading}
                className="flex h-24 w-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors disabled:opacity-60"
              >
                <Camera className="h-7 w-7 mb-1" />
                <span className="text-[10px] font-medium">{photoUploading ? 'Import…' : 'Ajouter une photo'}</span>
              </button>
            )}
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{vehicle.numero_immatriculation}</h1>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statutColors[vehicle.statut]}`}>
                {vehicle.statut}
              </span>
            </div>
            <p className="text-slate-500">{vehicle.marque} {vehicle.type_commercial} — {vehicle.couleur}</p>
            {!printMode && !vehicle.photo_url && (
              <button
                onClick={() => photoInputRef.current?.click()}
                className="mt-1.5 inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline"
              >
                <Upload className="h-3 w-3" />
                Téléverser une photo
              </button>
            )}
          </div>
        </div>

          <div className="flex gap-8">
            <div className="text-right">
              <p className="text-xs text-slate-500">Kilométrage</p>
              <p className="text-xl font-bold text-slate-800">{vehicle.kilometrage.toLocaleString()} km</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Dépenses totales</p>
              <p className="text-xl font-bold text-orange-600">{formatMoney(totalExpenses + totalMaintenance)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Proch. entretien</p>
              <p className={`text-xl font-bold ${
                maintenanceForecast.alertLevel === 'critical'
                  ? 'text-red-600'
                  : maintenanceForecast.alertLevel === 'warning'
                    ? 'text-amber-600'
                    : 'text-slate-800'
              }`}>
                {maintenanceForecast.hasHistory
                  ? `${maintenanceForecast.nextMaintenanceKm.toLocaleString('fr-FR')} km`
                  : 'À renseigner'}
              </p>
              <p className="text-[11px] text-slate-500">
                {maintenanceForecast.estimatedNextDate ? formatDate(maintenanceForecast.estimatedNextDate) : 'Date estimée indisponible'}
              </p>
            </div>
          </div>
      </div>

      {/* ── Grille info ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Carte Grise Recto */}
        <Card title={<><FileText className="h-4 w-4" /> Carte Grise (Recto)</>}>
          <Row icon={<Hash className="h-4 w-4" />}    label="N° Carte Grise"     value={vehicle.numero_carte_grise || '—'} />
          <Row icon={<Hash className="h-4 w-4" />}    label="Code parc entreprise" value={vehicle.code_parc_entreprise || '—'} />
          <Row icon={<Info className="h-4 w-4" />}     label="Propriétaire"       value={vehicle.nom_proprietaire || '—'} />
          <Row icon={<Info className="h-4 w-4" />}     label="RDC"                value={vehicle.rdc || '—'} />
          <Row icon={<Car className="h-4 w-4" />}      label="Marque"             value={vehicle.marque || '—'} />
          <Row icon={<Car className="h-4 w-4" />}      label="Type commercial"    value={vehicle.type_commercial || '—'} />
          <Row icon={<Info className="h-4 w-4" />}     label="Couleur"            value={vehicle.couleur || '—'} />
          <Row icon={<Info className="h-4 w-4" />}     label="Carrosserie"        value={vehicle.carrosserie || '—'} />
          <Row icon={<Info className="h-4 w-4" />}     label="Genre"              value={vehicle.genre || '—'} />
          <Row icon={<Info className="h-4 w-4" />}     label="Usage"              value={vehicle.usage_vehicule || '—'} />
          <Row icon={<Fuel className="h-4 w-4" />}     label="Énergie"            value={vehicle.energie || '—'} />
          <Row icon={<Calendar className="h-4 w-4" />} label="Date d'édition"     value={formatDate(vehicle.date_edition)} />
          <Row icon={<Info className="h-4 w-4" />}     label="Places assises"     value={vehicle.places_assises?.toString() || '—'} />
          <Row icon={<Info className="h-4 w-4" />}     label="Nbr essieux"        value={vehicle.nombre_essieux?.toString() || '—'} />
          <Row icon={<Gauge className="h-4 w-4" />}    label="Cylindrée"          value={vehicle.cylindree_cc ? vehicle.cylindree_cc + ' CC' : '—'} />
          <Row icon={<Gauge className="h-4 w-4" />}    label="Puissance fiscale"  value={vehicle.puissance_fiscale_cv ? vehicle.puissance_fiscale_cv + ' CV' : '—'} />
          <Row icon={<Info className="h-4 w-4" />}     label="PTAC"               value={vehicle.ptac_kg ? vehicle.ptac_kg + ' Kg' : '—'} />
        </Card>

        {/* Carte Grise Verso + Gestion */}
        <div className="space-y-4">
          <Card title={<><FileText className="h-4 w-4" /> Carte Grise (Verso)</>}>
            <Row icon={<Hash className="h-4 w-4" />} label="N° VIN/Chassis"         value={vehicle.vin_chassis || '—'} />
            <Row icon={<Hash className="h-4 w-4" />} label="N° Moteur"              value={vehicle.numero_moteur || '—'} />
            <Row icon={<Info className="h-4 w-4" />} label="Type technique"          value={vehicle.type_technique || '—'} />
            <Row icon={<Info className="h-4 w-4" />} label="N° immat. précédent"    value={vehicle.numero_immatriculation_precedent || '—'} />
            <Row icon={<Info className="h-4 w-4" />} label="Société de crédit"       value={vehicle.societe_credit || '—'} />
          </Card>

          <Card title={<><DollarSign className="h-4 w-4" /> Gestion du Parc</>}>
            <Row icon={<Calendar className="h-4 w-4" />} label="Date d'achat"        value={formatDate(vehicle.date_achat)} />
            <Row icon={<DollarSign className="h-4 w-4" />} label="Coût d'achat"      value={vehicle.cout_achat ? formatMoney(vehicle.cout_achat) : '—'} />
            <Row icon={<DollarSign className="h-4 w-4" />} label="Frais livraison"   value={vehicle.frais_livraison ? formatMoney(vehicle.frais_livraison) : '—'} />
            <Row icon={<DollarSign className="h-4 w-4" />} label="Frais douane"      value={vehicle.frais_douane ? formatMoney(vehicle.frais_douane) : '—'} />
            <Row icon={<DollarSign className="h-4 w-4" />} label="Frais installation" value={vehicle.frais_installation ? formatMoney(vehicle.frais_installation) : '—'} />
            <Row icon={<DollarSign className="h-4 w-4" />} label="Coûts indirects"   value={vehicle.couts_indirects ? formatMoney(vehicle.couts_indirects) : '—'} />
            <Row icon={<DollarSign className="h-4 w-4" />} label="Valeur résiduelle" value={vehicle.valeur_residuelle ? formatMoney(vehicle.valeur_residuelle) : '—'} />
            <EcheanceRow label="Assurance (échéance)"  date={vehicle.date_assurance} days={daysToAssurance} />
            <Row icon={<Shield className="h-4 w-4" />} label="Coût assurance annuel" value={vehicle.cout_assurance_annuel ? formatMoney(vehicle.cout_assurance_annuel) : '—'} />
            <EcheanceRow label="Vignette (échéance)"   date={vehicle.date_vignette}  days={daysToVignette} />
            <EcheanceRow label="Carte de transport"    date={vehicle.validite_carte_transport || ''} days={daysUntil(vehicle.validite_carte_transport || '')} />
            <EcheanceRow label="Patente"               date={vehicle.validite_patente || ''} days={daysUntil(vehicle.validite_patente || '')} />
            <EcheanceRow label="Carte de stationnement" date={vehicle.validite_carte_stationnement || ''} days={daysUntil(vehicle.validite_carte_stationnement || '')} />
            <Row icon={<Receipt className="h-4 w-4" />} label="Dépenses enregistrées" value={formatMoney(totalExpenses)} />
            <Row icon={<Wrench className="h-4 w-4" />}  label="Coûts maintenance"    value={formatMoney(totalMaintenance)} />
            <Row icon={<User className="h-4 w-4" />}    label="Conducteur"           value={vehicle.conducteur || '—'} />
            <Row icon={<MapPin className="h-4 w-4" />}  label="Affectation"          value={vehicle.affectation || '—'} />
            <Row icon={<MapPin className="h-4 w-4" />}  label="Zone d'affectation"   value={vehicle.zone_affectation || '—'} />
            <Row icon={<MapPin className="h-4 w-4" />}  label="Zone de travail"      value={vehicle.zone_travail || '—'} />
            <Row icon={<Car className="h-4 w-4" />}     label="Catégorie de parc"    value={vehicle.categorie_parc || '—'} />
            {vehicle.observations && (
              <Row icon={<AlertCircle className="h-4 w-4" />} label="Observations" value={vehicle.observations} />
            )}
          </Card>
        </div>

        {/* Documents administratifs */}
        <div className="lg:col-span-3">
          <Card title={<><FileText className="h-4 w-4" /> Documents administratifs</>}>
            {printMode ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {DOCUMENT_FIELDS.map(({ key, label }) => (
                  <div key={key} className="text-center">
                    {vehicle[key] ? (
                      <img src={vehicle[key] as string} alt={label} className="mx-auto h-20 w-full rounded-lg border border-slate-200 object-cover" />
                    ) : (
                      <div className="mx-auto flex h-20 w-full items-center justify-center rounded-lg border border-dashed border-slate-200 text-[10px] text-slate-400">Non fourni</div>
                    )}
                    <p className="mt-1 text-[10px] text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {DOCUMENT_FIELDS.map(({ key, label }) => {
                  const url = vehicle[key] as string | undefined;
                  const uploading = docUploading === key;
                  return (
                    <div key={key} className="text-center">
                      {url ? (
                        <div className="group relative">
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt={label} className="mx-auto h-20 w-full rounded-lg border border-slate-200 object-cover" />
                          </a>
                          <button
                            onClick={() => handleRemoveDocument(key, label)}
                            className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            title={`Supprimer « ${label} »`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="mx-auto flex h-20 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                          {uploading ? <span className="text-[10px]">Import…</span> : <><Upload className="h-4 w-4 mb-0.5" /><span className="text-[9px]">Importer</span></>}
                          <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => handleDocumentChange(key as string, key, e)} />
                        </label>
                      )}
                      <p className="mt-1 text-[10px] font-medium text-slate-500">{label}</p>
                      {url && (
                        <label className="mt-0.5 inline-block cursor-pointer text-[9px] text-emerald-600 hover:underline">
                          {uploading ? 'Import…' : 'Remplacer'}
                          <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => handleDocumentChange(key as string, key, e)} />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Maintenance + Dépenses */}
        <div className="space-y-4">
          <Card title={<><Wrench className="h-4 w-4" /> Historique Maintenance</>}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                {vehicleMaintenance.length} intervention(s) — {formatMoney(totalMaintenance)}
              </span>
              {!printMode && (
                <button onClick={() => setShowMaintForm(!showMaintForm)} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                  + Ajouter
                </button>
              )}
            </div>

            {showMaintForm && (
              <form onSubmit={handleAddMaintenance} className="mb-4 space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <input type="date" required value={maintForm.date} onChange={(e) => setMaintForm((p) => ({ ...p, date: e.target.value }))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
                <input type="text" required placeholder="Type d'intervention" value={maintForm.type} onChange={(e) => setMaintForm((p) => ({ ...p, type: e.target.value }))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
                <input type="text" placeholder="Description" value={maintForm.description} onChange={(e) => setMaintForm((p) => ({ ...p, description: e.target.value }))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" required placeholder="Coût (FCFA)" value={maintForm.cout} onChange={(e) => setMaintForm((p) => ({ ...p, cout: e.target.value }))} className="rounded border border-slate-300 px-2 py-1.5 text-sm" />
                  <input type="number" placeholder="Kilométrage" value={maintForm.kilometrage} onChange={(e) => setMaintForm((p) => ({ ...p, kilometrage: e.target.value }))} className="rounded border border-slate-300 px-2 py-1.5 text-sm" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 rounded bg-emerald-600 py-1.5 text-xs font-semibold text-white">Enregistrer</button>
                  <button type="button" onClick={() => setShowMaintForm(false)} className="flex-1 rounded border border-slate-300 py-1.5 text-xs text-slate-500">Annuler</button>
                </div>
              </form>
            )}

            {vehicleMaintenance.length > 0 ? (
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {vehicleMaintenance.map((m) => (
                  <div key={m.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{m.type}</p>
                        <p className="text-xs text-slate-500">{formatDate(m.date)}{m.kilometrage ? ` — ${m.kilometrage.toLocaleString()} km` : ''}</p>
                        {m.description && <p className="mt-0.5 text-xs text-slate-400">{m.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-700">{formatMoney(m.cout)}</p>
                        {!printMode && (
                          <DeleteGuardButton
                            module="entretiens"
                            recordId={m.id}
                            label={`l'entretien « ${m.type} » du ${formatDate(m.date)}`}
                            onDelete={() => deleteMaintenanceRecord(m.id)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            ×
                          </DeleteGuardButton>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-slate-400">Aucun enregistrement</p>
            )}
          </Card>

          <Card title={<><Receipt className="h-4 w-4" /> Dépenses du Véhicule</>}>
            <p className="mb-3 text-sm text-slate-500">{vehicleExpenses.length} dépense(s) — {formatMoney(totalExpenses)}</p>
            {vehicleExpenses.length > 0 ? (
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {vehicleExpenses.slice(0, 8).map((exp) => (
                  <div key={exp.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{exp.libelle}</p>
                        <p className="text-xs text-slate-500">{formatDate(exp.date)} — {exp.categorie}</p>
                        {exp.categorie === 'Entretien' && exp.kilometrage_entretien ? (
                          <p className="mt-0.5 text-xs text-amber-700">
                            Entretien saisi à {exp.kilometrage_entretien.toLocaleString('fr-FR')} km
                            {exp.date_entretien ? ` le ${formatDate(exp.date_entretien)}` : ''}
                          </p>
                        ) : null}
                        {exp.fournisseur && <p className="mt-0.5 text-xs text-slate-400">{exp.fournisseur}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={`whitespace-nowrap text-sm font-bold ${exp.montant < 0 ? 'text-emerald-600' : 'text-slate-700'}`}>{formatMoney(exp.montant)}</p>
                        {!printMode && (
                          <DeleteGuardButton
                            module="depenses"
                            recordId={exp.id}
                            label={`la dépense « ${exp.libelle} » du ${formatDate(exp.date)}`}
                            onDelete={() => deleteExpenseRecord(exp.id)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            ×
                          </DeleteGuardButton>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-slate-400">Aucune dépense enregistrée</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
