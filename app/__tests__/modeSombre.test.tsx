import { StyleSheet } from "react-native";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

import Bilan from "../bilan";
import Glossaire from "../glossaire";
import Outils from "../outils";
import Profil from "../profil";
import { useProgressStore } from "../../src/state/progressStore";
import { FournisseurTheme } from "../../src/theme/ModeCouleur";
import { PALETTE_CLAIRE, PALETTE_SOMBRE } from "../../src/theme/palettes";

// Le mode sombre repose sur une règle simple : plus aucune couleur d'interface n'est
// écrite en dur, tout passe par la palette active. Une seule couleur oubliée suffit à
// trouer l'écran — un fond crème au milieu du sombre, ou un texte anthracite devenu
// invisible — et rien dans le rendu ne le signale.
//
// Ce test monte des écrans réellement en sombre et cherche les valeurs qui n'existent que
// dans la palette claire. C'est le filet qui rend la conversion durable : un composant
// ajouté plus tard avec une couleur en dur le fera échouer.

/** Couleurs propres au mode clair : les rencontrer en sombre est un oubli. */
const FONDS_CLAIRS = [PALETTE_CLAIRE.fond, PALETTE_CLAIRE.surfaceAtone, PALETTE_CLAIRE.verrouilleFond];
const TEXTES_CLAIRS = [PALETTE_CLAIRE.texte, PALETTE_CLAIRE.texteAttenue, PALETTE_CLAIRE.texteTertiaire];

function normaliser(valeur: unknown): string | undefined {
  return typeof valeur === "string" ? valeur.replace(/\s/g, "").toUpperCase() : undefined;
}

function contient(liste: string[], valeur: unknown): boolean {
  const c = normaliser(valeur);
  return c !== undefined && liste.some((attendue) => attendue.toUpperCase() === c);
}

function monterEnSombre(Ecran: () => React.ReactElement | null): ReactTestRenderer {
  let arbre!: ReactTestRenderer;
  act(() => {
    arbre = create(
      <FournisseurTheme>
        <Ecran />
      </FournisseurTheme>
    );
  });
  return arbre;
}

const ECRANS: [string, () => React.ReactElement | null][] = [
  ["Profil", Profil],
  ["Outils", Outils],
  ["Glossaire", Glossaire],
  ["Bilan", Bilan],
];

describe("mode sombre", () => {
  beforeAll(() => {
    useProgressStore.setState({ preferenceTheme: "sombre" });
  });

  afterAll(() => {
    useProgressStore.setState({ preferenceTheme: "systeme" });
  });

  test.each(ECRANS)("« %s » n'affiche aucune surface restée en mode clair", (_nom, Ecran) => {
    const arbre = monterEnSombre(Ecran);
    const oublis: string[] = [];

    for (const noeud of arbre.root.findAll(() => true)) {
      const style = StyleSheet.flatten(noeud.props?.style) as
        | { backgroundColor?: unknown; color?: unknown }
        | undefined;
      if (!style) continue;
      if (contient(FONDS_CLAIRS, style.backgroundColor)) {
        oublis.push(`fond ${String(style.backgroundColor)}`);
      }
      if (contient(TEXTES_CLAIRS, style.color)) {
        oublis.push(`texte ${String(style.color)}`);
      }
    }

    expect([...new Set(oublis)]).toEqual([]);
    act(() => arbre.unmount());
  });

  test("le fond des écrans est bien celui de la palette sombre", () => {
    const arbre = monterEnSombre(Profil);
    const fonds = arbre.root
      .findAll(() => true)
      .map((noeud) => StyleSheet.flatten(noeud.props?.style) as { backgroundColor?: unknown } | undefined)
      .map((style) => normaliser(style?.backgroundColor))
      .filter((c): c is string => c !== undefined);
    expect(fonds).toContain(PALETTE_SOMBRE.surface.toUpperCase());
    act(() => arbre.unmount());
  });

  test("le choix du thème est proposé et enregistré", () => {
    const arbre = monterEnSombre(Profil);
    const clair = arbre.root.find(
      (noeud) => noeud.props.accessibilityLabel === "Thème Clair" && typeof noeud.props.onPress === "function"
    );
    act(() => clair.props.onPress());
    expect(useProgressStore.getState().preferenceTheme).toBe("clair");
    // La remise en sombre déclenche un rendu de l'arbre encore monté : elle doit passer
    // par act(), sinon React signale une mise à jour hors du cycle de test.
    act(() => {
      useProgressStore.setState({ preferenceTheme: "sombre" });
    });
    act(() => arbre.unmount());
  });
});
