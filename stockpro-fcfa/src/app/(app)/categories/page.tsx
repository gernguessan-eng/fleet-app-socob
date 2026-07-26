import { db } from "@/db";
import { categories, articles } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import { CategorieForm } from "@/components/CategorieForm";
import { CategoriesGrid } from "@/components/CategoriesGrid";

export const dynamic = "force-dynamic";

async function getCategories() {
  const cats = await db.select().from(categories).orderBy(asc(categories.nom));

  const stats = await db
    .select({
      categorieId: articles.categorieId,
      nbArticles: sql<number>`count(*)::int`,
      stockTotal: sql<number>`coalesce(sum(${articles.stockActuel}), 0)::int`,
      valeur: sql<number>`coalesce(sum(${articles.stockActuel} * ${articles.prixAchat}), 0)::int`,
    })
    .from(articles)
    .groupBy(articles.categorieId);

  return {
    categories: cats.map((c) => {
      const s = stats.find((x) => x.categorieId === c.id);
      return {
        ...c,
        nbArticles: Number(s?.nbArticles) || 0,
        stockTotal: Number(s?.stockTotal) || 0,
        valeur: Number(s?.valeur) || 0,
      };
    }),
  };
}

export default async function CategoriesPage() {
  const data = await getCategories();

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Catégories
          </h2>
          <p className="text-sm text-slate-500">
            Organisation et classification des pièces
          </p>
        </div>
        <CategorieForm />
      </div>
      <CategoriesGrid data={data.categories} />
    </div>
  );
}
