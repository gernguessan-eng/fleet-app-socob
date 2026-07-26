import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { and, count, eq, ne } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requester = await getCurrentUser();
  if (!requester || requester.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "Accès réservé aux administrateurs." },
      { status: 403 },
    );
  }

  const { id } = await params;
  const targetId = parseInt(id);

  if (targetId === requester.userId) {
    return NextResponse.json(
      { ok: false, error: "Vous ne pouvez pas supprimer votre propre compte." },
      { status: 400 },
    );
  }

  const [target] = await db.select().from(users).where(eq(users.id, targetId));
  if (!target) {
    return NextResponse.json(
      { ok: false, error: "Utilisateur introuvable." },
      { status: 404 },
    );
  }

  if (target.role === "ADMIN") {
    const [{ value: otherAdmins }] = await db
      .select({ value: count() })
      .from(users)
      .where(and(eq(users.role, "ADMIN"), ne(users.id, targetId)));
    if (otherAdmins === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Impossible de supprimer le dernier administrateur du site.",
        },
        { status: 400 },
      );
    }
  }

  await db.delete(users).where(eq(users.id, targetId));
  return NextResponse.json({ ok: true });
}
