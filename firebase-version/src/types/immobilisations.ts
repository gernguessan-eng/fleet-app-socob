// ── Suivi des Immobilisations ──

export type ImmobilisationStatut = 'En cours' | 'Terminé' | 'En attente pièces';

export type ImmobilisationRecord = {
  id: string;
  vehicleId: string;
  garage: string;
  date_entree: string;
  date_sortie_prevue: string;
  date_sortie_reelle: string;
  travaux: string;
  statut: ImmobilisationStatut;
  cout_estime: number;
  cout_final: number;
  observations: string;
};

export const IMMOBILISATIONS_STORAGE_KEY = 'parc_auto_immobilisations';

export const SAMPLE_IMMOBILISATIONS: ImmobilisationRecord[] = [];
