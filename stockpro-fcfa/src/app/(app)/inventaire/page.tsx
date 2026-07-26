import { db } from "@/db";
import { inventaires, inventaireLignes, articles } from "@/db/schema";
import { desc, eq, asc, sql } from "drizzle-orm";
import { InventaireActions } from "@/components/InventaireActions";
import { InventaireLignesTable } from "@/components/InventaireLignesTable";
import { PrintButton } from "@/components/PrintButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getInventaires() {
  const rows = await db
    .select({
      id: inventaires.id,
      nom: inventaires.nom,
      dateInventaire: inventaires.dateInventaire,
      observations: inventaires.observations,
      valide: inventaires.valide,
    })
    .from(inventaires)
    .orderBy(desc(inventaires.dateInventaire));

  // Count lignes per inventaire
  const counts = await db
    .select({
      inventaireId: inventaireLignes.inventaireId,
      nb: sql<number>`count(*)::int`,
    })
    .from(inventaireLignes)
    .groupBy(inventaireLignes.inventaireId);

  const countMap = new Map(counts.map((c) => [c.inventaireId, Number(c.nb) || 0]));
  return rows.map((r) => ({ ...r, nbLignes: countMap.get(r.id) ?? 0 }));
}

async function getInventaireDetails(id: number) {
  const [inv] = await db
    .select()
    .from(inventaires)
    .where(eq(inventaires.id, id));
  if (!inv) return null;
  const lignes = await db
    .select({
      id: inventaireLignes.id,
      stockTheorique: inventaireLignes.stockTheorique,
      stockCompte: inventaireLignes.stockCompte,
      ecart: inventaireLignes.ecart,
      observations: inventaireLignes.observations,
      articleId: articles.id,
      codeArticle: articles.codeArticle,
      reference: articles.reference,
      designation: articles.designation,
      unite: articles.unite,
      emplacement: articles.emplacement,
    })
    .from(inventaireLignes)
    .leftJoin(articles, eq(inventaireLignes.articleId, articles.id))
    .where(eq(inventaireLignes.inventaireId, id))
    .orderBy(asc(articles.codeArticle));
  return { inv, lignes };
}

