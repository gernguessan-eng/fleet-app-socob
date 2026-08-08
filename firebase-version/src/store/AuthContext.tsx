import React, { createContext, useContext } from 'react';
import type { UserProfile } from '../authService';

// Seules ces adresses peuvent voir/traiter les demandes de suppression et supprimer des
// données directement sans validation préalable. Volontairement codé en dur (pas de rôle,
// pas d'interface pour modifier cette liste) : c'est une liste restreinte et exceptionnelle,
// distincte du système de rôles Administrateur/Agent/Client utilisé pour le reste de l'app.
const SUPER_ADMIN_EMAILS = ['gernguessan@outlook.com', 'sthcarry@yahoo.fr'];

interface AuthContextType {
  profile: UserProfile | null;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({ profile: null, isSuperAdmin: false });

export function AuthProvider({ profile, children }: { profile: UserProfile | null; children: React.ReactNode }) {
  const isSuperAdmin = !!profile?.email && SUPER_ADMIN_EMAILS.includes(profile.email.trim().toLowerCase());
  return <AuthContext.Provider value={{ profile, isSuperAdmin }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
