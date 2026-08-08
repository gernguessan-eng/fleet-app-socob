// ── Validation administrateur des suppressions ──
// Toute suppression de donnée, faite par un utilisateur qui n'est pas Administrateur,
// est transformée en demande en attente : la donnée n'est réellement supprimée qu'après
// approbation par un compte au rôle "Administrateur" (voir DeleteGuardButton.tsx et
// components/DeletionRequestsReview.tsx).

export type DeletionModule =
  | 'vehicules'
  | 'chauffeurs'
  | 'missions'
  | 'planning'
  | 'depenses'
  | 'entretiens'
  | 'sinistres'
  | 'immobilisations'
  | 'pneumatiques'
  | 'catalogue'
  | 'comparatif'
  | 'contacts';

export const MODULE_LABELS: Record<DeletionModule, string> = {
  vehicules: 'Véhicules',
  chauffeurs: 'Chauffeurs',
  missions: 'Missions',
  planning: 'Planning',
  depenses: 'Dépenses',
  entretiens: 'Entretiens',
  sinistres: 'Sinistres',
  immobilisations: 'Immo-garages extérieurs',
  pneumatiques: 'Pneumatiques',
  catalogue: 'Catalogue des pièces',
  comparatif: 'Comparatif des prix',
  contacts: "Carnet d'adresses",
};

export type DeletionRequestStatus = 'pending' | 'approuvee' | 'rejetee';

export type DeletionRequest = {
  id: string;
  module: DeletionModule;
  recordId: string;
  recordLabel: string;
  requestedBy: string;
  requestedAt: string;
  status: DeletionRequestStatus;
  reviewedBy?: string;
  reviewedAt?: string;
};

export const DELETION_REQUESTS_STORAGE_KEY = 'deletion_requests';
