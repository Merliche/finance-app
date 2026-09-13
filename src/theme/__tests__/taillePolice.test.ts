import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { PLAFOND_ETIQUETTE, PLAFOND_PASTILLE } from "../typographie";

// La taille de police du système est le premier réglage qu'utilisent les personnes qui
// voient mal. React Native l'applique par défaut à chaque `Text`, et le desactiver
// (`allowFontScaling={false}`) revient à le leur retirer.
//
// L'exception est un texte enfermé dans une boîte qui ne peut pas grandir : un numéro dans
// une pastille ronde, une lettre de réponse dans un carré. Agrandi sans limite, il déborde
// ou se fait rogner, et le réglage produit alors l'inverse de ce qu'on cherchait. Ces
// textes-là reçoivent un plafond, jamais une désactivation.
//
// Ce test tient les deux bouts : interdire la désactivation, et garder le plafond rare.

const RACINE = resolve(__dirname, "../../..");

function fichiersSources(dossier: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(dossier)) {
    if (entree === "node_modules" || entree === ".expo" || entree === "__tests__") continue;
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...fichiersSources(chemin));
    else if (/\.tsx?$/.test(entree)) trouves.push(chemin);
  }
  return trouves;
}

const SOURCES = [...fichiersSources(join(RACINE, "src")), ...fichiersSources(join(RACINE, "app"))].map(
  (chemin) => ({ chemin: chemin.slice(RACINE.length + 1), contenu: readFileSync(chemin, "utf8") })
);

describe("taille de police du système", () => {
  test("il y a bien des sources à inspecter", () => {
    // Sans ça, une erreur de chemin rendrait les tests suivants vides et toujours verts.
    expect(SOURCES.length).toBeGreaterThan(50);
  });

  test("aucun écran ne désactive l'agrandissement du texte", () => {
    const fautifs = SOURCES.filter(({ contenu }) => /allowFontScaling\s*=\s*\{?\s*false/.test(contenu)).map(
      ({ chemin }) => chemin
    );
    expect(fautifs).toEqual([]);
  });

  test("le plafond reste l'exception, réservé aux boîtes qui ne grandissent pas", () => {
    // S'il se répand, c'est que le réglage d'accessibilité est neutralisé par la bande.
    const plafonnes = SOURCES.filter(({ contenu }) => contenu.includes("maxFontSizeMultiplier"));
    expect(plafonnes.length).toBeGreaterThan(0);
    expect(plafonnes.length).toBeLessThanOrEqual(10);
  });

  test("les plafonds laissent une marge d'agrandissement réelle", () => {
    // Un plafond trop bas revient à désactiver le réglage sans le dire.
    expect(PLAFOND_PASTILLE).toBeGreaterThanOrEqual(1.2);
    expect(PLAFOND_ETIQUETTE).toBeGreaterThan(PLAFOND_PASTILLE);
    expect(PLAFOND_ETIQUETTE).toBeLessThanOrEqual(2);
  });

  test("un texte plafonné utilise un jeton partagé, pas un nombre écrit sur place", () => {
    for (const { chemin, contenu } of SOURCES) {
      if (!contenu.includes("maxFontSizeMultiplier")) continue;
      const occurrences = contenu.match(/maxFontSizeMultiplier=\{([^}]+)\}/g) ?? [];
      for (const occurrence of occurrences) {
        expect(`${chemin} : ${occurrence}`).toMatch(/PLAFOND_(PASTILLE|ETIQUETTE)/);
      }
    }
  });
});
