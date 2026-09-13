import { Text } from "react-native";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

import Map from "../parcours/index";
import { useContentStore } from "../../src/state/contentStore";
import { recupererParcoursBundle } from "../../src/data/content";
import { VOIES } from "../../src/constants/voies";

// Le sommet du chemin d'introduction est une fourche : un rond par voie. C'est le seul
// endroit de l'application où l'on découvre qu'il existe plusieurs voies, et un rond
// manquant rend une voie entière invisible sans qu'aucune erreur ne se produise.

function monter(): ReactTestRenderer {
  let arbre!: ReactTestRenderer;
  act(() => {
    arbre = create(<Map />);
  });
  return arbre;
}

/**
 * Étiquettes des éléments NATIFS seulement. Un composant qui reçoit la propriété et le
 * pressable qu'il rend la portent tous deux : compter les deux multiplierait chaque rond.
 */
function etiquettes(arbre: ReactTestRenderer): string[] {
  return arbre.root
    .findAll(
      (noeud) => typeof noeud.props.accessibilityLabel === "string" && typeof noeud.type === "string"
    )
    .map((noeud) => String(noeud.props.accessibilityLabel));
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
    .join(" | ");
}

describe("fourche vers les voies", () => {
  beforeAll(() => {
    const intro = recupererParcoursBundle("intro")!;
    useContentStore.setState({ parcoursParId: { intro: { statut: "charge", parcours: intro } } });
  });

  test("un rond par voie, ni plus ni moins", () => {
    const arbre = monter();
    const labels = etiquettes(arbre);
    for (const voie of VOIES) {
      const presents = labels.filter((etiquette) => etiquette.startsWith(voie.labelParDefaut));
      expect(`${voie.id} : ${presents.length} rond(s)`).toBe(`${voie.id} : 1 rond(s)`);
    }
    act(() => arbre.unmount());
  });

  test("chaque voie est nommée sous son rond", () => {
    const arbre = monter();
    const textes = textesRendus(arbre);
    for (const voie of VOIES) {
      expect(textes).toContain(voie.labelParDefaut);
    }
    act(() => arbre.unmount());
  });

  test("la fourche annonce son invitation", () => {
    const arbre = monter();
    expect(textesRendus(arbre)).toContain("Choisis ta voie");
    act(() => arbre.unmount());
  });
});
