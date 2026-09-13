// Reste à vivre : ce qu'il reste vraiment une fois le logement et les charges fixes
// payés. C'est le chiffre qui décide de tout le reste — un budget ne se juge jamais sur
// le revenu, mais sur ce qui survit aux prélèvements automatiques.
// Variables attendues : revenu (€ par mois), loyer (€ par mois), charges (€ par mois).
// Le résultat peut être négatif : c'est précisément l'information utile.

export function calculerResteAVivre(valeurs: Record<string, number>): number {
  const { revenu, loyer, charges } = valeurs;
  return revenu - loyer - charges;
}
