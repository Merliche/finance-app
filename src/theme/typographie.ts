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
