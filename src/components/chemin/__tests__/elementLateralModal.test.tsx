import { Text } from "react-native";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

import { ElementLateralModal } from "../ElementLateralModal";
import type { ElementLateral } from "../../../domain/elementsLateraux/types";

// Ces fiches sont ouvertes depuis le chemin ET depuis l'écran Outils. Elles reposent
// maintenant sur `FeuilleModale`, qui porte la barre glissante : ce test garantit que le
// contenu de chaque type de fiche arrive bien à l'écran à travers ce nouvel emballage, et
// qu'il reste toujours un moyen explicite de refermer.

const ANECDOTE: ElementLateral = {
  id: "intro-saviez-vous-salaire",
  parcoursId: "intro",
  session: 1,
  type: "saviez_vous",
  titre: "L'origine du mot salaire",
  anecdote: "Il vient du sel, que touchaient les légionnaires romains.",
};

const COMPARATEUR: ElementLateral = {
  id: "intro-comparateur-epargner-depenser",
  parcoursId: "intro",
  session: 1,
  type: "comparateur",
  titre: "Épargner vs tout dépenser",
  optionA: { label: "Épargner 100 € par mois", points: ["Un filet en six mois"] },
  optionB: { label: "Tout dépenser", points: ["Aucune marge au premier imprévu"] },
  conclusion: "La différence se joue sur la régularité, pas sur le montant.",
};

function rendre(element: ElementLateral | null): ReactTestRenderer {
  let arbre!: ReactTestRenderer;
  act(() => {
    arbre = create(<ElementLateralModal element={element} onFermer={() => {}} />);
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

describe("ElementLateralModal", () => {
  test("ne rend rien tant qu'aucun élément n'est ouvert", () => {
    const arbre = rendre(null);
    expect(arbre.toJSON()).toBeNull();
    act(() => arbre.unmount());
  });

  test("affiche une anecdote et son titre", () => {
    const arbre = rendre(ANECDOTE);
    const textes = textesRendus(arbre);
    expect(textes).toContain("L'origine du mot salaire");
    expect(textes).toContain("légionnaires romains");
    act(() => arbre.unmount());
  });

  test("affiche les deux colonnes d'un comparateur et sa conclusion", () => {
    const arbre = rendre(COMPARATEUR);
    const textes = textesRendus(arbre);
    expect(textes).toContain("Épargner 100 € par mois");
    expect(textes).toContain("Tout dépenser");
    expect(textes).toContain("la régularité");
    act(() => arbre.unmount());
  });

  test("propose toujours de refermer, y compris au lecteur d'écran", () => {
    // Le glissement vers le bas ne doit jamais être le seul moyen de sortir : la barre et
    // le fond portent chacun une action de fermeture annoncée.
    const arbre = rendre(ANECDOTE);
    const fermetures = arbre.root
      .findAll((noeud) => noeud.props.accessibilityLabel === "Fermer")
      .filter((noeud) => typeof noeud.props.onPress === "function");
    expect(fermetures.length).toBeGreaterThanOrEqual(2);
    act(() => arbre.unmount());
  });
});
