import {
  calculerStatutParcours,
  completerEtape,
  etapeEstCompletee,
  parcoursEstTermine,
  voieEstDeverrouillee,
} from "../progress";
import type { Etape, Parcours, ProgressionGlobale, ProgressionParcours } from "../types";

const lecon: Etape = { id: "l1", ordre: 1, titre: "Leçon", type: "lecon", contenu: [] };
const quiz: Etape = {
  id: "q1",
  ordre: 2,
  titre: "Quiz",
  type: "quiz",
  contenu: [],
  quiz: { questions: [], seuilReussite: 70 },
};
const exemple: Etape = {
  id: "e1",
  ordre: 3,
  titre: "Exemple",
  type: "exemple",
  contenu: [],
  simulateur: { formule: "interet_compose", variables: [], resultat: { label: "x" } },
};
const situation: Etape = {
  id: "s1",
  ordre: 4,
  titre: "Situation",
  type: "situation",
  contenu: [],
  situation: {
    contexte: "…",
    choix: [{ id: "a", texte: "A", feedback: "…", qualite: "recommande" }],
  },
};

const exercice: Etape = {
  id: "x1",
  ordre: 5,
  titre: "Exercice",
  type: "exercice",
  contenu: [],
  exercice: {
    seuilReussite: 60,
    items: [{ id: "i1", type: "vrai_faux", enonce: "…", reponse: true, explication: "…" }],
  },
};

const voie: Parcours = {
  id: "banque",
  titre: "Banque",
  description: "",
  ordre: 1,
  type: "voie",
  prerequisParcoursId: "intro",
  version: 1,
  etapes: [lecon, quiz, exemple, situation],
  // Pas de champ `recompense` : la récompense d'une voie est sa fiche de synthèse,
  // fabriquée à partir du contenu. Rien n'est à renseigner pour qu'elle existe.
};

const vierge: ProgressionParcours = {
  parcoursId: "banque",
  etapesCompletees: [],
  statut: "non_commence",
  recompenseDebloquee: false,
};

const T0 = "2026-01-01T00:00:00.000Z";

describe("etapeEstCompletee — règle par type d'étape", () => {
  test("une leçon est complétée dès l'appel", () => {
    expect(etapeEstCompletee(lecon, { type: "lecon" })).toBe(true);
  });

  test("un quiz exige le seuil de réussite", () => {
    expect(etapeEstCompletee(quiz, { type: "quiz", score: 69 })).toBe(false);
    expect(etapeEstCompletee(quiz, { type: "quiz", score: 70 })).toBe(true);
  });

  test("un exemple exige d'avoir manipulé le simulateur", () => {
    expect(etapeEstCompletee(exemple, { type: "exemple", aInteragi: false })).toBe(false);
    expect(etapeEstCompletee(exemple, { type: "exemple", aInteragi: true })).toBe(true);
  });

  test("une situation exige un choix existant", () => {
    expect(etapeEstCompletee(situation, { type: "situation", choixSelectionneId: "inconnu" })).toBe(false);
    expect(etapeEstCompletee(situation, { type: "situation", choixSelectionneId: "a" })).toBe(true);
  });

  test("un exercice exige le seuil de réussite, comme un quiz", () => {
    expect(etapeEstCompletee(exercice, { type: "exercice", score: 50 })).toBe(false);
    expect(etapeEstCompletee(exercice, { type: "exercice", score: 60 })).toBe(true);
    expect(etapeEstCompletee(quiz, { type: "exercice", score: 100 })).toBe(false);
  });

  test("un résultat du mauvais type ne complète jamais", () => {
    expect(etapeEstCompletee(quiz, { type: "lecon" })).toBe(false);
  });
});

