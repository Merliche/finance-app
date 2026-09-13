import { questionsARevoir } from "../revision";
import type { Parcours } from "../types";

const parcours: Parcours[] = [
  {
    id: "intro",
    titre: "Intro",
    description: "",
    ordre: 0,
    type: "intro",
    version: 1,
    etapes: [
      {
        id: "s1-quiz",
        ordre: 1,
        titre: "Quiz · Budget",
        type: "quiz",
        contenu: [],
        quiz: {
          seuilReussite: 70,
          questions: [
            { id: "q1", question: "A ?", choix: ["x", "y"], bonneReponseIndex: 0 },
            { id: "q2", question: "B ?", choix: ["x", "y"], bonneReponseIndex: 1 },
          ],
        },
      },
      { id: "s1-lecon", ordre: 2, titre: "Leçon", type: "lecon", contenu: [] },
    ],
  },
];

const ratee = (nbEchecs: number, dernierEchec: string) => ({
  parcoursId: "intro",
  etapeId: "s1-quiz",
  nbEchecs,
  dernierEchec,
});

describe("questionsARevoir", () => {
  test("rattache chaque question ratée à son énoncé et à son étape", () => {
    const [premiere] = questionsARevoir({ q1: ratee(1, "2026-09-01") }, parcours);
    expect(premiere.question.question).toBe("A ?");
    expect(premiere.etapeTitre).toBe("Quiz · Budget");
  });

  test("les questions les plus souvent manquées passent devant", () => {
    const file = questionsARevoir({ q1: ratee(1, "2026-09-05"), q2: ratee(3, "2026-09-05") }, parcours);
    expect(file.map((q) => q.questionId)).toEqual(["q2", "q1"]);
  });

  test("à égalité d'échecs, la plus ancienne passe devant", () => {
    const file = questionsARevoir({ q1: ratee(2, "2026-09-09"), q2: ratee(2, "2026-09-02") }, parcours);
    expect(file.map((q) => q.questionId)).toEqual(["q2", "q1"]);
  });

  test("une question disparue du contenu est ignorée plutôt que de faire planter l'écran", () => {
    const file = questionsARevoir(
      { q1: ratee(1, "2026-09-01"), disparue: ratee(1, "2026-09-01"), ailleurs: { ...ratee(1, "2026-09-01"), parcoursId: "inconnu" } },
      parcours
    );
    expect(file.map((q) => q.questionId)).toEqual(["q1"]);
  });

  test("rien à réviser donne une file vide", () => {
    expect(questionsARevoir({}, parcours)).toEqual([]);
  });
});
