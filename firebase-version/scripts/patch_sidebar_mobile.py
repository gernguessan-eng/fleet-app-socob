import re
p='src/components/Sidebar.tsx'
s=open(p,encoding='utf-8').read()
def rep(a,b):
    global s
    assert s.count(a)==1,(a[:70],s.count(a)); s=s.replace(a,b)

rep("import { useState, useEffect, useCallback } from 'react';","import { useState, useEffect, useCallback, useRef } from 'react';")
rep("  AlertTriangle, Wrench, ParkingCircle, BookUser, Package, ShieldCheck, Settings,\n}","  AlertTriangle, Wrench, ParkingCircle, BookUser, Package, ShieldCheck, Settings, X,\n}")
rep("const STORAGE_ORDER_KEY","""/** Titre de la page affichée dans la barre du haut (téléphone) */
export function pageTitleFor(pathname: string): string {
  if (pathname.startsWith('/vehicule/')) return 'Fiche véhicule';
  if (pathname === '/demandes-suppression') return 'Demandes de suppression';
  return defaultNavItems.find((i) => i.path === pathname)?.label ?? 'SOCOB FleetGest';
}

const STORAGE_ORDER_KEY""")
rep("export default function Sidebar() {\n  const location = useLocation();","""interface SidebarProps {
  /** Téléphone/tablette : le menu est un tiroir qui glisse depuis la gauche */
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const touchStart = useRef<{ x: number; y: number } | null>(null);""")
rep("  useEffect(() => { saveHidden(hiddenItems); }, [hiddenItems]);\n","""  useEffect(() => { saveHidden(hiddenItems); }, [hiddenItems]);

  // Le tiroir se referme dès qu'on change de page, avec la touche Échap, ou si l'écran devient large
  useEffect(() => { onClose(); }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const onResize = () => { if (window.innerWidth >= 1024) onClose(); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // le contenu derrière ne défile plus
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
""")

rep("""  return (
    <aside className="fixed left-0 top-0 z-30 flex h-full w-64 flex-col overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950 text-white shadow-xl">""","""  return (
    <>
    {/* Voile sombre derrière le tiroir (téléphone) : toucher pour fermer */}
    <div
      aria-hidden="true"
      onClick={onClose}
      className={`fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden print:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    />
    <aside
      id="main-nav"
      aria-label="Menu principal"
      onTouchStart={(e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
      onTouchEnd={(e) => {
        const s0 = touchStart.current; touchStart.current = null;
        if (!s0 || !open) return;
        const dx = e.changedTouches[0].clientX - s0.x; const dy = e.changedTouches[0].clientY - s0.y;
        if (dx < -60 && Math.abs(dx) > Math.abs(dy) * 1.5) onClose(); // glisser vers la gauche = refermer
      }}
      className={`${open ? 'nav-open translate-x-0 shadow-2xl' : 'max-lg:invisible -translate-x-full'} fixed left-0 top-0 z-40 flex h-dvh w-[min(86vw,19rem)] flex-col overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950 text-white shadow-xl transition-[transform,visibility] duration-300 ease-out lg:z-30 lg:h-full lg:w-64 lg:translate-x-0`}
    >""")

rep("""        <div>
          <h1 className="text-sm font-bold leading-tight">{displayAppName()}</h1>
          <p className="text-[10px] text-slate-400">Gestion de flotte</p>
        </div>
      </div>""","""        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-bold leading-tight">{displayAppName()}</h1>
          <p className="text-[10px] text-slate-400">Gestion de flotte</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le menu"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-slate-200 ring-1 ring-white/10 transition active:scale-95 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>""")
rep('className="flex items-center gap-3 border-b-2 border-[#E8B923]/50 px-6 py-5"','className="flex items-center gap-3 border-b-2 border-[#E8B923]/50 px-5 py-4 lg:px-6 lg:py-5"')

