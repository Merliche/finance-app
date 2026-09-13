// Formule "épargne programmée" — un versement fixe chaque mois, capitalisé mensuellement.
// Variables attendues : versement (€ par mois), taux (% annuel), duree (années).
// Valeur acquise = versement × ((1 + r)^n − 1) / r, avec r le taux mensuel et n le nombre
// de mois. C'est la réponse à la question la plus posée en éducation financière :
// « combien j'aurai si je mets X € par mois ? »

export function calculerEpargneProgrammee(valeurs: Record<string, number>): number {
  const { versement, taux, duree } = valeurs;
  const tauxMensuel = taux / 100 / 12;
  const nombreMois = duree * 12;

  if (tauxMensuel === 0) {
    return versement * nombreMois;
  }

  return versement * ((Math.pow(1 + tauxMensuel, nombreMois) - 1) / tauxMensuel);
}
