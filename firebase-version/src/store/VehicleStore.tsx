import React, { createContext, useContext, useEffect, useCallback } from 'react';
import type { Vehicle, MaintenanceRecord, ExpenseRecord, DashboardStats, Contact } from '../types';
import { IMMOBILISATIONS_STORAGE_KEY, SAMPLE_IMMOBILISATIONS, type ImmobilisationRecord } from '../types/immobilisations';
import { SINISTRES_STORAGE_KEY, SAMPLE_SINISTRES, type SinistreRecord } from '../types/sinistres';
import { SAMPLE_PNEUS, type PneumatiqueRecord } from '../types/pneumatique';
import { DEFAULT_APP_SETTINGS, type AppSettings } from '../types/settings';
import { useFirestoreCollection } from '../firestoreSync';
import { maintenanceExpenseId, maintenanceToExpense } from '../utils/maintenance';

const STORAGE_KEY_VEHICLES = 'parc_auto_vehicles';
const STORAGE_KEY_MAINTENANCE = 'parc_auto_maintenance';
const STORAGE_KEY_EXPENSES = 'parc_auto_expenses';
const STORAGE_KEY_CONTACTS = 'parc_auto_contacts';

// Note : la lecture directe de localStorage n'est plus utilisée pour les collections
// (elles sont désormais synchronisées avec Firestore via useFirestoreCollection).

/**
 * ── Cohérence inter-modules ──
 * Un véhicule doit apparaître comme "En maintenance" (immobilisé) dès qu'il a :
 *  - une immobilisation (Suivi des immobilisations) dont le statut n'est PAS "Terminé", OU
 *  - un sinistre (Gestion des sinistres) actuellement "En réparation"
 *    (les autres statuts de sinistre — Déclaré, Expertise, Indemnisé — n'immobilisent
 *    pas nécessairement le véhicule sur le terrain).
 * On ne rétrograde JAMAIS automatiquement un statut "Hors service" ou "Réformé" : ce sont
 * des décisions manuelles plus lourdes que la synchro ne doit pas écraser. On ne repasse
 * un véhicule en "Actif" que s'il avait été placé en "En maintenance" et qu'il n'a plus
 * aucun dossier actif.
 */
function computeSyncedStatut(
  current: Vehicle['statut'],
  hasActiveImmobilisation: boolean,
  hasActiveSinistre: boolean
): Vehicle['statut'] {
  const shouldBeImmobilized = hasActiveImmobilisation || hasActiveSinistre;
  if (shouldBeImmobilized && current === 'Actif') return 'En maintenance';
  if (!shouldBeImmobilized && current === 'En maintenance') return 'Actif';
  return current;
}

function syncVehiclesWithImmobilisationsAndSinistres(
  vehicleList: Vehicle[],
  immobilisations: ImmobilisationRecord[],
  sinistres: SinistreRecord[]
): Vehicle[] {
  return vehicleList.map((v) => {
    const hasActiveImmobilisation = immobilisations.some((r) => r.vehicleId === v.id && r.statut !== 'Terminé');
    const hasActiveSinistre = sinistres.some((s) => s.vehicleId === v.id && s.statut === 'En réparation');
    const nextStatut = computeSyncedStatut(v.statut, hasActiveImmobilisation, hasActiveSinistre);
    return nextStatut === v.statut ? v : { ...v, statut: nextStatut };
  });
}

const sampleVehicles: Vehicle[] = [];

const sampleExpenses: ExpenseRecord[] = [];

const sampleContacts: Contact[] = [];

