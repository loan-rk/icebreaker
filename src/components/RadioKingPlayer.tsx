import { useEffect } from "react";
import { cn } from "@/lib/utils";

// Lecteur web fourni par RadioKing pour la webradio « avocadoradio ».
// `c` / `c2` = couleurs (rouge RadioKing sur fond blanc).
// Le slash final est nécessaire : sans lui, les bundles JS du lecteur (chargés
// en relatif) renvoient 404 et le lecteur reste blanc.
const PLAYER_SRC = "https://player.radioking.io/avocadoradio/?c=%2384000E&c2=%23FFFFFF";
// Script côté page (facultatif) : gère le redimensionnement et l'ouverture du
// lecteur en pop-up. Chargé une seule fois, en asynchrone.
const HELPER_SRC = "https://player.radioking.io/scripts/iframe.bundle.js";

/**
 * Lecteur radio RadioKing, pensé pour vivre discrètement en bas d'un écran :
 * dans le flux (ne recouvre donc aucun bouton), largeur fluide plafonnée à
 * 470 px, hauteur fixe. Ne s'affiche pas si un lecteur casse la page.
 */
export function RadioKingPlayer({ className }: { className?: string }) {
  useEffect(() => {
    if (document.querySelector(`script[src="${HELPER_SRC}"]`)) return;
    const script = document.createElement("script");
    script.src = HELPER_SRC;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div
      className={cn("flex w-full max-w-[470px] shrink-0 flex-col items-center gap-1.5", className)}
    >
      <iframe
        src={PLAYER_SRC}
        title="Lecteur radio RadioKing — Avocado Radio"
        loading="lazy"
        scrolling="no"
        className="h-[145px] w-full rounded-md border-0 shadow-lg"
      />
    </div>
  );
}
