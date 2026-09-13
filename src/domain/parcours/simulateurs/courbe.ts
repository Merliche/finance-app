// Échantillonnage d'un simulateur pour le tracer en courbe : au lieu d'un seul résultat,
// on évalue la formule sur toute la plage d'une de ses variables. C'est ce qui permet de
// VOIR la forme du phénomène (la boule de neige des intérêts composés, l'effondrement du
// pouvoir d'achat) plutôt que de lire un nombre qui change.
//
// Logique pure, sans React : la même fonction sert à l'étape « exemple » et au
// calculateur libre des éléments latéraux.
import type { FormuleSimulateur, Simulateur, SimulateurVariable } from "../types";
import { resoudreFormule } from ".";

/**
 * Variable portée en abscisse pour chaque formule — celle dont la variation raconte
 * quelque chose. C'est presque toujours la durée ; pour les formules sans temps, c'est
 * la variable dont dépend le plus le résultat.
 */
export const ABSCISSE_PAR_FORMULE: Record<FormuleSimulateur, string> = {
  interet_compose: "duree",
  mensualite_credit: "duree",
  epargne_programmee: "duree",
  regle_72: "taux",
  pouvoir_achat: "duree",
  cout_total_credit: "duree",
  capacite_emprunt: "duree",
  rendement_locatif: "prix",
  point_mort: "tauxMarge",
  salaire_net: "brut",
  // Le loyer, parce que c'est la seule variable sur laquelle on peut vraiment agir : la
  // courbe montre ce que chaque centaine d'euros de loyer coûte en liberté.
  reste_a_vivre: "loyer",
};

export interface EchantillonCourbe {
  /** Points (x = valeur de la variable d'abscisse, y = résultat), x croissants. */
  points: { x: number; y: number }[];
  /** Position actuelle des curseurs sur cette courbe. */
  xCourant: number;
  yCourant: number;
  variable: SimulateurVariable;
}

const NB_POINTS = 28;

/**
 * Évalue la formule sur toute la plage de sa variable d'abscisse, les autres variables
 * restant aux valeurs courantes. Les points non finis sont écartés (la règle des 72 à
 * taux nul, le point mort sans marge) ; s'il en reste moins de deux, il n'y a pas de
 * courbe à tracer et la fonction renvoie `undefined`.
 */
export function echantillonnerSimulateur(
  simulateur: Simulateur,
  valeurs: Record<string, number>
): EchantillonCourbe | undefined {
  const idAbscisse = ABSCISSE_PAR_FORMULE[simulateur.formule];
  const variable = simulateur.variables.find((v) => v.id === idAbscisse);
  if (!variable || variable.max <= variable.min) return undefined;

  const calculer = resoudreFormule(simulateur.formule);
  const points: { x: number; y: number }[] = [];
  for (let index = 0; index < NB_POINTS; index++) {
    const x = variable.min + ((variable.max - variable.min) * index) / (NB_POINTS - 1);
    const y = calculer({ ...valeurs, [variable.id]: x });
    if (Number.isFinite(y)) points.push({ x, y });
  }
  if (points.length < 2) return undefined;

  const yCourant = calculer(valeurs);
  return { points, xCourant: valeurs[variable.id], yCourant, variable };
}
