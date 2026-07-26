"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function SeedButton() {
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        startTransition(() => router.refresh());
      } else {
        alert("Erreur : " + (data.error || "inconnue"));
      }
    } catch (e) {
      alert("Erreur : " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading || isPending}
      className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
    >
      {loading || isPending ? "Initialisation..." : "Initialiser la base de données"}
    </button>
  );
}
