import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseApp,
} from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  type Auth,
} from "firebase/auth";

// Projet Firebase PARTAGÉ "RISE Presence" (suivi des connexions), commun à toutes les
// applications de la suite (FleetGest, AtelierGest, StockPro...). Contrairement au projet
// Firebase propre à chaque client (un par client, configuré via variables d'environnement
// dans les autres applications), celui-ci est unique et identique pour tout le monde —
// d'où une configuration fixe ici plutôt qu'une variable d'environnement par déploiement.
// Ces informations ne sont pas secrètes : elles identifient un projet, pas des données.
const riseFirebaseConfig = {
  apiKey: "AIzaSyAdjUYlswy-rfk0cwVs2Qly5-iViNrhKqk",
  authDomain: "riseappli-prod.firebaseapp.com",
  projectId: "riseappli-prod",
  storageBucket: "riseappli-prod.firebasestorage.app",
  messagingSenderId: "404378933325",
  appId: "1:404378933325:web:881815792a58b529346404",
};

const RISE_APP_NAME = "rise-presence";

let riseApp: FirebaseApp | null = null;
let riseAuthInstance: Auth | null = null;
let riseDbInstance: Firestore | null = null;
let riseAuthReadyPromise: Promise<void> | null = null;

// Initialisation paresseuse et strictement côté navigateur : StockPro utilise le rendu
// serveur (Next.js), et ce module ne doit jamais tenter de contacter Firebase pendant la
// génération des pages côté serveur — seulement une fois dans le navigateur de la personne.
function ensureInitialized() {
  if (typeof window === "undefined") return;
  if (riseApp) return;

  riseApp = getApps().some((a) => a.name === RISE_APP_NAME)
    ? getApp(RISE_APP_NAME)
    : initializeApp(riseFirebaseConfig, RISE_APP_NAME);
  riseDbInstance = getFirestore(riseApp);
  riseAuthInstance = getAuth(riseApp);

  // NOTE : ce mécanisme de connexion (anonyme) est déduit du fait que risePresenceSync.ts
  // attend une session prête avant d'écrire dans Firestore, ce qui suppose que les règles
  // de sécurité du projet RISE Presence exigent un utilisateur authentifié. Le fichier
  // riseFirebase.ts d'origine (utilisé par FleetGest) ne m'a pas été fourni : si vos règles
  // Firestore attendent autre chose qu'une connexion anonyme, dites-le-moi pour ajuster.
  riseAuthReadyPromise = new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(riseAuthInstance!, (user) => {
      if (user) {
        unsubscribe();
        resolve();
      } else {
        signInAnonymously(riseAuthInstance!).catch((err) => {
          console.error("[RISE Presence] Échec de la connexion anonyme :", err);
        });
      }
    });
  });
}

export function getRiseDb(): Firestore | null {
  ensureInitialized();
  return riseDbInstance;
}

export function getRiseAuthReady(): Promise<void> {
  ensureInitialized();
  return riseAuthReadyPromise ?? Promise.resolve();
}
