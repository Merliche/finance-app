import { construireGlossaire, filtrerGlossaire, grouperParInitiale, normaliser } from "../glossaire";
import type { ElementLateral } from "../elementsLateraux/types";
import type { Parcours } from "../parcours/types";

const parcours: Parcours[] = [
  {
    id: "banque",
    titre: "La voie Banque",
    description: "",
    ordre: 1,
    type: "voie",
    version: 1,
    etapes: [
      {
        id: "banque-s1-lecon",
        ordre: 1,
        titre: "Leçon",
        type: "lecon",
        contenu: [
          { type: "definition", terme: "Agios", texte: "Les intérêts d'un découvert." },
          { type: "definition", terme: "Épargne", texte: "Court." },
          { type: "texte", texte: "Pas une définition." },
        ],
      },
      {
        id: "banque-s2-lecon",
        ordre: 2,
        titre: "Leçon",
        type: "lecon",
        contenu: [{ type: "definition", terme: "TAEG", texte: "Le taux tout compris." }],
      },
    ],
  },
];

const elements: ElementLateral[] = [
  {
    id: "banque-glossaire",
    parcoursId: "banque",
    session: 1,
    type: "glossaire",
    titre: "Glossaire",
    entrees: [
      { terme: "Épargne", definition: "Une définition nettement plus longue et plus complète que l'autre." },
      { terme: "Découvert", definition: "Un solde négatif toléré." },
    ],
  },
  { id: "banque-badge", parcoursId: "banque", session: 1, type: "badge", titre: "Badge", description: "…" },
];

describe("normaliser", () => {
  test("retire accents et casse", () => {
    expect(normaliser("Épargne")).toBe("epargne");
    expect(normaliser("DÉCOUVERT")).toBe("decouvert");
  });
});

describe("construireGlossaire", () => {
  const entrees = construireGlossaire(parcours, elements);

  test("rassemble les définitions des leçons et des glossaires de session", () => {
    expect(entrees.map((e) => e.terme).sort()).toEqual(["Agios", "Découvert", "TAEG", "Épargne"].sort());
  });

  test("rattache chaque terme à son parcours et à sa session", () => {
    const taeg = entrees.find((e) => e.terme === "TAEG")!;
    expect(taeg.parcoursId).toBe("banque");
    expect(taeg.session).toBe(2);
  });

  test("en cas de doublon, garde la définition la plus complète", () => {
    const epargne = entrees.find((e) => e.terme === "Épargne")!;
    expect(epargne.definition).toContain("plus complète");
  });

  test("trie alphabétiquement en ignorant les accents", () => {
    const termes = entrees.map((e) => e.terme);
    expect(termes).toEqual(["Agios", "Découvert", "Épargne", "TAEG"]);
  });

  test("ignore les éléments latéraux qui ne sont pas des glossaires", () => {
    expect(entrees.some((e) => e.terme === "Badge")).toBe(false);
  });
});

describe("filtrerGlossaire", () => {
  const entrees = construireGlossaire(parcours, elements);

  test("cherche dans le terme comme dans la définition", () => {
    expect(filtrerGlossaire(entrees, "agios").map((e) => e.terme)).toEqual(["Agios"]);
    expect(filtrerGlossaire(entrees, "découvert").map((e) => e.terme).sort()).toEqual(["Agios", "Découvert"]);
  });

  test("ignore les accents et la casse", () => {
    expect(filtrerGlossaire(entrees, "EPARGNE").map((e) => e.terme)).toEqual(["Épargne"]);
  });

  test("exige tous les mots de la recherche", () => {
    expect(filtrerGlossaire(entrees, "taux compris").map((e) => e.terme)).toEqual(["TAEG"]);
    expect(filtrerGlossaire(entrees, "taux inexistant")).toEqual([]);
  });

  test("une recherche vide ne filtre rien", () => {
    expect(filtrerGlossaire(entrees, "   ")).toHaveLength(entrees.length);
  });
});

describe("grouperParInitiale", () => {
  test("regroupe par lettre, accents rabattus sur la lettre de base", () => {
    const groupes = grouperParInitiale(construireGlossaire(parcours, elements));
    expect(groupes.map((g) => g.lettre)).toEqual(["A", "D", "E", "T"]);
    expect(groupes[2].entrees[0].terme).toBe("Épargne");
  });

  test("un glossaire vide ne produit aucun groupe", () => {
    expect(grouperParInitiale([])).toEqual([]);
  });
});
