import type { RoleSerie } from "../../domain/parcours/types";
import type { Couleurs, ModeCouleur } from "../../theme/palettes";
import { type ThemeParcours } from "../../theme/parcoursTheme";

/**
 * Couleurs des schémas. Le contenu ne parle qu'en rôles (`principal`, `secondaire`,
 * `attenue`) : c'est ici qu'un rôle devient une couleur, en fonction du parcours — la
 * série "principale" est toujours de la couleur de la voie, la "secondaire" d'un
 * anthracite neutre qui contraste avec n'importe quelle voie.
 */
/**
 * Le neutre qui contraste avec n'importe quelle voie. Il s'inverse avec le mode : un
 * anthracite se lit parfaitement sur du papier et disparaît sur un fond sombre, où il
 * faut au contraire une teinte claire.
 */
export function neutreContrastant(couleurs: Couleurs, mode: ModeCouleur): string {
  return mode === "sombre" ? "#C7CDD8" : "#2F3542";
}

function grisAttenue(mode: ModeCouleur): string {
  return mode === "sombre" ? "#5F6673" : "#B9BEC7";
}

export function couleurRole(
  role: RoleSerie | undefined,
  theme: ThemeParcours,
  couleurs: Couleurs,
  mode: ModeCouleur
): string {
  switch (role) {
    case "secondaire":
      return neutreContrastant(couleurs, mode);
    case "attenue":
      return grisAttenue(mode);
    default:
      return theme.primary;
  }
}

/** Palette d'une répartition (jusqu'à 5 parts) : voie, neutre, puis accents transverses. */
export function paletteRepartition(
  theme: ThemeParcours,
  couleurs: Couleurs,
  mode: ModeCouleur
): string[] {
  return [
    theme.primary,
    neutreContrastant(couleurs, mode),
    "#E0A73B",
    "#2AA9A0",
    grisAttenue(mode),
  ];
}

/** Formatage court des valeurs sur un schéma : 12 500 → "12,5 k", 1 200 000 → "1,2 M". */
export function formaterCourt(valeur: number, unite?: string): string {
  const abs = Math.abs(valeur);
  let texte: string;
  if (abs >= 1_000_000) texte = `${(valeur / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  else if (abs >= 10_000) texte = `${(valeur / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} k`;
  else texte = valeur.toLocaleString("fr-FR", { maximumFractionDigits: abs >= 100 ? 0 : 1 });
  return unite ? `${texte} ${unite}` : texte;
}
