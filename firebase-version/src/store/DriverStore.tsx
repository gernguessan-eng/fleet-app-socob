import React, { createContext, useContext, useCallback } from 'react';
import type { Driver, Mission, PlanningEvent } from '../types';
import { useFirestoreCollection } from '../firestoreSync';

const SK_DRIVERS = 'parc_auto_drivers';
const SK_MISSIONS = 'parc_auto_missions';
const SK_PLANNING = 'parc_auto_planning';

// Note : la lecture directe de localStorage n'est plus utilisée pour les collections
// (elles sont désormais synchronisées avec Firestore via useFirestoreCollection).

const sampleDrivers: Driver[] = [];

const sampleMissions: Mission[] = [];

const samplePlanning: PlanningEvent[] = [];

interface DriverContextType {
  drivers: Driver[];
  missions: Mission[];
  planning: PlanningEvent[];
  addDriver: (d: Driver) => void;
  importDrivers: (drivers: Driver[]) => void;
  updateDriver: (id: string, u: Partial<Driver>) => void;
  deleteDriver: (id: string) => void;
  addMission: (m: Mission) => void;
  updateMission: (id: string, u: Partial<Mission>) => void;
  deleteMission: (id: string) => void;
  addPlanningEvent: (e: PlanningEvent) => void;
  updatePlanningEvent: (id: string, u: Partial<PlanningEvent>) => void;
  deletePlanningEvent: (id: string) => void;
}

const DriverContext = createContext<DriverContextType | undefined>(undefined);

function getLinkedPlanningIdFromMissionId(missionId: string) {
  return missionId.startsWith('mi-pl-') ? missionId.slice('mi-pl-'.length) : `pl-mi-${missionId}`;
}

function getLinkedMissionIdFromPlanningId(planningId: string) {
  return planningId.startsWith('pl-mi-') ? planningId.slice('pl-mi-'.length) : `mi-pl-${planningId}`;
}

function buildPlanningFromMission(mission: Mission, planningId: string): PlanningEvent {
  return {
    id: planningId,
    driverId: mission.driverId,
    vehicleId: mission.vehicleId,
    titre: mission.titre,
    type: 'Mission',
    date_debut: mission.date_debut,
    date_fin: mission.date_fin,
    couleur: '#10b981',
    notes: mission.observations || mission.description || '',
  };
}

function buildMissionFromPlanning(event: PlanningEvent, missionId: string): Mission {
  return {
    id: missionId,
    driverId: event.driverId,
    vehicleId: event.vehicleId,
    titre: event.titre,
    description: event.notes || 'Mission créée automatiquement depuis la planification',
    lieu_depart: '',
    lieu_arrivee: '',
    date_debut: event.date_debut,
    date_fin: event.date_fin,
    heure_depart: '',
    heure_retour: '',
    km_depart: 0,
    km_retour: 0,
    statut: 'Planifiée',
    cout_mission: 0,
    observations: event.notes || 'Alimentée automatiquement depuis le sous-onglet Planification',
  };
}

