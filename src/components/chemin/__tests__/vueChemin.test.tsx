import { Text } from "react-native";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

import { VueChemin } from "../VueChemin";
import type { ElementLateral } from "../../../domain/elementsLateraux/types";
import type { Etape, Parcours } from "../../../domain/parcours/types";
import { themeDuParcours } from "../../../theme/parcoursTheme";

// Le chemin est le seul écran qui assemble géométrie, dégradés SVG, animations natives
// et modales. Un test de rendu ne juge pas son esthétique : il garantit qu'il se monte
// sans lever, et que ce qui doit être lisible l'est — l'étape en cours, les sessions,
// le sommet. C'est ce qui manquait quand une couleur mal formée ou un identifiant de
// dégradé dupliqué pouvait faire écran blanc sans qu'aucun test ne bronche.

function etape(id: string, titre: string, type: Etape["type"] = "lecon", ordre = 1): Etape {
  if (type === "quiz") {
    return {
      id,
      ordre,
      titre,
      type: "quiz",
      contenu: [],
      quiz: {
        seuilReussite: 70,
        questions: [{ id: `${id}-q1`, question: "Alors ?", choix: ["A", "B"], bonneReponseIndex: 0 }],
      },
    };
  }
  return { id, ordre, titre, type: "lecon", contenu: [{ type: "texte", texte: "Un contenu de démonstration." }] };
}

const PARCOURS: Parcours = {
  id: "banque",
  titre: "La voie Banque",
  description: "",
  ordre: 2,
  type: "voie",
  version: 1,
  etapes: [
    etape("banque-s1-lecon", "Le compte courant", "lecon", 1),
    etape("banque-s1-quiz", "Quiz du compte", "quiz", 2),
    etape("banque-s2-lecon", "Le livret A", "lecon", 3),
    etape("banque-s2-quiz", "Quiz de l'épargne", "quiz", 4),
  ],
};

const LATERAUX: ElementLateral[] = [
  {
    id: "banque-saviez-vous-1",
    parcoursId: "banque",
    session: 1,
    type: "saviez_vous",
    titre: "Le sais-tu ?",
    anecdote: "Une anecdote.",
  },
];

const SOMMET = {
  caption: "Ta récompense",
  cibles: [
    {
      cle: "recompense",
      couleur: "#2E6FE0",
      couleurSombre: "#1D4CA8",
      icone: "gift" as const,
      label: "À débloquer",
      deverrouille: false,
      onPress: () => {},
    },
  ],
};

function rendre(etapesCompletees: string[]): ReactTestRenderer {
  let arbre!: ReactTestRenderer;
  act(() => {
    arbre = create(
      <VueChemin
        parcours={PARCOURS}
        etapesCompletees={etapesCompletees}
        theme={themeDuParcours("banque")}
        elementsLateraux={LATERAUX}
        sommet={SOMMET}
        onEtapePress={() => {}}
      />
    );
  });
  return arbre;
}

/** Tous les textes rendus, concaténés — l'équivalent de ce qu'un utilisateur peut lire. */
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

describe("VueChemin", () => {
  test("se monte et annonce l'étape en cours", () => {
    const arbre = rendre(["banque-s1-lecon"]);
    const textes = textesRendus(arbre);
    // La bulle d'appel doit désigner la première étape non validée, pas la dernière
    // validée : c'est elle qui dit où reprendre.
    expect(textes).toContain("À suivre");
    expect(textes).toContain("Quiz du compte");
    act(() => arbre.unmount());
  });

  test("affiche les bannières des sessions et le sommet", () => {
    const arbre = rendre([]);
    const textes = textesRendus(arbre);
    expect(textes).toContain("Session 1");
    expect(textes).toContain("Session 2");
    expect(textes).toContain("Ta récompense");
    expect(textes).toContain("À débloquer");
    act(() => arbre.unmount());
  });

  test("annonce chaque nœud à l'accessibilité avec son état", () => {
    const arbre = rendre(["banque-s1-lecon"]);
    const etiquettes = arbre.root
      .findAll((noeud) => typeof noeud.props.accessibilityLabel === "string")
      .map((noeud) => String(noeud.props.accessibilityLabel));
    const joint = etiquettes.join(" | ");
    expect(joint).toContain("Le compte courant, validée");
    expect(joint).toContain("Quiz du compte, à faire maintenant");
    expect(joint).toContain("Le livret A, verrouillée");
    act(() => arbre.unmount());
  });

  test("un parcours entièrement validé se rend sans étape en cours", () => {
    // Cas limite réel : une voie terminée n'a plus de nœud « actuel », donc ni bulle,
    // ni comète, ni foyer de lumière. Rien ne doit lever pour autant.
    const arbre = rendre(PARCOURS.etapes.map((e) => e.id));
    expect(textesRendus(arbre)).not.toContain("À suivre");
    act(() => arbre.unmount());
  });

  test("une durée est proposée avant d'ouvrir l'étape en cours", () => {
    const arbre = rendre([]);
    expect(textesRendus(arbre)).toMatch(/\d+ min/);
    act(() => arbre.unmount());
  });
});
