"use client";

import { useRouter } from "next/navigation";
import { formatDate, formatCurrency, formatNumber } from "@/lib/format";

type Data = {
  id: number;
  nom: string;
  contact: string | null;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  totalEntrees: number;
  quantiteTotale: number;
  valeurTotale: number;
  dernierAchat: string | null;
};

export function FournisseursTable({ data }: { data: Data[] }) {
  const router = useRouter();
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
        Aucun fournisseur enregistré
      </div>
    );
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce fournisseur ?")) return;
    const res = await fetch(`/api/fournisseurs/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Fournisseur</th>
            <th className="px-4 py-3 font-medium">Contact</th>
            <th className="px-4 py-3 font-medium text-right">Commandes</th>
            <th className="px-4 py-3 font-medium text-right">Qté totale</th>
            <th className="px-4 py-3 font-medium text-right">CA achats</th>
            <th className="px-4 py-3 font-medium">Dernier achat</th>
            <th className="px-4 py-3 font-medium text-right"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((f) => (
            <tr key={f.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{f.nom}</div>
                <div className="text-[11px] text-slate-500">{f.email ?? "—"}</div>
              </td>
              <td className="px-4 py-3 text-slate-700">
                <div>{f.contact ?? "—"}</div>
                <div className="text-[11px] text-slate-500">{f.telephone ?? ""}</div>
              </td>
              <td className="px-4 py-3 text-right font-medium">{formatNumber(f.totalEntrees)}</td>
              <td className="px-4 py-3 text-right text-slate-700">{formatNumber(f.quantiteTotale)}</td>
              <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(f.valeurTotale)}</td>
              <td className="px-4 py-3 text-slate-600 text-xs">
                {f.dernierAchat ? formatDate(f.dernierAchat) : <span className="text-slate-400">Aucun</span>}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => handleDelete(f.id)}
                  className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
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
