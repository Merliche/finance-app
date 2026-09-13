// Regroupement des étapes en sessions, pour l'affichage des bannières sur le chemin.
// Le modèle de données (types.ts) n'a pas de notion de "session" : c'est une convention
// d'affichage dérivée du préfixe "sN-" présent dans les ids d'étape du contenu (voir
// src/data/content/*.json). Les libellés ci-dessous sont de la présentation, pas du
// contenu éditorial — ils vivent donc en code, comme les icônes.
import type { Ionicons } from "@expo/vector-icons";
import type { Etape } from "../domain/parcours/types";

type NomIcone = keyof typeof Ionicons.glyphMap;

export interface InfosSession {
  titre: string;
  icone: NomIcone;
  /** Difficulté affichée (1 à 3) : les voies montent en exigence au fil des sessions. */
  niveau: 1 | 2 | 3;
  /** Une phrase qui donne envie, affichée sur la fiche de session. */
  accroche: string;
}

export const LIBELLE_NIVEAU: Record<InfosSession["niveau"], string> = { 1: "Découverte", 2: "Confirmé", 3: "Expert" };

const SESSIONS_PAR_PARCOURS: Record<string, Record<number, InfosSession>> = {
  intro: {
    1: { titre: "L'argent et le budget", icone: "wallet-outline", niveau: 1, accroche: "Où va ton argent, et comment reprendre la main." },
    2: { titre: "Intérêts simples et composés", icone: "trending-up-outline", niveau: 1, accroche: "Le mécanisme qui fait grossir une épargne toute seule." },
    3: { titre: "L'inflation", icone: "cash-outline", niveau: 1, accroche: "Pourquoi 100 € d'aujourd'hui ne vaudront pas 100 € demain." },
    4: { titre: "Le crédit", icone: "card-outline", niveau: 1, accroche: "Emprunter sans se faire avoir : mensualité, taux, coût total." },
    5: { titre: "Aperçu des 4 mondes", icone: "compass-outline", niveau: 1, accroche: "Quatre voies s'ouvrent : laquelle te ressemble ?" },
  },
  banque: {
    1: { titre: "Le compte au quotidien", icone: "card-outline", niveau: 1, accroche: "Ce que ton compte te coûte sans que tu le voies." },
    2: { titre: "L'épargne de précaution", icone: "shield-checkmark-outline", niveau: 1, accroche: "Le filet de sécurité avant tout rendement." },
    3: { titre: "L'épargne qui dure", icone: "time-outline", niveau: 2, accroche: "Assurance-vie, horizon, et le bon placement pour chaque projet." },
    4: { titre: "Emprunter sans se piéger", icone: "document-text-outline", niveau: 2, accroche: "TAEG, durée, assurance : lire un crédit comme un banquier." },
    5: { titre: "Choisir et piloter sa banque", icone: "business-outline", niveau: 2, accroche: "Traditionnelle, en ligne, néobanque : choisir sans se tromper." },
    6: { titre: "Fiscalité de l'épargne", icone: "receipt-outline", niveau: 3, accroche: "Ce qu'il reste vraiment une fois l'impôt passé." },
    7: { titre: "Immobilier et patrimoine", icone: "home-outline", niveau: 3, accroche: "Emprunter pour un toit : capacité, levier, frais cachés." },
    8: { titre: "Bâtir son plan financier", icone: "map-outline", niveau: 3, accroche: "Tout assembler en un plan qui tient sur une page." },
    9: { titre: "Impôts : lire sa feuille sans peur", icone: "document-attach-outline", niveau: 3, accroche: "Tranches, taux marginal, crédits d'impôt : ce qui change vraiment ta paie." },
  },
  marche: {
    1: { titre: "À quoi sert la bourse", icone: "storefront-outline", niveau: 1, accroche: "La bourse n'est pas un casino : à quoi elle sert vraiment." },
    2: { titre: "Actions et obligations", icone: "document-text-outline", niveau: 1, accroche: "Posséder ou prêter : deux façons d'investir, deux risques." },
    3: { titre: "Risque et rendement", icone: "pulse-outline", niveau: 2, accroche: "La règle que toutes les arnaques violent." },
    4: { titre: "Diversifier", icone: "grid-outline", niveau: 2, accroche: "Le seul repas gratuit de la finance." },
    5: { titre: "Investir en pratique", icone: "rocket-outline", niveau: 2, accroche: "Enveloppes fiscales, et le pire ennemi de l'investisseur : lui-même." },
    6: { titre: "Lire une entreprise", icone: "analytics-outline", niveau: 3, accroche: "Cinq chiffres à lire avant d'y mettre un euro." },
    7: { titre: "Construire un portefeuille", icone: "pie-chart-outline", niveau: 3, accroche: "Répartir, rééquilibrer, et déjouer ses propres biais." },
    8: { titre: "Passer à l'action, prudemment", icone: "shield-half-outline", niveau: 3, accroche: "Faire le premier pas — et repérer une arnaque en trente secondes." },
    9: { titre: "Lire l'économie", icone: "globe-outline", niveau: 3, accroche: "Taux directeurs, inflation, cycles : décoder les nouvelles qui font bouger les marchés." },
  },
  entreprise: {
    1: { titre: "Le rôle de la finance", icone: "briefcase-outline", niveau: 1, accroche: "Pourquoi une entreprise dépense avant d'encaisser." },
    2: { titre: "Lire les comptes", icone: "reader-outline", niveau: 1, accroche: "Bilan et compte de résultat : la photo et le film." },
    3: { titre: "Se financer", icone: "cash-outline", niveau: 2, accroche: "Dette ou capital : ce que chaque euro coûte vraiment." },
    4: { titre: "Créer de la valeur", icone: "trending-up-outline", niveau: 2, accroche: "Distinguer un investissement qui crée de la valeur d'un qui en détruit." },
    5: { titre: "La trésorerie", icone: "wallet-outline", niveau: 2, accroche: "Le paradoxe : rentable, et pourtant à sec." },
    6: { titre: "Valoriser une entreprise", icone: "diamond-outline", niveau: 3, accroche: "Mettre un prix sur une promesse." },
    7: { titre: "Croissance et signaux d'alerte", icone: "warning-outline", niveau: 3, accroche: "Lever des fonds, et voir venir la chute." },
    8: { titre: "Piloter au quotidien", icone: "speedometer-outline", niveau: 3, accroche: "Cinq chiffres par semaine, et l'arithmétique du prix." },
    9: { titre: "Les ratios qui comptent", icone: "stats-chart-outline", niveau: 3, accroche: "Rentabilité, endettement, délais : juger une entreprise en quatre calculs." },
  },
  quotidien: {
    1: { titre: "Lire sa fiche de paie", icone: "document-text-outline", niveau: 1, accroche: "Brut, net, net imposable : enfin comprendre la feuille qu'on reçoit chaque mois." },
    2: { titre: "Se loger", icone: "home-outline", niveau: 1, accroche: "Bail, dépôt de garantie, charges : ce qu'un logement coûte vraiment." },
    3: { titre: "S'assurer", icone: "umbrella-outline", niveau: 1, accroche: "Ce qui est obligatoire, ce qui ne l'est pas, et ce que « tous risques » veut dire." },
    4: { titre: "Repérer les arnaques", icone: "warning-outline", niveau: 2, accroche: "SMS, faux conseiller, fausse amende : les reconnaître en quelques secondes." },
    5: { titre: "Consommer sans se faire avoir", icone: "pricetags-outline", niveau: 2, accroche: "Garanties, rétractation, abonnements oubliés : reprendre la main." },
    6: { titre: "Se déplacer", icone: "car-outline", niveau: 2, accroche: "Acheter, louer, LOA : le coût réel d'une voiture, tout compris." },
    7: { titre: "Se soigner", icone: "medkit-outline", niveau: 2, accroche: "Sécu, mutuelle, reste à charge : qui paie quoi, et combien." },
    8: { titre: "La retraite à 25 ans", icone: "hourglass-outline", niveau: 3, accroche: "Trimestres, points, et pourquoi commencer tôt change tout." },
    9: { titre: "Quand les revenus sont irréguliers", icone: "pulse-outline", niveau: 2, accroche: "Intérim, saison, indépendance : budgéter quand la paie ne tombe pas le 30." },
    10: { titre: "L'argent à deux", icone: "people-outline", niveau: 2, accroche: "Compte joint, PACS, mariage : qui paie quoi, et qui possède quoi." },
    11: { titre: "Les aides auxquelles tu as droit", icone: "hand-left-outline", niveau: 2, accroche: "Un ayant droit sur trois ne demande rien. Dix minutes pour vérifier." },
    12: { titre: "Ta première année seul", icone: "compass-outline", niveau: 3, accroche: "Un budget qui tient, et une année entière de décisions à prendre." },
  },
};

