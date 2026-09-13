import { melanger, versRvb } from "../couleurs";
import { PALETTE_CLAIRE, PALETTE_SOMBRE, palette, voile, type Couleurs } from "../palettes";
import { THEMES_PARCOURS, themeDuParcours } from "../parcoursTheme";

/** Luminance relative, au sens WCAG. */
function luminance(hex: string): number {
  const { r, g, b } = versRvb(hex);
  const canal = (valeur: number) => {
    const v = valeur / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

/** Rapport de contraste WCAG entre deux couleurs opaques. */
function contraste(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

describe("structure des palettes", () => {
  test("les deux palettes portent exactement les mêmes jetons", () => {
    // Un jeton présent d'un seul côté produirait un `undefined` dans un style, que React
    // Native ignore en silence : l'élément s'afficherait sans couleur, sans erreur.
    expect(Object.keys(PALETTE_SOMBRE).sort()).toEqual(Object.keys(PALETTE_CLAIRE).sort());
    expect(Object.keys(PALETTE_SOMBRE.ombres).sort()).toEqual(Object.keys(PALETTE_CLAIRE.ombres).sort());
  });

  test("aucun jeton de couleur n'est vide", () => {
    for (const nom of Object.keys(PALETTE_CLAIRE) as (keyof Couleurs)[]) {
      if (nom === "ombres") continue;
      for (const p of [PALETTE_CLAIRE, PALETTE_SOMBRE]) {
        expect(typeof p[nom]).toBe("string");
        expect(String(p[nom])).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });

  test("palette() rend la bonne palette", () => {
    expect(palette("clair")).toBe(PALETTE_CLAIRE);
    expect(palette("sombre")).toBe(PALETTE_SOMBRE);
  });
});

describe("lisibilité", () => {
  // 4.5:1 est le seuil AA pour du texte courant, 3:1 pour du texte secondaire de grande
  // taille. Le texte principal doit largement dépasser les deux.
  test.each([
    ["clair", PALETTE_CLAIRE],
    ["sombre", PALETTE_SOMBRE],
  ])("en mode %s, le texte principal contraste fortement avec le fond", (_mode, p) => {
    expect(contraste(p.texte, p.fond)).toBeGreaterThan(10);
    expect(contraste(p.texte, p.surface)).toBeGreaterThan(10);
  });

  test.each([
    ["clair", PALETTE_CLAIRE],
    ["sombre", PALETTE_SOMBRE],
  ])("en mode %s, le texte atténué reste au-dessus du seuil AA", (_mode, p) => {
    expect(contraste(p.texteAttenue, p.fond)).toBeGreaterThan(4.5);
    expect(contraste(p.texteAttenue, p.surface)).toBeGreaterThan(4.5);
  });

  test.each([
    ["clair", PALETTE_CLAIRE],
    ["sombre", PALETTE_SOMBRE],
  ])("en mode %s, le texte tertiaire reste distinguable", (_mode, p) => {
    expect(contraste(p.texteTertiaire, p.fond)).toBeGreaterThan(3);
  });

  test.each([
    ["clair", PALETTE_CLAIRE],
    ["sombre", PALETTE_SOMBRE],
  ])("en mode %s, succès et erreur se lisent sur leur propre fond", (_mode, p) => {
    expect(contraste(p.succes, p.succesFond)).toBeGreaterThan(3);
    expect(contraste(p.erreur, p.erreurFond)).toBeGreaterThan(3);
    expect(contraste(p.ambre, p.ambreFond)).toBeGreaterThan(3);
  });

  test("en sombre, ni noir pur ni blanc pur", () => {
    // Le contraste maximal fatigue l'œil et fait vibrer les petits textes sur OLED.
    expect(PALETTE_SOMBRE.fond).not.toBe("#000000");
    expect(PALETTE_SOMBRE.texte).not.toBe("#FFFFFF");
  });

  test("une surface se détache de son fond dans les deux modes", () => {
    // En sombre l'élévation passe par la luminosité, pas par l'ombre : si la surface et
    // le fond étaient identiques, plus aucune carte ne se verrait.
    expect(PALETTE_SOMBRE.surface).not.toBe(PALETTE_SOMBRE.fond);
    expect(luminance(PALETTE_SOMBRE.surface)).toBeGreaterThan(luminance(PALETTE_SOMBRE.fond));
    expect(luminance(PALETTE_CLAIRE.surface)).toBeGreaterThan(luminance(PALETTE_CLAIRE.fond));
  });
});

describe("voiles de parcours", () => {
  test.each(Object.keys(THEMES_PARCOURS))("la voie « %s » garde son identité dans les deux modes", (id) => {
    const clair = themeDuParcours(id, "clair");
    const sombre = themeDuParcours(id, "sombre");
    // La couleur d'identité ne bouge pas : c'est elle qui dit de quelle voie il s'agit.
    expect(sombre.primary).toBe(clair.primary);
    expect(sombre.primaryDark).toBe(clair.primaryDark);
  });

  test.each(Object.keys(THEMES_PARCOURS))("les voiles de « %s » suivent le mode", (id) => {
    const clair = themeDuParcours(id, "clair");
    const sombre = themeDuParcours(id, "sombre");
    // En clair, un voile est presque blanc ; en sombre, il doit être sombre, sans quoi il
    // ferait une tache lumineuse au milieu de l'écran.
    expect(luminance(clair.tint)).toBeGreaterThan(0.6);
    expect(luminance(sombre.tint)).toBeLessThan(0.2);
    expect(luminance(sombre.tintFort)).toBeLessThan(0.3);
  });

  test.each(Object.keys(THEMES_PARCOURS))("du texte se lit sur les voiles de « %s »", (id) => {
    for (const mode of ["clair", "sombre"] as const) {
      const theme = themeDuParcours(id, mode);
      expect(contraste(palette(mode).texte, theme.tint)).toBeGreaterThan(4.5);
    }
  });

  test("voile() part de la surface du mode, jamais du blanc", () => {
    expect(voile("#2E6FE0", "clair", "leger")).toBe(melanger("#FFFFFF", "#2E6FE0", 0.12));
    expect(luminance(voile("#2E6FE0", "sombre", "fort"))).toBeLessThan(0.3);
  });

  test("un parcours inconnu retombe sur le thème par défaut, dans les deux modes", () => {
    expect(themeDuParcours("inexistant", "sombre").primary).toBe(THEMES_PARCOURS.intro.primary);
  });
});
