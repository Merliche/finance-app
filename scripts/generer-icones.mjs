// Fabrique les quatre icônes de l'app à partir de assets/icon-source.png.
//
// Le fond de la source est un aplat très régulier (#04424A, écart-type < 0,8), ce qui
// permet de le découper proprement : l'alpha de chaque pixel est tiré de sa distance à
// cette couleur.
//
// Point important pour la qualité des bords : on NE dé-prémultiplie PAS. Les pixels de
// bord gardent la couleur qu'ils ont dans la source — c'est-à-dire le logo déjà composité
// sur le teal. Tant que le fond de destination est EXACTEMENT ce même teal (fond de
// l'icône adaptative, fond du splash), recomposer redonne la source au pixel près, sans
// liseré. C'est pour ça que app.json doit utiliser #04424A et pas une nuance voisine.
//
// Réduction par moyenne d'aire (couverture fractionnaire), dans l'espace sRGB : c'est le
// filtre correct pour un agrandissement négatif, et rester en sRGB préserve exactement
// l'invariant de compositing ci-dessus.

import { readFileSync, writeFileSync } from "node:fs";
import { PNG } from "pngjs";

const SOURCE = "assets/icon-source.png";
const DOSSIER = "assets/images/";

const FOND = [4, 66, 74]; // #04424A, moyenne des quatre coins
const SEUIL_BAS = 12; // en deçà : fond pur
const SEUIL_HAUT = 34; // au delà : logo pur

// ---------------------------------------------------------------- lecture

const src = PNG.sync.read(readFileSync(SOURCE));
const { width: W, height: H } = src;
console.log(`source : ${W}×${H}`);

/** Image RGBA en Float64, pour enchaîner les opérations sans perte. */
function creer(w, h) {
  return { w, h, d: new Float64Array(w * h * 4) };
}

const plein = creer(W, H); // la source telle quelle, opaque
const decoupe = creer(W, H); // la même, mais le fond rendu transparent

for (let i = 0; i < W * H; i++) {
  const [r, g, b] = [src.data[i * 4], src.data[i * 4 + 1], src.data[i * 4 + 2]];
  plein.d[i * 4] = r;
  plein.d[i * 4 + 1] = g;
  plein.d[i * 4 + 2] = b;
  plein.d[i * 4 + 3] = 255;

  const dist = Math.hypot(r - FOND[0], g - FOND[1], b - FOND[2]);
  const alpha = Math.max(0, Math.min(1, (dist - SEUIL_BAS) / (SEUIL_HAUT - SEUIL_BAS)));
  decoupe.d[i * 4] = r;
  decoupe.d[i * 4 + 1] = g;
  decoupe.d[i * 4 + 2] = b;
  decoupe.d[i * 4 + 3] = alpha * 255;
}

// ------------------------------------------------------- cadre du logo

let x0 = W, y0 = H, x1 = -1, y1 = -1;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (decoupe.d[(y * W + x) * 4 + 3] > 128) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
}
const cadre = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
console.log(
  `logo : ${cadre.w}×${cadre.h} px à (${cadre.x}, ${cadre.y}) — ` +
    `${((cadre.w / W) * 100).toFixed(1)}% × ${((cadre.h / H) * 100).toFixed(1)}% de la source`
);

// ------------------------------------------------------------ opérations

/** Découpe un rectangle. */
function rogner(img, x, y, w, h) {
  const out = creer(w, h);
  for (let j = 0; j < h; j++) {
    const src = ((y + j) * img.w + x) * 4;
    out.d.set(img.d.subarray(src, src + w * 4), j * w * 4);
  }
  return out;
}

/** Réduction par moyenne d'aire à couverture fractionnaire. */
function redimensionner(img, w, h) {
  const out = creer(w, h);
  const ex = img.w / w;
  const ey = img.h / h;
  for (let j = 0; j < h; j++) {
    const hautSrc = j * ey;
    const basSrc = (j + 1) * ey;
    for (let i = 0; i < w; i++) {
      const gaucheSrc = i * ex;
      const droiteSrc = (i + 1) * ex;
      let sr = 0, sg = 0, sb = 0, sa = 0, poidsTotal = 0;
      for (let y = Math.floor(hautSrc); y < Math.min(img.h, Math.ceil(basSrc)); y++) {
        const couvY = Math.min(y + 1, basSrc) - Math.max(y, hautSrc);
        if (couvY <= 0) continue;
        for (let x = Math.floor(gaucheSrc); x < Math.min(img.w, Math.ceil(droiteSrc)); x++) {
          const couvX = Math.min(x + 1, droiteSrc) - Math.max(x, gaucheSrc);
          if (couvX <= 0) continue;
          const poids = couvX * couvY;
          const k = (y * img.w + x) * 4;
          sr += img.d[k] * poids;
          sg += img.d[k + 1] * poids;
          sb += img.d[k + 2] * poids;
          sa += img.d[k + 3] * poids;
          poidsTotal += poids;
        }
      }
      const k = (j * w + i) * 4;
      out.d[k] = sr / poidsTotal;
      out.d[k + 1] = sg / poidsTotal;
      out.d[k + 2] = sb / poidsTotal;
      out.d[k + 3] = sa / poidsTotal;
    }
  }
  return out;
}

