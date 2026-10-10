import { useState } from 'react';

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
      <select
        value={selectValue}
        onChange={(e) => {
          if (e.target.value === '__autre__') { setOtherMode(true); onChange(''); }
          else { setOtherMode(false); onChange(e.target.value); }
        }}
        className={inputCls}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
        <option value="__autre__">Autre…</option>
      </select>
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
