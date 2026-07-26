import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import { ArticleForm } from "@/components/ArticleForm";
import { ArticlesTable } from "@/components/ArticlesTable";

export const dynamic = "force-dynamic";

async function getArticles() {
  const rows = await db
    .select({
      id: articles.id,
      codeArticle: articles.codeArticle,
      reference: articles.reference,
      designation: articles.designation,
      categorieId: articles.categorieId,
      categorieNom: categories.nom,
      unite: articles.unite,
      stockActuel: articles.stockActuel,
      stockMin: articles.stockMin,
      stockMax: articles.stockMax,
      prixAchat: articles.prixAchat,
      prixVente: articles.prixVente,
      emplacement: articles.emplacement,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categorieId, categories.id))
    .orderBy(asc(articles.codeArticle));

  const cats = await db
    .select({ id: categories.id, nom: categories.nom })
    .from(categories)
    .orderBy(asc(categories.nom));

  // Valeur totale par article
  const enriched = await db
    .select({
      id: articles.id,
      valeurStock: sql<number>`stock_actuel * prix_achat`,
    })
    .from(articles);

  const valeurMap = new Map(enriched.map((e) => [e.id, Number(e.valeurStock) || 0]));

  return {
    articles: rows.map((r) => ({
      ...r,
      valeurStock: valeurMap.get(r.id) ?? 0,
    })),
    categories: cats,
  };
}

export default async function ArticlesPage() {
  const data = await getArticles();

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Articles / Pièces
          </h2>
          <p className="text-sm text-slate-500">
            {data.articles.length} article(s) référencé(s)
          </p>
        </div>
        <ArticleForm categories={data.categories} />
      </div>
      <ArticlesTable
        articles={data.articles}
        categories={data.categories}
      />
    </div>
  );
}
