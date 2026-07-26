import { db } from "@/db";
import { articles, fournisseurs, mouvements } from "@/db/schema";
import { asc, desc, eq, and, gte, lte, sql } from "drizzle-orm";
import { EntreeForm } from "@/components/EntreeForm";
import { EntreesTable } from "@/components/EntreesTable";
import { formatNumber } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SearchParams = { article?: string; from?: string; to?: string };

async function getEntrees(sp: SearchParams) {
  const articleFilter = sp.article ? parseInt(sp.article) : undefined;

  const filters = [eq(mouvements.type, "ENTREE")];
  if (articleFilter) filters.push(eq(mouvements.articleId, articleFilter));
  if (sp.from) filters.push(gte(mouvements.dateMouvement, new Date(sp.from)));
  if (sp.to) filters.push(lte(mouvements.dateMouvement, new Date(sp.to + "T23:59:59")));

  const where = and(...filters);

  const rows = await db
    .select({
      id: mouvements.id,
      quantite: mouvements.quantite,
      dateMouvement: mouvements.dateMouvement,
      fournisseurId: mouvements.fournisseurId,
      fournisseurNom: fournisseurs.nom,
      numeroBon: mouvements.numeroBon,
      prixUnitaire: mouvements.prixUnitaire,
      reference: mouvements.reference,
      observations: mouvements.observations,
      articleId: mouvements.articleId,
      codeArticle: articles.codeArticle,
      refArticle: articles.reference,
      designation: articles.designation,
    })
    .from(mouvements)
    .leftJoin(articles, eq(mouvements.articleId, articles.id))
    .leftJoin(fournisseurs, eq(mouvements.fournisseurId, fournisseurs.id))
    .where(where)
    .orderBy(desc(mouvements.dateMouvement))
    .limit(200);

  const arts = await db
    .select({
      id: articles.id,
      codeArticle: articles.codeArticle,
      reference: articles.reference,
      designation: articles.designation,
    })
    .from(articles)
    .orderBy(asc(articles.codeArticle));

  const fours = await db
    .select()
    .from(fournisseurs)
    .orderBy(asc(fournisseurs.nom));

  const [totalRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(mouvements)
    .where(where);

  const [qteRow] = await db
    .select({ qte: sql<number>`coalesce(sum(quantite), 0)::int` })
    .from(mouvements)
    .where(where);

  const [valeurRow] = await db
    .select({ valeur: sql<number>`coalesce(sum(quantite * prix_unitaire), 0)::float` })
    .from(mouvements)
    .where(where);

  return {
    rows,
    articles: arts,
    fournisseurs: fours,
    total: Number(totalRow?.total) || 0,
    totalQte: Number(qteRow?.qte) || 0,
    totalValeur: Number(valeurRow?.valeur) || 0,
  };
}

export default async function EntreesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const articleFilter = sp.article ? parseInt(sp.article) : undefined;
  const data = await getEntrees(sp);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            ⬇ Entrées de stock
          </h2>
          <p className="text-sm text-slate-500">
            Réceptions, approvisionnements, retours fournisseurs
          </p>
        </div>
        <EntreeForm articles={data.articles} fournisseurs={data.fournisseurs} preselectedArticleId={articleFilter} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500">Total entrées</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">{data.total}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-emerald-50 p-4">
          <div className="text-xs uppercase tracking-wider text-emerald-700">Quantité totale entrée</div>
          <div className="mt-1 text-xl font-semibold text-emerald-700">+{formatNumber(data.totalQte)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-brand-50 p-4">
          <div className="text-xs uppercase tracking-wider text-brand-700">Valeur totale</div>
          <div className="mt-1 text-xl font-semibold text-brand-700">
            {formatNumber(data.totalValeur)} FCFA
          </div>
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
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
          href="/entrees"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Réinitialiser
        </Link>
      </form>

      <EntreesTable rows={data.rows} />
    </div>
  );
}
