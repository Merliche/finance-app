// Défi du jour — une question de quiz tirée du contenu déjà atteint, la même pour toute
// la journée (déterministe à partir de la date, comme le "saviez-vous"), qui rapporte
// une petite prime d'XP une fois par jour. Logique pure : le tirage ne dépend que de ce
// qu'on lui passe, la persistance des défis joués vit dans le store.
import type { Parcours, QuizQuestion } from "./types";

export const XP_PAR_DEFI = 15;

export interface DefiDuJour {
  jour: string;
  parcoursId: string;
  etapeId: string;
  question: QuizQuestion;
  /** true quand la question avait déjà été manquée : le défi sert alors de révision. */
  estUneRevision: boolean;
}

function empreinte(texte: string): number {
  let h = 0;
  for (const caractere of texte) h = (h * 31 + caractere.charCodeAt(0)) % 1000003;
  return h;
}

/**
 * Tire le défi du jour parmi les questions de quiz des étapes `eligibles` (en pratique :
 * celles déjà validées, pour ne jamais interroger sur du contenu jamais vu).
 *
 * Les questions déjà manquées passent devant : si l'utilisateur en a en attente, le défi
 * du jour en pioche une plutôt qu'une question au hasard. C'est le même geste pour lui,
 * mais il travaille ce qu'il ne sait pas. `undefined` si rien n'est encore éligible.
 */
export function tirerDefiDuJour(
  jour: string,
  parcours: Parcours[],
  estEligible: (parcoursId: string, etapeId: string) => boolean,
  questionsRatees: ReadonlySet<string> = new Set()
): DefiDuJour | undefined {
  const candidats: Omit<DefiDuJour, "jour">[] = [];
  for (const p of parcours) {
    for (const etape of p.etapes) {
      if (etape.type !== "quiz" || !estEligible(p.id, etape.id)) continue;
      for (const question of etape.quiz.questions) {
        candidats.push({
          parcoursId: p.id,
          etapeId: etape.id,
          question,
          estUneRevision: questionsRatees.has(question.id),
        });
      }
    }
  }

  const aRevoir = candidats.filter((candidat) => candidat.estUneRevision);
  const panier = aRevoir.length > 0 ? aRevoir : candidats;
  if (panier.length === 0) return undefined;

  return { jour, ...panier[empreinte(jour) % panier.length] };
}
