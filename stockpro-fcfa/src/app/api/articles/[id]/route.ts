import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const [article] = await db
      .update(articles)
      .set({
        codeArticle: body.codeArticle,
        reference: body.reference,
        designation: body.designation,
        categorieId: body.categorieId || null,
        unite: body.unite,
        stockMin: body.stockMin,
        stockMax: body.stockMax,
        prixAchat: String(body.prixAchat),
        prixVente: String(body.prixVente),
        emplacement: body.emplacement || null,
        updatedAt: new Date(),
      })
      .where(eq(articles.id, parseInt(id)))
      .returning();
    return NextResponse.json({ ok: true, article });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await db.delete(articles).where(eq(articles.id, parseInt(id)));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