rep("""<nav className={`flex-1 space-y-1 overflow-y-auto px-3 ${editMode ? 'py-2' : 'py-4'}`}>""","""<nav className={`flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 pb-[max(1rem,env(safe-area-inset-bottom))] ${editMode ? 'pt-2' : 'pt-4'}`}>""")
rep("""              onDragEnd={handleDragEnd}
              className={`flex items-center gap-2 rounded-lg transition-all""","""              onDragEnd={handleDragEnd}
              style={{ '--i': index } as React.CSSProperties}
              className={`nav-item flex items-center gap-2 rounded-lg transition-all""")
rep("onClick={(e) => { if (editMode) e.preventDefault(); }}","onClick={(e) => { if (editMode) e.preventDefault(); else onClose(); }}")
rep("""      </div>
    </aside>
  );
}""","""      </div>
    </aside>
    </>
  );
}""")
open(p,'w',encoding='utf-8').write(s)

# App
p='src/App.tsx'
s=open(p,encoding='utf-8').read()
rep("import { useEffect, useState } from 'react';","import { useCallback, useEffect, useState } from 'react';")
rep("import Sidebar from './components/Sidebar';","import Sidebar from './components/Sidebar';\nimport MobileTopBar from './components/MobileTopBar';")
rep("""function AppContent({ profile, onLogout }: { profile: UserProfile; onLogout: () => void }) {
  return (""","""function AppContent({ profile, onLogout }: { profile: UserProfile; onLogout: () => void }) {
  const [navOpen, setNavOpen] = useState(false);
  const closeNav = useCallback(() => setNavOpen(false), []);

  // Téléphone : un glissement du doigt depuis le bord gauche de l'écran ouvre le menu
  useEffect(() => {
    let start: { x: number; y: number } | null = null;
    const down = (e: TouchEvent) => {
      const t = e.touches[0];
      start = window.innerWidth < 1024 && t.clientX <= 22 ? { x: t.clientX, y: t.clientY } : null;
    };
    const up = (e: TouchEvent) => {
      if (!start) return;
      const t = e.changedTouches[0];
      if (t.clientX - start.x > 70 && Math.abs(t.clientX - start.x) > Math.abs(t.clientY - start.y) * 1.5) setNavOpen(true);
      start = null;
    };
    window.addEventListener('touchstart', down, { passive: true });
    window.addEventListener('touchend', up, { passive: true });
    return () => { window.removeEventListener('touchstart', down); window.removeEventListener('touchend', up); };
  }, []);

  return (""")
rep("""        <Sidebar />
        <main className="relative ml-64 flex-1 p-6 print:ml-0 print:p-0">
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-y-0 left-64 right-0""","""        <Sidebar open={navOpen} onClose={closeNav} />
        <div className="flex min-w-0 flex-1 flex-col lg:ml-64 print:ml-0">
        <MobileTopBar open={navOpen} onMenu={() => setNavOpen(true)} />
        <main className="relative flex-1 p-3 sm:p-4 lg:p-6 print:p-0">
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-y-0 left-0 right-0 lg:left-64""")
rep("""          </div>
        </main>
      </div>
    </div>
  );
}""","""          </div>
        </main>
        </div>
      </div>
    </div>
  );
}""")
open(p,'w',encoding='utf-8').write(s)

# CSS
p='src/index.css'
s=open(p,encoding='utf-8').read()
s=s.replace("@media print {","""/* Menu tiroir (téléphone) : les onglets apparaissent en cascade à l'ouverture */
@keyframes nav-item-in {
  from { opacity: 0; transform: translateX(-16px); }
  to   { opacity: 1; transform: none; }
}
@media (max-width: 1023px) and (prefers-reduced-motion: no-preference) {
  .nav-open .nav-item {
    animation: nav-item-in 0.38s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: calc(var(--i, 0) * 30ms + 110ms);
  }
}

@media print {""",1)
open(p,'w',encoding='utf-8').write(s)
