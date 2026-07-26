"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatNumber, formatCurrency } from "@/lib/format";

type Article = {
  id: number;
  codeArticle: string;
  reference: string;
  designation: string;
  categorieId: number | null;
  categorieNom: string | null;
  unite: string;
  stockActuel: number;
  stockMin: number;
  stockMax: number;
  prixAchat: string | number;
  prixVente: string | number;
  emplacement: string | null;
  valeurStock: number;
};

type Cat = { id: number; nom: string };

export function ArticlesTable({
  articles,
  categories,
}: {
  articles: Article[];
  categories: Cat[];
}) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("");
  const [filterStock, setFilterStock] = useState<string>("");
  const [editing, setEditing] = useState<Article | null>(null);
  const router = useRouter();

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const s = search.toLowerCase();
      const matchSearch =
        !s ||
        a.codeArticle.toLowerCase().includes(s) ||
        a.reference.toLowerCase().includes(s) ||
        a.designation.toLowerCase().includes(s);
      const matchCat = !filterCat || a.categorieId?.toString() === filterCat;
      let matchStock = true;
      if (filterStock === "low") matchStock = a.stockActuel <= a.stockMin;
      if (filterStock === "out") matchStock = a.stockActuel === 0;
      if (filterStock === "ok") matchStock = a.stockActuel > a.stockMin;
      return matchSearch && matchCat && matchStock;
    });
  }, [articles, search, filterCat, filterStock]);

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cet article ?")) return;
    const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("Impossible de supprimer (article utilisé dans des mouvements)");
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
        <input
          type="text"
          placeholder="Rechercher un article..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">Toutes catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
        <select
          value={filterStock}
          onChange={(e) => setFilterStock(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">Tous les stocks</option>
          <option value="ok">Stock OK</option>
          <option value="low">Stock bas</option>
          <option value="out">Rupture</option>
        </select>
        <div className="ml-auto text-xs text-slate-500">
          {filtered.length} résultat(s)
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Référence</th>
              <th className="px-4 py-3 font-medium">Désignation</th>
              <th className="px-4 py-3 font-medium">Catégorie</th>
              <th className="px-4 py-3 font-medium text-right">Stock</th>
              <th className="px-4 py-3 font-medium text-right">Min/Max</th>
              <th className="px-4 py-3 font-medium text-right">P. Achat</th>
              <th className="px-4 py-3 font-medium text-right">Valeur</th>
              <th className="px-4 py-3 font-medium">Emplacement</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                  Aucun article trouvé
                </td>
              </tr>
            ) : (
              filtered.map((a) => {
                const stockTone =
                  a.stockActuel === 0
                    ? "bg-rose-100 text-rose-700"
                    : a.stockActuel <= a.stockMin
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700";
                return (
                  <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-slate-900">
                      {a.codeArticle}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{a.reference}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {a.designation}
                    </td>
                    <td className="px-4 py-3">
                      {a.categorieNom ? (
                        <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                          {a.categorieNom}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${stockTone}`}>
                        {formatNumber(a.stockActuel)} {a.unite}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500">
                      {a.stockMin} / {a.stockMax}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {formatCurrency(a.prixAchat)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {formatCurrency(a.valeurStock)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {a.emplacement ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/entrees?article=${a.id}`}
                          className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
                          title="Entrée"
                        >
                          ⬇ Entrée
                        </Link>
                        <Link
                          href={`/sorties?article=${a.id}`}
                          className="rounded-md bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100"
                          title="Sortie"
                        >
                          ⬆ Sortie
                        </Link>
                        <button
                          onClick={() => setEditing(a)}
                          className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-200"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-rose-100 hover:text-rose-700"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditArticleModal
          article={editing}
          categories={categories}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function EditArticleModal({
  article,
  categories,
  onClose,
}: {
  article: Article;
  categories: Cat[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    codeArticle: article.codeArticle,
    reference: article.reference,
    designation: article.designation,
    categorieId: article.categorieId?.toString() ?? "",
    unite: article.unite,
    stockMin: article.stockMin.toString(),
    stockMax: article.stockMax.toString(),
    prixAchat: article.prixAchat.toString(),
    prixVente: article.prixVente.toString(),
    emplacement: article.emplacement ?? "",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/articles/${article.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          categorieId: form.categorieId ? parseInt(form.categorieId) : null,
          stockMin: parseInt(form.stockMin) || 0,
          stockMax: parseInt(form.stockMax) || 0,
          prixAchat: parseFloat(form.prixAchat) || 0,
          prixVente: parseFloat(form.prixVente) || 0,
        }),
      });
      if (res.ok) {
        onClose();
        router.refresh();
      } else {
        const data = await res.json();
        alert("Erreur : " + (data.error || "inconnue"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            Modifier l&apos;article
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>
        <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3">
          <F label="Code article" value={form.codeArticle} onChange={(v) => setForm({ ...form, codeArticle: v })} />
          <F label="Référence" value={form.reference} onChange={(v) => setForm({ ...form, reference: v })} />
          <div className="col-span-2">
            <F label="Désignation" value={form.designation} onChange={(v) => setForm({ ...form, designation: v })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Catégorie</label>
            <select
              value={form.categorieId}
              onChange={(e) => setForm({ ...form, categorieId: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">— Aucune —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
          <F label="Unité" value={form.unite} onChange={(v) => setForm({ ...form, unite: v })} />
          <F label="Stock min" type="number" value={form.stockMin} onChange={(v) => setForm({ ...form, stockMin: v })} />
          <F label="Stock max" type="number" value={form.stockMax} onChange={(v) => setForm({ ...form, stockMax: v })} />
          <F label="Prix d'achat (FCFA)" type="number" step="1" value={form.prixAchat} onChange={(v) => setForm({ ...form, prixAchat: v })} />
          <F label="Prix de vente (FCFA)" type="number" step="1" value={form.prixVente} onChange={(v) => setForm({ ...form, prixVente: v })} />
          <F label="Emplacement" value={form.emplacement} onChange={(v) => setForm({ ...form, emplacement: v })} />
          <div className="col-span-2 mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function F({
  label,
  value,
  onChange,
  type = "text",
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={step}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}
