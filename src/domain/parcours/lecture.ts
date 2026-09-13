// Estimation du temps d'une étape, affichée dans le bandeau ("≈ 3 min") : le lecteur
// sait à quoi il s'engage avant d'ouvrir. Logique pure sur le contenu.
import type { ContenuBloc, Etape } from "./types";

const MOTS_PAR_MINUTE = 190;

function motsDuBloc(bloc: ContenuBloc): number {
  switch (bloc.type) {
    case "texte":
      return compterMots(bloc.texte);
    case "definition":
      return compterMots(bloc.terme) + compterMots(bloc.texte);
    case "exemple_texte":
      return compterMots(bloc.titre) + compterMots(bloc.texte);
    case "liste":
      return bloc.items.reduce((n, item) => n + compterMots(item), 0);
    case "a_retenir":
      return bloc.points.reduce((n, point) => n + compterMots(point), 0);
    case "schema":
      return 40; // le temps de regarder l'animation et de lire la légende
  }
}

function compterMots(texte: string): number {
  return texte.split(/\s+/).filter(Boolean).length;
}

/** Minutes estimées (au moins 1), lecture plus temps d'interaction selon le type. */
export function estimerDureeLecture(etape: Etape): number {
  let mots = etape.contenu.reduce((n, bloc) => n + motsDuBloc(bloc), 0);
  switch (etape.type) {
    case "quiz":
      mots += etape.quiz.questions.reduce((n, q) => n + compterMots(q.question) + q.choix.reduce((m, c) => m + compterMots(c), 0) + 30, 0);
      break;
    case "situation":
      mots += compterMots(etape.situation.contexte) + etape.situation.choix.reduce((n, c) => n + compterMots(c.texte) + compterMots(c.feedback) / 2, 0) + 40;
      break;
    case "exemple":
      mots += 120; // manipuler les curseurs, lire le résultat
      break;
    case "exercice":
      mots += etape.exercice.items.reduce((n, item) => n + compterMots(item.enonce) + compterMots(item.explication) + 60, 0);
      break;
    case "scenario":
      mots +=
        compterMots(etape.scenario.intro) +
        etape.scenario.decisions.reduce(
          (n, decision) =>
            n + compterMots(decision.situation) + decision.options.reduce((m, option) => m + compterMots(option.texte) + compterMots(option.consequence) / 2, 0) + 30,
          0
        );
      break;
    case "lecon":
      break;
  }
  return Math.max(1, Math.round(mots / MOTS_PAR_MINUTE));
}
