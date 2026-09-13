import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";

import { useProgressStore } from "../state/progressStore";
import { palette, type Couleurs, type ModeCouleur, type PreferenceTheme } from "./palettes";

export type { PreferenceTheme };

interface ValeurContexte {
  mode: ModeCouleur;
  couleurs: Couleurs;
}

// Valeur de repli : un composant monté hors du fournisseur (un test unitaire, par
// exemple) rend en clair plutôt que de lever.
const REPLI: ValeurContexte = { mode: "clair", couleurs: palette("clair") };

const Contexte = createContext<ValeurContexte>(REPLI);

/**
 * Rend la palette active disponible à tout l'arbre. À monter une seule fois, au-dessus de
 * la navigation.
 *
 * Le mode effectif se décide ici, à un seul endroit : la préférence enregistrée, et si
 * elle vaut « système », le réglage du téléphone. Aucun composant n'a à connaître cette
 * règle, ils demandent seulement des couleurs.
 */
export function FournisseurTheme({ children }: { children: ReactNode }) {
  const preference = useProgressStore((etat) => etat.preferenceTheme);
  const systeme = useColorScheme();

  const valeur = useMemo<ValeurContexte>(() => {
    const mode: ModeCouleur =
      preference === "systeme" ? (systeme === "dark" ? "sombre" : "clair") : preference;
    return { mode, couleurs: palette(mode) };
  }, [preference, systeme]);

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

/** La palette active. */
export function useCouleurs(): Couleurs {
  return useContext(Contexte).couleurs;
}

/** Le mode effectif, une fois la préférence et le réglage système combinés. */
export function useMode(): ModeCouleur {
  return useContext(Contexte).mode;
}

export function useEstSombre(): boolean {
  return useContext(Contexte).mode === "sombre";
}

// Les feuilles de style sont construites une fois par palette, pas une fois par rendu :
// `StyleSheet.create` enregistre ses styles côté natif, et le refaire à chaque image
// annulerait tout l'intérêt de la feuille. Deux entrées suffisent — il n'y a que deux
// palettes — et elles vivent aussi longtemps que l'application.
const cache = new WeakMap<Couleurs, WeakMap<object, unknown>>();

/**
 * Construit (ou retrouve) la feuille de style d'un composant pour la palette active.
 *
 * Chaque composant déclare `const creerStyles = (couleurs: Couleurs) => StyleSheet.create({…})`
 * au niveau module, puis appelle `useStyles(creerStyles)`. La fabrique étant stable, le
 * résultat est calculé une fois par palette et par composant, jamais davantage.
 */
export function useStyles<T extends object>(fabrique: (couleurs: Couleurs) => T): T {
  const couleurs = useCouleurs();
  let parFabrique = cache.get(couleurs);
  if (!parFabrique) {
    parFabrique = new WeakMap();
    cache.set(couleurs, parFabrique);
  }
  let styles = parFabrique.get(fabrique) as T | undefined;
  if (!styles) {
    styles = fabrique(couleurs);
    parFabrique.set(fabrique, styles);
  }
  return styles;
}
