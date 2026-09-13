// Moteur de progression — logique pure, sans réseau ni UI, basée sur les types de types.ts.
//
// Règle de complétion par type d'étape (voir PROJECT.md §5, "Condition de complétion
// par type d'étape"), tranchée et implémentée ici via `etapeEstCompletee` :
//   - lecon      : complétée dès l'appel — le "lu jusqu'au bout puis continuer" est
//                  garanti par l'écran (qui n'appelle `completerEtape` qu'à ce moment-là),
//                  il n'y a rien de plus à vérifier côté domaine.
//   - quiz       : complétée si le score fourni atteint `quiz.seuilReussite`.
//   - exemple    : complétée seulement si l'utilisateur a manipulé le simulateur
//                  (`aInteragi`) — la valeur pédagogique vient de l'interaction, pas
//                  de la simple lecture.
//   - situation  : complétée dès qu'un choix existant est sélectionné — `qualite` est
//                  nuancée (recommande/acceptable/deconseille), il n'y a pas de seuil
//                  de réussite, seul le fait d'avoir choisi et vu le feedback compte.
//   - exercice   : comme un quiz, complété si le score atteint `exercice.seuilReussite`.
//   - scenario   : complété dès qu'on est allé au bout des décisions — l'écran n'appelle
//                  `completerEtape` qu'à ce moment-là. Le score sert au bilan narratif,
//                  jamais à valider : aucune trajectoire de vie n'est « ratée ».

import type { Etape, Parcours, ProgressionGlobale, ProgressionParcours } from "./types";

/** Preuve de complétion fournie par l'écran pour une étape, selon son type. */
export type ResultatEtape =
  | { type: "lecon" }
  | { type: "quiz"; score: number }
  | { type: "exemple"; aInteragi: boolean }
  | { type: "situation"; choixSelectionneId: string }
  | { type: "exercice"; score: number }
  | { type: "scenario"; score: number };

/** Vérifie la condition de complétion propre au type de l'étape (règle documentée en tête de fichier). */
export function etapeEstCompletee(etape: Etape, resultat: ResultatEtape): boolean {
  switch (resultat.type) {
    case "lecon":
      return etape.type === "lecon";
    case "quiz":
      return etape.type === "quiz" && resultat.score >= etape.quiz.seuilReussite;
    case "exemple":
      return etape.type === "exemple" && resultat.aInteragi;
    case "situation":
      return (
        etape.type === "situation" &&
        etape.situation.choix.some((choix) => choix.id === resultat.choixSelectionneId)
      );
    case "exercice":
      return etape.type === "exercice" && resultat.score >= etape.exercice.seuilReussite;
    case "scenario":
      return etape.type === "scenario";
  }
}

/** true si toutes les étapes du parcours sont dans `progression.etapesCompletees`. */
export function parcoursEstTermine(parcours: Parcours, progression: ProgressionParcours): boolean {
  return parcours.etapes.every((etape) => progression.etapesCompletees.includes(etape.id));
}

/** Statut dérivé d'un parcours à partir de sa progression. */
export function calculerStatutParcours(
  parcours: Parcours,
  progression: ProgressionParcours
): ProgressionParcours["statut"] {
  if (progression.etapesCompletees.length === 0) {
    return "non_commence";
  }
  return parcoursEstTermine(parcours, progression) ? "termine" : "en_cours";
}

/** true si le parcours est terminé et porte une récompense (un parcours "intro" n'en a pas). */
/**
 * Une voie terminée donne toujours sa fiche de synthèse : la récompense se fabrique à
 * partir du contenu, il n'y a rien à renseigner pour qu'elle existe. L'intro, elle, n'en
 * a pas — elle ouvre la fourche vers les voies, c'est sa conclusion.
 */
export function recompenseEstDebloquee(parcours: Parcours, progression: ProgressionParcours): boolean {
  return progression.statut === "termine" && parcours.type === "voie";
}

/**
 * Marque une étape comme complétée si sa condition de complétion est remplie (voir
 * `etapeEstCompletee`), et retourne la progression du parcours recalculée (étapes
 * complétées, statut, dates, récompense). No-op — retourne `progression` inchangée —
 * si l'étape est inconnue du parcours ou si sa condition de complétion n'est pas remplie.
 * Idempotent : rappeler avec la même étape déjà complétée ne duplique rien et ne
 * réinitialise pas `dateDebut`/`dateFin`.
 *
 * `maintenant` est injecté par l'appelant plutôt que lu via `Date.now()`, pour que la
 * fonction reste pure et testable.
 */
export function completerEtape(
  parcours: Parcours,
  progression: ProgressionParcours,
  etapeId: string,
  resultat: ResultatEtape,
  maintenant: string
): ProgressionParcours {
  const etape = parcours.etapes.find((e) => e.id === etapeId);
  if (!etape || !etapeEstCompletee(etape, resultat)) {
    return progression;
  }

  const etapesCompletees = progression.etapesCompletees.includes(etapeId)
    ? progression.etapesCompletees
    : [...progression.etapesCompletees, etapeId];

  const statut = calculerStatutParcours(parcours, { ...progression, etapesCompletees });

  return {
    ...progression,
    etapesCompletees,
    statut,
    dateDebut: progression.dateDebut ?? maintenant,
    dateFin: statut === "termine" ? progression.dateFin ?? maintenant : progression.dateFin,
    derniereActivite: maintenant,
    recompenseDebloquee: recompenseEstDebloquee(parcours, { ...progression, statut }),
  };
}

/**
 * true si la voie est déverrouillée : soit elle n'a pas de prérequis (cas de "intro"),
 * soit le parcours prérequis est terminé dans la progression globale.
 */
export function voieEstDeverrouillee(parcours: Parcours, progressionGlobale: ProgressionGlobale): boolean {
  if (!parcours.prerequisParcoursId) {
    return true;
  }
  return progressionGlobale.parcours[parcours.prerequisParcoursId]?.statut === "termine";
}
