import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inventaires, inventaireLignes, articles } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [inv] = await db.insert(inventaires).values({
      nom: body.nom,
      observations: body.observations || null,
    }).returning();

    // Add all current articles
    const arts = await db.select().from(articles);
    if (arts.length > 0) {
      await db.insert(inventaireLignes).values(
        arts.map((a) => ({
          inventaireId: inv.id,
          articleId: a.id,
          stockTheorique: a.stockActuel,
          stockCompte: null,
          ecart: null,
          observations: null,
        })),
      );
    }
    return NextResponse.json({ ok: true, inventaire: inv });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
