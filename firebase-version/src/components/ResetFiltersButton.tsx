/** Bouton « Réinitialiser » commun à tous les menus : efface l'ensemble des filtres de l'écran.
 *  Même apparence que celui du menu Véhicules ; à n'afficher que lorsqu'un filtre est actif. */
export default function ResetFiltersButton({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Effacer tous les filtres"
      className={`rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 print:hidden ${className}`}
    >
      Réinitialiser
    </button>
  );
}
