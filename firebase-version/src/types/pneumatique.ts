// ── Gestion des Pneumatiques ──

export type PneumatiqueRecord = {
  id: string;
  vehicleId: string;
  position: 'AVG' | 'AVD' | 'ARG' | 'ARD' | 'Secours';
  marque: string;
  modele: string;
  dimension: string;
  date_montage: string;
  km_montage: number;
  km_actuel?: number;
  usure_mm?: number; // profondeur de sculpture restante
  cout_unitaire: number;
  main_oeuvre: number;
  etat: 'Bon' | 'Usure modérée' | 'À remplacer' | 'Remplacé';
  fournisseur: string;
  observations: string;
};

export type SeuilAlertePneu = {
  usureMinimale_mm: number;
  kmMaxParJeu: number;
  coutBudgetMensuel: number;
};

export const PNEU_DIMENSIONS: string[] = [
  '175/65 R15', '185/65 R15', '195/65 R15', '205/55 R16',
  '215/55 R17', '225/45 R17', '235/55 R18', '245/45 R18',
  '255/55 R19', '265/60 R18', '165/70 R13', '175/70 R13',
];

export const PNEU_MARQUES: string[] = [
  'Michelin', 'Bridgestone', 'Goodyear', 'Continental',
  'Pirelli', 'Dunlop', 'Hankook', 'Yokohama',
  'BF Goodrich', 'Nokian', 'Firestone', 'Autre',
];

// Échantillon de données
export const SAMPLE_PNEUS: PneumatiqueRecord[] = [];
