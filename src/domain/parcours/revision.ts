// Révision des erreurs : retrouver, dans le contenu, les questions que l'utilisateur a
// manquées. Le store ne garde que des identifiants (voir `QuestionRatee`) ; c'est ici
// qu'on les rattache à leur énoncé, et qu'on décide de l'ordre dans lequel les reposer.
import type { Parcours, QuizQuestion } from "./types";

export interface QuestionRateeStockee {
  parcoursId: string;
  etapeId: string;
  nbEchecs: number;
  dernierEchec: string;
}

export interface QuestionARevoir {
  questionId: string;
  parcoursId: string;
  etapeId: string;
  etapeTitre: string;
  nbEchecs: number;
  question: QuizQuestion;
}

/**
 * Les questions à revoir, de la plus tenace à la plus anecdotique : d'abord celles
 * manquées le plus souvent, puis les plus anciennes — celles qu'on a eu le temps
 * d'oublier. Une question dont le contenu a disparu (étape retirée, question renommée
 * lors d'une mise à jour) est simplement ignorée.
 */
export function questionsARevoir(
  ratees: Record<string, QuestionRateeStockee>,
  parcours: Parcours[]
): QuestionARevoir[] {
  const parId = new Map(parcours.map((p) => [p.id, p]));
  const resultat: QuestionARevoir[] = [];

  for (const [questionId, ratee] of Object.entries(ratees)) {
    const etape = parId.get(ratee.parcoursId)?.etapes.find((e) => e.id === ratee.etapeId);
    if (!etape || etape.type !== "quiz") continue;
    const question = etape.quiz.questions.find((q) => q.id === questionId);
    if (!question) continue;

    resultat.push({
      questionId,
      parcoursId: ratee.parcoursId,
      etapeId: ratee.etapeId,
      etapeTitre: etape.titre,
      nbEchecs: ratee.nbEchecs,
      question,
    });
  }

  return resultat.sort((a, b) => {
    if (b.nbEchecs !== a.nbEchecs) return b.nbEchecs - a.nbEchecs;
    return (ratees[a.questionId].dernierEchec ?? "").localeCompare(ratees[b.questionId].dernierEchec ?? "");
  });
}