export function infosSession(parcoursId: string, session: number): InfosSession | undefined {
  return SESSIONS_PAR_PARCOURS[parcoursId]?.[session];
}

// Accepte aussi bien "s1-lecon-x" (intro) que "banque-s1-lecon-x" (voies).
const PREFIXE_SESSION = /(?:^|-)s(\d+)-/;

export function sessionDeEtape(etape: Etape): number | null {
  const correspondance = PREFIXE_SESSION.exec(etape.id);
  return correspondance ? Number(correspondance[1]) : null;
}

/**
 * Sessions "atteintes" d'un parcours : celles qui contiennent au moins une étape validée,
 * ou l'étape en cours (la première non validée). C'est le critère de déverrouillage des
 * éléments latéraux — le même que celui de la map.
 */
export function sessionsAtteintes(etapes: Etape[], etapesCompletees: string[]): Set<number> {
  const triees = etapes.slice().sort((a, b) => a.ordre - b.ordre);
  const completees = new Set(etapesCompletees);
  const atteintes = new Set<number>();
  let actuelleTrouvee = false;
  for (const etape of triees) {
    const session = sessionDeEtape(etape);
    const validee = completees.has(etape.id);
    const estActuelle = !validee && !actuelleTrouvee;
    if (estActuelle) actuelleTrouvee = true;
    if (session !== null && (validee || estActuelle)) atteintes.add(session);
  }
  return atteintes;
}
