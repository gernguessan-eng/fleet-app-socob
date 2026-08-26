// ── Gestion des Sinistres ──

export type SinistreType =
  | 'Collision'
  | 'Renversement'
  | 'Vol'
  | 'Bris de glace'
  | 'Incendie'
  | 'Inondation'
  | 'Vandalisme'
  | 'Autre';

export type SinistreStatut = 'Déclaré' | 'Expertise' | 'En réparation' | 'Indemnisé' | 'Clôturé';

export const SINISTRES_STORAGE_KEY = 'parc_auto_sinistres';

export type SinistreRecord = {
  id: string;
  vehicleId: string;
  date_sinistre: string;
  lieu: string;
  type: SinistreType;
  description: string;
  cout_estime: number;
  cout_final?: number;
  assureur: string;
  numero_dossier: string;
  statut: SinistreStatut;
  responsable: string;
  temoins: string;
  photos_jointes?: string;
  observations: string;
};

export const SINISTRE_TYPES: SinistreType[] = [
  'Collision', 'Renversement', 'Vol', 'Bris de glace',
  'Incendie', 'Inondation', 'Vandalisme', 'Autre',
];

export const SINISTRE_STATUTS: SinistreStatut[] = [
  'Déclaré', 'Expertise', 'En réparation', 'Indemnisé', 'Clôturé',
];

// Échantillon
export const SAMPLE_SINISTRES: SinistreRecord[] = [];
