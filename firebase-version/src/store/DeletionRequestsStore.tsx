import React, { createContext, useContext } from 'react';
import { useFirestoreCollection } from '../firestoreSync';
import type { DeletionRequest, DeletionModule } from '../types/deletionRequests';
import { DELETION_REQUESTS_STORAGE_KEY } from '../types/deletionRequests';

interface DeletionRequestsContextType {
  deletionRequests: DeletionRequest[];
  requestDeletion: (req: { module: DeletionModule; recordId: string; recordLabel: string; requestedBy: string }) => void;
  approveDeletion: (id: string, reviewedBy: string) => DeletionRequest | undefined;
  rejectDeletion: (id: string, reviewedBy: string) => void;
  cancelOwnRequest: (id: string) => void;
}

const DeletionRequestsContext = createContext<DeletionRequestsContextType | undefined>(undefined);

export function DeletionRequestsProvider({ children }: { children: React.ReactNode }) {
  const [deletionRequests, setDeletionRequests] = useFirestoreCollection<DeletionRequest>(DELETION_REQUESTS_STORAGE_KEY, []);

  const requestDeletion: DeletionRequestsContextType['requestDeletion'] = (req) => {
    setDeletionRequests(prev => [
      ...prev,
      { id: 'delreq' + Date.now(), ...req, status: 'pending', requestedAt: new Date().toISOString() },
    ]);
  };

  // N'effectue PAS la suppression réelle ici : se contente de marquer la demande comme
  // "approuvée". C'est à l'appelant (page de revue admin) d'effectuer la suppression dans
  // le module concerné, puis d'appeler cette fonction pour clore la demande — voir
  // DeletionRequestsReview.tsx.
  const approveDeletion: DeletionRequestsContextType['approveDeletion'] = (id, reviewedBy) => {
    const req = deletionRequests.find(r => r.id === id);
    setDeletionRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approuvee', reviewedBy, reviewedAt: new Date().toISOString() } : r));
    return req;
  };

  const rejectDeletion: DeletionRequestsContextType['rejectDeletion'] = (id, reviewedBy) => {
    setDeletionRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejetee', reviewedBy, reviewedAt: new Date().toISOString() } : r));
  };

  // Permet à l'auteur d'une demande de l'annuler lui-même (ex: erreur de manipulation)
  // avant qu'un administrateur ne l'ait traitée.
  const cancelOwnRequest: DeletionRequestsContextType['cancelOwnRequest'] = (id) => {
    setDeletionRequests(prev => prev.filter(r => r.id !== id));
  };

  return (
    <DeletionRequestsContext.Provider value={{ deletionRequests, requestDeletion, approveDeletion, rejectDeletion, cancelOwnRequest }}>
      {children}
    </DeletionRequestsContext.Provider>
  );
}

export function useDeletionRequests() {
  const ctx = useContext(DeletionRequestsContext);
  if (!ctx) throw new Error('useDeletionRequests must be used within DeletionRequestsProvider');
  return ctx;
}
