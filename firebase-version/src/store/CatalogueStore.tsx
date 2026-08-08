import React, { createContext, useContext } from 'react';
import { useFirestoreCollection } from '../firestoreSync';
import type { CataloguePiece, ComparatifRecord } from '../types/catalogue';
import {
  CATALOGUE_STORAGE_KEY, SAMPLE_CATALOGUE,
  COMPARATIF_STORAGE_KEY, SAMPLE_COMPARATIF,
} from '../types/catalogue';

type Updater<T> = T[] | ((prev: T[]) => T[]);

interface CatalogueContextType {
  pieces: CataloguePiece[];
  setPieces: (updater: Updater<CataloguePiece>) => void;
  comparatifs: ComparatifRecord[];
  setComparatifs: (updater: Updater<ComparatifRecord>) => void;
  deletePiece: (id: string) => void;
  deleteComparatifRow: (id: string) => void;
}

const CatalogueContext = createContext<CatalogueContextType | undefined>(undefined);

export function CatalogueProvider({ children }: { children: React.ReactNode }) {
  const [pieces, setPieces] = useFirestoreCollection<CataloguePiece>(CATALOGUE_STORAGE_KEY, SAMPLE_CATALOGUE);
  const [comparatifs, setComparatifs] = useFirestoreCollection<ComparatifRecord>(COMPARATIF_STORAGE_KEY, SAMPLE_COMPARATIF);

  const deletePiece = (id: string) => setPieces(prev => prev.filter(p => p.id !== id));
  const deleteComparatifRow = (id: string) => setComparatifs(prev => prev.filter(r => r.id !== id));

  return (
    <CatalogueContext.Provider value={{ pieces, setPieces, comparatifs, setComparatifs, deletePiece, deleteComparatifRow }}>
      {children}
    </CatalogueContext.Provider>
  );
}

export function useCatalogue() {
  const ctx = useContext(CatalogueContext);
  if (!ctx) throw new Error('useCatalogue must be used within CatalogueProvider');
  return ctx;
}
