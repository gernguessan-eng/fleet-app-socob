import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import { users } from "@/db/schema";
import { UsersManager } from "@/components/UsersManager";

export default async function UtilisateursPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  const list = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.createdAt);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Utilisateurs</h2>
        <p className="text-sm text-slate-500">
          Gérez les comptes ayant accès à cette application. Chaque personne se
          connecte avec sa propre adresse e-mail et son propre mot de passe.
        </p>
      </div>
      <UsersManager
        currentUserId={user.userId}
        initialUsers={list.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
      />
    </div>
  );
}
