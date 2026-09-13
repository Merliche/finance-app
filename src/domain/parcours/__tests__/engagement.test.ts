import { calculerSerie, calculerXp, jourLocal, niveauDepuisXp, XP_PAR_ETAPE } from "../engagement";

describe("calculerXp / niveauDepuisXp", () => {
  test("additionne les étapes validées de tous les parcours", () => {
    const xp = calculerXp({
      intro: { parcoursId: "intro", etapesCompletees: ["a", "b", "c"], statut: "en_cours", recompenseDebloquee: false },
      banque: { parcoursId: "banque", etapesCompletees: ["d"], statut: "en_cours", recompenseDebloquee: false },
    });
    expect(xp).toBe(4 * XP_PAR_ETAPE);
  });

  test("un niveau tous les 100 XP, en partant du niveau 1", () => {
    expect(niveauDepuisXp(0)).toEqual({ niveau: 1, xpDansNiveau: 0, xpPourSuivant: 100 });
    expect(niveauDepuisXp(99).niveau).toBe(1);
    expect(niveauDepuisXp(100)).toEqual({ niveau: 2, xpDansNiveau: 0, xpPourSuivant: 100 });
    expect(niveauDepuisXp(260)).toEqual({ niveau: 3, xpDansNiveau: 60, xpPourSuivant: 100 });
  });
});

describe("calculerSerie", () => {
  test("zéro sans activité aujourd'hui ni hier", () => {
    expect(calculerSerie([], "2026-09-11")).toBe(0);
    expect(calculerSerie(["2026-09-08"], "2026-09-11")).toBe(0);
  });

  test("compte les jours consécutifs se terminant aujourd'hui", () => {
    expect(calculerSerie(["2026-09-09", "2026-09-10", "2026-09-11"], "2026-09-11")).toBe(3);
  });

  test("ne casse pas la série si l'app n'a pas encore été ouverte aujourd'hui", () => {
    expect(calculerSerie(["2026-09-09", "2026-09-10"], "2026-09-11")).toBe(2);
  });

  test("un trou dans les jours arrête le comptage", () => {
    expect(calculerSerie(["2026-09-07", "2026-09-09", "2026-09-10", "2026-09-11"], "2026-09-11")).toBe(3);
  });

  test("passe correctement les changements de mois et d'année", () => {
    expect(calculerSerie(["2025-12-31", "2026-01-01"], "2026-01-01")).toBe(2);
    expect(calculerSerie(["2026-02-28", "2026-03-01"], "2026-03-01")).toBe(2);
  });

  test("jourLocal formate en AAAA-MM-JJ avec zéros", () => {
    expect(jourLocal(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
