import type { ExpenseRecord, Vehicle } from '../types';

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
