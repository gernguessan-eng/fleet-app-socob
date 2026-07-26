import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inventaireLignes, inventaires } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Saisie manuelle du stock compté (et observations) pour une ligne d'inventaire
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; ligneId: string }> },
) {
  try {
    const { id, ligneId } = await params;
    const inventaireId = parseInt(id);
    const body = await req.json();

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
        { ok: false, error: "Cette campagne est déjà validée, elle n'est plus modifiable" },
        { status: 409 },
      );
    }

    const [ligne] = await db
      .select()
      .from(inventaireLignes)
      .where(
        and(
          eq(inventaireLignes.id, parseInt(ligneId)),
          eq(inventaireLignes.inventaireId, inventaireId),
        ),
      );
    if (!ligne) {
      return NextResponse.json(
        { ok: false, error: "Ligne d'inventaire introuvable" },
        { status: 404 },
      );
    }

    const stockCompte =
      body.stockCompte === null || body.stockCompte === ""
        ? null
        : parseInt(body.stockCompte);
    const ecart =
      stockCompte === null || Number.isNaN(stockCompte)
        ? null
        : stockCompte - ligne.stockTheorique;

    const [updated] = await db
      .update(inventaireLignes)
      .set({
        stockCompte: stockCompte === null || Number.isNaN(stockCompte) ? null : stockCompte,
        ecart,
        observations:
          body.observations !== undefined ? body.observations || null : ligne.observations,
      })
      .where(eq(inventaireLignes.id, ligne.id))
      .returning();

    return NextResponse.json({ ok: true, ligne: updated });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
