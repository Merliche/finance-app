import { Text } from "react-native";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

// L'écran lit l'identifiant de la voie dans l'URL : on le lui fournit ici, la doublure
// commune renvoie des paramètres vides.
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => ({ parcoursId: "banque" }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

// Le client Supabase lève à l'import si les variables d'environnement manquent, et Jest
// ne charge pas le .env. L'inscription email n'est pas le sujet de ce test : on la double.
jest.mock("../../src/data/remote/emailRepository", () => ({
  inscrireEmail: jest.fn(() => Promise.resolve({ statut: "ok" })),
}));

import EcranRecompense from "../parcours/[parcoursId]/reward";
import { useContentStore } from "../../src/state/contentStore";
import { recupererParcoursBundle } from "../../src/data/content";

// La récompense de fin de voie n'est plus un code à remplir : c'est une fiche de synthèse
// fabriquée à partir du contenu de la voie. Ce test garantit qu'elle arrive à l'écran
// sans qu'aucun champ éditorial ne soit renseigné — c'était exactement le point qui
// bloquait la soumission, avec quatre écrans de récompense vides.

function monter(): ReactTestRenderer {
  let arbre!: ReactTestRenderer;
  act(() => {
    arbre = create(<EcranRecompense />);
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

describe("écran de récompense", () => {
  beforeAll(() => {
    // On pose directement le contenu embarqué dans le store : le chargement distant n'a
    // pas lieu d'être ici, et l'écran doit se juger sur ce qu'il affiche.
    const parcours = recupererParcoursBundle("banque")!;
    useContentStore.setState({ parcoursParId: { banque: { statut: "charge", parcours } } });
  });

  test("affiche la fiche de synthèse, sans aucun champ à remplir", () => {
    const arbre = monter();
    const textes = textesRendus(arbre);
    expect(textes).toContain("Fiche de synthèse");
    expect(textes).toContain("points clés");
    expect(textes).not.toContain("À REMPLIR");
    act(() => arbre.unmount());
  });

  test("la première session est ouverte et montre ses points", () => {
    // Une fiche entièrement repliée ressemblerait à un sommaire vide alors qu'elle est
    // justement le contenu.
    const parcours = recupererParcoursBundle("banque")!;
    const premierPoint = parcours.etapes
      .flatMap((etape) => etape.contenu)
      .flatMap((bloc) => (bloc.type === "a_retenir" ? bloc.points : []))[0];
    const arbre = monter();
    expect(textesRendus(arbre)).toContain(premierPoint);
    act(() => arbre.unmount());
  });

  test("propose d'emporter la fiche", () => {
    const arbre = monter();
    const partage = arbre.root.findAll(
      (noeud) => noeud.props.accessibilityLabel === "Partager ma fiche de synthèse"
    );
    expect(partage.length).toBeGreaterThan(0);
    act(() => arbre.unmount());
  });

  test("annonce les réflexes et les pièges tirés des mises en situation", () => {
    const arbre = monter();
    const textes = textesRendus(arbre);
    expect(textes).toContain("Les bons réflexes");
    expect(textes).toContain("Les pièges à éviter");
    act(() => arbre.unmount());
  });

  test("n'affiche aucun bloc livre tant qu'aucun livre n'existe", () => {
    // Le bloc reste dans le code, prêt à accueillir un livre partenaire. Tant que le
    // contenu n'en déclare pas, rien ne doit apparaître — surtout pas un code vide.
    const arbre = monter();
    const textes = textesRendus(arbre);
    expect(textes).not.toContain("Voir le livre sur Amazon");
    expect(textes).not.toContain("Code de réduction");
    act(() => arbre.unmount());
  });

  test("la collecte d'email reste facultative et annoncée comme telle", () => {
    // Exigence d'Apple comme du RGPD : rien d'essentiel ne doit dépendre de l'adresse.
    const arbre = monter();
    expect(textesRendus(arbre)).toContain("Facultatif");
    act(() => arbre.unmount());
  });
});

describe("consentement à la collecte d'email", () => {
  function caseAcocher(arbre: ReactTestRenderer) {
    return arbre.root.find(
      (noeud) =>
        noeud.props.accessibilityRole === "checkbox" && typeof noeud.props.onPress === "function"
    );
  }

  function boutonEnvoyer(arbre: ReactTestRenderer) {
    return arbre.root.find(
      (noeud) =>
        noeud.props.accessibilityLabel === "Valider mon inscription" &&
        typeof noeud.props.onPress === "function"
    );
  }

  test("la case est présente et décochée au départ", () => {
    // Un consentement pré-coché n'est pas un consentement : le RGPD exige un acte positif.
    const arbre = monter();
    expect(caseAcocher(arbre).props.accessibilityState.checked).toBe(false);
    act(() => arbre.unmount());
  });

  test("elle se coche et se décoche", () => {
    const arbre = monter();
    act(() => caseAcocher(arbre).props.onPress());
    expect(caseAcocher(arbre).props.accessibilityState.checked).toBe(true);
    act(() => caseAcocher(arbre).props.onPress());
    expect(caseAcocher(arbre).props.accessibilityState.checked).toBe(false);
    act(() => arbre.unmount());
  });

  test("rien n'est envoyé tant que la case n'est pas cochée", () => {
    const { inscrireEmail } = require("../../src/data/remote/emailRepository");
    inscrireEmail.mockClear();
    const arbre = monter();

    const champ = arbre.root.find((noeud) => noeud.props.placeholder === "ton@email.com");
    act(() => champ.props.onChangeText("quelquun@exemple.fr"));

    // Le bouton d'envoi doit rester inerte : c'est lui la garantie, pas un message après coup.
    expect(boutonEnvoyer(arbre).props.disabled).toBe(true);
    expect(inscrireEmail).not.toHaveBeenCalled();
    act(() => arbre.unmount());
  });

  test("cocher la case débloque l'envoi", () => {
    const arbre = monter();
    const champ = arbre.root.find((noeud) => noeud.props.placeholder === "ton@email.com");
    act(() => champ.props.onChangeText("quelquun@exemple.fr"));
    expect(boutonEnvoyer(arbre).props.disabled).toBe(true);
    act(() => caseAcocher(arbre).props.onPress());
    expect(boutonEnvoyer(arbre).props.disabled).toBe(false);
    act(() => arbre.unmount());
  });

  test("la politique de confidentialité est accessible depuis l'encart", () => {
    // Elle doit être lisible AVANT de cocher, pas seulement depuis un autre écran.
    const arbre = monter();
    const lien = arbre.root.findAll(
      (noeud) => noeud.props.accessibilityLabel === "Lire la politique de confidentialité"
    );
    expect(lien.length).toBeGreaterThan(0);
    act(() => arbre.unmount());
  });
});
