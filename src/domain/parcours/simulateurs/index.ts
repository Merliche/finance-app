import type { FormuleSimulateur } from "../types";
import { calculerCapaciteEmprunt } from "./capaciteEmprunt";
import { calculerCoutTotalCredit } from "./coutTotalCredit";
import { calculerEpargneProgrammee } from "./epargneProgrammee";
import { calculerInteretCompose } from "./interetCompose";
import { calculerMensualiteCredit } from "./mensualiteCredit";
import { calculerPointMort } from "./pointMort";
import { calculerPouvoirAchat } from "./pouvoirAchat";
import { calculerRegle72 } from "./regle72";
import { calculerRendementLocatif } from "./rendementLocatif";
import { calculerResteAVivre } from "./resteAVivre";
import { calculerSalaireNet } from "./salaireNet";

const FORMULES: Record<FormuleSimulateur, (valeurs: Record<string, number>) => number> = {
  interet_compose: calculerInteretCompose,
  mensualite_credit: calculerMensualiteCredit,
  epargne_programmee: calculerEpargneProgrammee,
  regle_72: calculerRegle72,
  pouvoir_achat: calculerPouvoirAchat,
  cout_total_credit: calculerCoutTotalCredit,
  capacite_emprunt: calculerCapaciteEmprunt,
  rendement_locatif: calculerRendementLocatif,
  point_mort: calculerPointMort,
  salaire_net: calculerSalaireNet,
  reste_a_vivre: calculerResteAVivre,
};

/** Variables que chaque formule attend — sert à valider le contenu (scripts) et à documenter. */
export const VARIABLES_PAR_FORMULE: Record<FormuleSimulateur, readonly string[]> = {
  interet_compose: ["capital", "taux", "duree"],
  mensualite_credit: ["montant", "taux", "duree"],
  epargne_programmee: ["versement", "taux", "duree"],
  regle_72: ["taux"],
  pouvoir_achat: ["capital", "inflation", "duree"],
  cout_total_credit: ["montant", "taux", "duree"],
  capacite_emprunt: ["revenu", "taux", "duree"],
  rendement_locatif: ["loyer", "prix"],
  point_mort: ["chargesFixes", "tauxMarge"],
  salaire_net: ["brut", "cotisations"],
  reste_a_vivre: ["revenu", "loyer", "charges"],
};

/** Résout la fonction de calcul associée à une formule de simulateur. */
export function resoudreFormule(formule: FormuleSimulateur): (valeurs: Record<string, number>) => number {
  return FORMULES[formule];
}

/**
 * Affichage d'un résultat de simulateur : nombre formaté à la française, ou "—" pour
 * un résultat non fini (règle des 72 à taux nul, point mort sans marge…).
 */
export function formaterResultat(valeur: number, unite?: string): string {
  if (!Number.isFinite(valeur)) return "—";
  const decimales = Math.abs(valeur) >= 1000 ? 0 : Math.abs(valeur) >= 100 ? 1 : 2;
  const texte = valeur.toLocaleString("fr-FR", { maximumFractionDigits: decimales });
  return unite ? `${texte} ${unite}` : texte;
}

export {
  calculerCapaciteEmprunt,
  calculerCoutTotalCredit,
  calculerEpargneProgrammee,
  calculerInteretCompose,
  calculerMensualiteCredit,
  calculerPointMort,
  calculerPouvoirAchat,
  calculerRegle72,
  calculerRendementLocatif,
  calculerResteAVivre,
  calculerSalaireNet,
};
