"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useMemo, useState, useSyncExternalStore } from "react";

type NavItem = { href: string; label: string; icon: string };

const baseNav: NavItem[] = [
  { href: "/", label: "Tableau de bord", icon: "📊" },
  { href: "/articles", label: "Articles", icon: "📦" },
  { href: "/mouvements", label: "Mouvements", icon: "🔁" },
  { href: "/entrees", label: "Entrées", icon: "⬇️" },
  { href: "/sorties", label: "Sorties", icon: "⬆️" },
  { href: "/fournisseurs", label: "Fournisseurs", icon: "🏭" },
  { href: "/categories", label: "Catégories", icon: "🏷️" },
  { href: "/inventaire", label: "Inventaire", icon: "📋" },
  { href: "/analyses", label: "Analyses", icon: "📈" },
];

const STORAGE_KEY = "stockpro:sidebar-order";
// Événement local pour prévenir la page courante d'un changement d'ordre
// (l'événement natif "storage" ne se déclenche que dans les *autres* onglets).
const ORDER_EVENT = "stockpro:sidebar-order-changed";

// Réapplique un ordre sauvegardé (par href) à la liste de menus actuelle,
// tout en plaçant en fin de liste les éventuels nouveaux menus non connus.
function applyOrder(items: NavItem[], savedHrefs: string[]): NavItem[] {
  const remaining = new Map(items.map((i) => [i.href, i]));
  const ordered: NavItem[] = [];
  for (const href of savedHrefs) {
    const item = remaining.get(href);
    if (item) {
      ordered.push(item);
      remaining.delete(href);
    }
  }
  for (const item of items) {
    if (remaining.has(item.href)) ordered.push(item);
  }
  return ordered;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(ORDER_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(ORDER_EVENT, callback);
  };
}

function getSnapshot() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function getServerSnapshot() {
  return ""; // Aucun ordre personnalisé connu côté serveur
}

function persistOrder(next: NavItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next.map((i) => i.href)));
    window.dispatchEvent(new Event(ORDER_EVENT));
  } catch {
    // stockage indisponible (ex: navigation privée) : rien à faire de plus
  }
}

function resetOrder() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(ORDER_EVENT));
  } catch {
    // ignore
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const savedOrderRaw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const items = useMemo(() => {
    if (!savedOrderRaw) return baseNav;
    try {
      return applyOrder(baseNav, JSON.parse(savedOrderRaw));
    } catch {
      return baseNav;
    }
  }, [savedOrderRaw]);

  const [reordering, setReordering] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const next = [...items];
    const [moved] = next.splice(draggedIndex, 1);
    next.splice(targetIndex, 0, moved);
    persistOrder(next);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="sticky top-0 flex h-screen flex-col">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold">
          S
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight text-slate-900">
            StockPro
          </div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500">
            Gestion de stock
          </div>
        </div>
      </div>

      <div className="px-3 pt-3">
        <button
          onClick={() => setReordering(!reordering)}
          className={clsx(
            "flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
            reordering
              ? "border-brand-200 bg-brand-50 text-brand-700"
              : "border-slate-200 text-slate-500 hover:bg-slate-50",
          )}
        >
          {reordering ? "✓ Terminé" : "↕ Réorganiser les menus"}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {reordering && (
          <p className="mb-2 px-1 text-[11px] text-slate-400">
            Glissez un menu pour le déplacer à l&apos;endroit souhaité.
          </p>
        )}
        {items.map((item, index) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          if (reordering) {
            const isDragging = draggedIndex === index;
            const isOver = dragOverIndex === index && draggedIndex !== index;
            return (
              <div
                key={item.href}
                draggable
                onDragStart={() => setDraggedIndex(index)}
                onDragEnter={() => setDragOverIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
                className={clsx(
                  "mb-1 flex cursor-grab items-center gap-2 rounded-lg border bg-white px-2 py-2 active:cursor-grabbing",
                  isDragging ? "opacity-40" : "opacity-100",
                  isOver ? "border-brand-400 bg-brand-50" : "border-slate-200",
                )}
              >
                <span className="text-slate-300">⠿</span>
                <span className="text-base">{item.icon}</span>
                <span className="flex-1 text-sm text-slate-700">{item.label}</span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 mb-1 text-sm transition-colors",
                active
                  ? "bg-brand-50 text-brand-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
        {reordering && (
          <button
            onClick={resetOrder}
            className="mt-2 w-full text-center text-xs text-slate-400 hover:text-slate-600 hover:underline"
          >
            Réinitialiser l&apos;ordre par défaut
          </button>
        )}
      </nav>

      <div className="border-t border-slate-200 px-4 py-4">
        <div className="rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-white">
          <div className="text-xs font-medium opacity-90">Astuce</div>
          <div className="mt-1 text-[13px] leading-snug">
            Lancez un inventaire physique pour réconcilier vos stocks théoriques.
          </div>
        </div>
      </div>
    </div>
  );
}
