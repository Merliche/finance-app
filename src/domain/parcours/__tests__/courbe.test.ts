import { ABSCISSE_PAR_FORMULE, echantillonnerSimulateur } from "../simulateurs/courbe";
import { VARIABLES_PAR_FORMULE } from "../simulateurs";
import type { FormuleSimulateur, Simulateur } from "../types";

const interetCompose: Simulateur = {
  formule: "interet_compose",
  variables: [
    { id: "capital", label: "Capital", unite: "€", min: 100, max: 10000, pas: 100, valeurParDefaut: 1000 },
    { id: "taux", label: "Taux", unite: "%", min: 0, max: 10, pas: 0.5, valeurParDefaut: 5 },
    { id: "duree", label: "Durée", unite: "ans", min: 1, max: 30, pas: 1, valeurParDefaut: 10 },
  ],
  resultat: { label: "Capital final", unite: "€" },
};

describe("ABSCISSE_PAR_FORMULE", () => {
  test("chaque formule porte en abscisse une de ses propres variables", () => {
    for (const formule of Object.keys(VARIABLES_PAR_FORMULE) as FormuleSimulateur[]) {
      expect(VARIABLES_PAR_FORMULE[formule]).toContain(ABSCISSE_PAR_FORMULE[formule]);
    }
  });
});

describe("echantillonnerSimulateur", () => {
  test("couvre toute la plage de la variable d'abscisse, dans l'ordre", () => {
    const echantillon = echantillonnerSimulateur(interetCompose, { capital: 1000, taux: 5, duree: 10 })!;
    expect(echantillon.variable.id).toBe("duree");
    expect(echantillon.points[0].x).toBeCloseTo(1);
    expect(echantillon.points[echantillon.points.length - 1].x).toBeCloseTo(30);
    for (let i = 1; i < echantillon.points.length; i++) {
      expect(echantillon.points[i].x).toBeGreaterThan(echantillon.points[i - 1].x);
    }
  });

  test("le point courant correspond au résultat affiché", () => {
    const echantillon = echantillonnerSimulateur(interetCompose, { capital: 1000, taux: 5, duree: 10 })!;
    expect(echantillon.xCourant).toBe(10);
    expect(echantillon.yCourant).toBeCloseTo(1628.89, 1);
  });

  test("les autres variables gardent leur valeur courante le long de la courbe", () => {
    const a = echantillonnerSimulateur(interetCompose, { capital: 1000, taux: 5, duree: 10 })!;
    const b = echantillonnerSimulateur(interetCompose, { capital: 2000, taux: 5, duree: 10 })!;
    expect(b.points[5].y).toBeCloseTo(a.points[5].y * 2, 6);
  });

  test("écarte les points non finis plutôt que de casser le tracé", () => {
    // La règle des 72 à taux nul ne double jamais : le premier point est infini.
    const regle72: Simulateur = {
      formule: "regle_72",
      variables: [{ id: "taux", label: "Taux", unite: "%", min: 0, max: 12, pas: 0.5, valeurParDefaut: 6 }],
      resultat: { label: "Années", unite: "ans" },
    };
    const echantillon = echantillonnerSimulateur(regle72, { taux: 6 })!;
    expect(echantillon.points.every((point) => Number.isFinite(point.y))).toBe(true);
    expect(echantillon.points.length).toBeGreaterThan(20);
  });

  test("pas de courbe quand la plage est vide", () => {
    const figé: Simulateur = {
      formule: "regle_72",
      variables: [{ id: "taux", label: "Taux", unite: "%", min: 5, max: 5, pas: 1, valeurParDefaut: 5 }],
      resultat: { label: "Années" },
    };
    expect(echantillonnerSimulateur(figé, { taux: 5 })).toBeUndefined();
  });
});
