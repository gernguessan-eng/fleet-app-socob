import { db } from "@/db";
import { fournisseurs, mouvements, articles } from "@/db/schema";
import { asc, eq, desc, sql } from "drizzle-orm";
import { FournisseurForm } from "@/components/FournisseurForm";
import { FournisseursTable } from "@/components/FournisseursTable";

export const dynamic = "force-dynamic";

async function getFournisseurs() {
  const fours = await db
    .select()
    .from(fournisseurs)
    .orderBy(asc(fournisseurs.nom));

  // Total entree per fournisseur
  const stats = await db
    .select({
      fournisseurId: mouvements.fournisseurId,
      totalEntrees: sql<number>`count(*)::int`,
      quantiteTotale: sql<number>`coalesce(sum(${mouvements.quantite}), 0)::int`,
      valeurTotale: sql<number>`coalesce(sum(${mouvements.quantite} * ${mouvements.prixUnitaire}), 0)::int`,
      dernierAchat: sql<string>`max(${mouvements.dateMouvement})`,
    })
    .from(mouvements)
    .where(eq(mouvements.type, "ENTREE"))
    .groupBy(mouvements.fournisseurId);

  return {
    fournisseurs: fours.map((f) => {
      const s = stats.find((x) => x.fournisseurId === f.id);
      return {
        ...f,
        totalEntrees: Number(s?.totalEntrees) || 0,
        quantiteTotale: Number(s?.quantiteTotale) || 0,
        valeurTotale: Number(s?.valeurTotale) || 0,
        dernierAchat: s?.dernierAchat ?? null,
      };
    }),
  };
}

export default async function FournisseursPage() {
  const data = await getFournisseurs();

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Fournisseurs
          </h2>
          <p className="text-sm text-slate-500">
            {data.fournisseurs.length} fournisseur(s) enregistré(s)
          </p>
        </div>
        <FournisseurForm />
      </div>
      <FournisseursTable data={data.fournisseurs} />
    </div>
  );
}
