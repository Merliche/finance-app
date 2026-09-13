// Chargement des éléments latéraux — contenu bundlé, pas de backend pour l'instant
// (contrairement aux parcours) : ajouter/modifier un élément se fait uniquement en
// éditant elementsLateraux.json, sans toucher au code.
import type { ElementLateral, ElementSaviezVous } from "../../domain/elementsLateraux/types";
import elementsJson from "./elementsLateraux.json";

const TOUS_LES_ELEMENTS = elementsJson as ElementLateral[];

export function obtenirElementsLateraux(parcoursId: string): ElementLateral[] {
  return TOUS_LES_ELEMENTS.filter((element) => element.parcoursId === parcoursId);
}

export function obtenirTousLesElementsLateraux(): ElementLateral[] {
  return TOUS_LES_ELEMENTS;
}

/**
 * "Le saviez-vous" du jour : la même anecdote pour toute la journée, une autre le
 * lendemain — déterministe à partir de la date, sans rien stocker.
 */
export function saviezVousDuJour(jour: string): ElementSaviezVous | undefined {
  const anecdotes = TOUS_LES_ELEMENTS.filter((e): e is ElementSaviezVous => e.type === "saviez_vous");
  if (anecdotes.length === 0) return undefined;
  let empreinte = 0;
  for (const caractere of jour) empreinte = (empreinte * 31 + caractere.charCodeAt(0)) % 100003;
  return anecdotes[empreinte % anecdotes.length];
}
