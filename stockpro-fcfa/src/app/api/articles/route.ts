import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { articles } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [article] = await db
      .insert(articles)
      .values({
        codeArticle: body.codeArticle,
        reference: body.reference,
        designation: body.designation,
        categorieId: body.categorieId || null,
        unite: body.unite || "U",
        stockActuel: body.stockActuel || 0,
        stockMin: body.stockMin || 0,
        stockMax: body.stockMax || 0,
        prixAchat: String(body.prixAchat || 0),
        prixVente: String(body.prixVente || 0),
        emplacement: body.emplacement || null,
      })
      .returning();
    return NextResponse.json({ ok: true, article });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
