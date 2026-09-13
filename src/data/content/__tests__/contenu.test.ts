// Garde-fou sur le contenu embarqué : il est écrit à la main (et publié tel quel sur
// Supabase), donc les invariants dont dépendent les écrans sont vérifiés ici plutôt que
// découverts à l'exécution sur le téléphone d'un utilisateur.
import { recupererParcoursBundle } from "..";
import { obtenirTousLesElementsLateraux } from "../elementsLateraux";
import { sessionDeEtape, sessionsAtteintes } from "../../../constants/sessions";
import { infosSession } from "../../../constants/sessions";
import { VARIABLES_PAR_FORMULE, resoudreFormule } from "../../../domain/parcours/simulateurs";
import type { Parcours } from "../../../domain/parcours/types";
import { VOIES } from "../../../constants/voies";

// Dérivé de VOIES : ajouter une voie sans la bundler doit faire échouer ces tests, pas
// passer inaperçu parce que la liste était recopiée à la main ici.
const IDS = ["intro", ...VOIES.map((voie) => voie.id)];
const PARCOURS = IDS.map((id) => {
  const parcours = recupererParcoursBundle(id);
  if (!parcours) throw new Error(`parcours ${id} absent du registre bundlé`);
  return parcours as Parcours;
});

describe.each(PARCOURS.map((p) => [p.id, p] as const))("contenu du parcours %s", (_id, parcours) => {
  test("les ids d'étape sont uniques", () => {
    const ids = parcours.etapes.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("les ordres sont séquentiels à partir de 1", () => {
    const ordres = parcours.etapes.map((e) => e.ordre).sort((a, b) => a - b);
    expect(ordres).toEqual(ordres.map((_, index) => index + 1));
  });

  test("chaque étape appartient à une session connue de l'app", () => {
    for (const etape of parcours.etapes) {
      const session = sessionDeEtape(etape);
      expect(session).not.toBeNull();
      // Sans libellé, la bannière et la fiche de session n'afficheraient rien.
      expect(infosSession(parcours.id, session!)).toBeDefined();
    }
  });

  test("les sessions se suivent sans trou", () => {
    const sessions = [...new Set(parcours.etapes.map(sessionDeEtape))].sort((a, b) => a! - b!);
    expect(sessions).toEqual(sessions.map((_, index) => index + 1));
  });

  test("chaque simulateur reçoit exactement les variables de sa formule et calcule un nombre fini", () => {
    for (const etape of parcours.etapes) {
      if (etape.type !== "exemple") continue;
      const { formule, variables } = etape.simulateur;
      expect(variables.map((v) => v.id).sort()).toEqual([...VARIABLES_PAR_FORMULE[formule]].sort());
      const valeurs = Object.fromEntries(variables.map((v) => [v.id, v.valeurParDefaut]));
      expect(Number.isFinite(resoudreFormule(formule)(valeurs))).toBe(true);
      for (const variable of variables) {
        expect(variable.valeurParDefaut).toBeGreaterThanOrEqual(variable.min);
        expect(variable.valeurParDefaut).toBeLessThanOrEqual(variable.max);
      }
    }
  });

  test("chaque quiz a un seuil atteignable et des bonnes réponses valides", () => {
    for (const etape of parcours.etapes) {
      if (etape.type !== "quiz") continue;
      const { questions, seuilReussite } = etape.quiz;
      expect(questions.length).toBeGreaterThan(0);
      expect(Math.round((questions.length / questions.length) * 100)).toBeGreaterThanOrEqual(seuilReussite);
      for (const question of questions) {
        expect(question.bonneReponseIndex).toBeGreaterThanOrEqual(0);
        expect(question.bonneReponseIndex).toBeLessThan(question.choix.length);
      }
    }
  });

  test("chaque exercice a un seuil atteignable et des réponses du bon type", () => {
    for (const etape of parcours.etapes) {
      if (etape.type !== "exercice") continue;
      const { items, seuilReussite } = etape.exercice;
      expect(items.length).toBeGreaterThan(0);
      expect(seuilReussite).toBeLessThanOrEqual(100);
      for (const item of items) {
        expect(item.explication.length).toBeGreaterThan(0);
        if (item.type === "nombre") {
          expect(Number.isFinite(item.reponse)).toBe(true);
          expect(item.tolerance).toBeGreaterThanOrEqual(0);
        } else {
          expect(typeof item.reponse).toBe("boolean");
        }
      }
    }
  });

  test("chaque situation propose un choix recommandé", () => {
    for (const etape of parcours.etapes) {
      if (etape.type !== "situation") continue;
      expect(etape.situation.choix.some((choix) => choix.qualite === "recommande")).toBe(true);
    }
  });

  test("chaque scénario a un bilan de repli et au moins un bon choix par décision", () => {
    for (const etape of parcours.etapes) {
      if (etape.type !== "scenario") continue;
      const { decisions, bilans } = etape.scenario;
      expect(decisions.length).toBeGreaterThan(0);
      // Sans bilan à seuil 0, un parcours catastrophique n'afficherait rien à la fin.
      expect(bilans.some((bilan) => bilan.seuil === 0)).toBe(true);
      for (const decision of decisions) {
        expect(decision.options.length).toBeGreaterThanOrEqual(2);
        expect(decision.options.some((option) => option.points === 2)).toBe(true);
        for (const option of decision.options) {
          expect(option.consequence.length).toBeGreaterThan(0);
          expect([0, 1, 2]).toContain(option.points);
        }
      }
    }
  });

  test("chaque série de schéma a autant de points que d'étiquettes d'axe", () => {
    for (const etape of parcours.etapes) {
      for (const bloc of etape.contenu) {
        if (bloc.type !== "schema" || bloc.schema.kind !== "courbes") continue;
        for (const serie of bloc.schema.series) {
          expect(serie.points).toHaveLength(bloc.schema.axeX.length);
        }
      }
    }
  });
});

describe("éléments latéraux", () => {
  const elements = obtenirTousLesElementsLateraux();

  test("les ids sont uniques", () => {
    const ids = elements.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("chacun est rattaché à une session qui existe dans son parcours", () => {
    for (const element of elements) {
      const parcours = PARCOURS.find((p) => p.id === element.parcoursId);
      expect(parcours).toBeDefined();
      const sessions = new Set(parcours!.etapes.map(sessionDeEtape));
      expect(sessions.has(element.session)).toBe(true);
    }
  });

  test("chaque calculateur libre reçoit les variables de sa formule", () => {
    for (const element of elements) {
      if (element.type !== "calculateur") continue;
      const { formule, variables } = element.simulateur;
      expect(variables.map((v) => v.id).sort()).toEqual([...VARIABLES_PAR_FORMULE[formule]].sort());
    }
  });

  test("chaque session de voie donne droit à un badge", () => {
    for (const parcours of PARCOURS.filter((p) => p.type === "voie")) {
      for (const session of new Set(parcours.etapes.map(sessionDeEtape))) {
        const badge = elements.find((e) => e.type === "badge" && e.parcoursId === parcours.id && e.session === session);
        expect(badge).toBeDefined();
      }
    }
  });

  test("un parcours jamais commencé n'ouvre que les outils de sa première session", () => {
    const parcours = PARCOURS[1];
    const atteintes = sessionsAtteintes(parcours.etapes, []);
    expect([...atteintes]).toEqual([1]);
  });
});

describe("exercices : chaque question doit tenir debout seule", () => {
  // L'écran d'exercice n'affiche qu'une question à la fois, et la précédente disparaît.
  // Une question qui renvoie à un énoncé antérieur — « combien d'intérêts dans CE crédit »,
  // « et au bout de deux ans » — est donc littéralement impossible à résoudre : les
  // chiffres dont elle a besoin ne sont plus à l'écran. Deux questions étaient dans ce cas.
  const RENVOIS = /\b(ce crédit|cette offre|ce placement|ce montant|ces mêmes|mêmes\s|ci-dessus|précédent)/i;

  const questionsChiffrees = PARCOURS.flatMap((parcours) =>
    parcours.etapes.flatMap((etape) =>
      etape.type === "exercice"
        ? etape.exercice.items
            .filter((item) => item.type === "nombre")
            .map((item) => ({ etapeId: etape.id, item }))
        : []
    )
  );

  test("il y a bien des questions chiffrées à inspecter", () => {
    expect(questionsChiffrees.length).toBeGreaterThan(5);
  });

  test("aucune ne renvoie à un énoncé qu'on ne voit plus", () => {
    const fautives = questionsChiffrees
      .filter(({ item }) => RENVOIS.test(item.enonce))
      .map(({ etapeId, item }) => `${etapeId} :: ${item.enonce}`);
    expect(fautives).toEqual([]);
  });

  test("chacune porte elle-même les nombres dont elle a besoin", () => {
    // Une question chiffrée sans le moindre chiffre dans son propre énoncé tire
    // forcément ses données d'ailleurs.
    const fautives = questionsChiffrees
      .filter(({ item }) => !/\d/.test(item.enonce))
      .map(({ etapeId, item }) => `${etapeId} :: ${item.enonce}`);
    expect(fautives).toEqual([]);
  });

  test("chacune donne la réponse dans son explication", () => {
    for (const { etapeId, item } of questionsChiffrees) {
      expect(`${etapeId} : ${item.explication}`.length).toBeGreaterThan(40);
    }
  });
});