describe("completerEtape", () => {
  test("passe le parcours en 'en_cours' et pose dateDebut à la première étape", () => {
    const apres = completerEtape(voie, vierge, "l1", { type: "lecon" }, T0);
    expect(apres.etapesCompletees).toEqual(["l1"]);
    expect(apres.statut).toBe("en_cours");
    expect(apres.dateDebut).toBe(T0);
    expect(apres.dateFin).toBeUndefined();
    expect(apres.recompenseDebloquee).toBe(false);
  });

  test("est un no-op si la condition de complétion n'est pas remplie", () => {
    const apres = completerEtape(voie, vierge, "q1", { type: "quiz", score: 10 }, T0);
    expect(apres).toBe(vierge);
  });

  test("est un no-op pour une étape inconnue du parcours", () => {
    expect(completerEtape(voie, vierge, "nexistepas", { type: "lecon" }, T0)).toBe(vierge);
  });

  test("est idempotent : rejouer une étape ne la duplique pas et garde dateDebut", () => {
    const une = completerEtape(voie, vierge, "l1", { type: "lecon" }, T0);
    const deux = completerEtape(voie, une, "l1", { type: "lecon" }, "2026-02-02T00:00:00.000Z");
    expect(deux.etapesCompletees).toEqual(["l1"]);
    expect(deux.dateDebut).toBe(T0);
  });

  test("termine le parcours, pose dateFin et débloque la récompense à la dernière étape", () => {
    let p = completerEtape(voie, vierge, "l1", { type: "lecon" }, T0);
    p = completerEtape(voie, p, "q1", { type: "quiz", score: 100 }, T0);
    p = completerEtape(voie, p, "e1", { type: "exemple", aInteragi: true }, T0);
    expect(p.statut).toBe("en_cours");
    const fin = "2026-03-03T00:00:00.000Z";
    p = completerEtape(voie, p, "s1", { type: "situation", choixSelectionneId: "a" }, fin);
    expect(p.statut).toBe("termine");
    expect(p.dateFin).toBe(fin);
    expect(p.recompenseDebloquee).toBe(true);
    expect(parcoursEstTermine(voie, p)).toBe(true);
  });

  test("terminer l'intro ne débloque pas de fiche", () => {
    // L'intro se conclut sur l'ouverture des voies, pas sur une fiche de synthèse.
    const intro: Parcours = { ...voie, id: "intro", type: "intro", prerequisParcoursId: undefined };
    let p = completerEtape(intro, { ...vierge, parcoursId: "intro" }, "l1", { type: "lecon" }, T0);
    p = completerEtape(intro, p, "q1", { type: "quiz", score: 100 }, T0);
    p = completerEtape(intro, p, "e1", { type: "exemple", aInteragi: true }, T0);
    p = completerEtape(intro, p, "s1", { type: "situation", choixSelectionneId: "a" }, T0);
    expect(p.statut).toBe("termine");
    expect(p.recompenseDebloquee).toBe(false);
  });

  test("l'ordre de complétion n'a pas d'importance", () => {
    let p = completerEtape(voie, vierge, "s1", { type: "situation", choixSelectionneId: "a" }, T0);
    p = completerEtape(voie, p, "l1", { type: "lecon" }, T0);
    expect(calculerStatutParcours(voie, p)).toBe("en_cours");
  });
});

describe("voieEstDeverrouillee", () => {
  const global = (statutIntro?: ProgressionParcours["statut"]): ProgressionGlobale => ({
    parcours: statutIntro
      ? { intro: { parcoursId: "intro", etapesCompletees: [], statut: statutIntro, recompenseDebloquee: false } }
      : {},
  });

  test("un parcours sans prérequis est toujours ouvert", () => {
    expect(voieEstDeverrouillee({ ...voie, prerequisParcoursId: undefined }, global())).toBe(true);
  });

  test("une voie reste fermée tant que l'intro n'est pas terminée", () => {
    expect(voieEstDeverrouillee(voie, global())).toBe(false);
    expect(voieEstDeverrouillee(voie, global("en_cours"))).toBe(false);
    expect(voieEstDeverrouillee(voie, global("termine"))).toBe(true);
  });
});
