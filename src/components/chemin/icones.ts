import type { Ionicons } from "@expo/vector-icons";
import type { Etape } from "../../domain/parcours/types";

type NomIcone = keyof typeof Ionicons.glyphMap;

const ICONE_PAR_TYPE_ETAPE: Record<Etape["type"], NomIcone> = {
  lecon: "book-outline",
  quiz: "help-circle-outline",
  exemple: "calculator-outline",
  situation: "chatbubbles-outline",
  exercice: "pencil-outline",
  scenario: "git-branch-outline",
};

export function iconeEtape(etape: Etape): NomIcone {
  return ICONE_PAR_TYPE_ETAPE[etape.type];
}

const LIBELLE_PAR_TYPE_ETAPE: Record<Etape["type"], string> = {
  lecon: "Leçon",
  quiz: "Quiz",
  exemple: "Simulateur",
  situation: "Mise en situation",
  exercice: "Exercice",
  scenario: "Étude de cas",
};

export function libelleTypeEtape(etape: Etape): string {
  return LIBELLE_PAR_TYPE_ETAPE[etape.type];
}

const ICONE_PAR_VOIE: Record<string, NomIcone> = {
  banque: "business-outline",
  marche: "trending-up-outline",
  entreprise: "briefcase-outline",
  quotidien: "home-outline",
};

export function iconeVoie(voieId: string): NomIcone {
  return ICONE_PAR_VOIE[voieId] ?? "flag-outline";
}
