import { ScrollView, StyleSheet } from "react-native";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

import Bienvenue from "../bienvenue";
import Bilan from "../bilan";
import Confidentialite from "../confidentialite";
import Revision from "../revision";

// Un écran dont le contenu est plus haut que l'écran ET qui n'a pas de défilement perd
// purement ce qui dépasse, en bas, sans aucun signe. C'est ce qui coupait la mention
// légale de l'écran de bienvenue au premier lancement : trois cartes d'arguments, un
// bouton, et une phrase de trop.
//
// Rien ne se voit au rendu, et aucune assertion sur le texte n'attrape le problème — le
// texte EST rendu, il est juste invisible. Ce qui se teste, en revanche, c'est la
// structure : ces écrans doivent confier leur contenu à un conteneur défilant, et ce
// conteneur doit s'étirer (`flexGrow`) plutôt que se figer (`flex`), sans quoi le
// défilement existerait mais la mise en page s'effondrerait quand tout tient.

function monter(Ecran: () => React.ReactElement | null): ReactTestRenderer {
  let arbre!: ReactTestRenderer;
  act(() => {
    arbre = create(<Ecran />);
  });
  return arbre;
}

const ECRANS: [string, () => React.ReactElement | null][] = [
  ["Bienvenue", Bienvenue],
  ["Bilan", Bilan],
  ["Révision", Revision],
  ["Confidentialité", Confidentialite],
];

describe("contenu long : rien ne doit être coupé", () => {
  test.each(ECRANS)("« %s » confie son contenu à un conteneur défilant", (_nom, Ecran) => {
    const arbre = monter(Ecran);
    expect(arbre.root.findAllByType(ScrollView).length).toBeGreaterThan(0);
    act(() => arbre.unmount());
  });

  test.each(ECRANS)("« %s » laisse son contenu s'étirer au lieu de le figer", (_nom, Ecran) => {
    const arbre = monter(Ecran);
    const conteneurs = arbre.root
      .findAllByType(ScrollView)
      .map((noeud) => StyleSheet.flatten(noeud.props.contentContainerStyle) as
        | { flex?: number; flexGrow?: number }
        | undefined);

    // `flex: 1` sur le conteneur d'un ScrollView enferme le contenu dans la hauteur
    // visible : le défilement ne sert alors plus à rien.
    for (const conteneur of conteneurs) {
      expect(conteneur?.flex).toBeUndefined();
    }
    act(() => arbre.unmount());
  });

  test("l'écran de bienvenue garde sa répartition en hauteur", () => {
    // Le contenu doit rester réparti entre haut, milieu et bas quand il tient : sans
    // `flexGrow`, tout se tasserait en haut de l'écran dès qu'on rend la vue défilante.
    const arbre = monter(Bienvenue);
    const conteneur = StyleSheet.flatten(
      arbre.root.findAllByType(ScrollView)[0].props.contentContainerStyle
    ) as { flexGrow?: number; justifyContent?: string };
    expect(conteneur.flexGrow).toBe(1);
    expect(conteneur.justifyContent).toBe("space-between");
    act(() => arbre.unmount());
  });
});
