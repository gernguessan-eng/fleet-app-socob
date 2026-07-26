import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { count } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Route publique (accessible sans être connecté) : indique seulement si
// au moins un compte existe déjà, pour que la page de connexion sache si
// elle doit proposer l'onglet "Inscription" (premier démarrage uniquement).
export async function GET() {
  try {
    const [{ value: totalUsers }] = await db.select({ value: count() }).from(users);
    return NextResponse.json({ ok: true, hasUsers: totalUsers > 0 });
  } catch {
    // Si la table n'existe pas encore (base fraîchement créée), on considère
    // qu'aucun compte n'existe.
    return NextResponse.json({ ok: true, hasUsers: false });
  }
}