export default async function InventairePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const sp = await searchParams;
  const list = await getInventaires();
  const currentId = sp.id ? parseInt(sp.id) : list[0]?.id;
  const details = currentId ? await getInventaireDetails(currentId) : null;

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Inventaires physiques
          </h2>
          <p className="text-sm text-slate-500">
            Réconciliation du stock théorique et du stock réel
          </p>
        </div>
        <InventaireActions />
      </div>

      <div className="no-print grid grid-cols-1 gap-4 lg:grid-cols-[280px,1fr]">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Campagnes
          </h3>
          {list.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-500">
              Aucune campagne
            </div>
          ) : (
            list.map((i) => (
              <Link
                key={i.id}
                href={`/inventaire?id=${i.id}`}
                className={`block rounded-lg border p-3 transition ${
                  i.id === currentId
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-slate-900">{i.nom}</div>
                  {i.valide && (
                    <span className="shrink-0 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                      ✓
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  {new Date(i.dateInventaire).toLocaleDateString("fr-FR")} • {i.nbLignes} article(s)
                </div>
              </Link>
            ))
          )}
        </div>

        <div>
          {details ? (
            <InventaireDetailView
              inventaireId={details.inv.id}
              nom={details.inv.nom}
              date={details.inv.dateInventaire}
              observations={details.inv.observations}
              valide={details.inv.valide}
              valideAt={details.inv.valideAt}
              lignes={details.lignes}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
              Sélectionnez ou créez une campagne d&apos;inventaire
            </div>
          )}
        </div>
      </div>

      {details && (
        <div className="print-page">
          <div className="rounded-xl border border-slate-200 bg-white p-8">
            <div className="border-b border-slate-200 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    FICHE D&apos;INVENTAIRE
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Campagne : <span className="font-semibold">{details.inv.nom}</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Date d&apos;inventaire</div>
                  <div className="font-semibold text-slate-900">
                    {new Date(details.inv.dateInventaire).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
              {details.inv.observations && (
                <p className="mt-3 text-xs text-slate-500">
                  Observations : {details.inv.observations}
                </p>
              )}
            </div>

            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-300 text-left text-[11px] uppercase tracking-wider text-slate-700">
                  <th className="py-2 font-semibold">Code article</th>
                  <th className="py-2 font-semibold">Référence</th>
                  <th className="py-2 font-semibold">Désignation</th>
                  <th className="py-2 font-semibold text-center">Unité</th>
                  <th className="py-2 font-semibold text-center">Stock compté</th>
                  <th className="py-2 font-semibold">Observations</th>
                </tr>
              </thead>
              <tbody>
                {details.lignes.map((l) => (
                  <tr key={l.id} className="border-b border-slate-200">
                    <td className="py-2 font-mono text-[11px] font-medium">{l.codeArticle}</td>
                    <td className="py-2 text-slate-700">{l.reference}</td>
                    <td className="py-2 text-slate-900">{l.designation}</td>
                    <td className="py-2 text-center text-slate-500">{l.unite}</td>
                    <td className="py-2 text-center">
                      {l.stockCompte !== null ? (
                        <span className="font-semibold text-slate-900">{l.stockCompte}</span>
                      ) : (
                        <div className="mx-auto h-7 w-20 border-b-2 border-slate-400"></div>
                      )}
                    </td>
                    <td className="py-2">
                      {l.observations ? (
                        <span className="text-xs text-slate-700">{l.observations}</span>
                      ) : (
                        <div className="h-5 border-b border-slate-300"></div>
                      )}
                    </td>
                  </tr>
                ))}
                {Array.from({ length: Math.max(0, 15 - details.lignes.length) }).map((_, i) => (
                  <tr key={`empty-${i}`} className="border-b border-slate-200">
                    <td className="py-3"></td>
                    <td className="py-3"></td>
                    <td className="py-3"></td>
                    <td className="py-3"></td>
                    <td className="py-3">
                      <div className="mx-auto h-7 w-20 border-b-2 border-slate-400"></div>
                    </td>
                    <td className="py-3"></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-8 grid grid-cols-2 gap-8">
              <div>
                <div className="border-t-2 border-slate-300 pt-2 text-xs text-slate-500">
                  Signature du responsable inventaire
                </div>
              </div>
              <div>
                <div className="border-t-2 border-slate-300 pt-2 text-xs text-slate-500">
                  Date et signature du magasinier
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InventaireDetailView({
  inventaireId,
  nom,
  date,
  observations,
  valide,
  valideAt,
  lignes,
}: {
  inventaireId: number;
  nom: string;
  date: Date | string;
  observations: string | null;
  valide: boolean;
  valideAt: Date | string | null;
  lignes: any[];
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{nom}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {new Date(date).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          {valide ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              ✓ Validée{valideAt ? ` le ${new Date(valideAt).toLocaleDateString("fr-FR")}` : ""}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
              ● En cours de saisie
            </span>
          )}
        </div>
        {observations && (
          <p className="mt-2 text-xs text-slate-500">Observations : {observations}</p>
        )}
        <p className="mt-3 text-sm text-slate-600">
          Saisissez directement le stock compté pour chaque article ci-dessous. L&apos;écart se
          calcule automatiquement. Une fois la campagne validée, le stock réel des articles est
          mis à jour et un mouvement d&apos;ajustement est journalisé pour chaque écart.
        </p>
        <div className="mt-4 grid grid-cols-5 gap-2 rounded-lg bg-slate-50 p-3 text-center text-xs">
          <div>
            <div className="font-semibold text-slate-900">{lignes.length}</div>
            <div className="text-slate-500">Articles</div>
          </div>
          <div>
            <div className="font-semibold text-slate-900">
              {lignes.filter((l) => l.stockCompte !== null).length}
            </div>
            <div className="text-slate-500">Comptés</div>
          </div>
          <div>
            <div className="font-semibold text-slate-900">
              {lignes.reduce((acc, l) => acc + (l.stockTheorique ?? 0), 0)}
            </div>
            <div className="text-slate-500">Théoriques</div>
          </div>
          <div>
            <div className="font-semibold text-rose-600">
              {lignes.filter((l) => (l.ecart ?? 0) < 0).length}
            </div>
            <div className="text-slate-500">Manquants</div>
          </div>
          <div>
            <div className="font-semibold text-emerald-600">
              {lignes.filter((l) => (l.ecart ?? 0) > 0).length}
            </div>
            <div className="text-slate-500">Excédents</div>
          </div>
        </div>
        <PrintButton />
      </div>

      <InventaireLignesTable inventaireId={inventaireId} lignes={lignes} valide={valide} />
    </div>
  );
}
