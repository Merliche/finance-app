import { construireFiche, ficheEnTexte } from "../fiche";
import type { Parcours } from "../types";
import { recupererParcoursBundle } from "../../../data/content";
import { infosSession } from "../../../constants/sessions";
import { VOIES } from "../../../constants/voies";

function parcoursDeTest(): Parcours {
  return {
    id: "banque",
    titre: "La voie Banque",
    description: "",
    ordre: 1,
    type: "voie",
    version: 1,
    chiffresVerifiesLe: "2026-09-12",
    etapes: [
      {
        id: "banque-s1-lecon",
        ordre: 1,
        titre: "Le compte courant",
        type: "lecon",
        contenu: [
          { type: "texte", texte: "Un texte qui ne doit pas entrer dans la fiche." },
          { type: "definition", terme: "Agios", texte: "Court." },
          { type: "a_retenir", points: ["Premier point", "Deuxième point"] },
        ],
      },
      {
        id: "banque-s1-situation",
        ordre: 2,
        titre: "Le découvert de fin de mois",
        type: "situation",
        contenu: [],
        situation: {
          contexte: "Tu es à découvert.",
          choix: [
            { id: "a", texte: "Appeler ta banque", feedback: "C'est le bon geste.", qualite: "recommande" },
            { id: "b", texte: "Attendre", feedback: "Ça se paie.", qualite: "acceptable" },
            { id: "c", texte: "Prendre un crédit renouvelable", feedback: "Le plus cher.", qualite: "deconseille" },
          ],
        },
      },
      {
        id: "banque-s2-lecon",
        ordre: 3,
        titre: "L'épargne",
        type: "lecon",
        contenu: [
          // Le même mot, redéfini dans une autre session : les deux doivent rester, chacune
          // sous sa session (voir le commentaire sur la déduplication dans fiche.ts).
          { type: "definition", terme: "agios", texte: "Les intérêts que coûte un découvert, calculés au jour le jour." },
          // Doublon dans la MÊME session : celui-là se collapse, sur la version la plus longue.
          { type: "definition", terme: "Livret A", texte: "Court." },
          { type: "definition", terme: "livret a", texte: "Une épargne disponible et défiscalisée, plafonnée." },
          { type: "a_retenir", points: ["Troisième point"] },
        ],
      },
    ],
  };
}

const FICHE = construireFiche(parcoursDeTest(), (session) => `Session numéro ${session}`);

