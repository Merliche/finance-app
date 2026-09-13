// Typographie de l'app. En React Native, `fontWeight` n'a aucun effet sur une police
// personnalisée : chaque graisse est une famille distincte. On ne déclare donc jamais de
// fontWeight ailleurs dans le code, on passe toujours par les presets ci-dessous.
//
// Pairing : Bricolage Grotesque (titres — du caractère, un peu éditorial) + Plus Jakarta
// Sans (tout le reste — très lisible en petit, excellent support des accents français).
export const POLICES = {
  titreExtra: "BricolageGrotesque_800ExtraBold",
  titre: "BricolageGrotesque_700Bold",
  regulier: "PlusJakartaSans_400Regular",
  moyen: "PlusJakartaSans_500Medium",
  semi: "PlusJakartaSans_600SemiBold",
  gras: "PlusJakartaSans_700Bold",
  extra: "PlusJakartaSans_800ExtraBold",
} as const;

/** Les polices à charger au démarrage (voir app/_layout.tsx). */
export const TYPO = {
  /** Titre principal d'écran. */
  titreEcran: {
    fontFamily: POLICES.titreExtra,
    fontSize: 25,
    lineHeight: 30,
    letterSpacing: -0.6,
  },
  /** Titre d'un bloc ou d'une étape. */
  titreSection: {
    fontFamily: POLICES.titre,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  /** Titre court (bannière de session, carte). */
  titreCarte: {
    fontFamily: POLICES.gras,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  /** Corps de texte long (leçons). */
  corps: {
    fontFamily: POLICES.regulier,
    fontSize: 15.5,
    lineHeight: 25,
  },
  /** Corps un peu appuyé (énoncés, réponses). */
  corpsMoyen: {
    fontFamily: POLICES.moyen,
    fontSize: 15,
    lineHeight: 22,
  },
  /** Libellés d'interface. */
  label: {
    fontFamily: POLICES.semi,
    fontSize: 13,
    lineHeight: 18,
  },
  /** Texte secondaire, légendes. */
  legende: {
    fontFamily: POLICES.moyen,
    fontSize: 12.5,
    lineHeight: 17,
  },
  /** Micro-label en capitales (catégories, sur-titres). */
  surtitre: {
    fontFamily: POLICES.extra,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  /** Texte de bouton. */
  bouton: {
    fontFamily: POLICES.gras,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  /** Chiffres mis en avant (résultats de simulateur, code promo). */
  chiffre: {
    fontFamily: POLICES.titreExtra,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -1,
  },
} as const;

/**
 * Plafonds d'agrandissement du texte.
 *
 * Les textes de l'application suivent la taille de police du système : c'est le
 * comportement par défaut de React Native, et il ne faut surtout pas le désactiver — c'est
 * le premier réglage d'accessibilité qu'utilisent les personnes qui voient mal.
 *
 * Mais quelques textes vivent dans une boîte qui, elle, ne peut pas grandir : un numéro
 * dans une pastille ronde, une lettre de réponse dans un carré. Agrandis sans limite, ils
 * débordent ou se font rogner, et le réglage d'accessibilité produit alors l'inverse de ce
 * qu'on cherchait. Ces textes-là, et uniquement ceux-là, reçoivent un plafond.
 *
 * Tout le reste grandit sans limite : paragraphes, titres, libellés de bouton, réponses de
 * quiz. Leurs conteneurs s'étirent.
 */
export const PLAFOND_PASTILLE = 1.3;

/** Pour un libellé contraint en largeur plutôt qu'enfermé dans un carré. */
export const PLAFOND_ETIQUETTE = 1.6;
