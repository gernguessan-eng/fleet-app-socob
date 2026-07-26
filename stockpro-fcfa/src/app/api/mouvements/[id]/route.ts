import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mouvements, articles } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const [mvt] = await db
      .select()
      .from(mouvements)
      .where(eq(mouvements.id, parseInt(id)));
    if (!mvt) {
      return NextResponse.json(
        { ok: false, error: "Mouvement introuvable" },
        { status: 404 },
      );
    }
    // Reverse the stock impact
    // ENTREE et INVENTAIRE ajoutent leur quantité au stock (INVENTAIRE peut être négatif) ;
    // SORTIE la retire. Pour annuler, on applique donc l'inverse.
    const reverse =
      mvt.type === "SORTIE" ? Number(mvt.quantite) : -Number(mvt.quantite);
    await db
      .update(articles)
      .set({
        stockActuel: sql`GREATEST(0, ${articles.stockActuel} + ${reverse})`,
        updatedAt: new Date(),
      })
      .where(eq(articles.id, mvt.articleId));
    await db.delete(mouvements).where(eq(mouvements.id, parseInt(id)));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
