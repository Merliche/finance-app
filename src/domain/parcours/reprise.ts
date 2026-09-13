// « Reprendre où j'en étais » : retrouver l'étape exacte sur laquelle l'utilisateur
// s'était arrêté. Sans ça, chaque ouverture de l'app repart de la carte de l'intro, et
// quelqu'un au milieu d'une voie doit re-naviguer à chaque fois.
import type { Etape, Parcours, ProgressionParcours } from "./types";

export interface Reprise {
  parcoursId: string;
  parcoursTitre: string;
  etape: Etape;
}

/**
 * Le parcours commencé mais non terminé sur lequel l'activité est la plus récente, et sa
 * première étape non validée.
 *
 * `derniereActivite` n'existe pas sur les progressions enregistrées par les versions
 * antérieures de l'app : on retombe alors sur `dateDebut`, puis sur la chaîne vide — ces
 * parcours-là passent simplement en dernier, ce qui est le comportement voulu.
 */
export function trouverReprise(
  parcours: Parcours[],
  progression: Record<string, ProgressionParcours | undefined>
): Reprise | undefined {
  const candidats = parcours
    .map((p) => ({ parcours: p, avancement: progression[p.id] }))
    .filter(
      (candidat): candidat is { parcours: Parcours; avancement: ProgressionParcours } =>
        candidat.avancement !== undefined &&
        candidat.avancement.statut === "en_cours" &&
        candidat.avancement.etapesCompletees.length > 0
    )
    .sort((a, b) => horodatage(b.avancement).localeCompare(horodatage(a.avancement)));

  for (const { parcours: p, avancement } of candidats) {
    const validees = new Set(avancement.etapesCompletees);
    const suivante = p.etapes
      .slice()
      .sort((a, b) => a.ordre - b.ordre)
      .find((etape) => !validees.has(etape.id));
    // Un parcours « en cours » dont toutes les étapes sont validées ne devrait pas
    // exister, mais le contenu peut avoir rétréci entre deux versions.
    if (suivante) return { parcoursId: p.id, parcoursTitre: p.titre, etape: suivante };
  }

  return undefined;
}

function horodatage(avancement: ProgressionParcours): string {
  return avancement.derniereActivite ?? avancement.dateDebut ?? "";
}
