import { db } from "@/db";
import { sql, desc, eq, and, gte } from "drizzle-orm";
import {
  articles,
  mouvements,
  categories,
  fournisseurs,
} from "@/db/schema";
import { KpiCard } from "@/components/KpiCard";
import { MovementsChart } from "@/components/MovementsChart";
import { StockByCategoryChart } from "@/components/StockByCategoryChart";
import { TopArticlesTable } from "@/components/TopArticlesTable";
import { LowStockTable } from "@/components/LowStockTable";
import { SeedButton } from "@/components/SeedButton";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const [
    [{ count: articleCount = 0 } = { count: 0 }],
    [{ value: totalStock = 0 } = { value: 0 }],
    [{ value: totalValue = 0 } = { value: 0 }],
    [{ count: mouvementCount = 0 } = { count: 0 }],
    [{ count: fournisseurCount = 0 } = { count: 0 }],
    [{ count: lowStockCount = 0 } = { count: 0 }],
    [{ value: monthEntrees = 0 } = { value: 0 }],
    [{ value: monthSorties = 0 } = { value: 0 }],
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(articles),
    db
      .select({ value: sql<number>`coalesce(sum(stock_actuel), 0)::int` })
      .from(articles),
    db
      .select({
        value: sql<number>`coalesce(sum(stock_actuel * prix_achat), 0)::int`,
      })
      .from(articles),
    db.select({ count: sql<number>`count(*)::int` }).from(mouvements),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(fournisseurs),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(articles)
      .where(sql`stock_actuel <= stock_min`),
    db
      .select({
        value: sql<number>`coalesce(sum(quantite), 0)::int`,
      })
      .from(mouvements)
      .where(
        and(
          eq(mouvements.type, "ENTREE"),
          gte(
            mouvements.dateMouvement,
            sql`date_trunc('month', now())`,
          ),
        ),
      ),
    db
      .select({
        value: sql<number>`coalesce(sum(quantite), 0)::int`,
      })
      .from(mouvements)
      .where(
        and(
          eq(mouvements.type, "SORTIE"),
          gte(
            mouvements.dateMouvement,
            sql`date_trunc('month', now())`,
          ),
        ),
      ),
  ]);

  // Movements per day last 30 days
  const movementsPerDay = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${mouvements.dateMouvement}), 'YYYY-MM-DD')`,
      type: mouvements.type,
      total: sql<number>`sum(${mouvements.quantite})::int`,
    })
    .from(mouvements)
    .where(
      gte(
        mouvements.dateMouvement,
        sql`now() - interval '30 days'`,
      ),
    )
    .groupBy(
      sql`date_trunc('day', ${mouvements.dateMouvement})`,
      mouvements.type,
    )
    .orderBy(sql`date_trunc('day', ${mouvements.dateMouvement})`);

  // Stock by category
  const stockByCategory = await db
    .select({
      name: categories.nom,
      value: sql<number>`coalesce(sum(${articles.stockActuel}), 0)::int`,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categorieId, categories.id))
    .groupBy(categories.nom);

  // Top mouvements articles
  const topArticles = await db
    .select({
      articleId: mouvements.articleId,
      designation: articles.designation,
      codeArticle: articles.codeArticle,
      total: sql<number>`sum(${mouvements.quantite})::int`,
    })
    .from(mouvements)
    .leftJoin(articles, eq(mouvements.articleId, articles.id))
    .where(gte(mouvements.dateMouvement, sql`now() - interval '30 days'`))
    .groupBy(mouvements.articleId, articles.designation, articles.codeArticle)
    .orderBy(desc(sql`sum(${mouvements.quantite})`))
    .limit(5);

  // Low stock
  const lowStock = await db
    .select({
      id: articles.id,
      codeArticle: articles.codeArticle,
      reference: articles.reference,
      designation: articles.designation,
      stockActuel: articles.stockActuel,
      stockMin: articles.stockMin,
      emplacement: articles.emplacement,
    })
    .from(articles)
    .where(sql`stock_actuel <= stock_min`)
    .orderBy(articles.stockActuel)
    .limit(6);

  return {
    articleCount: Number(articleCount) || 0,
    totalStock: Number(totalStock) || 0,
    totalValue: Number(totalValue) || 0,
    mouvementCount: Number(mouvementCount) || 0,
    fournisseurCount: Number(fournisseurCount) || 0,
    lowStockCount: Number(lowStockCount) || 0,
    monthEntrees: Number(monthEntrees) || 0,
    monthSorties: Number(monthSorties) || 0,
    movementsPerDay,
    stockByCategory,
    topArticles,
    lowStock,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (data.articleCount === 0) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center max-w-xl">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600 text-2xl">
            📦
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            Bienvenue dans StockPro
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Initialisez la base de données pour charger des données de démonstration
            (articles, fournisseurs, mouvements sur 60 jours).
          </p>
          <div className="mt-6 flex justify-center">
            <SeedButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Vue d&apos;ensemble
          </h2>
          <p className="text-sm text-slate-500">
            Activité de votre stock en temps réel
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          Données actualisées
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Valeur du stock"
          value={`${formatNumber(data.totalValue)} FCFA`}
          subtext={`${formatNumber(data.totalStock)} unités en stock`}
          icon="💰"
          tone="brand"
        />
        <KpiCard
          label="Articles référencés"
          value={formatNumber(data.articleCount)}
          subtext={`${data.fournisseurCount} fournisseur(s) actif(s)`}
          icon="📦"
        />
        <KpiCard
          label="Mouvements (total)"
          value={formatNumber(data.mouvementCount)}
          subtext={`+${data.monthEntrees} entrées / -${data.monthSorties} sorties ce mois`}
          icon="🔁"
        />
        <KpiCard
          label="Alertes stock bas"
          value={formatNumber(data.lowStockCount)}
          subtext="Articles sous le seuil minimum"
          icon="⚠️"
          tone={data.lowStockCount > 0 ? "danger" : "ok"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Activité des 30 derniers jours
              </h3>
              <p className="text-xs text-slate-500">
                Entrées vs sorties par jour
              </p>
            </div>
          </div>
          <MovementsChart data={data.movementsPerDay} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Répartition par catégorie
            </h3>
            <p className="text-xs text-slate-500">
              Stock total en unités
            </p>
          </div>
          <StockByCategoryChart data={data.stockByCategory} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">
            Articles les plus mouvementés
          </h3>
          <p className="mb-3 text-xs text-slate-500">30 derniers jours</p>
          <TopArticlesTable data={data.topArticles} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">
            Alertes de stock bas
          </h3>
          <p className="mb-3 text-xs text-slate-500">
            Articles à réapprovisionner
          </p>
          <LowStockTable data={data.lowStock} />
        </div>
      </div>
    </div>
  );
}
