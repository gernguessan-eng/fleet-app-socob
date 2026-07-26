"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signalPresenceDisconnected } from "@/lib/risePresenceSync";

const titleMap: Record<string, string> = {
  "/": "Tableau de bord",
  "/articles": "Articles",
  "/mouvements": "Mouvements de stock",
  "/entrees": "Entrées de stock",
  "/sorties": "Sorties de stock",
  "/fournisseurs": "Fournisseurs",
  "/categories": "Catégories",
  "/inventaire": "Campagnes d'inventaire",
  "/analyses": "Analyses & statistiques",
  "/utilisateurs": "Utilisateurs",
};

const roleLabel: Record<string, string> = {
  ADMIN: "Administrateur",
  USER: "Utilisateur",
};

export function Topbar({ email, role }: { email: string; role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const title = titleMap[pathname] ?? "StockPro";

  const onLogout = async () => {
    if (email) signalPresenceDisconnected(email);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="no-print sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur">
      <div>
        <h1 className="text-base font-semibold text-slate-900">{title}</h1>
        <p className="text-xs text-slate-500">
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          Base de données connectée
        </div>
        {email && (
          <div className="hidden lg:block text-right">
            <div className="text-xs font-medium text-slate-700">{email}</div>
            <div className="text-[11px] text-slate-400">
              {roleLabel[role] ?? role}
            </div>
          </div>
        )}
        {role === "ADMIN" && (
          <Link
            href="/utilisateurs"
            title="Gérer les utilisateurs"
            className={
              pathname === "/utilisateurs"
                ? "grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm text-brand-700"
                : "grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-sm text-slate-700 hover:bg-slate-200"
            }
          >
            👤
          </Link>
        )}
        <button
          onClick={onLogout}
          title="Se déconnecter"
          className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700 hover:bg-slate-200"
        >
          ⏻
        </button>
      </div>
    </header>
  );
}
