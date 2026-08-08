import type { ExpenseRecord, MaintenanceRecord, Vehicle } from '../types';

// ── Fusion Historique Maintenance ↔ Dépenses ──
// Toute intervention de maintenance ayant un coût devient AUSSI une dépense
// (catégorie "Entretien"), pour que les totaux du menu Dépenses, du Tableau de bord et
// des fiches véhicule restent cohérents entre eux — une seule source de vérité.
// Le lien entre les deux se fait par un identifiant déterministe (préfixe "exp-maint-"),
// donc on peut toujours retrouver/mettre à jour/supprimer la dépense miroir sans champ
// supplémentaire à stocker.
const MAINTENANCE_EXPENSE_PREFIX = 'exp-maint-';

export function maintenanceExpenseId(maintenanceId: string): string {
  return MAINTENANCE_EXPENSE_PREFIX + maintenanceId;
}

export function isMaintenanceDerivedExpense(expenseId: string): boolean {
  return expenseId.startsWith(MAINTENANCE_EXPENSE_PREFIX);
}

export function maintenanceToExpense(m: MaintenanceRecord): ExpenseRecord {
  return {
    id: maintenanceExpenseId(m.id),
    vehicleId: m.vehicleId,
    date: m.date,
    categorie: 'Entretien',
    libelle: m.description ? `${m.type} — ${m.description}` : m.type,
    montant: m.cout,
    fournisseur: '',
    mode_paiement: '',
    numero_piece: '',
    justificatif_nom: '',
    notes: 'Synchronisé automatiquement depuis Historique Maintenance.',
    date_entretien: m.date,
    kilometrage_entretien: m.kilometrage,
  };
}

export type MaintenanceForecast = {
  hasHistory: boolean;
  lastMaintenanceDate: string;
  lastMaintenanceKm: number;
  nextMaintenanceKm: number;
  remainingKm: number;
  intervalKm: number;
  estimatedNextDate: string;
  alertLevel: 'critical' | 'warning' | 'none' | 'missing';
};

function normalizeEnergy(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function isDieselVehicle(vehicle: Vehicle) {
  return normalizeEnergy(vehicle.energie).includes('diesel');
}

export function getMaintenanceExpenses(vehicleId: string, expenseRecords: ExpenseRecord[]) {
  return expenseRecords
    .filter((expense) => expense.vehicleId === vehicleId && expense.categorie === 'Entretien')
    .filter((expense) => (expense.kilometrage_entretien ?? 0) > 0)
    .sort((a, b) => {
      const kmDiff = (b.kilometrage_entretien ?? 0) - (a.kilometrage_entretien ?? 0);
      if (kmDiff !== 0) return kmDiff;
      return new Date(b.date_entretien || b.date).getTime() - new Date(a.date_entretien || a.date).getTime();
    });
}

export function getVehicleMaintenanceForecast(vehicle: Vehicle, expenseRecords: ExpenseRecord[]): MaintenanceForecast {
  const maintenanceExpenses = getMaintenanceExpenses(vehicle.id, expenseRecords);
  const lastExpense = maintenanceExpenses[0];
  const intervalKm = isDieselVehicle(vehicle) ? 7500 : 10000;

  if (!lastExpense) {
    return {
      hasHistory: false,
      lastMaintenanceDate: '',
      lastMaintenanceKm: 0,
      nextMaintenanceKm: 0,
      remainingKm: 0,
      intervalKm,
      estimatedNextDate: '',
      alertLevel: 'missing',
    };
  }

  const lastMaintenanceKm = lastExpense.kilometrage_entretien ?? 0;
  const nextMaintenanceKm = lastMaintenanceKm + intervalKm;
  const remainingKm = nextMaintenanceKm - vehicle.kilometrage;
  const referenceDate = lastExpense.date_entretien || lastExpense.date;
  let estimatedNextDate = '';

  if (referenceDate) {
    const daysElapsed = Math.max(
      0,
      Math.floor((Date.now() - new Date(referenceDate).getTime()) / (1000 * 60 * 60 * 24))
    );
    const kmDriven = vehicle.kilometrage - lastMaintenanceKm;

    if (remainingKm <= 0) {
      estimatedNextDate = new Date().toISOString().slice(0, 10);
    } else if (daysElapsed > 0 && kmDriven > 0) {
      const kmPerDay = kmDriven / daysElapsed;
      if (kmPerDay > 0) {
        const estimatedDays = Math.ceil(remainingKm / kmPerDay);
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + estimatedDays);
        estimatedNextDate = nextDate.toISOString().slice(0, 10);
      }
    }
  }

  const alertLevel = remainingKm <= 0 ? 'critical' : remainingKm <= 1000 ? 'warning' : 'none';

  return {
    hasHistory: true,
    lastMaintenanceDate: referenceDate,
    lastMaintenanceKm,
    nextMaintenanceKm,
    remainingKm,
    intervalKm,
    estimatedNextDate,
    alertLevel,
  };
}
