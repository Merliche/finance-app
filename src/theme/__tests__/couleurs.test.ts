import { assombrir, avecAlpha, eclaircir, melanger, versRvb } from "../couleurs";
import { THEMES_PARCOURS } from "../parcoursTheme";

describe("versRvb", () => {
  test("lit la notation longue et la notation courte", () => {
    expect(versRvb("#2E6FE0")).toEqual({ r: 46, g: 111, b: 224 });
    expect(versRvb("#FFF")).toEqual({ r: 255, g: 255, b: 255 });
    expect(versRvb("2e6fe0")).toEqual({ r: 46, g: 111, b: 224 });
  });

  test("une entrée illisible donne du noir, jamais NaN", () => {
    // Une couleur invalide doit dégrader proprement : un NaN se propagerait jusqu'à un
    // style, et React Native lèverait au rendu.
    expect(versRvb("pas une couleur")).toEqual({ r: 0, g: 0, b: 0 });
    expect(versRvb("")).toEqual({ r: 0, g: 0, b: 0 });
  });
});

describe("eclaircir / assombrir", () => {
  test("les extrêmes donnent blanc et noir", () => {
    expect(eclaircir("#2E6FE0", 1)).toBe("#FFFFFF");
    expect(assombrir("#2E6FE0", 1)).toBe("#000000");
  });

  test("un ratio nul ne change rien", () => {
    expect(eclaircir("#2E6FE0", 0)).toBe("#2E6FE0");
    expect(assombrir("#2E6FE0", 0)).toBe("#2E6FE0");
  });

  test("éclaircir monte chaque canal, assombrir le descend", () => {
    const clair = versRvb(eclaircir("#2E6FE0", 0.4));
    const sombre = versRvb(assombrir("#2E6FE0", 0.4));
    const base = versRvb("#2E6FE0");
    expect(clair.r).toBeGreaterThan(base.r);
    expect(clair.b).toBeGreaterThan(base.b);
    expect(sombre.r).toBeLessThan(base.r);
    expect(sombre.b).toBeLessThan(base.b);
  });

  test("un ratio hors bornes est ramené dans l'intervalle", () => {
    expect(eclaircir("#2E6FE0", 4)).toBe("#FFFFFF");
    expect(assombrir("#2E6FE0", -2)).toBe("#2E6FE0");
  });
});

describe("avecAlpha", () => {
  test("rend une couleur rgba utilisable telle quelle par React Native", () => {
    expect(avecAlpha("#2E6FE0", 0.5)).toBe("rgba(46, 111, 224, 0.5)");
    expect(avecAlpha("#FFFFFF", 0)).toBe("rgba(255, 255, 255, 0)");
  });

  test("borne l'alpha", () => {
    expect(avecAlpha("#000000", 5)).toBe("rgba(0, 0, 0, 1)");
    expect(avecAlpha("#000000", -1)).toBe("rgba(0, 0, 0, 0)");
  });
});

describe("melanger", () => {
  test("les extrêmes rendent chacune des deux couleurs", () => {
    expect(melanger("#000000", "#FFFFFF", 0)).toBe("#000000");
    expect(melanger("#000000", "#FFFFFF", 1)).toBe("#FFFFFF");
  });

  test("le milieu est à mi-chemin", () => {
    expect(melanger("#000000", "#FFFFFF", 0.5)).toBe("#808080");
  });
});

describe("dérivés des thèmes de parcours", () => {
  // Ces variantes servent au relief des nœuds et aux nappes du fond : si l'une d'elles
  // sortait hors de la notation hexadécimale, tout le chemin cesserait de s'afficher.
  test.each(Object.entries(THEMES_PARCOURS))("le thème « %s » produit des variantes valides", (_id, theme) => {
    for (const couleur of [theme.primary, theme.primaryDark, theme.tint, theme.tintFort]) {
      expect(eclaircir(couleur, 0.3)).toMatch(/^#[0-9A-F]{6}$/);
      expect(assombrir(couleur, 0.15)).toMatch(/^#[0-9A-F]{6}$/);
      expect(melanger(couleur, theme.primary, 0.4)).toMatch(/^#[0-9A-F]{6}$/);
      expect(avecAlpha(couleur, 0.2)).toMatch(/^rgba\(\d+, \d+, \d+, [\d.]+\)$/);
    }
  });
});