export function DriverProvider({ children }: { children: React.ReactNode }) {
  const [drivers, setDrivers] = useFirestoreCollection<Driver>(SK_DRIVERS, sampleDrivers);
  const [missions, setMissions] = useFirestoreCollection<Mission>(SK_MISSIONS, sampleMissions);
  const [planning, setPlanning] = useFirestoreCollection<PlanningEvent>(SK_PLANNING, samplePlanning);

  const addDriver = useCallback((d: Driver) => setDrivers(p => [...p, d]), []);
  const importDrivers = useCallback((newDrivers: Driver[]) => {
    setDrivers((prev) => {
      const existingKeys = new Set(prev.map((d) => d.numero_permis || `${d.nom}|${d.prenom}|${d.telephone}`));
      const toAdd = newDrivers.filter((d) => !existingKeys.has(d.numero_permis || `${d.nom}|${d.prenom}|${d.telephone}`));
      return [...prev, ...toAdd];
    });
  }, []);
  const updateDriver = useCallback((id: string, u: Partial<Driver>) => setDrivers(p => p.map(d => d.id === id ? { ...d, ...u } : d)), []);
  const deleteDriver = useCallback((id: string) => {
    setDrivers(p => p.filter(d => d.id !== id));
    setMissions(p => p.filter(m => m.driverId !== id));
    setPlanning(p => p.filter(e => e.driverId !== id));
  }, []);

  const addMission = useCallback((mission: Mission) => {
    setMissions(prev => {
      if (prev.some(m => m.id === mission.id)) return prev;
      return [...prev, mission];
    });
    const planningId = getLinkedPlanningIdFromMissionId(mission.id);
    const planningEvent = buildPlanningFromMission(mission, planningId);
    setPlanning(prev => {
      const exists = prev.some(e => e.id === planningId);
      return exists ? prev.map(e => e.id === planningId ? planningEvent : e) : [...prev, planningEvent];
    });
  }, []);

  const updateMission = useCallback((id: string, u: Partial<Mission>) => {
    setMissions(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, ...u } : m);
      const mission = updated.find(m => m.id === id);
      if (mission) {
        const planningId = getLinkedPlanningIdFromMissionId(id);
        const planningEvent = buildPlanningFromMission(mission, planningId);
        setPlanning(prevPlanning => {
          const exists = prevPlanning.some(e => e.id === planningId);
          return exists ? prevPlanning.map(e => e.id === planningId ? planningEvent : e) : [...prevPlanning, planningEvent];
        });
      }
      return updated;
    });
  }, []);

  const deleteMission = useCallback((id: string) => {
    setMissions(prev => prev.filter(m => m.id !== id));
    const planningId = getLinkedPlanningIdFromMissionId(id);
    setPlanning(prev => prev.filter(e => e.id !== planningId));
  }, []);

  const addPlanningEvent = useCallback((event: PlanningEvent) => {
    setPlanning(prev => {
      if (prev.some(e => e.id === event.id)) return prev;
      return [...prev, event];
    });

    if (event.type === 'Mission') {
      const missionId = getLinkedMissionIdFromPlanningId(event.id);
      const mission = buildMissionFromPlanning(event, missionId);
      setMissions(prev => {
        const exists = prev.some(m => m.id === missionId);
        return exists ? prev.map(m => m.id === missionId ? mission : m) : [...prev, mission];
      });
    }
  }, []);

  const updatePlanningEvent = useCallback((id: string, u: Partial<PlanningEvent>) => {
    setPlanning(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, ...u } : e);
      const event = updated.find(e => e.id === id);
      if (event) {
        const missionId = getLinkedMissionIdFromPlanningId(id);
        if (event.type === 'Mission') {
          const mission = buildMissionFromPlanning(event, missionId);
          setMissions(prevMissions => {
            const exists = prevMissions.some(m => m.id === missionId);
            return exists ? prevMissions.map(m => m.id === missionId ? { ...m, ...mission } : m) : [...prevMissions, mission];
          });
        } else {
          setMissions(prevMissions => prevMissions.filter(m => m.id !== missionId));
        }
      }
      return updated;
    });
  }, []);

  const deletePlanningEvent = useCallback((id: string) => {
    setPlanning(prev => prev.filter(e => e.id !== id));
    const missionId = getLinkedMissionIdFromPlanningId(id);
    setMissions(prev => prev.filter(m => m.id !== missionId));
  }, []);

  return React.createElement(DriverContext.Provider, {
    value: {
      drivers,
      missions,
      planning,
      addDriver,
      importDrivers,
      updateDriver,
      deleteDriver,
      addMission,
      updateMission,
      deleteMission,
      addPlanningEvent,
      updatePlanningEvent,
      deletePlanningEvent,
    },
  }, children);
}

export function useDrivers() {
  const ctx = useContext(DriverContext);
  if (!ctx) throw new Error('useDrivers must be used within DriverProvider');
  return ctx;
}
