import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
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
  const body = await req.json().catch(() => ({}));
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (newPassword.length < 6) {
    return NextResponse.json(
      { ok: false, error: "Le mot de passe doit contenir au moins 6 caractères." },
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

  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, targetId));

  return NextResponse.json({ ok: true });
}
