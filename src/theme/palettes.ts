// Les deux palettes de l'application. Tout ce qui a une couleur dans l'interface la
// prend ici, jamais en dur : c'est ce qui rend le mode sombre possible sans repasser sur
// chaque écran à chaque changement.
//
// La palette sombre n'est pas l'inverse de la claire. Deux règles la gouvernent :
// — le fond n'est jamais noir pur, et le texte jamais blanc pur. Le contraste maximal
//   fatigue l'œil et fait « baver » les lettres sur un écran OLED ;
// — en sombre, une surface se détache en étant PLUS CLAIRE que son fond, pas en portant
//   une ombre. Une ombre portée ne se voit pas sur du sombre, c'est l'élévation par la
//   luminosité qui prend le relais.
import { melanger } from "./couleurs";

export interface Ombre {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  elevation: number;
}

export interface Couleurs {
  /** Fond d'écran général. */
  fond: string;
  /** Surface d'une carte posée sur le fond. */
  surface: string;
  /** Surface secondaire, plus sourde, posée sur une carte. */
  surfaceAtone: string;
  bordure: string;
  texte: string;
  texteAttenue: string;
  texteTertiaire: string;
  verrouilleFond: string;
  verrouilleBordure: string;
  verrouilleIcone: string;
  succes: string;
  succesFond: string;
  erreur: string;
  erreurFond: string;
  /** Signal « attention » : série de jours, indice d'exercice, réponse acceptable. */
  ambre: string;
  ambreFond: string;
  ambreBordure: string;
  /** Texte posé sur une couleur pleine de parcours (bouton, nœud, bandeau). */
  surCouleur: string;
  ombres: {
    carte: Ombre;
    flottante: Ombre;
    modale: Ombre;
  };
}

export const PALETTE_CLAIRE: Couleurs = {
  // Blanc cassé chaud, pour que les cartes blanches se détachent.
  fond: "#F5F3EE",
  surface: "#FFFFFF",
  surfaceAtone: "#EFECE6",
  bordure: "#E6E3DC",
  texte: "#1A1D23",
  // Assombris juste ce qu'il faut pour passer les seuils de contraste sur le fond crème :
  // les valeurs d'origine tombaient à 4,3 et 2,4, sous les seuils AA.
  texteAttenue: "#676D79",
  texteTertiaire: "#838891",
  verrouilleFond: "#EDECE7",
  verrouilleBordure: "#DAD8D1",
  verrouilleIcone: "#A9A79E",
  succes: "#1B8E4B",
  succesFond: "#E6F6EC",
  erreur: "#CF3535",
  erreurFond: "#FCECEC",
  ambre: "#9A5A12",
  ambreFond: "#FFF1DF",
  ambreBordure: "#F5D3A6",
  surCouleur: "#FFFFFF",
  ombres: {
    carte: {
      shadowColor: "#1A1D23",
      shadowOpacity: 0.05,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    flottante: {
      shadowColor: "#1A1D23",
      shadowOpacity: 0.12,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    modale: {
      shadowColor: "#1A1D23",
      shadowOpacity: 0.18,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: -6 },
      elevation: 16,
    },
  },
};

export const PALETTE_SOMBRE: Couleurs = {
  // Un gris très sombre légèrement bleuté, pas du noir : le noir pur écrase les reliefs
  // et rend impossible de distinguer une carte de son fond.
  fond: "#15161A",
  surface: "#1E2027",
  surfaceAtone: "#282B33",
  bordure: "#343843",
  // Blanc cassé chaud : un blanc pur sur ce fond éblouit et fait vibrer les petits textes.
  texte: "#F1F0ED",
  texteAttenue: "#AEB4BF",
  texteTertiaire: "#868D99",
  verrouilleFond: "#212329",
  verrouilleBordure: "#363A45",
  verrouilleIcone: "#6C7280",
  // Signaux plus clairs et moins saturés qu'en mode clair : sur un fond sombre, un vert
  // foncé devient illisible et un rouge vif vibre.
  succes: "#5CD98A",
  succesFond: "#14301F",
  erreur: "#F58A8A",
  erreurFond: "#361C1C",
  ambre: "#F0C878",
  ambreFond: "#332A17",
  ambreBordure: "#4C3E1F",
  surCouleur: "#FFFFFF",
  ombres: {
    carte: {
      shadowColor: "#000000",
      shadowOpacity: 0.35,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    flottante: {
      shadowColor: "#000000",
      shadowOpacity: 0.5,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    modale: {
      shadowColor: "#000000",
      shadowOpacity: 0.6,
      shadowRadius: 26,
      shadowOffset: { width: 0, height: -6 },
      elevation: 16,
    },
  },
};

export type ModeCouleur = "clair" | "sombre";

/** Ce que l'utilisateur a choisi. « systeme » suit le réglage du téléphone. */
export type PreferenceTheme = "systeme" | ModeCouleur;

export function palette(mode: ModeCouleur): Couleurs {
  return mode === "sombre" ? PALETTE_SOMBRE : PALETTE_CLAIRE;
}

/**
 * Voile d'une couleur de parcours, adapté au mode. En clair c'est une teinte presque
 * blanche ; en sombre, la même idée donne une surface sombre teintée — mélanger vers le
 * blanc y produirait une tache lumineuse au milieu de l'écran.
 */
export function voile(couleurParcours: string, mode: ModeCouleur, force: "leger" | "fort"): string {
  const couleurs = palette(mode);
  if (mode === "clair") {
    return melanger("#FFFFFF", couleurParcours, force === "leger" ? 0.12 : 0.24);
  }
  return melanger(couleurs.surface, couleurParcours, force === "leger" ? 0.17 : 0.32);
}
