"use client";

export function PrintButton({ label = "🖨 Imprimer la fiche d'inventaire" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
    >
      {label}
    </button>
  );
}
