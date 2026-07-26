import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSessionToken, verifyPassword, SESSION_COOKIE, SESSION_COOKIE_MAX_AGE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  const [user] = await db.select().from(users).where(eq(users.email, email));

  // Message volontairement identique dans les deux cas (email inconnu / mauvais
  // mot de passe) pour ne pas révéler quelles adresses e-mail sont enregistrées.
  const invalid = () =>
    NextResponse.json(
      { ok: false, error: "Adresse e-mail ou mot de passe incorrect." },
      { status: 401 },
    );

  if (!user) return invalid();

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return invalid();

  const token = createSessionToken({ userId: user.id, email: user.email, role: user.role });
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
