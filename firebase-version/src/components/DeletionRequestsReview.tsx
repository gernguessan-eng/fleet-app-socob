import { useMemo } from 'react';
import { useVehicles } from '../store/VehicleStore';
import { useDrivers } from '../store/DriverStore';
import { useCatalogue } from '../store/CatalogueStore';
import { useAuth } from '../store/AuthContext';
import { useDeletionRequests } from '../store/DeletionRequestsStore';
import { MODULE_LABELS } from '../types/deletionRequests';
import type { DeletionRequest } from '../types/deletionRequests';
import { ShieldCheck, Check, X, Clock, User, ShieldAlert, History } from 'lucide-react';

function fmtDateTime(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function DeletionRequestsReview() {
  const { profile, isSuperAdmin } = useAuth();
  const { deletionRequests, approveDeletion, rejectDeletion } = useDeletionRequests();
  const { deleteVehicle, deleteMaintenanceRecord, deleteExpenseRecord, deleteContact, deleteImmobilisation, deleteSinistre, setPneus } = useVehicles();
  const { deleteDriver, deleteMission, deletePlanningEvent } = useDrivers();
  const { deletePiece, deleteComparatifRow } = useCatalogue();

  const pending = useMemo(
    () => deletionRequests.filter(r => r.status === 'pending').sort((a, b) => a.requestedAt.localeCompare(b.requestedAt)),
    [deletionRequests]
  );
  const history = useMemo(
    () => deletionRequests.filter(r => r.status !== 'pending').sort((a, b) => (b.reviewedAt || '').localeCompare(a.reviewedAt || '')).slice(0, 40),
    [deletionRequests]
  );

  // Effectue la suppression réelle dans le module concerné. C'est la seule étape qui
  // manquait pour que la validation admin soit effective de bout en bout, quel que soit
  // le module d'origine de la demande.
  const performActualDelete = (req: DeletionRequest) => {
    switch (req.module) {
      case 'vehicules': deleteVehicle(req.recordId); break;
      case 'entretiens': deleteMaintenanceRecord(req.recordId); break;
      case 'depenses': deleteExpenseRecord(req.recordId); break;
      case 'contacts': deleteContact(req.recordId); break;
      case 'immobilisations': deleteImmobilisation(req.recordId); break;
      case 'sinistres': deleteSinistre(req.recordId); break;
      case 'pneumatiques': setPneus(prev => prev.filter(p => p.id !== req.recordId)); break;
      case 'chauffeurs': deleteDriver(req.recordId); break;
      case 'missions': deleteMission(req.recordId); break;
      case 'planning': deletePlanningEvent(req.recordId); break;
      case 'catalogue': deletePiece(req.recordId); break;
      case 'comparatif': deleteComparatifRow(req.recordId); break;
    }
  };

  const reviewerName = profile?.displayName || profile?.email || 'Administrateur';
  const handleApprove = (req: DeletionRequest) => { performActualDelete(req); approveDeletion(req.id, reviewerName); };
  const handleReject = (req: DeletionRequest) => rejectDeletion(req.id, reviewerName);

  if (!isSuperAdmin) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0" />
        <p>Cette page est réservée à un accès restreint. Contactez votre administrateur si vous pensez avoir besoin d'y accéder.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900"><ShieldCheck className="h-6 w-6 text-emerald-600" />Demandes de suppression</h2>
        <p className="mt-1 text-sm text-slate-500">Toute suppression demandée par un compte non-administrateur apparaît ici en attente de votre validation.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700"><Clock className="h-4 w-4 text-amber-500" />En attente ({pending.length})</h3>
        </div>
        {pending.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">Aucune demande en attente.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {pending.map(req => (
              <div key={req.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{req.recordLabel}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">{MODULE_LABELS[req.module]}</span>
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{req.requestedBy}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmtDateTime(req.requestedAt)}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleReject(req)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"><X className="h-3.5 w-3.5" /> Rejeter</button>
                  <button onClick={() => handleApprove(req)} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"><Check className="h-3.5 w-3.5" /> Approuver la suppression</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700"><History className="h-4 w-4 text-slate-400" />Historique des décisions</h3>
        </div>
        {history.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">Aucune décision prise pour le moment.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {history.map(req => (
              <div key={req.id} className="flex items-center justify-between gap-3 p-3 text-xs">
                <div>
                  <p className="font-medium text-slate-700">{req.recordLabel} <span className="text-slate-400">— {MODULE_LABELS[req.module]}</span></p>
                  <p className="text-slate-400">Demandé par {req.requestedBy} le {fmtDateTime(req.requestedAt)} · Traité par {req.reviewedBy} le {fmtDateTime(req.reviewedAt)}</p>
                </div>
                <span className={`flex-shrink-0 rounded-full px-2 py-0.5 font-semibold ${req.status === 'approuvee' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                  {req.status === 'approuvee' ? 'Supprimé' : 'Rejeté'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
