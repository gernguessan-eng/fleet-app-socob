"use client";

import { useRouter } from "next/navigation";
import { formatDateTime, formatNumber, formatCurrency } from "@/lib/format";

type Row = {
  id: number;
  quantite: number;
  dateMouvement: Date | string;
  fournisseurId: number | null;
  fournisseurNom: string | null;
  numeroBon: string | null;
  prixUnitaire: string | number;
  reference: string | null;
  observations: string | null;
  articleId: number;
  codeArticle: string | null;
  refArticle: string | null;
  designation: string | null;
};

export function EntreesTable({ rows }: { rows: Row[] }) {
  const router = useRouter();

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette entrée ? Le stock sera mis à jour.")) return;
    const res = await fetch(`/api/mouvements/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
        Aucune entrée enregistrée
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
            <th className="px-3 py-3 font-medium">Fournisseur</th>
            <th className="px-3 py-3 font-medium">N° Bon</th>
            <th className="px-3 py-3 font-medium text-right">Qté</th>
            <th className="px-3 py-3 font-medium text-right">P.U.</th>
            <th className="px-3 py-3 font-medium text-right">Total</th>
            <th className="px-3 py-3 font-medium">Réf.</th>
            <th className="px-3 py-3 font-medium">Observations</th>
            <th className="px-3 py-3 font-medium text-right"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const total = Number(r.quantite) * Number(r.prixUnitaire);
            return (
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
                  {r.fournisseurNom ? (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                      🏭 {r.fournisseurNom}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  {r.numeroBon ? (
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[11px] text-emerald-700">
                      {r.numeroBon}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">
                  +{formatNumber(r.quantite)}
                </td>
                <td className="px-3 py-2.5 text-right text-slate-700">
                  {Number(r.prixUnitaire) > 0 ? formatCurrency(r.prixUnitaire) : "—"}
                </td>
                <td className="px-3 py-2.5 text-right font-medium text-slate-900">
                  {total > 0 ? formatCurrency(total) : "—"}
                </td>
                <td className="px-3 py-2.5 text-[11px] text-slate-600 font-mono">
                  {r.reference ?? "—"}
                </td>
                <td className="px-3 py-2.5 text-[11px] text-slate-500 max-w-[200px]">
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
