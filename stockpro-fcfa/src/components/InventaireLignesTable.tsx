"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Ligne = {
  id: number;
  articleId: number;
  codeArticle: string | null;
  reference: string | null;
  designation: string | null;
  unite: string | null;
  emplacement: string | null;
  stockTheorique: number;
  stockCompte: number | null;
  ecart: number | null;
  observations: string | null;
};

export function InventaireLignesTable({
  inventaireId,
  lignes,
  valide,
}: {
  inventaireId: number;
  lignes: Ligne[];
  valide: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Ligne[]>(lignes);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [validating, setValidating] = useState(false);

  const compteCount = rows.filter((r) => r.stockCompte !== null).length;

  const saveLigne = async (
    ligneId: number,
    patch: { stockCompte?: string; observations?: string },
  ) => {
    setSavingId(ligneId);
    try {
      const res = await fetch(
        `/api/inventaires/${inventaireId}/lignes/${ligneId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        },
      );
      const data = await res.json();
      if (data.ok) {
        setRows((prev) =>
          prev.map((r) =>
            r.id === ligneId
              ? { ...r, stockCompte: data.ligne.stockCompte, ecart: data.ligne.ecart, observations: data.ligne.observations }
              : r,
          ),
        );
        setSavedId(ligneId);
        setTimeout(() => setSavedId((cur) => (cur === ligneId ? null : cur)), 1500);
      } else {
        alert("Erreur : " + (data.error || "inconnue"));
      }
    } finally {
      setSavingId(null);
    }
  };

  const onValider = async () => {
    if (
      !confirm(
        `Valider cette campagne ? Le stock réel des articles comptés (${compteCount}) sera mis à jour et un mouvement d'ajustement sera enregistré pour chaque écart. Cette action est définitive.`,
      )
    )
      return;
    setValidating(true);
    try {
      const res = await fetch(`/api/inventaires/${inventaireId}/valider`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.ok) {
        alert(`Campagne validée : ${data.ajustements} ajustement(s) de stock appliqué(s).`);
        router.refresh();
      } else {
        alert("Erreur : " + (data.error || "inconnue"));
      }
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
        <div className="text-xs text-slate-600">
          <span className="font-semibold text-slate-900">{compteCount}</span> / {rows.length}{" "}
          article(s) comptés
        </div>
        {!valide ? (
          <button
            onClick={onValider}
            disabled={validating || compteCount === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {validating ? "Validation..." : "✓ Valider l'inventaire et ajuster le stock"}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            ✓ Campagne validée — stock ajusté
          </span>
        )}
      </div>

      <div className="no-print overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-3 font-medium">Code</th>
              <th className="px-3 py-3 font-medium">Désignation</th>
              <th className="px-3 py-3 font-medium text-center">Unité</th>
              <th className="px-3 py-3 font-medium text-right">Théorique</th>
              <th className="px-3 py-3 font-medium text-center">Stock compté (saisie)</th>
              <th className="px-3 py-3 font-medium text-right">Écart</th>
              <th className="px-3 py-3 font-medium">Observations</th>
              <th className="px-3 py-3 font-medium text-center w-8"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-3 py-2 font-mono text-[11px] font-medium text-slate-900">
                  {l.codeArticle}
                </td>
                <td className="px-3 py-2 text-slate-800">{l.designation}</td>
                <td className="px-3 py-2 text-center text-slate-500">{l.unite}</td>
                <td className="px-3 py-2 text-right text-slate-600">{l.stockTheorique}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    disabled={valide}
                    defaultValue={l.stockCompte ?? ""}
                    placeholder="—"
                    onBlur={(e) => saveLigne(l.id, { stockCompte: e.target.value })}
                    className="mx-auto block w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </td>
                <td className="px-3 py-2 text-right font-semibold">
                  {l.ecart === null ? (
                    <span className="text-slate-400">—</span>
                  ) : l.ecart === 0 ? (
                    <span className="text-slate-500">0</span>
                  ) : l.ecart > 0 ? (
                    <span className="text-emerald-600">+{l.ecart}</span>
                  ) : (
                    <span className="text-rose-600">{l.ecart}</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    disabled={valide}
                    defaultValue={l.observations ?? ""}
                    placeholder="Observation..."
                    onBlur={(e) => saveLigne(l.id, { observations: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </td>
                <td className="px-3 py-2 text-center text-[11px]">
                  {savingId === l.id && <span className="text-slate-400">…</span>}
                  {savedId === l.id && <span className="text-emerald-600">✓</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
