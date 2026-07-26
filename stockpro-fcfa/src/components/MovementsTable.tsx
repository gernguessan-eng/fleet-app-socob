"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime, formatNumber, formatCurrency } from "@/lib/format";

type Row = {
  id: number;
  type: "ENTREE" | "SORTIE" | "INVENTAIRE";
  articleId: number;
  codeArticle: string | null;
  reference: string | null;
  designation: string | null;
  quantite: number;
  dateMouvement: Date | string;
  fournisseurId: number | null;
  fournisseurNom: string | null;
  numeroBon: string | null;
  prixUnitaire: string | number;
  motif: "VENTE" | "PRODUCTION" | "REBUT" | "PERTE" | "RETOUR_CLIENT" | "TRANSFERT" | "SORTIE_ATELIER" | "AUTRE" | null;
  destination: string | null;
  vehicule: string | null;
  ref: string | null;
  observations: string | null;
};

const MOTIF_LABELS: Record<string, string> = {
  VENTE: "Vente",
  PRODUCTION: "Production",
  REBUT: "Rebut",
  PERTE: "Perte",
  RETOUR_CLIENT: "Retour client",
  TRANSFERT: "Transfert",
  SORTIE_ATELIER: "Sortie atelier",
  AUTRE: "Autre",
};

export function MovementsTable({ rows }: { rows: Row[] }) {
  const router = useRouter();

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce mouvement ? Le stock sera recalculé.")) return;
    const res = await fetch(`/api/mouvements/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
        Aucun mouvement trouvé
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-3 py-3 font-medium">Date</th>
            <th className="px-3 py-3 font-medium">Type</th>
            <th className="px-3 py-3 font-medium">Code</th>
            <th className="px-3 py-3 font-medium">Référence</th>
            <th className="px-3 py-3 font-medium">Désignation</th>
            <th className="px-3 py-3 font-medium text-right">Qté</th>
            <th className="px-3 py-3 font-medium">Fournisseur / Motif</th>
            <th className="px-3 py-3 font-medium">N° Bon / Destination</th>
            <th className="px-3 py-3 font-medium text-right">P.U.</th>
            <th className="px-3 py-3 font-medium">Observations</th>
            <th className="px-3 py-3 font-medium text-right"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isEntree = r.type === "ENTREE";
            const isSortie = r.type === "SORTIE";
            const isInventaire = r.type === "INVENTAIRE";
            const qty = Number(r.quantite);
            const badgeClass = isEntree
              ? "bg-emerald-100 text-emerald-700"
              : isSortie
              ? "bg-rose-100 text-rose-700"
              : "bg-blue-100 text-blue-700";
            const badgeLabel = isEntree ? "⬇ ENTRÉE" : isSortie ? "⬆ SORTIE" : "🧮 INVENTAIRE";
            const qtyClass = isEntree || (isInventaire && qty >= 0)
              ? "text-emerald-700"
              : "text-rose-700";
            const qtyPrefix = isInventaire ? (qty >= 0 ? "+" : "") : isEntree ? "+" : "-";
            const qtyDisplay = isInventaire
              ? `${qtyPrefix}${formatNumber(qty)}`
              : `${qtyPrefix}${formatNumber(Math.abs(qty))}`;
            return (
              <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">
                  {formatDateTime(r.dateMouvement)}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${badgeClass}`}
                  >
                    {badgeLabel}
                  </span>
                </td>
                <td className="px-3 py-2.5 font-mono text-[11px] font-medium text-slate-900">
                  {r.codeArticle}
                </td>
                <td className="px-3 py-2.5 text-slate-700">{r.reference}</td>
                <td className="px-3 py-2.5 font-medium text-slate-900">
                  {r.designation}
                </td>
                <td className={`px-3 py-2.5 text-right font-semibold ${qtyClass}`}>
                  {qtyDisplay}
                </td>
                <td className="px-3 py-2.5">
                  {isEntree ? (
                    r.fournisseurNom ? (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                        🏭 {r.fournisseurNom}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )
                  ) : isSortie && r.motif ? (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {MOTIF_LABELS[r.motif] ?? r.motif}
                    </span>
                  ) : isInventaire ? (
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                      Ajustement
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-[11px] text-slate-600">
                  {isEntree ? (
                    r.numeroBon ? (
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-emerald-700">
                        {r.numeroBon}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )
                  ) : isSortie ? (
                    <span>
                      {r.destination ?? "—"}
                      {r.vehicule && (
                        <div className="mt-0.5 text-[10px] text-orange-700">🚗 {r.vehicule}</div>
                      )}
                      {r.ref && (
                        <div className="mt-0.5 font-mono text-[10px] text-slate-500">{r.ref}</div>
                      )}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right text-slate-700">
                  {isEntree && Number(r.prixUnitaire) > 0
                    ? formatCurrency(r.prixUnitaire)
                    : "—"}
                </td>
                <td className="px-3 py-2.5 text-[11px] text-slate-500 max-w-[180px]">
                  <div className="line-clamp-2">{r.observations ?? "—"}</div>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Supprimer"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
