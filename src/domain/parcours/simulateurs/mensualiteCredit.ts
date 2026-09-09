// Formule "mensualité de crédit" — voir PROJECT.md §5. Variables attendues : montant
// (capital emprunté), taux (% annuel), duree (mois).

export function calculerMensualiteCredit(valeurs: Record<string, number>): number {
  const { montant, taux, duree } = valeurs;
  const tauxMensuel = taux / 100 / 12;

  // Taux nul : pas d'intérêts, la mensualité est juste le capital réparti sur la durée.
  if (tauxMensuel === 0) {
    return montant / duree;
  }

  return (montant * tauxMensuel) / (1 - Math.pow(1 + tauxMensuel, -duree));
}
