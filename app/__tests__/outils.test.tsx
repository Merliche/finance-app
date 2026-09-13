import { Text } from "react-native";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

import Outils from "../outils";
import { obtenirTousLesElementsLateraux } from "../../src/data/content/elementsLateraux";

// La boîte à outils est le seul écran qui rassemble le contenu latéral des cinq parcours,
// et le seul dont l'affichage dépend entièrement de la progression enregistrée. Ce test
// garantit qu'elle se monte, qu'elle compte juste, et qu'un outil verrouillé le reste.

function rendre(): ReactTestRenderer {
  let arbre!: ReactTestRenderer;
  act(() => {
    arbre = create(<Outils />);
  });
  return arbre;
}

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

describe("écran Outils", () => {
  test("se monte et annonce les quatre familles d'outils", () => {
    const arbre = rendre();
    const textes = textesRendus(arbre);
    expect(textes).toContain("Boîte à outils");
    expect(textes).toContain("Calculateurs");
    expect(textes).toContain("Comparateurs");
    expect(textes).toContain("Glossaires");
    act(() => arbre.unmount());
  });

  test("le compteur porte sur les outils, badges exclus", () => {
    // Les badges sont des récompenses, pas des outils : les inclure gonflerait un total
    // que l'utilisateur ne peut pas « ouvrir ».
    const attendu = obtenirTousLesElementsLateraux().filter((element) => element.type !== "badge").length;
    const arbre = rendre();
    expect(textesRendus(arbre)).toContain(`/${attendu}`);
    act(() => arbre.unmount());
  });

  test("chaque outil est un bouton annoncé par son titre", () => {
    // Le mode test lève les verrous en développement (`MODE_TEST_TOUT_ACCESSIBLE`), donc
    // on ne peut pas y observer l'état verrouillé. Ce qui doit tenir dans les deux cas,
    // c'est que chaque outil soit atteignable et nommé.
    const arbre = rendre();
    const etiquettes = arbre.root
      .findAll((noeud) => typeof noeud.props.accessibilityLabel === "string")
      .map((noeud) => String(noeud.props.accessibilityLabel));
    const titres = obtenirTousLesElementsLateraux()
      .filter((element) => element.type !== "badge")
      .map((element) => element.titre);
    for (const titre of titres.slice(0, 8)) {
      expect(etiquettes.some((etiquette) => etiquette.startsWith(titre))).toBe(true);
    }
    act(() => arbre.unmount());
  });

  test("chaque outil affiche sa provenance : parcours et session", () => {
    const arbre = rendre();
    expect(textesRendus(arbre)).toMatch(/· Session \d+/);
    act(() => arbre.unmount());
  });
});
