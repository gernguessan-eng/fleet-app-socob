"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Cat = { id: number; nom: string };

export function ArticleForm({ categories }: { categories: Cat[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState({
    codeArticle: "",
    reference: "",
    designation: "",
    categorieId: categories[0]?.id?.toString() ?? "",
    unite: "U",
    stockActuel: "0",
    stockMin: "0",
    stockMax: "0",
    prixAchat: "0",
    prixVente: "0",
    emplacement: "",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          categorieId: form.categorieId ? parseInt(form.categorieId) : null,
          stockActuel: parseInt(form.stockActuel) || 0,
          stockMin: parseInt(form.stockMin) || 0,
          stockMax: parseInt(form.stockMax) || 0,
          prixAchat: parseFloat(form.prixAchat) || 0,
          prixVente: parseFloat(form.prixVente) || 0,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setOpen(false);
        setForm({
          codeArticle: "",
          reference: "",
          designation: "",
          categorieId: categories[0]?.id?.toString() ?? "",
          unite: "U",
          stockActuel: "0",
          stockMin: "0",
          stockMax: "0",
          prixAchat: "0",
          prixVente: "0",
          emplacement: "",
        });
        router.refresh();
      } else {
        alert("Erreur : " + (data.error || "inconnue"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
      >
        <span>+</span> Nouvel article
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Nouvel article
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3">
              <Field label="Code article *" value={form.codeArticle} onChange={(v) => setForm({ ...form, codeArticle: v })} required />
              <Field label="Référence *" value={form.reference} onChange={(v) => setForm({ ...form, reference: v })} required />
              <div className="col-span-2">
                <Field label="Désignation *" value={form.designation} onChange={(v) => setForm({ ...form, designation: v })} required />
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
              <Field label="Unité" value={form.unite} onChange={(v) => setForm({ ...form, unite: v })} />
              <Field label="Stock actuel" type="number" value={form.stockActuel} onChange={(v) => setForm({ ...form, stockActuel: v })} />
              <Field label="Emplacement" value={form.emplacement} onChange={(v) => setForm({ ...form, emplacement: v })} />
              <Field label="Stock minimum" type="number" value={form.stockMin} onChange={(v) => setForm({ ...form, stockMin: v })} />
              <Field label="Stock maximum" type="number" value={form.stockMax} onChange={(v) => setForm({ ...form, stockMax: v })} />
              <Field label="Prix d'achat (FCFA)" type="number" step="1" value={form.prixAchat} onChange={(v) => setForm({ ...form, prixAchat: v })} />
              <Field label="Prix de vente (FCFA)" type="number" step="1" value={form.prixVente} onChange={(v) => setForm({ ...form, prixVente: v })} />
              <div className="col-span-2 mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
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
      )}
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        step={step}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}
