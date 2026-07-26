import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { getCurrentUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen">
      <aside className="no-print w-64 shrink-0 border-r border-slate-200 bg-white">
        <Sidebar />
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar email={user?.email ?? ""} role={user?.role ?? "USER"} />
        <main className="flex-1 px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
