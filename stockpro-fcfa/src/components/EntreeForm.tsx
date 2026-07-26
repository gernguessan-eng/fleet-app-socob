"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Art = { id: number; codeArticle: string; reference: string; designation: string };
type Four = { id: number; nom: string };

export function EntreeForm({
  articles,
  fournisseurs,
  preselectedArticleId,
}: {
  articles: Art[];
  fournisseurs: Four[];
  preselectedArticleId?: number;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [form, setForm] = useState({
    articleId: preselectedArticleId?.toString() ?? articles[0]?.id?.toString() ?? "",
    fournisseurId: fournisseurs[0]?.id?.toString() ?? "",
    quantite: "",
    prixUnitaire: "",
    numeroBon: "",
    reference: "",
    observations: "",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/mouvements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ENTREE",
          articleId: parseInt(form.articleId),
          fournisseurId: form.fournisseurId ? parseInt(form.fournisseurId) : null,
          quantite: parseInt(form.quantite),
          prixUnitaire: parseFloat(form.prixUnitaire) || 0,
          numeroBon: form.numeroBon || null,
          reference: form.reference || null,
          observations: form.observations || null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setOpen(false);
        setForm({
          articleId: articles[0]?.id?.toString() ?? "",
          fournisseurId: fournisseurs[0]?.id?.toString() ?? "",
          quantite: "",
          prixUnitaire: "",
          numeroBon: "",
          reference: "",
          observations: "",
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
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
      >
        <span>+</span> Nouvelle entrée
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Enregistrer une entrée
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600">Article *</label>
                <select
                  required
                  value={form.articleId}
                  onChange={(e) => setForm({ ...form, articleId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">— Choisir —</option>
                  {articles.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.codeArticle} — {a.designation}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600">Fournisseur *</label>
                  <select
                    required
                    value={form.fournisseurId}
                    onChange={(e) => setForm({ ...form, fournisseurId: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="">— Choisir —</option>
                    {fournisseurs.map((f) => (
                      <option key={f.id} value={f.id}>{f.nom}</option>
                    ))}
                  </select>
                </div>
                <F label="N° Bon de livraison" value={form.numeroBon} onChange={(v) => setForm({ ...form, numeroBon: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="Quantité *" type="number" value={form.quantite} onChange={(v) => setForm({ ...form, quantite: v })} required />
                <F label="Prix unitaire (FCFA)" type="number" step="1" value={form.prixUnitaire} onChange={(v) => setForm({ ...form, prixUnitaire: v })} />
              </div>
              <F label="Référence (BL, commande...)" value={form.reference} onChange={(v) => setForm({ ...form, reference: v })} />
              <div>
                <label className="block text-xs font-medium text-slate-600">Observations</label>
                <textarea
                  value={form.observations}
                  onChange={(e) => setForm({ ...form, observations: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
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
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                >
                  {loading ? "Enregistrement..." : "Valider l'entrée"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function F({
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
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      />
    </div>
  );
}
