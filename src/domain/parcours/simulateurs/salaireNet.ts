// Du salaire brut au net à payer — l'écart que personne ne sait expliquer devant sa
// première fiche de paie.
// Variables attendues : brut (€ par mois), cotisations (% retenu sur le brut).
// Net = brut × (1 − cotisations / 100). En France, le taux tourne autour de 22 % pour un
// salarié non cadre et 25 % pour un cadre ; c'est un ordre de grandeur, pas une règle.

export function calculerSalaireNet(valeurs: Record<string, number>): number {
  const { brut, cotisations } = valeurs;
  return brut * (1 - cotisations / 100);
}
