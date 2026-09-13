import { tirerDefiDuJour } from "../defi";
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
      { id: "s1-lecon", ordre: 1, titre: "L", type: "lecon", contenu: [] },
      {
        id: "s1-quiz",
        ordre: 2,
        titre: "Q1",
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
      {
        id: "s2-quiz",
        ordre: 3,
        titre: "Q2",
        type: "quiz",
        contenu: [],
        quiz: { seuilReussite: 70, questions: [{ id: "q3", question: "C ?", choix: ["x", "y"], bonneReponseIndex: 0 }] },
      },
    ],
  },
];

describe("tirerDefiDuJour", () => {
  test("ne tire que parmi les quiz éligibles", () => {
    const defi = tirerDefiDuJour("2026-09-11", parcours, (_, etapeId) => etapeId === "s2-quiz");
    expect(defi?.etapeId).toBe("s2-quiz");
    expect(defi?.question.id).toBe("q3");
  });

  test("est déterministe pour un même jour, et varie d'un jour à l'autre", () => {
    const tout = () => true;
    const a = tirerDefiDuJour("2026-09-11", parcours, tout);
    const b = tirerDefiDuJour("2026-09-11", parcours, tout);
    expect(a).toEqual(b);
    const ids = new Set(
      ["2026-09-11", "2026-09-12", "2026-09-13", "2026-09-14", "2026-09-15", "2026-09-16"].map(
        (jour) => tirerDefiDuJour(jour, parcours, tout)?.question.id
      )
    );
    expect(ids.size).toBeGreaterThan(1);
  });

  test("rien d'éligible : pas de défi", () => {
    expect(tirerDefiDuJour("2026-09-11", parcours, () => false)).toBeUndefined();
  });
});
