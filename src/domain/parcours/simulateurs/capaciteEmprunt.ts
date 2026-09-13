// Capacité d'emprunt immobilier — le montant qu'une banque prête avec un taux
// d'endettement de 35 % (la norme française du HCSF).
// Variables attendues : revenu (€ nets par mois), taux (% annuel), duree (années).
// Mensualité max = 35 % du revenu ; montant = mensualité × (1 − (1 + i)^−n) / i,
// avec i le taux mensuel et n le nombre de mois (formule de la mensualité inversée).

const TAUX_ENDETTEMENT_MAX = 0.35;

export function calculerCapaciteEmprunt(valeurs: Record<string, number>): number {
  const { revenu, taux, duree } = valeurs;
  const mensualiteMax = revenu * TAUX_ENDETTEMENT_MAX;
  const tauxMensuel = taux / 100 / 12;
  const nombreMois = duree * 12;

  if (tauxMensuel === 0) {
    return mensualiteMax * nombreMois;
  }

  return (mensualiteMax * (1 - Math.pow(1 + tauxMensuel, -nombreMois))) / tauxMensuel;
}
