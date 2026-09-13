import { Easing } from "react-native";

/**
 * Jetons de mouvement. Une application a l'air « faite d'une pièce » quand tout y bouge
 * avec le même vocabulaire : une poignée de durées, deux ou trois courbes, trois ressorts.
 * Dès qu'on écrit une durée au cas par cas, l'écran suivant bouge un peu autrement, et
 * l'ensemble paraît bricolé sans qu'on sache dire pourquoi.
 *
 * Règle de lecture : plus un élément est gros, plus il se déplace lentement. Un bouton qui
 * s'enfonce est instantané ; une feuille qui monte prend son temps.
 */
export const DUREES = {
  /** Retour tactile, bascule d'état : il ne doit pas y avoir d'attente perçue. */
  eclair: 150,
  /** Apparition d'un petit élément, changement de couleur, réaction à une réponse. */
  courte: 260,
  /** Entrée d'une carte, d'un bloc de contenu. */
  moyenne: 420,
  /** Remplissage d'une barre, compteur qui monte : assez long pour qu'on le regarde. */
  longue: 760,
  /** Mouvements de décor, respirations lentes. */
  ample: 1400,
} as const;

export const COURBES = {
  /** Démarre vite, finit en douceur. Le défaut pour tout ce qui entre à l'écran. */
  sortie: Easing.out(Easing.cubic),
  /** Démarre doucement, finit vite. Pour ce qui quitte l'écran. */
  entree: Easing.in(Easing.cubic),
  /** Symétrique. Pour les allers-retours qui ne doivent pas avoir de début ni de fin. */
  douce: Easing.inOut(Easing.sin),
  /** Accélération franche. Pour ce qui tombe ou se rétracte. */
  vive: Easing.in(Easing.quad),
} as const;

/**
 * Configurations de ressort, en paramètres `Animated.spring`. Trois intentions, pas
 * davantage : un ressort par situation suffit, et le quatrième est toujours celui qui
 * fait dériver l'ensemble.
 */
export const RESSORTS = {
  /** Arrivée posée, sans rebond : cartes, feuilles, panneaux. */
  doux: { speed: 14, bounciness: 4 },
  /** Rebond franc : célébrations, badges, éléments qui surgissent. */
  rebond: { speed: 16, bounciness: 11 },
  /** Réponse immédiate, sans oscillation : enfoncement d'un bouton. */
  ferme: { speed: 40, bounciness: 0 },
} as const;

/** Décalage entre deux éléments d'une même liste qui entrent en cascade. */
export const DECALAGE_CASCADE = 55;

/**
 * Retard d'entrée du n-ième élément d'une liste. Le plafond est ce qui rend la cascade
 * utilisable sur une longue liste : sans lui, le quarantième élément attendrait deux
 * secondes, et l'écran paraîtrait lent au lieu de paraître vivant.
 */
export function delaiCascade(index: number, base = 0, plafond = 8): number {
  return base + Math.min(Math.max(index, 0), plafond) * DECALAGE_CASCADE;
}
