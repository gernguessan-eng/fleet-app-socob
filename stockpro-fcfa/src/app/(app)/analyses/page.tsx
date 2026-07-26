import { db } from "@/db";
import { articles, mouvements, categories, fournisseurs } from "@/db/schema";
import { sql, desc, eq, gte, and } from "drizzle-orm";
import { MovementTrendsChart } from "@/components/MovementTrendsChart";
import { ExitReasonsChart } from "@/components/ExitReasonsChart";
import { TopFournisseursChart } from "@/components/TopFournisseursChart";
import { CategoryValueChart } from "@/components/CategoryValueChart";
import { KpiCard } from "@/components/KpiCard";
import { formatNumber, formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

async function getAnalyses() {
  const since30 = sql`now() - interval '30 days'`;

  // Movements per day for last 60 days
  const movementsPerDay = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${mouvements.dateMouvement}), 'YYYY-MM-DD')`,
      type: mouvements.type,
      total: sql<number>`sum(${mouvements.quantite})::int`,
      valeur: sql<number>`sum(${mouvements.quantite} * ${mouvements.prixUnitaire})::int`,
    })
    .from(mouvements)
    .where(gte(mouvements.dateMouvement, sql`now() - interval '60 days'`))
    .groupBy(sql`date_trunc('day', ${mouvements.dateMouvement})`, mouvements.type)
    .orderBy(sql`date_trunc('day', ${mouvements.dateMouvement})`);

  // Exit reasons distribution
  const exitReasons = await db
    .select({
      motif: mouvements.motif,
      total: sql<number>`count(*)::int`,
      quantite: sql<number>`coalesce(sum(${mouvements.quantite}), 0)::int`,
    })
    .from(mouvements)
    .where(and(eq(mouvements.type, "SORTIE"), gte(mouvements.dateMouvement, since30)))
    .groupBy(mouvements.motif);

  // Top fournisseurs by value last 30 days
  const topFournisseurs = await db
    .select({
      nom: fournisseurs.nom,
      total: sql<number>`coalesce(sum(${mouvements.quantite} * ${mouvements.prixUnitaire}), 0)::int`,
      quantite: sql<number>`coalesce(sum(${mouvements.quantite}), 0)::int`,
    })
    .from(mouvements)
    .leftJoin(fournisseurs, eq(mouvements.fournisseurId, fournisseurs.id))
    .where(and(eq(mouvements.type, "ENTREE"), gte(mouvements.dateMouvement, since30)))
    .groupBy(fournisseurs.nom)
    .orderBy(desc(sql`coalesce(sum(${mouvements.quantite} * ${mouvements.prixUnitaire}), 0)`))
    .limit(8);

  // Category value
  const categoryValue = await db
    .select({
      nom: categories.nom,
      valeur: sql<number>`coalesce(sum(${articles.stockActuel} * ${articles.prixAchat}), 0)::int`,
      stock: sql<number>`coalesce(sum(${articles.stockActuel}), 0)::int`,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categorieId, categories.id))
    .groupBy(categories.nom)
    .orderBy(desc(sql`coalesce(sum(${articles.stockActuel} * ${articles.prixAchat}), 0)`));

  // KPIs
  const [kpiAchats] = await db
    .select({ value: sql<number>`coalesce(sum(quantite * prix_unitaire), 0)::int` })
    .from(mouvements)
    .where(and(eq(mouvements.type, "ENTREE"), gte(mouvements.dateMouvement, since30)));

  const [kpiSorties] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(mouvements)
    .where(and(eq(mouvements.type, "SORTIE"), gte(mouvements.dateMouvement, since30)));

  const [rotationRow] = await db
    .select({
      value: sql<number>`case when coalesce(sum(stock_actuel), 0) = 0 then 0 else round((coalesce((select sum(quantite) from mouvements where type = 'SORTIE' and date_mouvement >= now() - interval '30 days'), 0)::numeric / nullif(sum(stock_actuel), 0)) * 100, 1) end`,
    })
    .from(articles);

  const [rupturesRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(articles)
    .where(sql`stock_actuel = 0`);

  const [alertesRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(articles)
    .where(sql`stock_actuel <= stock_min`);

  return {
    movementsPerDay,
    exitReasons: exitReasons.map((e) => ({ ...e, total: Number(e.total), quantite: Number(e.quantite) })),
    topFournisseurs: topFournisseurs.map((f) => ({ ...f, total: Number(f.total), quantite: Number(f.quantite) })),
    categoryValue: categoryValue.map((c) => ({ ...c, valeur: Number(c.valeur), stock: Number(c.stock) })),
    kpiAchats: Number(kpiAchats?.value) || 0,
    kpiSorties: Number(kpiSorties?.value) || 0,
    rotation: Number(rotationRow?.value) || 0,
    ruptures: Number(rupturesRow?.value) || 0,
    alertes: Number(alertesRow?.value) || 0,
  };
}

export default async function AnalysesPage() {
  const data = await getAnalyses();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Analyses & statistiques
        </h2>
        <p className="text-sm text-slate-500">
          Indicateurs clés et tendances sur 30 / 60 jours
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Achats (30j)"
          value={formatCurrency(data.kpiAchats)}
          subtext="Valeur totale des entrées"
          icon="💰"
          tone="brand"
        />
        <KpiCard
          label="Mouvements de sortie (30j)"
          value={formatNumber(data.kpiSorties)}
          subtext="Opérations enregistrées"
          icon="🔁"
        />
        <KpiCard
          label="Taux de rotation (30j)"
          value={`${data.rotation}%`}
          subtext="Sorties / stock moyen"
          icon="🔄"
          tone="ok"
        />
        <KpiCard
          label="Alertes actives"
          value={formatNumber(data.alertes)}
          subtext={`${data.ruptures} rupture(s) totale(s)`}
          icon="⚠️"
          tone={data.alertes > 0 ? "danger" : "ok"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">
            Évolution des flux (60 jours)
          </h3>
          <p className="mb-3 text-xs text-slate-500">
            Quantités entrées vs sorties par jour
          </p>
          <MovementTrendsChart data={data.movementsPerDay} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">
            Répartition des motifs de sortie
          </h3>
          <p className="mb-3 text-xs text-slate-500">
            30 derniers jours
          </p>
          <ExitReasonsChart data={data.exitReasons} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">
            Top fournisseurs (CA achats)
          </h3>
          <p className="mb-3 text-xs text-slate-500">
            30 derniers jours
          </p>
          <TopFournisseursChart data={data.topFournisseurs} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">
            Valeur de stock par catégorie
          </h3>
          <p className="mb-3 text-xs text-slate-500">
            Stock actuel valorisé au prix d&apos;achat
          </p>
          <CategoryValueChart data={data.categoryValue} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-brand-50 to-white p-6">
        <h3 className="text-sm font-semibold text-slate-900">💡 Insights</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 text-sm">
          <Insight
            title="Rotation des stocks"
            value={`${data.rotation}%`}
            description={
              data.rotation > 30
                ? "Excellente rotation - stock dynamique."
                : data.rotation > 10
                  ? "Rotation correcte - surveillez les invendus."
                  : "Rotation lente - risque de surstockage."
            }
            tone={data.rotation > 30 ? "ok" : data.rotation > 10 ? "default" : "danger"}
          />
          <Insight
            title="Concentration fournisseurs"
            value={`${data.topFournisseurs.length} fournisseur(s) actif(s)`}
            description="Surveillez la dépendance à un fournisseur unique."
            tone="default"
          />
          <Insight
            title="Alertes"
            value={`${data.alertes} article(s) à réapprovisionner`}
            description={
              data.ruptures > 0
                ? `${data.ruptures} en rupture totale - action immédiate.`
                : "Aucune rupture critique détectée."
            }
            tone={data.alertes > 0 ? "danger" : "ok"}
          />
        </div>
      </div>
    </div>
  );
}

function Insight({
  title,
  value,
  description,
  tone,
}: {
  title: string;
  value: string;
  description: string;
  tone: "ok" | "default" | "danger";
}) {
  const toneCls = {
    ok: "border-emerald-200 bg-white",
    default: "border-slate-200 bg-white",
    danger: "border-rose-200 bg-white",
  }[tone];
  const valueCls = {
    ok: "text-emerald-700",
    default: "text-slate-900",
    danger: "text-rose-700",
  }[tone];
  return (
    <div className={`rounded-lg border p-4 ${toneCls}`}>
      <div className="text-[11px] uppercase tracking-wider text-slate-500">{title}</div>
      <div className={`mt-1 text-lg font-semibold ${valueCls}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-600">{description}</div>
    </div>
  );
}
