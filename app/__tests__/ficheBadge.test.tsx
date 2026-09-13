import { Text } from "react-native";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

import Profil from "../profil";
import { obtenirTousLesElementsLateraux } from "../../src/data/content/elementsLateraux";

// Dans la grille du profil, un badge n'est qu'un ruban et deux mots : on sait qu'on l'a,
// jamais pourquoi. Taper dessus doit ouvrir une fiche qui dit d'où il vient et ce qu'il a
// fallu faire.

function monter(): ReactTestRenderer {
  let arbre!: ReactTestRenderer;
  act(() => {
    arbre = create(<Profil />);
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

/** Le premier badge de la grille, tel qu'il est annoncé à l'accessibilité. */
function premierBadge(arbre: ReactTestRenderer) {
  const titre = obtenirTousLesElementsLateraux().find((element) => element.type === "badge")!.titre;
  return arbre.root.find(
    (noeud) =>
      typeof noeud.props.accessibilityLabel === "string" &&
      noeud.props.accessibilityLabel.startsWith(titre) &&
      typeof noeud.props.onPress === "function"
  );
}

describe("fiche de badge", () => {
  test("chaque badge de la grille est un bouton", () => {
    const arbre = monter();
    // On ne compte que les éléments natifs : le composant qui reçoit la propriété et le
    // pressable qu'il rend la portent tous deux, ce qui doublerait le total.
    const badges = arbre.root.findAll(
      (noeud) =>
        noeud.props.accessibilityHint === "Ouvre la fiche du badge" && typeof noeud.type === "string"
    );
    const total = obtenirTousLesElementsLateraux().filter((element) => element.type === "badge").length;
    expect(badges.length).toBe(total);
    act(() => arbre.unmount());
  });

  test("taper un badge ouvre sa fiche, avec sa provenance et sa condition", () => {
    const arbre = monter();
    const badge = obtenirTousLesElementsLateraux().find((element) => element.type === "badge")!;

    expect(textesRendus(arbre)).not.toContain("Comment on l'obtient");

    act(() => {
      premierBadge(arbre).props.onPress();
    });

    const textes = textesRendus(arbre);
    expect(textes).toContain("Comment on l'obtient");
    // La provenance : de quelle session du parcours vient ce badge.
    expect(textes).toContain(`Session ${badge.session}`);
    // La description éditoriale du badge.
    if (badge.type === "badge") expect(textes).toContain(badge.description.slice(0, 30));
    act(() => arbre.unmount());
  });

  test("la fiche annonce l'état du badge et l'avancement de sa session", () => {
    const arbre = monter();
    act(() => {
      premierBadge(arbre).props.onPress();
    });
    const textes = textesRendus(arbre);
    expect(textes).toMatch(/Badge obtenu|Badge à débloquer/);
    expect(textes).toMatch(/En validant les \d+ étapes de la session \d+\./);
    act(() => arbre.unmount());
  });

  test("la fiche se referme", () => {
    const arbre = monter();
    act(() => {
      premierBadge(arbre).props.onPress();
    });
    expect(textesRendus(arbre)).toContain("Comment on l'obtient");

    // La feuille offre deux fermetures : le fond et la barre du haut. On en tape une.
    const fermer = arbre.root.findAll(
      (noeud) => noeud.props.accessibilityLabel === "Fermer" && typeof noeud.props.onPress === "function"
    )[0];
    act(() => fermer.props.onPress());
    expect(textesRendus(arbre)).not.toContain("Comment on l'obtient");
    act(() => arbre.unmount());
  });
});
