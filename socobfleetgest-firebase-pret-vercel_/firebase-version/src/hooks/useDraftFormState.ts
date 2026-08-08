import { useEffect, useState } from 'react';

/**
 * Comme `useState`, mais pour un formulaire de CRÉATION : la saisie en cours est
 * automatiquement sauvegardée dans localStorage pendant la frappe, sous `key`. Si
 * l'utilisateur change de page (ou ferme puis rouvre le formulaire) avant d'avoir cliqué sur
 * "Enregistrer", la saisie n'est pas perdue — elle est restaurée à la prochaine ouverture.
 *
 * `isDraftMode` doit être `false` en mode MODIFICATION d'une fiche existante : dans ce cas,
 * le hook se comporte comme un simple `useState` (pas de sauvegarde/restauration), pour
 * éviter qu'un brouillon laissé sur une fiche ne s'affiche par erreur sur une autre fiche.
 * L'appelant doit appeler `clearDraft()` après un enregistrement réussi (ou une annulation
 * volontaire), sinon le brouillon réapparaîtrait au prochain formulaire vierge.
 */
export function useDraftFormState<T>(
  key: string,
  initial: T,
  isDraftMode: boolean
): [T, (v: T | ((prev: T) => T)) => void, () => void] {
  const [value, setValue] = useState<T>(() => {
    if (!isDraftMode) return initial;
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    if (!isDraftMode) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota dépassé ou navigation privée : on ignore, la saisie reste au moins en mémoire */
    }
  }, [key, value, isDraftMode]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  };

  return [value, setValue, clearDraft];
}
