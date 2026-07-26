"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Art = {
  id: number;
  codeArticle: string;
  reference: string;
  designation: string;
  stockActuel: number;
};

const MOTIFS = [
  { value: "VENTE", label: "Vente" },
  { value: "PRODUCTION", label: "Production" },
  { value: "REBUT", label: "Rebut / casse" },
  { value: "PERTE", label: "Perte / vol" },
  { value: "RETOUR_CLIENT", label: "Retour client" },
  { value: "TRANSFERT", label: "Transfert" },
  { value: "SORTIE_ATELIER", label: "Sortie atelier" },
  { value: "AUTRE", label: "Autre" },
];

export function SortieForm({
  articles,
  preselectedArticleId,
}: {
  articles: Art[];
  preselectedArticleId?: number;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [form, setForm] = useState({
    articleId: preselectedArticleId?.toString() ?? articles[0]?.id?.toString() ?? "",
    motif: "VENTE",
    quantite: "",
    destination: "",
    vehicule: "",
    reference: "",
    observations: "",
  });

  const selectedArticle = articles.find((a) => a.id === parseInt(form.articleId));
  const qty = parseInt(form.quantite) || 0;
  const willGoNegative = selectedArticle && qty > selectedArticle.stockActuel;

  const isAtelier = form.motif === "SORTIE_ATELIER";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (willGoNegative) {
      if (!confirm("La quantité demandée dépasse le stock disponible. Continuer ?")) return;
    }
    if (isAtelier && !form.vehicule.trim()) {
      alert("Veuillez indiquer le véhicule concerné pour une sortie atelier.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/mouvements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SORTIE",
          articleId: parseInt(form.articleId),
          motif: form.motif,
          quantite: qty,
          destination: form.destination || null,
          vehicule: isAtelier ? form.vehicule : null,
          reference: form.reference || null,
          observations: form.observations || null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setOpen(false);
        setForm({
          articleId: articles[0]?.id?.toString() ?? "",
          motif: "VENTE",
          quantite: "",
          destination: "",
          vehicule: "",
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
        className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-700"
      >
        <span>+</span> Nouvelle sortie
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Enregistrer une sortie
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
                      {a.codeArticle} — {a.designation} (stock: {a.stockActuel})
                    </option>
                  ))}
                </select>
                {selectedArticle && (
                  <div className="mt-1 text-[11px] text-slate-500">
                    Stock disponible : <span className="font-semibold">{selectedArticle.stockActuel}</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600">Motif *</label>
                  <select
                    required
                    value={form.motif}
                    onChange={(e) => setForm({ ...form, motif: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    {MOTIFS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <F label="Quantité *" type="number" value={form.quantite} onChange={(v) => setForm({ ...form, quantite: v })} required />
              </div>
              {willGoNegative && (
                <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  ⚠ Quantité supérieure au stock disponible
                </div>
              )}
              {isAtelier && (
                <F
                  label="Véhicule concerné *"
                  value={form.vehicule}
                  onChange={(v) => setForm({ ...form, vehicule: v })}
                  required
                />
              )}
              <F label="Destination / Client" value={form.destination} onChange={(v) => setForm({ ...form, destination: v })} />
              <F label="Référence (OF, BL client...)" value={form.reference} onChange={(v) => setForm({ ...form, reference: v })} />
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
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-700 disabled:opacity-60"
                >
                  {loading ? "Enregistrement..." : "Valider la sortie"}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100"
      />
    </div>
  );
}
