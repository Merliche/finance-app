// Thème centralisé par parcoursId — une couleur socle sobre pour le tronc commun
// ("intro"), une couleur distincte par voie, mais de la même famille (chroma/luminosité
// proches, seule la teinte varie). Aucun écran ne doit coder une couleur de parcours en
// dur : passer par `themeDuParcours(parcoursId)`.
import { PALETTE_CLAIRE, voile, type ModeCouleur } from "./palettes";

export interface ThemeParcours {
  /** Couleur pleine des nœuds validés/actuels et du tracé parcouru de ce parcours. */
  primary: string;
  /** Ombre/lèvre du bevel des nœuds (même teinte, plus sombre) — effet "bouton 3D". */
  primaryDark: string;
  /** Fond très clair pour les bannières de session et les encarts. */
  tint: string;
  /** Variante un peu plus soutenue du tint, pour les bordures d'encart. */
  tintFort: string;
}

export const THEMES_PARCOURS: Record<string, ThemeParcours> = {
  // Tronc commun : violet profond — distinct des 3 voies (bleu, orange, vert) et assez
  // vif pour que le premier écran de l'app ne soit pas gris. C'est lui qu'on voit d'abord.
  intro: { primary: "#5B4BDB", primaryDark: "#4032B2", tint: "#ECEAFB", tintFort: "#D8D3F6" },
  // Banque : bleu — confiance, classique du secteur bancaire.
  banque: { primary: "#2E6FE0", primaryDark: "#1D4CA8", tint: "#E7EFFD", tintFort: "#CFE0FB" },
  // Marché : orange — énergie, mouvement, salle des marchés.
  marche: { primary: "#DE7011", primaryDark: "#A8520A", tint: "#FCEDDE", tintFort: "#F8DCC0" },
  // Entreprise : vert-teal — croissance, corporate.
  entreprise: { primary: "#128A66", primaryDark: "#0B6149", tint: "#E0F3EC", tintFort: "#C4E7DA" },
  // Quotidien : framboise — chaud et humain, distinct du violet de l'intro (bleuté) comme
  // de l'orange du marché. C'est la voie de la vie de tous les jours, pas de la finance
  // de marché : sa couleur devait s'en détacher.
  quotidien: { primary: "#C9356B", primaryDark: "#95204E", tint: "#FCE7EF", tintFort: "#F7CEDD" },
};

export const THEME_PAR_DEFAUT = THEMES_PARCOURS.intro;

/**
 * Thème d'un parcours, adapté au mode d'affichage.
 *
 * `primary` et `primaryDark` ne bougent pas : ce sont les couleurs d'identité, et elles
 * tiennent sur clair comme sur sombre. En revanche `tint` et `tintFort`, presque blancs,
 * n'ont de sens qu'en mode clair — en sombre ils deviennent des surfaces sombres teintées.
 * On les DÉRIVE plutôt que de les écrire deux fois : une nouvelle voie suit
 * automatiquement, et les deux modes ne peuvent pas diverger avec le temps.
 */
export function themeDuParcours(parcoursId: string, mode: ModeCouleur = "clair"): ThemeParcours {
  const base = THEMES_PARCOURS[parcoursId] ?? THEME_PAR_DEFAUT;
  if (mode === "clair") return base;
  return {
    ...base,
    tint: voile(base.primary, "sombre", "leger"),
    tintFort: voile(base.primary, "sombre", "fort"),
  };
}

/**
 * Ancien jeu de couleurs neutres, conservé comme alias de la palette claire pour les
 * rares endroits qui ne peuvent pas lire le contexte (valeurs par défaut de navigation,
 * tests). Dans un composant, on passe par `useCouleurs()` : c'est la seule façon de
 * suivre le mode sombre.
 */
export const COULEURS_NEUTRES = PALETTE_CLAIRE;

/** Rayons de bordure, du plus discret au plus rond. */
export const RAYONS = {
  petit: 10,
  moyen: 14,
  grand: 20,
  carte: 22,
  pilule: 999,
} as const;

/** Ombres de la palette claire. Dans un composant, utiliser `couleurs.ombres`. */
export const OMBRES = PALETTE_CLAIRE.ombres;

/** Retour tactile commun à tous les éléments pressables. */
export const PRESSION = { transform: [{ scale: 0.96 }], opacity: 0.92 } as const;

/**
 * Teintes des écrans qui n'appartiennent à aucun parcours : boîte à outils, glossaire,
 * profil, bilan… Elles forment une famille à part — profondes, peu saturées — pour qu'on
 * voie d'un coup d'œil qu'on a quitté un chemin, tout en gardant une identité par écran.
 *
 * Trois arrêts par teinte, du clair au sombre, pour un dégradé en diagonale.
 */
export interface TeinteEcran {
  clair: string;
  moyen: string;
  sombre: string;
}

export const TEINTES_ECRAN: Record<string, TeinteEcran> = {
  outils: { clair: "#4A5468", moyen: "#2E3646", sombre: "#1B2130" },
  glossaire: { clair: "#8763C9", moyen: "#5F44A0", sombre: "#3E2D70" },
  profil: { clair: "#3C7FA8", moyen: "#265E83", sombre: "#17425F" },
  bilan: { clair: "#2E9B78", moyen: "#1B7659", sombre: "#105340" },
  revision: { clair: "#CE8340", moyen: "#A75D22", sombre: "#7C441A" },
  chiffres: { clair: "#5A6AC6", moyen: "#3D4A9C", sombre: "#2A3372" },
  apropos: { clair: "#5C626E", moyen: "#3F444D", sombre: "#2A2D34" },
  recompense: { clair: "#C9A227", moyen: "#9C7C13", sombre: "#6E560B" },
};

export function teinteEcran(cle: string): TeinteEcran {
  return TEINTES_ECRAN[cle] ?? TEINTES_ECRAN.apropos;
}