describe("construireFiche", () => {
  test("rassemble les points clés par session, dans l'ordre", () => {
    expect(FICHE.sections.map((s) => s.session)).toEqual([1, 2]);
    expect(FICHE.sections[0].points).toEqual(["Premier point", "Deuxième point"]);
    expect(FICHE.sections[1].points).toEqual(["Troisième point"]);
    expect(FICHE.nbPoints).toBe(3);
  });

  test("ne retient que les blocs qui font une fiche", () => {
    // Un paragraphe de leçon n'a rien à faire dans un mémo : seuls les « à retenir » et
    // les définitions y entrent.
    const tout = JSON.stringify(FICHE);
    expect(tout).not.toContain("ne doit pas entrer dans la fiche");
  });

  test("un doublon dans la même session se collapse, sur la version la plus complète", () => {
    const session2 = FICHE.sections[1].definitions.map((d) => d.terme.toLowerCase());
    expect(session2.filter((t) => t === "livret a")).toHaveLength(1);
    const livret = FICHE.sections[1].definitions.find((d) => d.terme.toLowerCase() === "livret a");
    expect(livret?.texte).toContain("plafonnée");
  });

  test("un mot redéfini dans une AUTRE session garde ses deux définitions", () => {
    // Elles ne disent pas la même chose : « cotisations sociales » désigne un prélèvement
    // sur salaire dans une session et sur chiffre d'affaires dans une autre. Garder la
    // plus longue ferait apparaître la seconde sous le titre de la première.
    expect(FICHE.sections[0].definitions.map((d) => d.terme.toLowerCase())).toContain("agios");
    expect(FICHE.sections[1].definitions.map((d) => d.terme.toLowerCase())).toContain("agios");
    expect(FICHE.sections[0].definitions.find((d) => d.terme.toLowerCase() === "agios")?.texte).toBe("Court.");
    expect(FICHE.nbDefinitions).toBe(3);
  });

  test("le choix recommandé devient un réflexe, le déconseillé un piège", () => {
    expect(FICHE.reflexes).toHaveLength(1);
    expect(FICHE.reflexes[0].geste).toBe("Appeler ta banque");
    expect(FICHE.reflexes[0].contexte).toBe("Le découvert de fin de mois");
    expect(FICHE.pieges).toHaveLength(1);
    expect(FICHE.pieges[0].geste).toBe("Prendre un crédit renouvelable");
    // Le choix « acceptable » n'est ni l'un ni l'autre : il ne dit rien à retenir.
    const gestes = [...FICHE.reflexes, ...FICHE.pieges].map((c) => c.geste);
    expect(gestes).not.toContain("Attendre");
  });

  test("le titre de session vient de l'appelant", () => {
    expect(FICHE.sections[0].titre).toBe("Session numéro 1");
  });

  test("se passe des titres de session si on n'en fournit pas", () => {
    const sansTitres = construireFiche(parcoursDeTest());
    expect(sansTitres.sections[0].titre).toBeUndefined();
    expect(sansTitres.nbPoints).toBe(3);
  });

  test("ne dépend pas de la progression", () => {
    // Contrairement au bilan : on n'obtient la fiche qu'en ayant terminé la voie, donc
    // tout a été traversé. Elle doit être complète sans qu'on lui passe une progression.
    expect(FICHE.nbSessions).toBe(2);
  });
});

describe("ficheEnTexte", () => {
  const texte = ficheEnTexte(FICHE);

  test("contient tout ce que la fiche affiche", () => {
    expect(texte).toContain("LA VOIE BANQUE");
    expect(texte).toContain("Premier point");
    expect(texte).toContain("Troisième point");
    expect(texte).toContain("Livret A");
    expect(texte).toContain("Appeler ta banque");
    expect(texte).toContain("Prendre un crédit renouvelable");
  });

  test("rappelle la date de vérification et l'avertissement", () => {
    expect(texte).toContain("2026-09-12");
    expect(texte).toContain("ne constitue pas un conseil en investissement");
  });
});

describe("fiches des voies réellement embarquées", () => {
  // Le filet de sécurité : la récompense se fabrique à partir du contenu, donc une voie
  // dont le contenu changerait au point de ne plus rien produire livrerait un écran vide.
  test.each(VOIES.map((voie) => voie.id))("la voie « %s » produit une fiche substantielle", (id) => {
    const parcours = recupererParcoursBundle(id);
    expect(parcours).toBeDefined();
    const fiche = construireFiche(parcours!, (session) => infosSession(id, session)?.titre);

    expect(fiche.nbSessions).toBeGreaterThanOrEqual(9);
    expect(fiche.nbPoints).toBeGreaterThanOrEqual(40);
    expect(fiche.nbDefinitions).toBeGreaterThanOrEqual(15);
    expect(fiche.reflexes.length).toBeGreaterThanOrEqual(5);
    expect(fiche.pieges.length).toBeGreaterThanOrEqual(5);
    // Chaque section porte son titre de session : une fiche numérotée sans intitulé
    // serait illisible une fois partagée hors de l'application.
    for (const section of fiche.sections) expect(section.titre).toBeTruthy();
  });

  test.each(VOIES.map((voie) => voie.id))("la version texte de « %s » est lisible telle quelle", (id) => {
    const fiche = construireFiche(recupererParcoursBundle(id)!, (session) => infosSession(id, session)?.titre);
    const texte = ficheEnTexte(fiche);
    expect(texte.length).toBeGreaterThan(2000);
    expect(texte).not.toContain("undefined");
    expect(texte).not.toContain("[object");
  });
});
