/**
 * Tests de rendu des six types d'étape.
 *
 * Tout le reste de la suite porte sur de la logique pure : un composant qui plante à
 * l'affichage passait donc au vert. Ces tests montent chaque type avec un contenu
 * minimal mais réaliste — schéma animé et SVG compris — et vérifient que le texte
 * attendu arrive bien à l'écran.
 */
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { Text } from "react-native";

import type { Etape } from "../../../domain/parcours/types";
import { THEMES_PARCOURS } from "../../../theme/parcoursTheme";
import { Exemple } from "../Exemple";
import { Exercice } from "../Exercice";
import { Lecon } from "../Lecon";
import { Quiz } from "../Quiz";
import { Scenario } from "../Scenario";
import { Situation } from "../Situation";

// Les doublures natives (animations, stockage, haptique, navigation) sont dans jest.setup.js.

const THEME = THEMES_PARCOURS.intro;

/**
 * Tout le texte rendu — de quoi vérifier ce que l'utilisateur voit réellement.
 *
 * Les enfants d'un même `<Text>` sont recollés sans séparateur (« Problème », 1, « / », 2
 * doit redonner « Problème 1 / 2 »), et les blocs distincts séparés par « | ». Les
 * nombres comptent autant que les chaînes : ce sont eux qui portent les résultats.
 */
function textesRendus(arbre: ReactTestRenderer): string {
  return arbre.root
    .findAllByType(Text)
    .map((noeud) =>
      [noeud.props.children]
        .flat(Infinity)
        .filter((enfant) => typeof enfant === "string" || typeof enfant === "number")
        .join("")
    )
    .filter((texte) => texte.length > 0)
    .join(" | ");
}

function monter(element: React.ReactElement): ReactTestRenderer {
  let arbre!: ReactTestRenderer;
  act(() => {
    arbre = create(element);
  });
  return arbre;
}

// Contenu commun : un texte, une définition et un schéma, pour que chaque type traverse
// aussi `ContenuBlocs` et le rendu SVG des schémas.
const CONTENU: Etape["contenu"] = [
  { type: "texte", texte: "Chapeau de l'étape." },
  { type: "definition", terme: "Agios", texte: "Les intérêts d'un découvert." },
  {
    type: "schema",
    schema: {
      kind: "barres",
      titre: "Deux durées",
      unite: "€",
      barres: [
        { label: "Sur 2 ans", valeur: 529 },
        { label: "Sur 4 ans", valeur: 1054 },
      ],
    },
  },
  { type: "a_retenir", points: ["Premier point", "Deuxième point"] },
];

