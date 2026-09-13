// Rendement locatif brut d'un bien immobilier.
// Variables attendues : loyer (€ par mois), prix (€, achat frais compris).
// Rendement brut = loyer annuel / prix × 100. "Brut" : avant charges, taxe foncière,
// vacance et impôt — le rendement net est en général 30 à 40 % plus bas.

export function calculerRendementLocatif(valeurs: Record<string, number>): number {
  const { loyer, prix } = valeurs;
  if (prix <= 0) return 0;
  return ((loyer * 12) / prix) * 100;
}
