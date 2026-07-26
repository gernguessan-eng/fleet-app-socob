"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { signalPresenceConnected } from "@/lib/risePresenceSync";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [checkingStatus, setCheckingStatus] = useState(true);
  const [hasUsers, setHasUsers] = useState(true);
  const [tab, setTab] = useState<"login" | "register">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const usersExist = data.ok ? Boolean(data.hasUsers) : true;
        setHasUsers(usersExist);
        if (!usersExist) setTab("register");
      })
      .catch(() => {
        if (!cancelled) setHasUsers(true);
      })
      .finally(() => {
        if (!cancelled) setCheckingStatus(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.ok) {
        const roleLabel = data.user?.role === "ADMIN" ? "Administrateur" : "Utilisateur";
        signalPresenceConnected(email, email, roleLabel);
        const next = params.get("next") || "/";
        router.push(next);
        router.refresh();
      } else {
        setError(data.error || "Une erreur est survenue.");
      }
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            S
          </div>
          <h1 className="mt-3 text-lg font-semibold text-slate-900">StockPro</h1>
          <p className="text-xs text-slate-500">Gestion de stock</p>
        </div>

        {!checkingStatus && hasUsers === false && (
          <p className="mb-4 rounded-lg bg-brand-50 px-3 py-2 text-center text-xs text-brand-700">
            Premier démarrage : créez le compte administrateur du site.
          </p>
        )}

        {!checkingStatus && hasUsers && (
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setTab("login")}
              className={clsx(
                "rounded-md py-1.5 text-sm font-medium transition-colors",
                tab === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
              )}
            >
              Connexion
            </button>
            <button
              type="button"
              disabled
              title="Demandez à un administrateur de créer votre compte"
              className="cursor-not-allowed rounded-md py-1.5 text-sm font-medium text-slate-300"
            >
              Inscription
            </button>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Adresse e-mail
            </label>
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="nom@entreprise.com"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-600">
                Mot de passe
              </label>
              {tab === "login" && (
                <button
                  type="button"
                  onClick={() => setShowForgot((v) => !v)}
                  className="text-[11px] font-medium text-brand-600 hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                placeholder={tab === "register" ? "Minimum 6 caractères" : "••••••••"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
            {showForgot && tab === "login" && (
              <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                Contactez l&apos;administrateur de votre entreprise : il peut
                réinitialiser votre mot de passe depuis la page
                &quot;Utilisateurs&quot; de l&apos;application.
              </p>
            )}
          </div>
          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Veuillez patienter..."
              : tab === "login"
                ? "Se connecter"
                : "Créer le compte administrateur"}
          </button>
        </form>

        {!checkingStatus && hasUsers && (
          <p className="mt-4 text-center text-[11px] text-slate-400">
            Pas encore de compte ? Demandez à un administrateur de vous en créer un
            depuis l&apos;application.
          </p>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
