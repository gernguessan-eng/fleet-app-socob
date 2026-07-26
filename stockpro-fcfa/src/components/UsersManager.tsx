"use client";

import { useState } from "react";

type UserRow = {
  id: number;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
};

export function UsersManager({
  currentUserId,
  initialUsers,
}: {
  currentUserId: number;
  initialUsers: UserRow[];
}) {
  const [users, setUsers] = useState<UserRow[] | null>(initialUsers);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [resettingId, setResettingId] = useState<number | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.ok) {
        setUsers(data.users);
        setLoadError(null);
      } else {
        setLoadError(data.error || "Impossible de charger la liste.");
      }
    } catch {
      setLoadError("Impossible de charger la liste.");
    }
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (data.ok) {
        setEmail("");
        setPassword("");
        setRole("USER");
        setShowForm(false);
        load();
      } else {
        setFormError(data.error || "Une erreur est survenue.");
      }
    } catch {
      setFormError("Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  };

  const onResetPassword = async (id: number, userEmail: string) => {
    const newPassword = prompt(
      `Nouveau mot de passe pour ${userEmail} (minimum 6 caractères) :`,
    );
    if (!newPassword) return;
    if (newPassword.length < 6) {
      alert("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setResettingId(id);
    try {
      const res = await fetch(`/api/users/${id}/reset-password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (data.ok) {
        alert("Mot de passe mis à jour. Communiquez-le à la personne concernée.");
      } else {
        alert(data.error || "Une erreur est survenue.");
      }
    } finally {
      setResettingId(null);
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("Supprimer ce compte ? Cette action est définitive.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        load();
      } else {
        alert(data.error || "Suppression impossible.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          {showForm ? "Annuler" : "+ Ajouter un utilisateur"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={onCreate}
          className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4"
        >
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Adresse e-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="nom@entreprise.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              placeholder="Min. 6 caractères"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Rôle</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "USER" | "ADMIN")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="USER">Utilisateur</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </div>
          {formError && (
            <p className="sm:col-span-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {formError}
            </p>
          )}
          <div className="sm:col-span-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? "Création..." : "Créer le compte"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Rôle</th>
              <th className="px-4 py-3 font-medium">Créé le</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadError && (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-rose-600">
                  {loadError}
                </td>
              </tr>
            )}
            {!loadError && users === null && (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-slate-400">
                  Chargement...
                </td>
              </tr>
            )}
            {users?.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-slate-800">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      u.role === "ADMIN"
                        ? "rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700"
                        : "rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                    }
                  >
                    {u.role === "ADMIN" ? "Administrateur" : "Utilisateur"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onResetPassword(u.id, u.email)}
                      disabled={resettingId === u.id}
                      className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                    >
                      {resettingId === u.id ? "..." : "Réinitialiser mdp"}
                    </button>
                    {u.id === currentUserId ? (
                      <span className="px-2 py-1 text-xs text-slate-400">Vous</span>
                    ) : (
                      <button
                        onClick={() => onDelete(u.id)}
                        disabled={deletingId === u.id}
                        className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                      >
                        {deletingId === u.id ? "..." : "Supprimer"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
