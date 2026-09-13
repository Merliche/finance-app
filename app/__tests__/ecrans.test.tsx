import { Text } from "react-native";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

import APropos from "../a-propos";
import Bienvenue from "../bienvenue";
import Bilan from "../bilan";
import Glossaire from "../glossaire";
import MesChiffres from "../mes-chiffres";
import Profil from "../profil";
import Revision from "../revision";
import { delaiCascade } from "../../src/theme/animation";

// Les écrans secondaires partagent désormais un bandeau, un fond animé et un corps unique
// (`EnteteEcran`). Ce test ne juge pas leur esthétique : il garantit qu'ils se montent
// tous, qu'ils annoncent un titre, et qu'ils offrent un retour — la conversion a supprimé
// les en-têtes natifs, donc un écran sans bouton de retour serait un cul-de-sac.

function monter(Ecran: () => React.ReactElement | null): ReactTestRenderer {
  let arbre!: ReactTestRenderer;
  act(() => {
    arbre = create(<Ecran />);
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

function etiquettes(arbre: ReactTestRenderer): string[] {
  return arbre.root
    .findAll((noeud) => typeof noeud.props.accessibilityLabel === "string")
    .map((noeud) => String(noeud.props.accessibilityLabel));
}

const ECRANS: [string, () => React.ReactElement | null, string][] = [
  ["Glossaire", Glossaire, "Glossaire"],
  ["Bilan", Bilan, "Ce que tu sais maintenant"],
  ["Profil", Profil, "Ton tableau de bord"],
  ["Révision", Revision, "Révision"],
  ["Mes chiffres", MesChiffres, "Mes chiffres"],
  ["À propos", APropos, "À propos"],
];

describe("écrans secondaires", () => {
  test.each(ECRANS)("« %s » se monte et affiche son bandeau", (_nom, Ecran, attendu) => {
    const arbre = monter(Ecran);
    expect(textesRendus(arbre)).toContain(attendu);
    act(() => arbre.unmount());
  });

  test.each(ECRANS)("« %s » propose un retour", (_nom, Ecran) => {
    // Les en-têtes natifs sont masqués : c'est le bandeau qui porte la sortie.
    const arbre = monter(Ecran);
    expect(etiquettes(arbre)).toContain("Retour");
    act(() => arbre.unmount());
  });
});

describe("écran de bienvenue", () => {
  test("se monte et propose de commencer", () => {
    const arbre = monter(Bienvenue);
    const textes = textesRendus(arbre);
    expect(textes).toContain("Éducation financière");
    expect(textes).toContain("Commencer");
    act(() => arbre.unmount());
  });
});

describe("delaiCascade", () => {
  test("échelonne les premiers éléments puis plafonne", () => {
    // Sans plafond, le quarantième élément d'une liste attendrait plus de deux secondes
    // avant d'apparaître : l'écran paraîtrait lent au lieu de paraître vivant.
    expect(delaiCascade(0)).toBe(0);
    expect(delaiCascade(1)).toBeGreaterThan(delaiCascade(0));
    expect(delaiCascade(40)).toBe(delaiCascade(8));
    expect(delaiCascade(3, 100)).toBe(100 + delaiCascade(3));
  });

  test("un indice négatif ne produit pas de retard négatif", () => {
    expect(delaiCascade(-5)).toBe(0);
  });
});
