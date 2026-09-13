import { bornesY, longueurPolyligne, normaliserParts, projeterSerie, tracerCourbe } from "../geometrie";

describe("bornesY", () => {
  test("inclut zéro quand toutes les valeurs sont positives, avec une marge en haut", () => {
    const b = bornesY([100, 250, 400]);
    expect(b.min).toBe(0);
    expect(b.max).toBeGreaterThan(400);
  });

  test("descend sous le minimum quand il y a des valeurs négatives", () => {
    const b = bornesY([-50, 20, 80]);
    expect(b.min).toBeLessThan(-50);
  });
});

describe("projeterSerie", () => {
  test("répartit les points sur toute la largeur et inverse l'axe vertical", () => {
    const points = projeterSerie([0, 50, 100], { largeur: 200, hauteur: 100 }, { min: 0, max: 100 });
    expect(points.map((p) => p.x)).toEqual([0, 100, 200]);
    expect(points[0].y).toBe(100); // valeur 0 tout en bas
    expect(points[2].y).toBe(0); // valeur max tout en haut
  });

  test("un point unique se centre", () => {
    expect(projeterSerie([5], { largeur: 200, hauteur: 100 }, { min: 0, max: 10 })[0].x).toBe(100);
  });
});

describe("tracerCourbe / longueurPolyligne", () => {
  test("commence par un déplacement puis enchaîne des Bézier", () => {
    const d = tracerCourbe([
      { x: 0, y: 10 },
      { x: 10, y: 0 },
    ]);
    expect(d.startsWith("M0,10")).toBe(true);
    expect(d).toContain(" C5,10 5,0 10,0");
  });

  test("la longueur d'une polyligne en deux segments", () => {
    expect(
      longueurPolyligne([
        { x: 0, y: 0 },
        { x: 3, y: 4 },
        { x: 3, y: 10 },
      ])
    ).toBe(11);
  });
});

describe("normaliserParts", () => {
  test("normalise à 1 et cumule les départs", () => {
    const parts = normaliserParts([50, 30, 20]);
    expect(parts.map((p) => p.fraction)).toEqual([0.5, 0.3, 0.2]);
    expect(parts.map((p) => p.depart)).toEqual([0, 0.5, 0.8]);
  });

  test("ignore les valeurs négatives et survit à un total nul", () => {
    expect(normaliserParts([0, 0]).map((p) => p.fraction)).toEqual([0, 0]);
    expect(normaliserParts([-5, 5])[1].fraction).toBe(1);
  });
});
