import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

// Les icônes sont fabriquées par `npm run icones` à partir de assets/icon-source.png.
// Trois exigences se cassent en silence — aucune erreur au build, seulement un rejet
// d'Apple ou une icône rognée sur un téléphone :
//
//  1. Apple refuse une icône d'App Store qui contient de la transparence. Un outil de
//     retouche qui réenregistre le fichier en RGBA suffit à la réintroduire.
//  2. Android masque jusqu'aux 33 % extérieurs de la couche avant d'une icône adaptative.
//     Un logo qui déborde de la zone sûre est coupé sur les lanceurs à masque rond.
//  3. Les bords découpés du logo gardent la couleur du fond d'origine (voir l'en-tête de
//     scripts/generer-icones.mjs). Ils ne sont invisibles que si les fonds déclarés dans
//     app.json valent EXACTEMENT cette couleur. Une nuance voisine suffit à créer un liseré.

const RACINE = resolve(__dirname, "../..");
const IMAGES = join(RACINE, "assets/images");

/** Couleur de fond de l'illustration d'origine, telle que la mesure le script. */
const FOND_SOURCE = "#04424A";

interface InfosPng {
  largeur: number;
  hauteur: number;
  typeCouleur: number;
  aChunkTrns: boolean;
}

function lirePng(nom: string): InfosPng {
  const octets = readFileSync(join(IMAGES, nom));
  let aChunkTrns = false;
  let curseur = 8; // après la signature PNG
  while (curseur < octets.length - 8) {
    const taille = octets.readUInt32BE(curseur);
    const type = octets.toString("ascii", curseur + 4, curseur + 8);
    if (type === "tRNS") aChunkTrns = true;
    if (type === "IEND") break;
    curseur += 12 + taille;
  }
  return {
    largeur: octets.readUInt32BE(16),
    hauteur: octets.readUInt32BE(20),
    typeCouleur: octets[25],
    aChunkTrns,
  };
}

const TYPE_RVB = 2;
const TYPE_RVB_ALPHA = 6;

const appJson = JSON.parse(readFileSync(join(RACINE, "app.json"), "utf8"));
const expo = appJson.expo;

describe("icône iOS", () => {
  const icone = lirePng("icon.png");

  test("mesure exactement 1024×1024", () => {
    expect(`${icone.largeur}×${icone.hauteur}`).toBe("1024×1024");
  });

  test("ne contient aucune transparence", () => {
    // Ni canal alpha, ni palette de transparence : Apple rejette les deux.
    expect(icone.typeCouleur).toBe(TYPE_RVB);
    expect(icone.aChunkTrns).toBe(false);
  });

  test("est bien celle déclarée dans app.json", () => {
    expect(expo.icon).toBe("./assets/images/icon.png");
  });
});

describe("icône adaptative Android", () => {
  const avant = lirePng("adaptive-icon.png");
  const mono = lirePng("adaptive-icon-mono.png");

  test("les deux couches sont carrées, en 1024, avec canal alpha", () => {
    for (const [nom, couche] of [
      ["couche avant", avant],
      ["couche monochrome", mono],
    ] as const) {
      expect(`${nom} : ${couche.largeur}×${couche.hauteur} type ${couche.typeCouleur}`).toBe(
        `${nom} : 1024×1024 type ${TYPE_RVB_ALPHA}`
      );
    }
  });

  test("le logo tient dans la zone sûre des 66 % centraux", () => {
    // Reconstruit l'alpha depuis le PNG, pour mesurer le vrai débordement plutôt que de
    // faire confiance au réglage du script.
    const { PNG } = require("pngjs");
    const image = PNG.sync.read(readFileSync(join(IMAGES, "adaptive-icon.png")));
    const { width, height, data } = image;

    let gauche = width;
    let droite = -1;
    let haut = height;
    let bas = -1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] > 8) {
          if (x < gauche) gauche = x;
          if (x > droite) droite = x;
          if (y < haut) haut = y;
          if (y > bas) bas = y;
        }
      }
    }

    // Zone sûre : 66,67 % de la toile, centrée. Android peut rogner tout le reste.
    const marge = (width * (1 - 2 / 3)) / 2;
    expect({
      gauche: gauche >= marge,
      droite: droite <= width - marge,
      haut: haut >= marge,
      bas: bas <= height - marge,
    }).toEqual({ gauche: true, droite: true, haut: true, bas: true });
  });

  test("les deux couches sont déclarées dans app.json", () => {
    expect(expo.android.adaptiveIcon.foregroundImage).toBe("./assets/images/adaptive-icon.png");
    expect(expo.android.adaptiveIcon.monochromeImage).toBe("./assets/images/adaptive-icon-mono.png");
  });
});

describe("fonds déclarés", () => {
  // Le découpage laisse aux bords la couleur du fond d'origine. Recomposer sur une autre
  // teinte ferait apparaître un liseré tout autour du logo.
  test("le fond de l'icône adaptative est celui de l'illustration", () => {
    expect(expo.android.adaptiveIcon.backgroundColor.toUpperCase()).toBe(FOND_SOURCE);
  });

  test("les deux fonds du splash sont celui de l'illustration", () => {
    const splash = expo.plugins.find(
      (greffon: unknown) => Array.isArray(greffon) && greffon[0] === "expo-splash-screen"
    )[1];
    expect(splash.backgroundColor.toUpperCase()).toBe(FOND_SOURCE);
    expect(splash.dark.backgroundColor.toUpperCase()).toBe(FOND_SOURCE);
  });

  test("le splash utilise le logo détouré, pas l'icône complète", () => {
    // L'icône complète porte son propre aplat : posée sur le fond du splash, elle
    // dessinerait un carré visible.
    const splash = expo.plugins.find(
      (greffon: unknown) => Array.isArray(greffon) && greffon[0] === "expo-splash-screen"
    )[1];
    expect(splash.image).toBe("./assets/images/splash-icon.png");
    expect(lirePng("splash-icon.png").typeCouleur).toBe(TYPE_RVB_ALPHA);
  });
});
