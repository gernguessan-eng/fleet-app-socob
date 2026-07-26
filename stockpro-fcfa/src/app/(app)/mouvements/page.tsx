import { db } from "@/db";
import { articles, mouvements, fournisseurs } from "@/db/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { MovementsTable } from "@/components/MovementsTable";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SearchParams = {
  type?: string;
  from?: string;
  to?: string;
};

async function getMouvements(sp: SearchParams) {
  const filters = [] as any[];
  if (sp.type && (sp.type === "ENTREE" || sp.type === "SORTIE" || sp.type === "INVENTAIRE")) {
    filters.push(eq(mouvements.type, sp.type));
  }
  if (sp.from) {
    filters.push(gte(mouvements.dateMouvement, new Date(sp.from)));
  }
  if (sp.to) {
    filters.push(lte(mouvements.dateMouvement, new Date(sp.to + "T23:59:59")));
  }

  const where = filters.length > 0 ? and(...filters) : undefined;

  const rows = await db
    .select({
      id: mouvements.id,
      type: mouvements.type,
      articleId: mouvements.articleId,
      codeArticle: articles.codeArticle,
      reference: articles.reference,
      designation: articles.designation,
      quantite: mouvements.quantite,
      dateMouvement: mouvements.dateMouvement,
      fournisseurId: mouvements.fournisseurId,
      fournisseurNom: fournisseurs.nom,
      numeroBon: mouvements.numeroBon,
      prixUnitaire: mouvements.prixUnitaire,
      motif: mouvements.motif,
      destination: mouvements.destination,
      vehicule: mouvements.vehicule,
      ref: mouvements.reference,
      observations: mouvements.observations,
    })
    .from(mouvements)
    .leftJoin(articles, eq(mouvements.articleId, articles.id))
    .leftJoin(fournisseurs, eq(mouvements.fournisseurId, fournisseurs.id))
    .where(where as any)
    .orderBy(desc(mouvements.dateMouvement))
    .limit(500);

  const [totalRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(mouvements)
    .where(where as any);

  const [entreeRow] = await db
    .select({ totalEntree: sql<number>`coalesce(sum(quantite), 0)::int` })
    .from(mouvements)
    .where(and(eq(mouvements.type, "ENTREE"), where as any));

  const [sortieRow] = await db
    .select({ totalSortie: sql<number>`coalesce(sum(quantite), 0)::int` })
    .from(mouvements)
    .where(and(eq(mouvements.type, "SORTIE"), where as any));

  return {
    rows,
    total: Number(totalRow?.total) || 0,
    totalEntree: Number(entreeRow?.totalEntree) || 0,
    totalSortie: Number(sortieRow?.totalSortie) || 0,
  };
}

export default async function MouvementsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const data = await getMouvements(sp);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Tous les mouvements
          </h2>
          <p className="text-sm text-slate-500">
            Historique complet des entrées et sorties
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/entrees"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
          >
            ⬇ Nouvelle entrée
          </Link>
          <Link
            href="/sorties"
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-700"
          >
            ⬆ Nouvelle sortie
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500">Total mouvements</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">{data.total}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-emerald-50 p-4">
          <div className="text-xs uppercase tracking-wider text-emerald-700">Total entrées (qté)</div>
          <div className="mt-1 text-xl font-semibold text-emerald-700">+{data.totalEntree}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-rose-50 p-4">
          <div className="text-xs uppercase tracking-wider text-rose-700">Total sorties (qté)</div>
          <div className="mt-1 text-xl font-semibold text-rose-700">-{data.totalSortie}</div>
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <label className="block text-xs font-medium text-slate-600">Type</label>
          <select
            name="type"
            defaultValue={sp.type ?? ""}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Tous</option>
            <option value="ENTREE">Entrées</option>
            <option value="SORTIE">Sorties</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Du</label>
          <input
            type="date"
            name="from"
            defaultValue={sp.from ?? ""}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Au</label>
          <input
            type="date"
            name="to"
            defaultValue={sp.to ?? ""}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Filtrer
        </button>
        <Link
          href="/mouvements"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Réinitialiser
        </Link>
      </form>

      <MovementsTable rows={data.rows} />
    </div>
  );
}
