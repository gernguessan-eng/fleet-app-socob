import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getStorage } from "firebase/storage";

// La configuration Firebase vient des variables d'environnement (voir .env.example) plutôt
// que d'être codée en dur : cela permet de déployer EXACTEMENT le même code pour chaque
// client (ex. socobfleetgest.netlify.app), chacun pointant vers SON PROPRE projet Firebase,
// simplement en réglant des variables d'environnement différentes sur Netlify — sans jamais
// modifier ni recompiler ce fichier manuellement pour chaque client.
// Ces informations ne sont pas secrètes : elles identifient un projet, pas des données.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  // Erreur explicite plutôt qu'un écran blanc silencieux si les variables d'environnement
  // n'ont pas été renseignées sur la plateforme de déploiement (Netlify, Vercel…).
  throw new Error(
    "Configuration Firebase manquante : renseignez les variables VITE_FIREBASE_* " +
    "(voir .env.example) dans les paramètres d'environnement de votre hébergeur."
  );
}

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
// Utilisé pour les photos de véhicules et documents administratifs (carte grise, patente,
// vignette, carte de transport, carte de stationnement) : ces images sont stockées dans
// Firebase Storage — PAS en base64 dans Firestore, qui a une limite stricte de 1 Mo par
// document (largement dépassée par des photos, même compressées).
export const storage = getStorage(firebaseApp);

// Contrairement à AtelierGest, FleetGest a un vrai écran de connexion (voir authService.ts /
// Login.tsx) : pas de connexion anonyme technique ici. `authReady` se résout dès qu'un
// utilisateur réellement connecté est détecté — utile pour firestoreSync.ts, qui n'est de
// toute façon monté qu'une fois l'utilisateur authentifié (voir App.tsx).
export const authReady: Promise<void> = new Promise((resolve) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      unsubscribe();
      resolve();
    }
  });
});
