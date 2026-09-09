// Formule "intérêts composés" — voir PROJECT.md §5. Variables attendues (ids définis
// côté contenu, dans SimulateurVariable[]) : capital, taux (% annuel), duree (années).

export function calculerInteretCompose(valeurs: Record<string, number>): number {
  const { capital, taux, duree } = valeurs;
  return capital * Math.pow(1 + taux / 100, duree);
}
