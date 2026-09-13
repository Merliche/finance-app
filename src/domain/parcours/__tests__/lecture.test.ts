import { estimerDureeLecture } from "../lecture";
import type { Etape } from "../types";

const mots = (n: number) => Array.from({ length: n }, () => "mot").join(" ");

describe("estimerDureeLecture", () => {
  test("une étape quasi vide dure au moins une minute", () => {
    const etape: Etape = { id: "a", ordre: 1, titre: "T", type: "lecon", contenu: [] };
    expect(estimerDureeLecture(etape)).toBe(1);
  });

  test("compte les mots de tous les types de blocs", () => {
    const court: Etape = { id: "a", ordre: 1, titre: "T", type: "lecon", contenu: [{ type: "texte", texte: mots(200) }] };
    const long: Etape = {
      ...court,
      contenu: [
        { type: "texte", texte: mots(200) },
        { type: "definition", terme: "X", texte: mots(200) },
        { type: "liste", items: [mots(100), mots(100)] },
        { type: "a_retenir", points: [mots(50), mots(50)] },
      ],
    };
    expect(estimerDureeLecture(long)).toBeGreaterThan(estimerDureeLecture(court));
  });

  test("un quiz ajoute du temps de réflexion par rapport à la même leçon", () => {
    const contenu = [{ type: "texte" as const, texte: mots(100) }];
    const lecon: Etape = { id: "a", ordre: 1, titre: "T", type: "lecon", contenu };
    const quiz: Etape = {
      id: "b",
      ordre: 2,
      titre: "T",
      type: "quiz",
      contenu,
      quiz: {
        seuilReussite: 70,
        questions: Array.from({ length: 6 }, (_, index) => ({
          id: `q${index}`,
          question: mots(20),
          choix: [mots(5), mots(5), mots(5)],
          bonneReponseIndex: 0,
        })),
      },
    };
    expect(estimerDureeLecture(quiz)).toBeGreaterThan(estimerDureeLecture(lecon));
  });

  test("les schémas comptent comme un temps d'observation, même sans texte", () => {
    const texte = { type: "texte" as const, texte: mots(180) };
    const schema = { type: "schema" as const, schema: { kind: "barres" as const, barres: [{ label: "A", valeur: 1 }] } };
    const sans: Etape = { id: "a", ordre: 1, titre: "T", type: "lecon", contenu: [texte] };
    const avec: Etape = { ...sans, contenu: [texte, schema, schema, schema, schema, schema] };
    expect(estimerDureeLecture(avec)).toBeGreaterThan(estimerDureeLecture(sans));
  });
});
