import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { riseDb, riseAuthReady } from "./riseFirebase";

// Noms alignés sur src/config/presenceSchema.js du tableau de bord RISE Presence
const PRESENCE_COLLECTION = "presence";
const USERS_COLLECTION = "users";
const STATUT_CONNECTE = "Connecté";
const STATUT_DECONNECTE = "Déconnecté";

// Identifie automatiquement quelle version de FleetGest signale la présence,
// à partir du nom de domaine du déploiement.
function currentAppName(): string {
  if (typeof window === "undefined" || !window.location?.hostname) return "FleetGest";
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return "FleetGest (local)";
  const firstSegment = host.split(".")[0];
  return firstSegment || "FleetGest";
}

// ⚠️ CHANGEMENT IMPORTANT : le document presence/users est maintenant identifié
// par l'UID RÉEL du compte Firebase Authentication (uid), pas par un texte dérivé
// du nom affiché ou de l'e-mail. Avant ce changement, si un même utilisateur était
// signalé une fois avec son nom et une fois avec son e-mail comme "identifiant",
// deux documents différents étaient créés pour la même personne — c'est exactement
// le bug des lignes en double observé dans RISE Presence.
//
// uid doit être le vrai uid Firebase (ex: auth.currentUser.uid dans FleetGest),
// pas une chaîne de caractères construite à la main.
export async function signalPresenceConnected(
  uid: string,
  displayName: string,
  email: string,
  fonction: string
) {
  if (!uid) {
    console.error("[RISE Presence] signalPresenceConnected appelé sans uid — signalement ignoré.");
    return;
  }
  try {
    await riseAuthReady;
    const userRef = doc(riseDb, USERS_COLLECTION, uid);
    const existingUser = await getDoc(userRef);
    await Promise.all([
      setDoc(
        doc(riseDb, PRESENCE_COLLECTION, uid),
        {
          uid,
          displayName,
          email: email || "",
          role: fonction || "",
          application: currentAppName(),
          statut: STATUT_CONNECTE,
          connexion: serverTimestamp(),
          deconnexion: null,
        },
        { merge: true }
      ),
      setDoc(
        userRef,
        {
          uid,
          displayName,
          email: email || "",
          role: fonction || "",
          updatedAt: serverTimestamp(),
          ...(existingUser.exists() ? {} : { createdAt: serverTimestamp() }),
        },
        { merge: true }
      ),
    ]);
  } catch (err) {
    console.error("[RISE Presence] Échec du signalement de connexion :", err);
  }
}

// À appeler lors de la déconnexion dans FleetGest. Même uid réel qu'à la connexion.
export async function signalPresenceDisconnected(uid: string) {
  if (!uid) return;
  try {
    await riseAuthReady;
    await setDoc(
      doc(riseDb, PRESENCE_COLLECTION, uid),
      { statut: STATUT_DECONNECTE, deconnexion: serverTimestamp() },
      { merge: true }
    );
  } catch (err) {
    console.error("[RISE Presence] Échec du signalement de déconnexion :", err);
  }
}
