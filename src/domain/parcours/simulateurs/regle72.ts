// Règle des 72 — approximation mentale du temps de doublement d'un capital.
// Variables attendues : taux (% annuel).
// Années ≈ 72 / taux. À 6 %, un capital double en ~12 ans ; à 2 %, en 36 ans.
// Un taux nul ou négatif ne double jamais : on renvoie l'infini, que l'UI affiche "—".

export function calculerRegle72(valeurs: Record<string, number>): number {
  const { taux } = valeurs;
  if (taux <= 0) return Number.POSITIVE_INFINITY;
  return 72 / taux;
}
