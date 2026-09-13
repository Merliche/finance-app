import { bilanDuParcours, compterPoints, compterTermes } from "../bilan";
import type { Parcours, ProgressionParcours } from "../types";

const parcours: Parcours = {
  id: "banque",
  titre: "La voie Banque",
  description: "",
  ordre: 1,
  type: "voie",
  version: 1,
  etapes: [
    {
      id: "banque-s1-lecon-a",
      ordre: 1,
      titre: "A",
      type: "lecon",
      contenu: [
        { type: "definition", terme: "Agios", texte: "…" },
        { type: "a_retenir", points: ["Point 1", "Point 2"] },
      ],
    },
    {
      id: "banque-s1-lecon-b",
      ordre: 2,
      titre: "B",
      type: "lecon",
      contenu: [{ type: "a_retenir", points: ["Point 3"] }],
    },
    {
      id: "banque-s2-lecon-c",
      ordre: 3,
      titre: "C",
      type: "lecon",
      contenu: [
        { type: "definition", terme: "TAEG", texte: "…" },
        { type: "a_retenir", points: ["Point 4"] },
      ],
    },
  ],
};

const progression = (etapesCompletees: string[]): ProgressionParcours => ({
  parcoursId: "banque",
  etapesCompletees,
  statut: "en_cours",
  recompenseDebloquee: false,
});

describe("bilanDuParcours", () => {
  test("ne retient que les points des étapes réellement validées", () => {
    const bilan = bilanDuParcours(parcours, progression(["banque-s1-lecon-a"]));
    expect(bilan.sessions).toHaveLength(1);
    expect(bilan.sessions[0].points).toEqual(["Point 1", "Point 2"]);
    expect(bilan.nbEtapesValidees).toBe(1);
    expect(bilan.nbEtapesTotal).toBe(3);
  });

  test("groupe par session et garde l'ordre des étapes", () => {
    const bilan = bilanDuParcours(parcours, progression(parcours.etapes.map((e) => e.id)));
    expect(bilan.sessions.map((s) => s.numero)).toEqual([1, 2]);
    expect(bilan.sessions[0].points).toEqual(["Point 1", "Point 2", "Point 3"]);
    expect(bilan.sessions[0].termes).toEqual(["Agios"]);
    expect(bilan.sessions[1].points).toEqual(["Point 4"]);
  });

  test("un parcours jamais commencé ne promet aucun savoir", () => {
    expect(bilanDuParcours(parcours, undefined).sessions).toEqual([]);
    expect(bilanDuParcours(parcours, progression([])).sessions).toEqual([]);
  });
});

describe("compteurs du bilan", () => {
  const bilan = bilanDuParcours(parcours, progression(parcours.etapes.map((e) => e.id)));

  test("compte tous les points retenus", () => {
    expect(compterPoints([bilan])).toBe(4);
  });

  test("dédoublonne les termes, y compris entre parcours", () => {
    expect(compterTermes([bilan, bilan])).toBe(2);
  });
});
