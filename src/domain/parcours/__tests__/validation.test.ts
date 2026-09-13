import { recupererParcoursBundle } from "../../../data/content";
import { VOIES } from "../../../constants/voies";
import { estParcoursValide, validerParcours } from "../validation";

/** Un parcours minimal mais complet, à abîmer cas par cas. */
function parcoursValide(): Record<string, unknown> {
  return {
    id: "banque",
    titre: "La voie Banque",
    description: "",
    ordre: 1,
    type: "voie",
    version: 3,
    etapes: [
      {
        id: "banque-s1-lecon",
        ordre: 1,
        titre: "Leçon",
        type: "lecon",
        contenu: [
          { type: "texte", texte: "Un texte." },
          { type: "a_retenir", points: ["Un point"] },
        ],
      },
      {
        id: "banque-s1-quiz",
        ordre: 2,
        titre: "Quiz",
        type: "quiz",
        contenu: [],
        quiz: {
          seuilReussite: 70,
          questions: [{ id: "q1", question: "Alors ?", choix: ["A", "B"], bonneReponseIndex: 1 }],
        },
      },
    ],
  };
}

/** Applique une modification sur une copie profonde, puis valide. */
function valider(modifier: (parcours: any) => void) {
  const copie = JSON.parse(JSON.stringify(parcoursValide()));
  modifier(copie);
  return validerParcours(copie, "banque");
}

describe("validerParcours — cas nominal", () => {
  test("accepte un parcours bien formé", () => {
    const resultat = validerParcours(parcoursValide(), "banque");
    expect(resultat.ok).toBe(true);
  });

  test("accepte les champs facultatifs absents", () => {
    expect(valider((p) => delete p.description).ok).toBe(true);
  });

  test("refuse un identifiant qui ne correspond pas à celui demandé", () => {
    // Protège contre une requête qui rendrait la mauvaise ligne.
    const resultat = validerParcours(parcoursValide(), "marche");
    expect(resultat.ok).toBe(false);
  });
});

describe("validerParcours — structure du parcours", () => {
  test.each([
    ["ce n'est pas un objet", () => validerParcours("du texte", "banque")],
    ["tableau au lieu d'objet", () => validerParcours([], "banque")],
    ["null", () => validerParcours(null, "banque")],
  ])("refuse %s", (_cas, executer) => {
    expect(executer().ok).toBe(false);
  });

  test.each([
    ["sans titre", (p: any) => (p.titre = "")],
    ["sans version numérique", (p: any) => (p.version = "3")],
    ["avec un type inattendu", (p: any) => (p.type = "chapitre")],
    ["sans étape", (p: any) => (p.etapes = [])],
    ["avec des étapes qui ne sont pas un tableau", (p: any) => (p.etapes = {})],
  ])("refuse un parcours %s", (_cas, casser) => {
    expect(valider(casser).ok).toBe(false);
  });

  test("refuse deux étapes qui partagent le même identifiant", () => {
    const resultat = valider((p) => (p.etapes[1].id = p.etapes[0].id));
    expect(resultat.ok).toBe(false);
    if (!resultat.ok) expect(resultat.raison).toContain("dupliqué");
  });
});

describe("validerParcours — étapes et blocs", () => {
  test.each([
    ["un type d'étape inconnu", (p: any) => (p.etapes[0].type = "podcast")],
    ["une étape sans titre", (p: any) => (p.etapes[0].titre = "  ")],
    ["un ordre non numérique", (p: any) => (p.etapes[0].ordre = "1")],
    ["un contenu absent", (p: any) => delete p.etapes[0].contenu],
    ["un bloc de type inconnu", (p: any) => p.etapes[0].contenu.push({ type: "video", url: "x" })],
    ["un bloc texte vide", (p: any) => (p.etapes[0].contenu[0].texte = "")],
    ["une liste sans items", (p: any) => p.etapes[0].contenu.push({ type: "liste", items: [] })],
  ])("refuse %s", (_cas, casser) => {
    expect(valider(casser).ok).toBe(false);
  });

  test("la raison désigne l'étape fautive", () => {
    const resultat = valider((p) => (p.etapes[1].type = "podcast"));
    expect(resultat.ok).toBe(false);
    if (!resultat.ok) expect(resultat.raison).toContain("banque-s1-quiz");
  });
});

