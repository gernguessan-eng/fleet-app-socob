import SortDateButton from './SortDateButton';

export type SortDirection = 'asc' | 'desc';

/** Variante du bouton de tri par date attendue par le module Sinistres (props direction/onToggle). */
export default function SortToggleButton({ direction, onToggle }: { direction: SortDirection; onToggle: () => void }) {
  return <SortDateButton order={direction} onToggle={onToggle} />;
}
