// Point mort (seuil de rentabilité) — le chiffre d'affaires à partir duquel une
// entreprise couvre ses charges fixes.
// Variables attendues : chargesFixes (€ par mois), tauxMarge (% de marge brute).
// Point mort = charges fixes / taux de marge. Avec 10 000 € de charges fixes et 40 % de
// marge, il faut 25 000 € de ventes par mois avant de gagner le premier euro.

export function calculerPointMort(valeurs: Record<string, number>): number {
  const { chargesFixes, tauxMarge } = valeurs;
  if (tauxMarge <= 0) return Number.POSITIVE_INFINITY;
  return chargesFixes / (tauxMarge / 100);
}
