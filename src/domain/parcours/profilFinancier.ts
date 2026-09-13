// « Mes chiffres à moi » : trois nombres saisis une seule fois, gardés uniquement sur le
// téléphone (voir progressStore), qui personnalisent toute l'app — les simulateurs
// démarrent sur la situation réelle de l'utilisateur, et les montants peuvent être
// traduits en heures de travail.
//
// Aucun de ces champs n'est obligatoire : tout le reste de l'app fonctionne à l'identique
// quand le profil est vide. C'est un bonus, jamais un prérequis.
import type { Simulateur, SimulateurVariable } from "./types";

export interface ProfilFinancier {
  /** Revenu net mensuel, en euros. */
  revenuNet?: number;
  /** Loyer ou mensualité de crédit du logement, en euros par mois. */
  loyer?: number;
  /** Épargne déjà constituée, en euros. */
  epargne?: number;
  dateMaj?: string;
}

export function profilEstRenseigne(profil: ProfilFinancier | undefined): boolean {
  return profil !== undefined && (profil.revenuNet !== undefined || profil.loyer !== undefined || profil.epargne !== undefined);
}

/** Durée légale mensuelle du travail en France (35 h par semaine). */
export const HEURES_MENSUELLES_LEGALES = 151.67;

export function tauxHoraire(revenuNet: number): number {
  return revenuNet / HEURES_MENSUELLES_LEGALES;
}

/**
 * Traduit un montant en temps de travail. C'est la conversion qui marque : « 720 € »
 * reste abstrait, « 47 heures de ton travail » ne l'est pas. On monte l'unité dès que le
 * nombre d'heures devient trop gros pour être ressenti.
 */
export function formaterEffort(montantEuros: number, revenuNet: number): string | undefined {
  if (!Number.isFinite(montantEuros) || montantEuros <= 0 || revenuNet <= 0) return undefined;
  const heures = montantEuros / tauxHoraire(revenuNet);

  // On reste en heures tant que le nombre parle encore (jusqu'à deux semaines de
  // travail) : « 55 h de ton travail » frappe bien plus fort que « 1,6 semaine ».
  if (heures < 1) return `${Math.round(heures * 60)} min de ton travail`;
  if (heures < 80) return `${Math.round(heures)} h de ton travail`;
  if (heures < HEURES_MENSUELLES_LEGALES * 1.5) {
    const semaines = heures / 35;
    return `${semaines.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} semaine${semaines >= 2 ? "s" : ""} de travail`;
  }
  const mois = heures / HEURES_MENSUELLES_LEGALES;
  if (mois < 24) return `${mois.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} mois de salaire`;
  return `${(mois / 12).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} ans de salaire`;
}

/** Arrondit au pas de la variable et ramène dans ses bornes. */
function ajuster(valeur: number, variable: SimulateurVariable): number {
  const arrondi = Math.round(valeur / variable.pas) * variable.pas;
  const decimales = (variable.pas.toString().split(".")[1] ?? "").length;
  return Number(Math.min(Math.max(arrondi, variable.min), variable.max).toFixed(decimales));
}

/**
 * Valeurs de départ d'un simulateur, personnalisées quand le profil le permet. On ne
 * remplace que les variables dont le sens correspond sans ambiguïté à un chiffre saisi —
 * un « montant emprunté » ou un « prix d'achat » ne se déduisent de rien, ils gardent
 * leur valeur d'exemple.
 */
export function valeursDepart(simulateur: Simulateur, profil: ProfilFinancier | undefined): Record<string, number> {
  const base = Object.fromEntries(simulateur.variables.map((variable) => [variable.id, variable.valeurParDefaut]));
  if (!profil) return base;

  for (const variable of simulateur.variables) {
    const personnalisee = valeurPersonnalisee(variable.id, profil);
    if (personnalisee !== undefined) base[variable.id] = ajuster(personnalisee, variable);
  }
  return base;
}

function valeurPersonnalisee(idVariable: string, profil: ProfilFinancier): number | undefined {
  switch (idVariable) {
    case "revenu":
      return profil.revenuNet;
    case "capital":
      return profil.epargne;
    case "loyer":
      return profil.loyer;
    case "versement":
      // Un dixième du revenu : l'ordre de grandeur d'un virement automatique raisonnable,
      // et le point de départ que recommande la session « Bâtir son plan ».
      return profil.revenuNet !== undefined ? profil.revenuNet * 0.1 : undefined;
    default:
      return undefined;
  }
}

/** Les variables d'un simulateur effectivement personnalisées par le profil. */
export function variablesPersonnalisees(simulateur: Simulateur, profil: ProfilFinancier | undefined): string[] {
  if (!profil) return [];
  return simulateur.variables.filter((v) => valeurPersonnalisee(v.id, profil) !== undefined).map((v) => v.id);
}
