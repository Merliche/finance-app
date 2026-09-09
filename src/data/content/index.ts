// Registre du contenu bundlé (fallback offline/dev, voir PROJECT.md §2 et §4).
//
// Metro (le bundler RN) exige des chemins de `require`/`import` statiques : on ne peut
// pas faire `require(`./${parcoursId}.json`)`. Le registre ci-dessous est donc la seule
// façon correcte d'indexer les JSON bundlés par id de parcours.
import type { Parcours } from "../../domain/parcours/types";
import introJson from "./intro.json";

const PARCOURS_BUNDLES: Partial<Record<string, Parcours>> = {
  intro: introJson as Parcours,
};

/** Contenu bundlé pour un parcours, ou `undefined` s'il n'a pas (encore) été bundlé. */
export function recupererParcoursBundle(parcoursId: string): Parcours | undefined {
  return PARCOURS_BUNDLES[parcoursId];
}
