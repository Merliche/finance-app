// Pouvoir d'achat futur d'une somme laissée sans rendement, rongée par l'inflation.
// Variables attendues : capital (€), inflation (% annuel), duree (années).
// Valeur réelle = capital / (1 + inflation)^durée — l'inverse exact des intérêts composés.

export function calculerPouvoirAchat(valeurs: Record<string, number>): number {
  const { capital, inflation, duree } = valeurs;
  return capital / Math.pow(1 + inflation / 100, duree);
}
