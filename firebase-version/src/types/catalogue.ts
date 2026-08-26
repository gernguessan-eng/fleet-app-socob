// ── Catalogue des pièces de rechange (suivi des prix) ──

export type PriceHistoryEntry = {
  id: string;
  date: string;
  valeur: number;
  fournisseur: string;
};

export type CataloguePiece = {
  id: string;
  nom_piece: string;
  reference: string;
  observations: string;
  // Historique trié chronologiquement croissant (le plus ancien en premier).
  // "Valeur d'achat" = avant-dernière entrée, "Valeur d'achat actuelle" = dernière entrée.
  historique: PriceHistoryEntry[];
};

export const CATALOGUE_STORAGE_KEY = 'parc_auto_catalogue_pieces';

// ── Comparatif de prix fournisseurs ──
// Table libre : les colonnes (fournisseurs comparés) sont communes à toutes les lignes,
// extensibles via un "+". Valider une offre pour une ligne l'ajoute à l'historique de
// prix de la pièce correspondante dans l'onglet "Catalogue" (valeur d'achat actuelle +
// fournisseur actuel).
export type ComparatifRecord = {
  id: string;
  pieceId: string; // référence CataloguePiece.id
  nom_piece: string; // dénormalisé pour un affichage/tri simple, garde une pièce libre possible
  offres: Record<string, number | null>; // clé = nom de la colonne fournisseur
  offreValidee: string; // nom du fournisseur retenu (colonne), vide si aucune validation
  date_comparatif: string;
};

export const COMPARATIF_STORAGE_KEY = 'parc_auto_catalogue_comparatif';
export const COMPARATIF_COLONNES_STORAGE_KEY = 'parc_auto_catalogue_comparatif_colonnes';

export const SAMPLE_COMPARATIF_COLONNES: string[] = [];

export const SAMPLE_COMPARATIF: ComparatifRecord[] = [];

export const SAMPLE_CATALOGUE: CataloguePiece[] = [];