/** Pose `motif` au centre d'une toile transparente de `taille`×`taille`. */
function centrer(motif, taille) {
  const out = creer(taille, taille);
  const x = Math.round((taille - motif.w) / 2);
  const y = Math.round((taille - motif.h) / 2);
  for (let j = 0; j < motif.h; j++) {
    const dst = ((y + j) * taille + x) * 4;
    out.d.set(motif.d.subarray(j * motif.w * 4, (j + 1) * motif.w * 4), dst);
  }
  return out;
}

/** Ne garde que la forme : blanc opaque, alpha inchangé. Pour l'icône thématique Android. */
function silhouette(img) {
  const out = creer(img.w, img.h);
  for (let i = 0; i < img.w * img.h; i++) {
    out.d[i * 4] = 255;
    out.d[i * 4 + 1] = 255;
    out.d[i * 4 + 2] = 255;
    out.d[i * 4 + 3] = img.d[i * 4 + 3];
  }
  return out;
}

/** Écrit un PNG. `avecAlpha: false` produit un RGB pur (exigence Apple pour l'icône). */
function ecrire(img, nom, avecAlpha) {
  const png = new PNG({
    width: img.w,
    height: img.h,
    colorType: avecAlpha ? 6 : 2,
    inputHasAlpha: true,
    deflateLevel: 9,
  });
  for (let i = 0; i < img.w * img.h * 4; i++) {
    png.data[i] = Math.max(0, Math.min(255, Math.round(img.d[i])));
  }
  const tampon = PNG.sync.write(png, {
    colorType: avecAlpha ? 6 : 2,
    inputHasAlpha: true,
    deflateLevel: 9,
  });
  writeFileSync(DOSSIER + nom, tampon);
  const type = tampon[25];
  console.log(
    `  ${nom.padEnd(24)} ${img.w}×${img.h}  ` +
      `${type === 6 ? "RVB+alpha" : type === 2 ? "RVB (sans alpha)" : "type " + type}  ` +
      `${(tampon.length / 1024).toFixed(0)} Ko`
  );
}

// ---------------------------------------------------------------- sorties

console.log("\nécriture :");

// 1. iOS / App Store — 1024×1024, aplat compris, aucune transparence.
//    Apple applique lui-même le masque arrondi : on livre le carré complet.
ecrire(redimensionner(plein, 1024, 1024), "icon.png", false);

// 2. Android, couche avant de l'icône adaptative — 1024×1024 transparent.
//    Le système peut masquer jusqu'aux 33 % extérieurs : le logo tient dans la zone
//    sûre centrale (66 %), ici 660 px, un peu en deçà des 683 px autorisés.
const ZONE_SURE = 660;
const echelle = ZONE_SURE / Math.max(cadre.w, cadre.h);
const logoAndroid = redimensionner(
  rogner(decoupe, cadre.x, cadre.y, cadre.w, cadre.h),
  Math.round(cadre.w * echelle),
  Math.round(cadre.h * echelle)
);
ecrire(centrer(logoAndroid, 1024), "adaptive-icon.png", true);

// 3. Android 13+, couche monochrome des icônes thématiques — la silhouette seule.
ecrire(centrer(silhouette(logoAndroid), 1024), "adaptive-icon-mono.png", true);

// 4. Splash — le logo seul, centré sur une toile carrée. Le fond vient de
//    backgroundColor dans app.json, qui doit valoir #04424A.
const MARGE_SPLASH = 0.86;
const echelleSplash = (1024 * MARGE_SPLASH) / Math.max(cadre.w, cadre.h);
const logoSplash = redimensionner(
  rogner(decoupe, cadre.x, cadre.y, cadre.w, cadre.h),
  Math.round(cadre.w * echelleSplash),
  Math.round(cadre.h * echelleSplash)
);
ecrire(centrer(logoSplash, 1024), "splash-icon.png", true);

// 5. Favicon — l'aplat compris, pour rester lisible à 16 px dans un onglet.
ecrire(redimensionner(plein, 64, 64), "favicon.png", false);

console.log(`\nfond de référence : #${FOND.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`);
