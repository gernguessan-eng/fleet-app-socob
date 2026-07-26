"use client";

import { useRouter } from "next/navigation";
import { formatNumber, formatCurrency } from "@/lib/format";

type Data = {
  id: number;
  nom: string;
  description: string | null;
  nbArticles: number;
  stockTotal: number;
  valeur: number;
};

const COLORS = [
  "from-brand-500 to-brand-700",
  "from-emerald-500 to-emerald-700",
  "from-amber-500 to-amber-700",
  "from-rose-500 to-rose-700",
  "from-violet-500 to-violet-700",
  "from-cyan-500 to-cyan-700",
];

export function CategoriesGrid({ data }: { data: Data[] }) {
  const router = useRouter();
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
        Aucune catégorie. Créez-en une pour commencer.
      </div>
    );
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data.map((c, idx) => (
        <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className={`grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br ${COLORS[idx % COLORS.length]} text-white text-sm font-semibold`}>
              {c.nom.charAt(0)}
            </div>
            <button onClick={() => handleDelete(c.id)} className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">🗑</button>
          </div>
          <h3 className="mt-3 font-semibold text-slate-900">{c.nom}</h3>
          <p className="mt-1 text-xs text-slate-500 line-clamp-2 min-h-[2rem]">{c.description ?? "—"}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Articles</div>
              <div className="text-sm font-semibold text-slate-900">{formatNumber(c.nbArticles)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Stock</div>
              <div className="text-sm font-semibold text-slate-900">{formatNumber(c.stockTotal)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Valeur</div>
              <div className="text-sm font-semibold text-slate-900">{formatCurrency(c.valeur)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
