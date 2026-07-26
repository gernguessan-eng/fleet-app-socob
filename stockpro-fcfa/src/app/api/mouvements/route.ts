import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mouvements, articles } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.articleId || !body.type || !body.quantite) {
      return NextResponse.json(
        { ok: false, error: "Champs obligatoires manquants" },
        { status: 400 },
      );
    }

    if (body.type !== "ENTREE" && body.type !== "SORTIE") {
      return NextResponse.json(
        { ok: false, error: "Type invalide" },
        { status: 400 },
      );
    }

    // For SORTIE, motif is required
    if (body.type === "SORTIE" && !body.motif) {
      return NextResponse.json(
        { ok: false, error: "Le motif est obligatoire pour une sortie" },
        { status: 400 },
      );
    }

    // For ENTREE, fournisseur is required
    if (body.type === "ENTREE" && !body.fournisseurId) {
      return NextResponse.json(
        { ok: false, error: "Le fournisseur est obligatoire pour une entrée" },
        { status: 400 },
      );
    }

    const [mouvement] = await db
      .insert(mouvements)
      .values({
        type: body.type,
        articleId: body.articleId,
        quantite: body.quantite,
        fournisseurId: body.type === "ENTREE" ? body.fournisseurId : null,
        motif: body.type === "SORTIE" ? body.motif : null,
        destination: body.destination || null,
        vehicule: body.type === "SORTIE" ? body.vehicule || null : null,
        numeroBon: body.numeroBon || null,
        prixUnitaire: String(body.prixUnitaire || 0),
        reference: body.reference || null,
        observations: body.observations || null,
      })
      .returning();

    // Update article stock
    const delta = body.type === "ENTREE" ? Number(body.quantite) : -Number(body.quantite);
    await db
      .update(articles)
      .set({
        stockActuel: sql`GREATEST(0, ${articles.stockActuel} + ${delta})`,
        updatedAt: new Date(),
      })
      .where(eq(articles.id, body.articleId));

    return NextResponse.json({ ok: true, mouvement });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
