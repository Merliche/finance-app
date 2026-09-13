// Mécaniques d'engagement — XP, niveau, série de jours. Logique pure, dérivée de la
// progression persistée : rien de nouveau à stocker pour l'XP (elle se recalcule), seuls
// les jours d'activité sont mémorisés (voir progressStore).
import type { ProgressionParcours } from "./types";
import { XP_PAR_DEFI } from "./defi";

export const XP_PAR_ETAPE = 20;
export const XP_PAR_NIVEAU = 100;

/**
 * XP totale : chaque étape validée, tous parcours confondus, rapporte la même chose,
 * plus une prime par défi du jour relevé.
 */
export function calculerXp(progression: Record<string, ProgressionParcours>, nbDefisReussis = 0): number {
  const xpEtapes = Object.values(progression).reduce((total, p) => total + p.etapesCompletees.length * XP_PAR_ETAPE, 0);
  return xpEtapes + nbDefisReussis * XP_PAR_DEFI;
}

export function niveauDepuisXp(xp: number): { niveau: number; xpDansNiveau: number; xpPourSuivant: number } {
  return {
    niveau: Math.floor(xp / XP_PAR_NIVEAU) + 1,
    xpDansNiveau: xp % XP_PAR_NIVEAU,
    xpPourSuivant: XP_PAR_NIVEAU,
  };
}

/** Date locale au format AAAA-MM-JJ — la seule chose qui compte pour une série est le jour, pas l'heure. */
export function jourLocal(date: Date): string {
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mois}-${jour}`;
}

function jourPrecedent(jour: string): string {
  const [a, m, j] = jour.split("-").map(Number);
  const date = new Date(a, m - 1, j - 1);
  return jourLocal(date);
}

/**
 * Longueur de la série de jours consécutifs d'activité se terminant aujourd'hui — ou
 * hier : on ne casse pas la série de quelqu'un qui n'a simplement pas encore ouvert
 * l'app aujourd'hui.
 */
export function calculerSerie(joursActifs: string[], aujourdhui: string): number {
  const jours = new Set(joursActifs);
  let curseur = jours.has(aujourdhui) ? aujourdhui : jourPrecedent(aujourdhui);
  if (!jours.has(curseur)) return 0;

  let serie = 0;
  while (jours.has(curseur)) {
    serie += 1;
    curseur = jourPrecedent(curseur);
  }
  return serie;
}
