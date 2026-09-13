// Manipulation de couleurs, en pur calcul. Sert à dériver des variantes d'un thème de
// parcours (reflet d'un nœud, halo d'un fond, voile d'un dégradé) sans avoir à écrire
// une nouvelle couleur en dur à chaque fois : une teinte de parcours change, tout suit.
//
// On travaille en sRGB, sans correction gamma : à ces amplitudes (des reflets et des
// voiles), l'écart avec une interpolation perceptuelle est invisible, et la simplicité
// vaut mieux qu'une conversion Lab pour dessiner un dégradé de bouton.

interface Rvb {
  r: number;
  g: number;
  b: number;
}

/** Accepte "#RGB" et "#RRGGBB". Renvoie du noir pour une entrée illisible, jamais NaN. */
export function versRvb(hex: string): Rvb {
  const brut = hex.trim().replace("#", "");
  const complet = brut.length === 3 ? brut.split("").map((c) => c + c).join("") : brut;
  if (!/^[0-9a-fA-F]{6}$/.test(complet)) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(complet.slice(0, 2), 16),
    g: parseInt(complet.slice(2, 4), 16),
    b: parseInt(complet.slice(4, 6), 16),
  };
}

function borne(valeur: number): number {
  return Math.max(0, Math.min(255, Math.round(valeur)));
}

function versHex({ r, g, b }: Rvb): string {
  return "#" + [r, g, b].map((c) => borne(c).toString(16).padStart(2, "0")).join("").toUpperCase();
}

/** Rapproche la couleur du blanc. `ratio` 0 = inchangée, 1 = blanc. */
export function eclaircir(hex: string, ratio: number): string {
  const r = Math.max(0, Math.min(1, ratio));
  const { r: rouge, g: vert, b: bleu } = versRvb(hex);
  return versHex({
    r: rouge + (255 - rouge) * r,
    g: vert + (255 - vert) * r,
    b: bleu + (255 - bleu) * r,
  });
}

/** Rapproche la couleur du noir. `ratio` 0 = inchangée, 1 = noir. */
export function assombrir(hex: string, ratio: number): string {
  const r = Math.max(0, Math.min(1, ratio));
  const { r: rouge, g: vert, b: bleu } = versRvb(hex);
  return versHex({ r: rouge * (1 - r), g: vert * (1 - r), b: bleu * (1 - r) });
}

/**
 * Même couleur, en `rgba(...)`. Indispensable pour les dégradés : un dégradé qui se
 * termine sur du blanc opaque laisse une frange claire sur un fond coloré, alors que le
 * même dégradé terminé sur sa propre couleur en alpha 0 disparaît vraiment.
 */
export function avecAlpha(hex: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  const { r, g, b } = versRvb(hex);
  return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(3))})`;
}

/** Mélange deux couleurs. `poids` 0 = `a`, 1 = `b`. */
export function melanger(a: string, b: string, poids: number): string {
  const p = Math.max(0, Math.min(1, poids));
  const ca = versRvb(a);
  const cb = versRvb(b);
  return versHex({
    r: ca.r + (cb.r - ca.r) * p,
    g: ca.g + (cb.g - ca.g) * p,
    b: ca.b + (cb.b - ca.b) * p,
  });
}
