// Calculs purs de mise à l'échelle et de tracé pour les schémas — sans React, testables.

export interface Point {
  x: number;
  y: number;
}

/** Bornes verticales d'un graphique : 0 inclus dès que toutes les valeurs sont positives, marge en haut. */
export function bornesY(valeurs: number[]): { min: number; max: number } {
  if (valeurs.length === 0) return { min: 0, max: 1 };
  const brutMin = Math.min(...valeurs);
  const brutMax = Math.max(...valeurs);
  const min = brutMin >= 0 ? 0 : brutMin - (brutMax - brutMin) * 0.08;
  const marge = (brutMax - min) * 0.08 || 1;
  return { min, max: brutMax + marge };
}

/** Projette une série de valeurs dans une zone de tracé (y vers le bas, comme en SVG). */
export function projeterSerie(
  points: number[],
  zone: { largeur: number; hauteur: number },
  bornes: { min: number; max: number }
): Point[] {
  const n = points.length;
  const etendue = bornes.max - bornes.min || 1;
  return points.map((valeur, index) => ({
    x: n === 1 ? zone.largeur / 2 : (index / (n - 1)) * zone.largeur,
    y: zone.hauteur - ((valeur - bornes.min) / etendue) * zone.hauteur,
  }));
}

/** Courbe lissée passant par les points (Bézier cubiques à tangentes horizontales, comme un tracé de chemin couché). */
export function tracerCourbe(points: Point[]): string {
  if (points.length === 0) return "";
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1];
    const c = points[i];
    const milieu = (p.x + c.x) / 2;
    d += ` C${milieu},${p.y} ${milieu},${c.y} ${c.x},${c.y}`;
  }
  return d;
}

/** Longueur de la polyligne reliant les points — borne haute suffisante pour un effet de tracé progressif. */
export function longueurPolyligne(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return total;
}

/** Parts normalisées d'une répartition : fraction de chaque part et fraction de départ cumulée. */
export function normaliserParts(valeurs: number[]): { fraction: number; depart: number }[] {
  const total = valeurs.reduce((somme, v) => somme + Math.max(0, v), 0) || 1;
  let cumul = 0;
  return valeurs.map((v) => {
    const fraction = Math.max(0, v) / total;
    const part = { fraction, depart: cumul };
    cumul += fraction;
    return part;
  });
}
