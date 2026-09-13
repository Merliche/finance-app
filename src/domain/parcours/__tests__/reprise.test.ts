import { trouverReprise } from "../reprise";
import type { Parcours, ProgressionParcours } from "../types";

function parcours(id: string, nbEtapes: number): Parcours {
  return {
    id,
    titre: `La voie ${id}`,
    description: "",
    ordre: 1,
    type: "voie",
    version: 1,
    etapes: Array.from({ length: nbEtapes }, (_, index) => ({
      id: `${id}-s1-e${index + 1}`,
      ordre: index + 1,
      titre: `Étape ${index + 1}`,
      type: "lecon" as const,
      contenu: [],
    })),
  };
}

function avancement(
  parcoursId: string,
  etapesCompletees: string[],
  extra: Partial<ProgressionParcours> = {}
): ProgressionParcours {
  return {
    parcoursId,
    etapesCompletees,
    statut: "en_cours",
    recompenseDebloquee: false,
    ...extra,
  };
}

const BANQUE = parcours("banque", 4);
const MARCHE = parcours("marche", 4);

describe("trouverReprise", () => {
  test("pointe la première étape non validée du parcours en cours", () => {
    const reprise = trouverReprise([BANQUE], {
      banque: avancement("banque", ["banque-s1-e1", "banque-s1-e2"], { derniereActivite: "2026-09-10T10:00:00Z" }),
    });
    expect(reprise?.parcoursId).toBe("banque");
    expect(reprise?.etape.id).toBe("banque-s1-e3");
    expect(reprise?.parcoursTitre).toBe("La voie banque");
  });

  test("choisit le parcours dont l'activité est la plus récente", () => {
    const reprise = trouverReprise([BANQUE, MARCHE], {
      banque: avancement("banque", ["banque-s1-e1"], { derniereActivite: "2026-09-01T10:00:00Z" }),
      marche: avancement("marche", ["marche-s1-e1"], { derniereActivite: "2026-09-11T10:00:00Z" }),
    });
    expect(reprise?.parcoursId).toBe("marche");
  });

  test("les progressions sans derniereActivite retombent sur dateDebut", () => {
    // Cas des progressions enregistrées par une version antérieure de l'app.
    const reprise = trouverReprise([BANQUE, MARCHE], {
      banque: avancement("banque", ["banque-s1-e1"], { dateDebut: "2026-09-11T10:00:00Z" }),
      marche: avancement("marche", ["marche-s1-e1"], { dateDebut: "2026-09-01T10:00:00Z" }),
    });
    expect(reprise?.parcoursId).toBe("banque");
  });

  test("ignore les parcours jamais commencés", () => {
    expect(trouverReprise([BANQUE], {})).toBeUndefined();
    expect(trouverReprise([BANQUE], { banque: avancement("banque", []) })).toBeUndefined();
  });

  test("ignore les parcours terminés", () => {
    const termine = avancement("banque", BANQUE.etapes.map((e) => e.id), { statut: "termine" });
    expect(trouverReprise([BANQUE], { banque: termine })).toBeUndefined();
  });

  test("passe au parcours suivant si le contenu du premier a rétréci", () => {
    // Toutes les étapes validées mais statut resté « en cours » : ne doit pas bloquer.
    const incoherent = avancement("banque", BANQUE.etapes.map((e) => e.id), {
      derniereActivite: "2026-09-12T10:00:00Z",
    });
    const reprise = trouverReprise([BANQUE, MARCHE], {
      banque: incoherent,
      marche: avancement("marche", ["marche-s1-e1"], { derniereActivite: "2026-09-01T10:00:00Z" }),
    });
    expect(reprise?.parcoursId).toBe("marche");
  });

  test("l'ordre des étapes fait foi, pas leur position dans le tableau", () => {
    const desordonne: Parcours = { ...BANQUE, etapes: [...BANQUE.etapes].reverse() };
    const reprise = trouverReprise([desordonne], { banque: avancement("banque", ["banque-s1-e1"]) });
    expect(reprise?.etape.id).toBe("banque-s1-e2");
  });
});
