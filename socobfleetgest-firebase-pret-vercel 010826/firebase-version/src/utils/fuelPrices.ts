// Prix de référence carburant (FCFA / litre), utilisés dans toute l'application pour les
// calculs théoriques de consommation et de coût (FuelManagement, GeolocTrajets...).
// Modifier ces valeurs ici les répercute automatiquement partout où elles sont utilisées.
export const FUEL_PRICES: Record<string, number> = {
  Essence: 875,
  Diesel: 700,
};

const DEFAULT_FUEL_PRICE = FUEL_PRICES.Diesel;

/** Retourne le prix au litre (FCFA) correspondant au type d'énergie d'un véhicule. */
export function getFuelPrice(energie?: string): number {
  if (!energie) return DEFAULT_FUEL_PRICE;
  return FUEL_PRICES[energie] ?? DEFAULT_FUEL_PRICE;
}
