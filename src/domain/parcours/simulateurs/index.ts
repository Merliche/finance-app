import type { Simulateur } from "../types";
import { calculerInteretCompose } from "./interetCompose";
import { calculerMensualiteCredit } from "./mensualiteCredit";

const FORMULES: Record<Simulateur["formule"], (valeurs: Record<string, number>) => number> = {
  interet_compose: calculerInteretCompose,
  mensualite_credit: calculerMensualiteCredit,
};

/** Résout la fonction de calcul associée à une formule de simulateur. */
export function resoudreFormule(formule: Simulateur["formule"]): (valeurs: Record<string, number>) => number {
  return FORMULES[formule];
}

export { calculerInteretCompose, calculerMensualiteCredit };