interface VehicleContextType {
  vehicles: Vehicle[];
  maintenanceRecords: MaintenanceRecord[];
  expenseRecords: ExpenseRecord[];
  contacts: Contact[];
  immobilisations: ImmobilisationRecord[];
  sinistres: SinistreRecord[];
  pneus: PneumatiqueRecord[];
  setPneus: (updater: PneumatiqueRecord[] | ((prev: PneumatiqueRecord[]) => PneumatiqueRecord[])) => void;
  appSettings: AppSettings;
  updateAppSettings: (updates: Partial<AppSettings>) => void;
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (id: string, vehicle: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  deleteMultipleVehicles: (ids: string[]) => void;
  addMaintenanceRecord: (record: MaintenanceRecord) => void;
  deleteMaintenanceRecord: (id: string) => void;
  addExpenseRecord: (record: ExpenseRecord) => void;
  updateExpenseRecord: (id: string, record: Partial<ExpenseRecord>) => void;
  deleteExpenseRecord: (id: string) => void;
  importExpenseRecords: (records: ExpenseRecord[]) => void;
  getDashboardStats: () => DashboardStats;
  importVehicles: (vehicles: Vehicle[]) => void;
  getVehicleById: (id: string) => Vehicle | undefined;
  addContact: (contact: Contact) => void;
  updateContact: (id: string, contact: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  addImmobilisation: (record: ImmobilisationRecord) => void;
  updateImmobilisation: (id: string, record: Partial<ImmobilisationRecord>) => void;
  deleteImmobilisation: (id: string) => void;
  addSinistre: (record: SinistreRecord) => void;
  updateSinistre: (id: string, record: Partial<SinistreRecord>) => void;
  deleteSinistre: (id: string) => void;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export function VehicleProvider({ children }: { children: React.ReactNode }) {
  const [immobilisations, setImmobilisations] = useFirestoreCollection<ImmobilisationRecord>(
    IMMOBILISATIONS_STORAGE_KEY, SAMPLE_IMMOBILISATIONS
  );
  const [sinistres, setSinistres] = useFirestoreCollection<SinistreRecord>(
    SINISTRES_STORAGE_KEY, SAMPLE_SINISTRES
  );
  const [vehicles, setVehicles] = useFirestoreCollection<Vehicle>(
    STORAGE_KEY_VEHICLES, sampleVehicles
  );
  const [maintenanceRecords, setMaintenanceRecords] = useFirestoreCollection<MaintenanceRecord>(
    STORAGE_KEY_MAINTENANCE, []
  );
  const [expenseRecords, setExpenseRecords] = useFirestoreCollection<ExpenseRecord>(
    STORAGE_KEY_EXPENSES, sampleExpenses
  );
  const [contacts, setContacts] = useFirestoreCollection<Contact>(
    STORAGE_KEY_CONTACTS, sampleContacts
  );
  const [pneus, setPneus] = useFirestoreCollection<PneumatiqueRecord>(
    'parc_auto_pneus', SAMPLE_PNEUS
  );

  // ── Paramètres généraux de l'application (un seul document partagé "general") ──
  const [appSettingsList, setAppSettingsList] = useFirestoreCollection<AppSettings>('appSettings', [DEFAULT_APP_SETTINGS]);
  const appSettings = appSettingsList[0] ?? DEFAULT_APP_SETTINGS;
  const updateAppSettings = useCallback((updates: Partial<AppSettings>) => {
    setAppSettingsList((prev) => [{ ...(prev[0] ?? DEFAULT_APP_SETTINGS), ...updates }]);
  }, [setAppSettingsList]);

  // ── Cohérence en temps réel ──
  // Dès qu'une immobilisation ou un sinistre change (ajout, modification,
  // suppression — depuis n'importe quel écran), on recalcule automatiquement
  // le statut des véhicules concernés. Plus besoin d'appel manuel : le menu
  // Véhicules et le Tableau de bord se mettent à jour tout seuls.
  useEffect(() => {
    setVehicles((prev) => syncVehiclesWithImmobilisationsAndSinistres(prev, immobilisations, sinistres));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immobilisations, sinistres]);

  // ── Réconciliation rétroactive ──
  // Les interventions de maintenance créées AVANT la mise en place de la fusion
  // Historique Maintenance ↔ Dépenses n'ont pas encore de dépense miroir. On les
  // rattrape automatiquement ici, une seule fois par changement, sans action requise
  // de l'utilisateur — ça corrige immédiatement les totaux jusque-là incohérents.
  useEffect(() => {
    const missing = maintenanceRecords.filter(
      (m) => m.cout > 0 && !expenseRecords.some((e) => e.id === maintenanceExpenseId(m.id))
    );
    if (missing.length > 0) {
      setExpenseRecords((prev) => [...prev, ...missing.map(maintenanceToExpense)]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maintenanceRecords, expenseRecords]);

  const addVehicle = useCallback((vehicle: Vehicle) => {
    setVehicles((prev) => [...prev, vehicle]);
  }, []);

  const updateVehicle = useCallback((id: string, updates: Partial<Vehicle>) => {
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
  }, []);

  const deleteVehicle = useCallback((id: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    setMaintenanceRecords((prev) => prev.filter((m) => m.vehicleId !== id));
    setExpenseRecords((prev) => prev.filter((expense) => expense.vehicleId !== id));
  }, []);

  const deleteMultipleVehicles = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setVehicles((prev) => prev.filter((v) => !idSet.has(v.id)));
    setMaintenanceRecords((prev) => prev.filter((m) => !idSet.has(m.vehicleId)));
    setExpenseRecords((prev) => prev.filter((expense) => !idSet.has(expense.vehicleId)));
  }, []);

  const addMaintenanceRecord = useCallback((record: MaintenanceRecord) => {
    setMaintenanceRecords((prev) => [...prev, record]);
    // Fusion : toute intervention avec un coût devient aussi une dépense (catégorie
    // "Entretien"), pour que Dépenses / Tableau de bord / fiches véhicule restent cohérents.
    if (record.cout > 0) {
      setExpenseRecords((prev) => [...prev, maintenanceToExpense(record)]);
    }
  }, []);

  const deleteMaintenanceRecord = useCallback((id: string) => {
    setMaintenanceRecords((prev) => prev.filter((m) => m.id !== id));
    setExpenseRecords((prev) => prev.filter((e) => e.id !== maintenanceExpenseId(id)));
  }, []);

  const addExpenseRecord = useCallback((record: ExpenseRecord) => {
    setExpenseRecords((prev) => [...prev, record]);
  }, []);

  const updateExpenseRecord = useCallback((id: string, updates: Partial<ExpenseRecord>) => {
    setExpenseRecords((prev) => prev.map((expense) => (expense.id === id ? { ...expense, ...updates } : expense)));
  }, []);

  const deleteExpenseRecord = useCallback((id: string) => {
    setExpenseRecords((prev) => prev.filter((expense) => expense.id !== id));
  }, []);

  const importExpenseRecords = useCallback((records: ExpenseRecord[]) => {
    setExpenseRecords((prev) => [...prev, ...records]);
  }, []);

  const importVehicles = useCallback((newVehicles: Vehicle[]) => {
    setVehicles((prev) => {
      const existingIds = new Set(prev.map((v) => v.numero_immatriculation));
      const toAdd = newVehicles.filter((v) => !existingIds.has(v.numero_immatriculation));
      return [...prev, ...toAdd];
    });
  }, []);

  const getVehicleById = useCallback(
    (id: string) => vehicles.find((v) => v.id === id),
    [vehicles]
  );

  const addContact = useCallback((contact: Contact) => {
    setContacts((prev) => [...prev, contact]);
  }, []);

  const updateContact = useCallback((id: string, updates: Partial<Contact>) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const deleteContact = useCallback((id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addImmobilisation = useCallback((record: ImmobilisationRecord) => {
    setImmobilisations((prev) => [...prev, record]);
  }, []);

  const updateImmobilisation = useCallback((id: string, updates: Partial<ImmobilisationRecord>) => {
    setImmobilisations((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }, []);

  const deleteImmobilisation = useCallback((id: string) => {
    setImmobilisations((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const addSinistre = useCallback((record: SinistreRecord) => {
    setSinistres((prev) => [...prev, record]);
  }, []);

  const updateSinistre = useCallback((id: string, updates: Partial<SinistreRecord>) => {
    setSinistres((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }, []);

  const deleteSinistre = useCallback((id: string) => {
    setSinistres((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const getDashboardStats = useCallback((): DashboardStats => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const activeVehicles = vehicles.filter((v) => v.statut === 'Actif');
    const maintenanceVehicles = vehicles.filter((v) => v.statut === 'En maintenance');
    const outOfServiceVehicles = vehicles.filter((v) => v.statut === 'Hors service');
    const reformedVehicles = vehicles.filter((v) => v.statut === 'Réformé');

    const totalKilometers = vehicles.reduce((sum, v) => sum + v.kilometrage, 0);
    const avgKilometers = vehicles.length > 0 ? totalKilometers / vehicles.length : 0;
    const totalAcquisitionCost = vehicles.reduce((sum, v) => sum + v.cout_achat + (v.frais_livraison || 0) + (v.frais_douane || 0) + (v.frais_installation || 0), 0);
    const totalInsuranceCost = vehicles.reduce((sum, v) => sum + v.cout_assurance_annuel, 0);
    const totalExpenseCost = expenseRecords.reduce((sum, expense) => sum + expense.montant, 0);
    const totalIndirectCosts = vehicles.reduce((sum, v) => sum + (v.couts_indirects || 0), 0);
    const totalResidualValue = vehicles.reduce((sum, v) => sum + (v.valeur_residuelle || 0), 0);
    // totalExpenseCost inclut déjà les coûts de maintenance (fusion Historique Maintenance
    // ↔ Dépenses, voir utils/maintenance.ts) : ne pas rajouter maintenanceRecords.cout ici,
    // ça compterait ces coûts deux fois.
    const totalOperatingCost = totalInsuranceCost + totalExpenseCost;
    const avgExpensePerVehicle = vehicles.length > 0 ? totalExpenseCost / vehicles.length : 0;
    
    // TCO = Coûts d'acquisition + Coûts d'exploitation + Coûts indirects - Valeur résiduelle
    const tcoGlobal = totalAcquisitionCost + totalOperatingCost + totalIndirectCosts - totalResidualValue;
    const tcoPerVehicle = vehicles.length > 0 ? tcoGlobal / vehicles.length : 0;

    const upcomingInsurance = vehicles.filter((v) => {
      if (!v.date_assurance) return false;
      const d = new Date(v.date_assurance);
      return d <= thirtyDaysFromNow;
    }).length;

    const upcomingVignette = vehicles.filter((v) => {
      if (!v.date_vignette) return false;
      const d = new Date(v.date_vignette);
      return d <= thirtyDaysFromNow;
    }).length;

    const upcomingCarteTransport = vehicles.filter((v) => {
      if (!v.validite_carte_transport) return false;
      const d = new Date(v.validite_carte_transport);
      return d <= thirtyDaysFromNow;
    }).length;

    const upcomingPatente = vehicles.filter((v) => {
      if (!v.validite_patente) return false;
      const d = new Date(v.validite_patente);
      return d <= thirtyDaysFromNow;
    }).length;

    const upcomingCarteStationnement = vehicles.filter((v) => {
      if (!v.validite_carte_stationnement) return false;
      const d = new Date(v.validite_carte_stationnement);
      return d <= thirtyDaysFromNow;
    }).length;

    const energyMap = new Map<string, number>();
    vehicles.forEach((v) => {
      energyMap.set(v.energie, (energyMap.get(v.energie) || 0) + 1);
    });
    const energyDistribution = Array.from(energyMap.entries()).map(([name, value]) => ({ name, value }));

    const brandMap = new Map<string, number>();
    vehicles.forEach((v) => {
      brandMap.set(v.marque, (brandMap.get(v.marque) || 0) + 1);
    });
    const brandDistribution = Array.from(brandMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const expenseMonthMap = new Map<string, number>();
    expenseRecords.forEach((expense) => {
      const d = new Date(expense.date);
      const key = d.toLocaleString('fr-FR', { month: 'short', year: 'numeric' });
      expenseMonthMap.set(key, (expenseMonthMap.get(key) || 0) + expense.montant);
    });
    const monthlyExpenses = Array.from(expenseMonthMap.entries())
      .map(([month, cost]) => ({ month, cost }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6);

    const expenseCategoryMap = new Map<string, number>();
    expenseRecords.forEach((expense) => {
      expenseCategoryMap.set(expense.categorie, (expenseCategoryMap.get(expense.categorie) || 0) + expense.montant);
    });
    const expenseCategoryDistribution = Array.from(expenseCategoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const ageMap = new Map<string, number>();
    vehicles.forEach((v) => {
      if (!v.date_mise_circulation) return;
      const age = new Date().getFullYear() - new Date(v.date_mise_circulation).getFullYear();
      const bucket = age <= 1 ? '0-1 ans' : age <= 3 ? '1-3 ans' : age <= 5 ? '3-5 ans' : '5+ ans';
      ageMap.set(bucket, (ageMap.get(bucket) || 0) + 1);
    });
    const vehicleAgeDistribution = Array.from(ageMap.entries()).map(([name, value]) => ({ name, value }));

    const categoryMap = new Map<string, number>();
    vehicles.forEach((v) => {
      const cat = v.categorie_parc || 'Autre';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    });
    const fleetCategoryDistribution = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

    return {
      totalVehicles: vehicles.length,
      activeVehicles: activeVehicles.length,
      maintenanceVehicles: maintenanceVehicles.length,
      outOfServiceVehicles: outOfServiceVehicles.length,
      reformedVehicles: reformedVehicles.length,
      totalKilometers,
      avgKilometers: Math.round(avgKilometers),
      totalAcquisitionCost,
      totalInsuranceCost,
      totalExpenseCost,
      totalOperatingCost,
      avgExpensePerVehicle: Math.round(avgExpensePerVehicle),
      tcoGlobal: Math.round(tcoGlobal),
      tcoPerVehicle: Math.round(tcoPerVehicle),
      upcomingInsurance,
      upcomingVignette,
      upcomingCarteTransport,
      upcomingPatente,
      upcomingCarteStationnement,
      energyDistribution,
      brandDistribution,
      monthlyExpenses,
      expenseCategoryDistribution,
      vehicleAgeDistribution,
      fleetCategoryDistribution,
    };
  }, [vehicles, maintenanceRecords, expenseRecords]);

  return React.createElement(VehicleContext.Provider, {
    value: {
      vehicles,
      maintenanceRecords,
      expenseRecords,
      contacts,
      immobilisations,
      sinistres,
      pneus,
      setPneus,
      appSettings,
      updateAppSettings,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      deleteMultipleVehicles,
      addMaintenanceRecord,
      deleteMaintenanceRecord,
      addExpenseRecord,
      updateExpenseRecord,
      deleteExpenseRecord,
      importExpenseRecords,
      getDashboardStats,
      importVehicles,
      getVehicleById,
      addContact,
      updateContact,
      deleteContact,
      addImmobilisation,
      updateImmobilisation,
      deleteImmobilisation,
      addSinistre,
      updateSinistre,
      deleteSinistre,
    },
  }, children);
}

export function useVehicles() {
  const context = useContext(VehicleContext);
  if (!context) throw new Error('useVehicles must be used within VehicleProvider');
  return context;
}
