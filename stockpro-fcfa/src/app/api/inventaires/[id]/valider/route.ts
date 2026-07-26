import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inventaires, inventaireLignes, articles, mouvements } from "@/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Valide une campagne : applique chaque stock compté saisi manuellement au stock réel
// de l'article, journalise un mouvement de type INVENTAIRE pour chaque écart, puis
// verrouille la campagne (elle n'est plus modifiable ensuite).
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const inventaireId = parseInt(id);

    const [inv] = await db
      .select()
      .from(inventaires)
      .where(eq(inventaires.id, inventaireId));
    if (!inv) {
      return NextResponse.json(
        { ok: false, error: "Campagne d'inventaire introuvable" },
        { status: 404 },
      );
    }
    if (inv.valide) {
      return NextResponse.json(
        { ok: false, error: "Cette campagne est déjà validée" },
        { status: 409 },
      );
    }

    const lignes = await db
      .select()
      .from(inventaireLignes)
      .where(
        and(
          eq(inventaireLignes.inventaireId, inventaireId),
          isNotNull(inventaireLignes.stockCompte),
        ),
      );

    let ajustements = 0;

    const result = await db.transaction(async (tx) => {
      for (const ligne of lignes) {
        if (ligne.stockCompte === null) continue;
        const [article] = await tx
          .select()
          .from(articles)
          .where(eq(articles.id, ligne.articleId));
        if (!article) continue;

        const delta = ligne.stockCompte - article.stockActuel;
        if (delta === 0) continue;

        await tx
          .update(articles)
          .set({ stockActuel: ligne.stockCompte, updatedAt: new Date() })
          .where(eq(articles.id, article.id));

        await tx.insert(mouvements).values({
          type: "INVENTAIRE",
          articleId: article.id,
          quantite: delta,
          reference: inv.nom,
          observations:
            ligne.observations ||
            `Ajustement d'inventaire — campagne "${inv.nom}"`,
        });

        ajustements++;
      }

      const [updatedInv] = await tx
        .update(inventaires)
        .set({ valide: true, valideAt: new Date() })
        .where(eq(inventaires.id, inventaireId))
        .returning();

      return updatedInv;
    });

    return NextResponse.json({ ok: true, inventaire: result, ajustements });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