describe("validerParcours — quiz", () => {
  test("refuse un index de bonne réponse hors bornes", () => {
    // C'est le cas qui ferait planter l'écran de correction.
    expect(valider((p) => (p.etapes[1].quiz.questions[0].bonneReponseIndex = 2)).ok).toBe(false);
    expect(valider((p) => (p.etapes[1].quiz.questions[0].bonneReponseIndex = -1)).ok).toBe(false);
  });

  test("refuse une question à moins de deux choix", () => {
    expect(valider((p) => (p.etapes[1].quiz.questions[0].choix = ["Seul"])).ok).toBe(false);
  });

  test("refuse un quiz sans question", () => {
    expect(valider((p) => (p.etapes[1].quiz.questions = [])).ok).toBe(false);
  });
});

describe("validerParcours — simulateurs", () => {
  const avecExemple = (simulateur: unknown) =>
    valider((p) =>
      p.etapes.push({ id: "banque-s1-exemple", ordre: 3, titre: "Exemple", type: "exemple", contenu: [], simulateur })
    );

  const bon = {
    formule: "interet_compose",
    variables: [
      { id: "capital", label: "Capital", min: 100, max: 1000, pas: 100, valeurParDefaut: 500 },
      { id: "taux", label: "Taux", min: 0, max: 10, pas: 0.5, valeurParDefaut: 3 },
      { id: "duree", label: "Durée", min: 1, max: 30, pas: 1, valeurParDefaut: 10 },
    ],
    resultat: { label: "Capital final" },
  };

  test("accepte un simulateur dont les variables correspondent à la formule", () => {
    expect(avecExemple(bon).ok).toBe(true);
  });

  test("refuse une formule inconnue", () => {
    expect(avecExemple({ ...bon, formule: "boule_de_cristal" }).ok).toBe(false);
  });

  test("refuse des variables qui ne correspondent pas à la formule", () => {
    expect(avecExemple({ ...bon, variables: bon.variables.slice(0, 2) }).ok).toBe(false);
  });

  test("refuse une valeur par défaut hors bornes", () => {
    const variables = JSON.parse(JSON.stringify(bon.variables));
    variables[0].valeurParDefaut = 5000;
    expect(avecExemple({ ...bon, variables }).ok).toBe(false);
  });

  test("refuse un pas nul, qui bloquerait les boutons + et −", () => {
    const variables = JSON.parse(JSON.stringify(bon.variables));
    variables[0].pas = 0;
    expect(avecExemple({ ...bon, variables }).ok).toBe(false);
  });
});

describe("validerParcours — schémas", () => {
  const avecSchema = (schema: unknown) => valider((p) => p.etapes[0].contenu.push({ type: "schema", schema }));

  test("refuse une série dont les points ne correspondent pas à l'axe", () => {
    expect(
      avecSchema({
        kind: "courbes",
        axeX: ["A", "B", "C"],
        series: [{ label: "Série", points: [1, 2] }],
      }).ok
    ).toBe(false);
  });

  test("refuse une répartition entièrement nulle, qui ne peut pas être normalisée", () => {
    expect(avecSchema({ kind: "repartition", parts: [{ label: "A", valeur: 0 }] }).ok).toBe(false);
  });

  test("accepte un schéma en barres bien formé", () => {
    expect(avecSchema({ kind: "barres", barres: [{ label: "A", valeur: 12 }] }).ok).toBe(true);
  });
});

describe("validerParcours — sources et récompense", () => {
  test("refuse une source sans URL https", () => {
    expect(valider((p) => (p.sources = [{ libelle: "Site", url: "http://exemple.fr" }])).ok).toBe(false);
  });

  test("accepte des sources bien formées", () => {
    expect(valider((p) => (p.sources = [{ libelle: "Site", url: "https://exemple.fr" }])).ok).toBe(true);
  });

  test("refuse une récompense incomplète", () => {
    expect(valider((p) => (p.recompense = { livre: { titre: "Livre" }, code: "X" })).ok).toBe(false);
  });
});

describe("validerParcours — contenu réellement embarqué", () => {
  // Le filet de sécurité ultime : ce que l'app transporte doit toujours passer sa propre
  // validation, sinon le repli lui-même serait rejeté.
  test.each(["intro", ...VOIES.map((voie) => voie.id)])("le parcours embarqué « %s » est valide", (id) => {
    const parcours = recupererParcoursBundle(id);
    expect(parcours).toBeDefined();
    const resultat = validerParcours(parcours, id);
    if (!resultat.ok) throw new Error(resultat.raison);
    expect(resultat.ok).toBe(true);
    expect(estParcoursValide(parcours, id)).toBe(true);
  });
});
