// Traçabilité des chiffres : le contenu cite des centaines de montants et de taux
// réglementaires, qui périment. Ces fonctions servent à dire *quand* ils ont été
// vérifiés et *où* on peut les revérifier soi-même.
import type { Parcours, SourceParcours } from "./types";

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** « 2026-09-12 » → « septembre 2026 ». Le jour n'apporte rien pour un barème annuel. */
export function formaterMoisAnnee(date: string): string | undefined {
  const correspondance = /^(\d{4})-(\d{2})-\d{2}$/.exec(date);
  if (!correspondance) return undefined;
  const mois = Number(correspondance[2]);
  if (mois < 1 || mois > 12) return undefined;
  return `${MOIS[mois - 1]} ${correspondance[1]}`;
}

/**
 * La plus ancienne date de vérification parmi les parcours fournis : c'est elle qui dit
 * l'âge réel de l'information affichée. Annoncer la plus récente serait flatteur et faux.
 */
export function verificationLaPlusAncienne(parcours: Parcours[]): string | undefined {
  const dates = parcours.map((p) => p.chiffresVerifiesLe).filter((date): date is string => typeof date === "string");
  return dates.length > 0 ? dates.sort()[0] : undefined;
}

/** Sources de tous les parcours, dédoublonnées par URL et triées par libellé. */
export function sourcesUniques(parcours: Parcours[]): SourceParcours[] {
  const parUrl = new Map<string, SourceParcours>();
  for (const p of parcours) {
    for (const source of p.sources ?? []) {
      if (!parUrl.has(source.url)) parUrl.set(source.url, source);
    }
  }
  return [...parUrl.values()].sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));
}
