import { StyleSheet, Text } from "react-native";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

import Profil from "../profil";
import Bilan from "../bilan";
import Glossaire from "../glossaire";
import { COULEURS_NEUTRES } from "../../src/theme/parcoursTheme";

// Les bandeaux d'écran sont des dégradés sombres. Tout ce qu'on y pose doit être pensé
// pour ce fond : un texte blanc sur une pastille restée blanche devient invisible, et rien
// dans le rendu ne le signale — la pastille est bien là, on ne lit simplement plus rien.
// C'est arrivé aux trois pastilles du Profil (niveau, série, badges).
//
// Ce test remonte de chaque texte blanc jusqu'à ses conteneurs et vérifie qu'aucun ne
// porte une couleur de fond opaque et claire.

const FONDS_CLAIRS = [
  COULEURS_NEUTRES.surface,
  COULEURS_NEUTRES.surfaceAtone,
  COULEURS_NEUTRES.fond,
  COULEURS_NEUTRES.verrouilleFond,
  "#FFFFFF",
  "#FFF",
];

function estBlanc(couleur: unknown): boolean {
  if (typeof couleur !== "string") return false;
  const c = couleur.replace(/\s/g, "").toLowerCase();
  if (c === "#fff" || c === "#ffffff") return true;
  // Un blanc translucide reste lisible sur un fond sombre : seul l'opaque pose problème.
  const rgba = /^rgba\(255,255,255,([\d.]+)\)$/.exec(c);
  return rgba !== null && Number(rgba[1]) > 0.85;
}

function estFondClairOpaque(couleur: unknown): boolean {
  if (typeof couleur !== "string") return false;
  const c = couleur.replace(/\s/g, "").toLowerCase();
  if (c.startsWith("rgba(")) return false; // translucide : laisse passer le dégradé
  return FONDS_CLAIRS.some((clair) => clair.toLowerCase() === c);
}

function monter(Ecran: () => React.ReactElement | null): ReactTestRenderer {
  let arbre!: ReactTestRenderer;
  act(() => {
    arbre = create(<Ecran />);
  });
  return arbre;
}

/**
 * Couleur du premier ancêtre qui peint vraiment quelque chose derrière ce nœud, ou
 * `undefined` s'il n'y en a pas. On s'arrête au premier : remonter plus haut ferait voir
 * le fond de l'écran à travers le dégradé du bandeau, qui le recouvre entièrement.
 */
function fondEffectif(
  noeud: ReturnType<ReactTestRenderer["root"]["findAllByType"]>[number]
): string | undefined {
  let courant = noeud.parent;
  while (courant) {
    // Un dégradé peint : ce qui est posé dessus n'a plus rien à voir avec l'écran.
    if (Array.isArray(courant.props?.colors)) return undefined;
    const style = StyleSheet.flatten(courant.props?.style) as { backgroundColor?: unknown } | undefined;
    if (style && typeof style.backgroundColor === "string") return style.backgroundColor;
    courant = courant.parent;
  }
  return undefined;
}

const ECRANS: [string, () => React.ReactElement | null][] = [
  ["Profil", Profil],
  ["Bilan", Bilan],
  ["Glossaire", Glossaire],
];

describe("contraste des bandeaux", () => {
  test.each(ECRANS)("aucun texte blanc de « %s » n'est posé sur un fond clair opaque", (_nom, Ecran) => {
    const arbre = monter(Ecran);
    const invisibles: string[] = [];

    for (const texte of arbre.root.findAllByType(Text)) {
      const style = StyleSheet.flatten(texte.props.style) as { color?: unknown } | undefined;
      if (!style || !estBlanc(style.color)) continue;
      const fond = fondEffectif(texte);
      if (estFondClairOpaque(fond)) {
        const contenu = [texte.props.children].flat(Infinity).filter((e) => typeof e === "string").join("");
        invisibles.push(`« ${contenu || "(sans texte)"} » sur ${fond}`);
      }
    }

    expect(invisibles).toEqual([]);
    act(() => arbre.unmount());
  });
});
