"use client";

import { useRouter } from "next/navigation";
import { formatDateTime, formatNumber } from "@/lib/format";

type Row = {
  id: number;
  quantite: number;
  dateMouvement: Date | string;
  motif: "VENTE" | "PRODUCTION" | "REBUT" | "PERTE" | "RETOUR_CLIENT" | "TRANSFERT" | "SORTIE_ATELIER" | "AUTRE" | null;
  destination: string | null;
  vehicule: string | null;
  reference: string | null;
  observations: string | null;
  articleId: number;
  codeArticle: string | null;
  refArticle: string | null;
  designation: string | null;
  stockActuel: number | null;
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

const MOTIF_TONES: Record<string, string> = {
  VENTE: "bg-blue-100 text-blue-700",
  PRODUCTION: "bg-violet-100 text-violet-700",
  REBUT: "bg-amber-100 text-amber-700",
  PERTE: "bg-rose-100 text-rose-700",
  RETOUR_CLIENT: "bg-cyan-100 text-cyan-700",
  TRANSFERT: "bg-slate-100 text-slate-700",
  SORTIE_ATELIER: "bg-orange-100 text-orange-700",
  AUTRE: "bg-slate-100 text-slate-700",
};

export function SortiesTable({ rows }: { rows: Row[] }) {
  const router = useRouter();

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette sortie ? Le stock sera mis à jour.")) return;
    const res = await fetch(`/api/mouvements/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
        Aucune sortie enregistrée
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-3 py-3 font-medium">Date</th>
            <th className="px-3 py-3 font-medium">Article</th>
            <th className="px-3 py-3 font-medium">Motif *</th>
            <th className="px-3 py-3 font-medium text-right">Qté</th>
            <th className="px-3 py-3 font-medium">Destination</th>
            <th className="px-3 py-3 font-medium">Véhicule</th>
            <th className="px-3 py-3 font-medium">Réf.</th>
            <th className="px-3 py-3 font-medium">Observations</th>
            <th className="px-3 py-3 font-medium text-right"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap">
                {formatDateTime(r.dateMouvement)}
              </td>
              <td className="px-3 py-2.5">
                <div className="font-mono text-[11px] font-medium text-slate-900">
                  {r.codeArticle}
                </div>
                <div className="text-slate-700">{r.designation}</div>
              </td>
              <td className="px-3 py-2.5">
                {r.motif ? (
                  <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${MOTIF_TONES[r.motif]}`}>
                    {MOTIF_LABELS[r.motif]}
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-right font-semibold text-rose-700">
                -{formatNumber(r.quantite)}
              </td>
              <td className="px-3 py-2.5 text-slate-700">
                {r.destination ?? <span className="text-slate-400">—</span>}
              </td>
              <td className="px-3 py-2.5 text-slate-700">
                {r.vehicule ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700">
                    🚗 {r.vehicule}
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-[11px] text-slate-600 font-mono">
                {r.reference ?? "—"}
              </td>
              <td className="px-3 py-2.5 text-[11px] text-slate-500 max-w-[220px]">
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