describe("rendu des étapes", () => {
  test("une leçon affiche son contenu, sa définition et son récapitulatif", () => {
    const etape: Etape = { id: "s1-lecon", ordre: 1, titre: "Leçon", type: "lecon", contenu: CONTENU };
    const arbre = monter(<Lecon etape={etape} theme={THEME} onTerminer={jest.fn()} />);
    const textes = textesRendus(arbre);

    expect(textes).toContain("Chapeau de l'étape.");
    expect(textes).toContain("Agios");
    expect(textes).toContain("Premier point");
    expect(textes).toContain("Continuer");
    act(() => arbre.unmount());
  });

  test("un quiz affiche ses questions et tous ses choix", () => {
    const etape: Etape = {
      id: "s1-quiz",
      ordre: 2,
      titre: "Quiz",
      type: "quiz",
      contenu: [{ type: "texte", texte: "Vérifions." }],
      quiz: {
        seuilReussite: 70,
        questions: [
          { id: "q1", question: "Que représente ton épargne ?", choix: ["Tes revenus", "La différence"], bonneReponseIndex: 1 },
        ],
      },
    };
    const arbre = monter(<Quiz etape={etape} parcoursId="intro" theme={THEME} onTerminer={jest.fn()} />);
    const textes = textesRendus(arbre);

    expect(textes).toContain("Que représente ton épargne ?");
    expect(textes).toContain("La différence");
    expect(textes).toContain("Valider mes réponses");
    act(() => arbre.unmount());
  });

  test("un exemple affiche ses curseurs, son résultat et sa courbe", () => {
    const etape: Etape = {
      id: "s2-exemple",
      ordre: 3,
      titre: "Exemple",
      type: "exemple",
      contenu: [{ type: "texte", texte: "Fais varier." }],
      simulateur: {
        formule: "interet_compose",
        variables: [
          { id: "capital", label: "Capital de départ", unite: "€", min: 100, max: 10000, pas: 100, valeurParDefaut: 1000 },
          { id: "taux", label: "Taux", unite: "%", min: 0, max: 10, pas: 0.5, valeurParDefaut: 3 },
          { id: "duree", label: "Durée", unite: "ans", min: 1, max: 30, pas: 1, valeurParDefaut: 10 },
        ],
        resultat: { label: "Capital final", unite: "€" },
      },
    };
    const arbre = monter(<Exemple etape={etape} theme={THEME} onTerminer={jest.fn()} />);
    const textes = textesRendus(arbre);

    expect(textes).toContain("Capital de départ");
    expect(textes).toContain("Capital final");
    // 1 000 € à 3 % sur 10 ans : le résultat doit être calculé, pas laissé à zéro.
    expect(textes).toMatch(/1\s*344/);
    act(() => arbre.unmount());
  });

  test("une situation affiche son contexte et ses choix", () => {
    const etape: Etape = {
      id: "s1-situation",
      ordre: 4,
      titre: "Situation",
      type: "situation",
      contenu: [{ type: "texte", texte: "Un ami te demande conseil." }],
      situation: {
        contexte: "Il est à découvert dès le 20 du mois.",
        choix: [
          { id: "noter", texte: "Noter ses dépenses", feedback: "Le bon point de départ.", qualite: "recommande" },
          { id: "decouvert", texte: "Augmenter son découvert", feedback: "Ça déplace le problème.", qualite: "deconseille" },
        ],
      },
    };
    const arbre = monter(<Situation etape={etape} theme={THEME} onTerminer={jest.fn()} />);
    const textes = textesRendus(arbre);

    expect(textes).toContain("Il est à découvert dès le 20 du mois.");
    expect(textes).toContain("Noter ses dépenses");
    act(() => arbre.unmount());
  });

  test("un exercice affiche son premier problème et pas les suivants", () => {
    const etape: Etape = {
      id: "s2-exercice",
      ordre: 5,
      titre: "Exercice",
      type: "exercice",
      contenu: [{ type: "texte", texte: "Quatre calculs." }],
      exercice: {
        seuilReussite: 50,
        items: [
          { id: "x1", type: "nombre", enonce: "1 000 € à 10 % pendant un an ?", reponse: 1100, tolerance: 5, unite: "€", explication: "1 100 €." },
          { id: "x2", type: "vrai_faux", enonce: "Doubler la durée double le capital.", reponse: false, explication: "Non." },
        ],
      },
    };
    const arbre = monter(<Exercice etape={etape} theme={THEME} onTerminer={jest.fn()} />);
    const textes = textesRendus(arbre);

    expect(textes).toContain("1 000 € à 10 % pendant un an ?");
    expect(textes).toContain("Problème 1 / 2");
    // Les problèmes se découvrent un par un : le second ne doit pas être visible.
    expect(textes).not.toContain("Doubler la durée double le capital.");
    act(() => arbre.unmount());
  });

  test("un scénario affiche sa mise en place et sa première décision", () => {
    const etape: Etape = {
      id: "s9-scenario",
      ordre: 6,
      titre: "Scénario",
      type: "scenario",
      contenu: [{ type: "texte", texte: "Cinq décisions." }],
      scenario: {
        intro: "Tu viens de décrocher ton premier travail.",
        decisions: [
          {
            id: "logement",
            situation: "Deux logements te plaisent.",
            options: [
              { id: "a", texte: "Le deux-pièces à 560 €", consequence: "Il te reste de la marge.", points: 2 },
              { id: "b", texte: "Le studio à 780 €", consequence: "Le logement pèse 41 %.", points: 0 },
            ],
          },
        ],
        bilans: [{ seuil: 0, titre: "Fin", texte: "C'est terminé." }],
      },
    };
    const arbre = monter(<Scenario etape={etape} theme={THEME} onTerminer={jest.fn()} />);
    const textes = textesRendus(arbre);

    expect(textes).toContain("Tu viens de décrocher ton premier travail.");
    expect(textes).toContain("Deux logements te plaisent.");
    expect(textes).toContain("Le deux-pièces à 560 €");
    // Le bilan n'apparaît qu'une fois toutes les décisions prises.
    expect(textes).not.toContain("C'est terminé.");
    act(() => arbre.unmount());
  });
});
