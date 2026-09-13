// Coût total d'un crédit : ce qu'on paie en plus du capital emprunté.
// Variables attendues : montant (€), taux (% annuel), duree (mois) — les mêmes que la
// mensualité, dont ce calcul dérive : coût = mensualité × durée − montant.
import { calculerMensualiteCredit } from "./mensualiteCredit";

export function calculerCoutTotalCredit(valeurs: Record<string, number>): number {
  const mensualite = calculerMensualiteCredit(valeurs);
  return mensualite * valeurs.duree - valeurs.montant;
}
