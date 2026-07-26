import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import {
  createSessionToken,
  hashPassword,
  SESSION_COOKIE,
  SESSION_COOKIE_MAX_AGE,
} from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// Crée un compte utilisateur.
// - S'il n'existe encore AUCUN compte : inscription libre, le compte créé
//   devient automatiquement ADMIN et est connecté immédiatement (démarrage
//   initial de l'application).
// - S'il existe déjà au moins un compte : seul un administrateur connecté
//   peut créer de nouveaux comptes (employés). Empêche quiconque possédant
//   simplement le lien du site de s'inscrire lui-même.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const requestedRole = body.role === "ADMIN" ? "ADMIN" : "USER";

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { ok: false, error: "Adresse e-mail invalide." },
      { status: 400 },
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { ok: false, error: "Le mot de passe doit contenir au moins 6 caractères." },
      { status: 400 },
    );
  }

  const [{ value: totalUsers }] = await db.select({ value: count() }).from(users);
  const isBootstrap = totalUsers === 0;

  if (!isBootstrap) {
    const requester = await getCurrentUser();
    if (!requester || requester.role !== "ADMIN") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Seul un administrateur déjà connecté peut créer de nouveaux comptes.",
        },
        { status: 403 },
      );
    }
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    return NextResponse.json(
      { ok: false, error: "Un compte existe déjà avec cette adresse e-mail." },
      { status: 409 },
    );
  }

  const role = isBootstrap ? "ADMIN" : requestedRole;
  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, role })
    .returning();

  // Lors du tout premier compte, on connecte automatiquement la personne.
  // Quand un administrateur crée un compte pour un tiers, on NE remplace PAS
  // sa propre session par celle du nouveau compte.
  if (isBootstrap) {
    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    const res = NextResponse.json({ ok: true, user: { email: user.email, role: user.role } });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_COOKIE_MAX_AGE,
    });
    return res;
  }

  return NextResponse.json({ ok: true, user: { email: user.email, role: user.role } });
}
