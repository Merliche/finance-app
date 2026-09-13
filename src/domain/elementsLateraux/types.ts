// Types des éléments latéraux de la map (calculateurs, comparateurs, "saviez-vous",
// glossaire, badges) — contenu bonus optionnel affiché à côté du chemin principal, sans
// lien avec la progression/complétion (contrairement aux étapes d'un Parcours). Types
// purs uniquement, comme domain/parcours/types.ts : aucune logique ici.
import type { Simulateur } from "../parcours/types";

export type TypeElementLateral = "calculateur" | "comparateur" | "saviez_vous" | "glossaire" | "badge";

interface ElementLateralBase {
  id: string;
  parcoursId: string;
  session: number; // se débloque quand cette session du parcours est atteinte
  titre: string;
}

/** Mini-outil autonome réutilisant une formule de simulateur existante (voir simulateurs/). */
export interface ElementCalculateur extends ElementLateralBase {
  type: "calculateur";
  description: string;
  simulateur: Simulateur;
}

export interface OptionComparateur {
  label: string;
  points: string[];
}

/** Comparaison de deux options côte à côte (ex: Livret A vs inflation). */
export interface ElementComparateur extends ElementLateralBase {
  type: "comparateur";
  optionA: OptionComparateur;
  optionB: OptionComparateur;
  conclusion?: string;
}

/** Anecdote ou fait de finance débloqué à la découverte. */
export interface ElementSaviezVous extends ElementLateralBase {
  type: "saviez_vous";
  anecdote: string;
}

export interface EntreeGlossaire {
  terme: string;
  definition: string;
}

/** Accès rapide à une ou plusieurs définitions déjà vues dans les leçons. */
export interface ElementGlossaire extends ElementLateralBase {
  type: "glossaire";
  entrees: EntreeGlossaire[];
}

/** Marque de progression franchie (pas de mécanique, juste une reconnaissance). */
export interface ElementBadge extends ElementLateralBase {
  type: "badge";
  description: string;
}

export type ElementLateral =
  | ElementCalculateur
  | ElementComparateur
  | ElementSaviezVous
  | ElementGlossaire
  | ElementBadge;
