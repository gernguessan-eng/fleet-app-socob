import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "leaflet/dist/leaflet.css";
import "./index.css";
import App from "./App";
import { displayAppName } from "./risePresenceSync";

// Le <title> statique d'index.html ne peut pas connaître le nom du site à la compilation
// (le même build est déployé sur plusieurs domaines clients) : on l'ajuste ici au chargement,
// pour que l'onglet du navigateur affiche aussi le nom du site en cours plutôt qu'un titre
// générique identique pour tous les clients.
document.title = `${displayAppName()} — Gestion de Flotte`;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
