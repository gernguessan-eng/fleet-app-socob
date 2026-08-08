import { useState } from 'react';
import { Trash2, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAuth } from '../store/AuthContext';
import { useDeletionRequests } from '../store/DeletionRequestsStore';
import type { DeletionModule } from '../types/deletionRequests';

interface Props {
  module: DeletionModule;
  recordId: string;
  /** Description lisible de ce qui va être supprimé, ex: "le véhicule AA-123-BC" */
  label: string;
  /** Suppression réelle — appelée immédiatement seulement si l'utilisateur est Administrateur */
  onDelete: () => void;
  className?: string;
  title?: string;
  size?: 'sm' | 'md';
  /** Contenu personnalisé du bouton déclencheur (ex: "Supprimer" en toutes lettres). Par défaut : icône poubelle seule. */
  children?: ReactNode;
}

export default function DeleteGuardButton({ module, recordId, label, onDelete, className, title, size = 'sm', children }: Props) {
  const { profile, isSuperAdmin } = useAuth();
  const { deletionRequests, requestDeletion } = useDeletionRequests();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  const isAdmin = isSuperAdmin;
  const alreadyRequested = deletionRequests.some(r => r.module === module && r.recordId === recordId && r.status === 'pending');
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  const handleConfirm = () => {
    if (isAdmin) {
      onDelete();
      setOpen(false);
      return;
    }
    requestDeletion({ module, recordId, recordLabel: label, requestedBy: profile?.displayName || profile?.email || 'Utilisateur' });
    setSent(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        disabled={alreadyRequested}
        title={alreadyRequested ? 'Suppression déjà demandée — en attente de validation administrateur' : (title || 'Supprimer')}
        className={className || 'p-1 text-slate-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-slate-400'}
      >
        {children || <Trash2 className={iconSize} />}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 print:hidden" onClick={(e) => e.stopPropagation()}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            {!sent ? (
              <>
                <div className="mb-3 flex items-center gap-2">
                  {isAdmin ? <AlertTriangle className="h-5 w-5 text-red-500" /> : <ShieldAlert className="h-5 w-5 text-amber-500" />}
                  <h3 className="text-sm font-bold text-slate-800">{isAdmin ? 'Confirmer la suppression' : 'Validation administrateur requise'}</h3>
                </div>
                <p className="text-sm text-slate-600">
                  {isAdmin ? (
                    <>Voulez-vous vraiment supprimer <strong>{label}</strong> ? Cette action est irréversible.</>
                  ) : (
                    <>Vous n'êtes pas administrateur. Une demande de suppression pour <strong>{label}</strong> sera envoyée à l'administrateur — la donnée ne sera réellement supprimée qu'après validation.</>
                  )}
                </p>
                <div className="mt-5 flex justify-end gap-3">
                  <button onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
                  <button onClick={handleConfirm} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${isAdmin ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
                    {isAdmin ? 'Supprimer' : 'Envoyer la demande'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-3 flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <h3 className="text-sm font-bold">Demande envoyée</h3>
                </div>
                <p className="text-sm text-slate-600">Votre demande de suppression a été transmise à l'administrateur. La donnée reste visible jusqu'à validation.</p>
                <div className="mt-5 flex justify-end">
                  <button onClick={() => { setOpen(false); setSent(false); }} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">OK</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
