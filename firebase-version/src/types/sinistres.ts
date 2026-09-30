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

// Nature des dommages et responsabilité (ajoutés avec le nouveau module Sinistres)
export type NatureDommage = 'Dommage corporel' | 'Dommage matériel' | 'Autre';
export type Responsabilite = 'Engagée' | 'Non engagée' | '';

export type SinistreStatut = 'Déclaré' | 'Expertise' | 'En réparation' | 'Indemnisé' | 'Clôturé';

export const SINISTRES_STORAGE_KEY = 'parc_auto_sinistres';

export type SinistreRecord = {
  id: string;
  vehicleId: string;
  date_sinistre: string;
  lieu: string;
  // « Autre » permet de saisir un type libre : on accepte donc aussi du texte.
  type: SinistreType | (string & {});
  commune?: string;
  nature_dommage?: NatureDommage | (string & {});
  responsabilite?: Responsabilite;
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

export const NATURE_DOMMAGE_OPTIONS: NatureDommage[] = ['Dommage corporel', 'Dommage matériel', 'Autre'];

export const RESPONSABILITE_OPTIONS: Exclude<Responsabilite, ''>[] = ['Engagée', 'Non engagée'];

// Suggestions pour la case « Commune » (saisie libre possible)
export const COMMUNES_SUGGESTIONS: string[] = [
  'Abobo', 'Adjamé', 'Anyama', 'Attécoubé', 'Bingerville', 'Cocody', 'Koumassi',
  'Marcory', 'Plateau', 'Port-Bouët', 'Songon', 'Treichville', 'Yopougon',
  'Bouaké', 'Yamoussoukro', 'San-Pédro', 'Daloa', 'Korhogo', 'Man', 'Gagnoa',
  'Abengourou', 'Divo', 'Soubré', 'Grand-Bassam', 'Dabou', 'Agboville',
];

// Échantillon
export const SAMPLE_SINISTRES: SinistreRecord[] = [];
