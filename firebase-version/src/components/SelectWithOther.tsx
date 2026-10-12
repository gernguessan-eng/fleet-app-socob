import { useState } from 'react';
import SearchableSelect from './SearchableSelect';

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Options proposées (sans « Autre », ajouté automatiquement) */
  options: string[];
  /** Libellé de la première option vide (si absent, pas d'option vide) */
  placeholder?: string;
  otherPlaceholder?: string;
  /** Rend la saisie obligatoire quand « Autre… » est choisi (évite d'enregistrer une valeur vide) */
  required?: boolean;
}

const inputCls = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

/**
 * Liste déroulante avec une option « Autre » : quand elle est choisie, une case de saisie
 * apparaît pour préciser la valeur. Une valeur hors liste (déjà saisie) rouvre « Autre ».
 */
export default function SelectWithOther({ value, onChange, options, placeholder, otherPlaceholder, required }: Props) {
  const isKnown = value === '' || options.includes(value);
  const [otherMode, setOtherMode] = useState(!isKnown || value === 'Autre');
  const selectValue = otherMode ? '__autre__' : value;

  return (
    <>
      <SearchableSelect
        value={selectValue}
        onChange={(v) => {
          if (v === '__autre__') { setOtherMode(true); onChange(''); }
          else { setOtherMode(false); onChange(v); }
        }}
        emptyLabel={placeholder}
        options={[...options.map((o) => ({ value: o, label: o })), { value: '__autre__', label: 'Autre…' }]}
        className={inputCls}
      />
      {otherMode && (
        <input
          value={value === 'Autre' ? '' : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={otherPlaceholder || 'Préciser…'}
          required={required}
          className={inputCls}
        />
      )}
    </>
  );
}
