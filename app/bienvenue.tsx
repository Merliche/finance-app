import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Apparition } from "../src/components/ui/Apparition";
import { FondAnime } from "../src/components/ui/FondAnime";
import { Poussiere } from "../src/components/ui/Poussiere";
import { Pulsation } from "../src/components/ui/Pulsation";
import { Reflet } from "../src/components/ui/Reflet";
import { useProgressStore } from "../src/state/progressStore";
import { delaiCascade } from "../src/theme/animation";
import { avecAlpha, eclaircir } from "../src/theme/couleurs";
import { useCouleurs, useStyles } from "../src/theme/ModeCouleur";
import type { Couleurs } from "../src/theme/palettes";
import { RAYONS, THEMES_PARCOURS } from "../src/theme/parcoursTheme";
import { TYPO } from "../src/theme/typographie";
import { haptiqueLegere } from "../src/utils/haptique";

const ARGUMENTS: { icone: keyof typeof Ionicons.glyphMap; titre: string; texte: string; couleur: string }[] = [
  {
    icone: "map",
    titre: "Un chemin, pas un cours",
    texte: "Des sessions courtes qui s'enchaînent : budget, intérêts, inflation, crédit… puis trois voies à explorer.",
    couleur: THEMES_PARCOURS.banque.primary,
  },
  {
    icone: "calculator",
    titre: "Des chiffres que tu manipules",
    texte: "Simulateurs, comparateurs et mises en situation : tu testes, tu vois l'effet, tu retiens.",
    couleur: THEMES_PARCOURS.marche.primary,
  },
  {
    icone: "lock-open",
    titre: "Sans compte, sans pub",
    texte: "Ta progression reste sur ton téléphone. Rien à créer, rien à donner pour commencer.",
    couleur: THEMES_PARCOURS.entreprise.primary,
  },
];

export default function Bienvenue() {
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const marquerAccueilVu = useProgressStore((state) => state.marquerAccueilVu);

  function commencer() {
    haptiqueLegere();
    marquerAccueilVu();
    router.replace("/parcours");
  }

  return (
    <View style={styles.ecran}>
      <LinearGradient
        colors={[THEMES_PARCOURS.intro.tint, couleurs.fond, couleurs.fond]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <FondAnime theme={THEMES_PARCOURS.intro} intensite={0.85} />
      <Poussiere couleur={THEMES_PARCOURS.intro.primary} hauteur={760} />

      {/* Défilant, et pas une simple vue en `flex: 1` : sur un écran court, les trois
          arguments et le bouton dépassent, et tout ce qui dépasse était purement coupé —
          à commencer par la mention légale, en tout dernier. `flexGrow` conserve la
          répartition en hauteur quand le contenu tient, et autorise le défilement sinon. */}
      <ScrollView
        style={styles.defilement}
        contentContainerStyle={[
          styles.contenu,
          { paddingTop: insets.top + 36, paddingBottom: insets.bottom + 22 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Apparition style={styles.haut}>
          <Apparition mode="pop" delai={60}>
            {/* Le tout premier objet que voit un nouvel utilisateur : il respire, il
                accroche la lumière, et il donne le ton du reste de l'application. */}
            <Pulsation amplitude={0.035} duree={2400}>
              <LinearGradient
                colors={[
                  eclaircir(THEMES_PARCOURS.intro.primary, 0.24),
                  THEMES_PARCOURS.intro.primary,
                  THEMES_PARCOURS.intro.primaryDark,
                ]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.logo}
              >
                <Reflet duree={1900} pause={3200} intensite={0.34} largeur={0.5} />
                <Ionicons name="trending-up" size={32} color="#FFFFFF" />
              </LinearGradient>
            </Pulsation>
          </Apparition>
          <Text style={styles.surtitre}>Éducation financière</Text>
          <Text style={styles.titre} accessibilityRole="header">
            Comprendre ton argent,{"\n"}pas à pas.
          </Text>
          <Text style={styles.sousTitre}>
            Les bases de la finance personnelle, expliquées simplement, sans jargon et sans jugement.
          </Text>
        </Apparition>

        <View style={styles.arguments}>
          {ARGUMENTS.map((argument, index) => (
            <Apparition
              key={argument.titre}
              delai={delaiCascade(index, 300)}
              style={[styles.argument, { borderColor: avecAlpha(argument.couleur, 0.2) }]}
            >
              <LinearGradient
                colors={[eclaircir(argument.couleur, 0.22), argument.couleur]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.argumentIcone}
              >
                <Ionicons name={argument.icone} size={19} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.argumentTextes}>
                <Text style={styles.argumentTitre}>{argument.titre}</Text>
                <Text style={styles.argumentTexte}>{argument.texte}</Text>
              </View>
            </Apparition>
          ))}
        </View>

        <Apparition delai={640} style={styles.bas}>
          <View style={styles.boutonEnveloppe}>
            <View style={styles.boutonLippe} />
            <Pressable
              onPress={commencer}
              accessibilityRole="button"
              style={({ pressed }) => [styles.bouton, pressed && styles.boutonPresse]}
            >
              <LinearGradient
                colors={[
                  eclaircir(THEMES_PARCOURS.intro.primary, 0.16),
                  THEMES_PARCOURS.intro.primary,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.boutonSurface}
              >
                <Reflet duree={1800} pause={3600} intensite={0.24} largeur={0.3} />
                <Text style={styles.boutonTexte}>Commencer</Text>
                <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>
          </View>
          <Text style={styles.mention}>Contenu éducatif — ne constitue pas un conseil en investissement.</Text>
        </Apparition>
      </ScrollView>
    </View>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    ecran: {
      flex: 1,
      backgroundColor: couleurs.fond,
    },
    defilement: {
      flex: 1,
    },
    contenu: {
      flexGrow: 1,
      paddingHorizontal: 26,
      justifyContent: "space-between",
      // Les trois blocs ne doivent jamais se toucher, même tassés sur un petit écran.
      gap: 28,
    },
    haut: {
      gap: 10,
    },
    logo: {
      width: 64,
      height: 64,
      borderRadius: RAYONS.grand,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
      overflow: "hidden",
      ...couleurs.ombres.flottante,
    },
    surtitre: {
      ...TYPO.surtitre,
      color: THEMES_PARCOURS.intro.primary,
    },
    titre: {
      ...TYPO.titreEcran,
      fontSize: 34,
      lineHeight: 39,
      letterSpacing: -1,
      color: couleurs.texte,
    },
    sousTitre: {
      ...TYPO.corps,
      color: couleurs.texteAttenue,
      marginTop: 4,
    },
    arguments: {
      gap: 14,
    },
    argument: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 14,
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.carte,
      borderWidth: 1,
      padding: 15,
      ...couleurs.ombres.carte,
    },
    argumentIcone: {
      width: 40,
      height: 40,
      borderRadius: RAYONS.moyen,
      alignItems: "center",
      justifyContent: "center",
    },
    argumentTextes: {
      flex: 1,
      gap: 3,
    },
    argumentTitre: {
      ...TYPO.titreCarte,
      color: couleurs.texte,
    },
    argumentTexte: {
      ...TYPO.legende,
      color: couleurs.texteAttenue,
    },
    bas: {
      gap: 14,
    },
    boutonEnveloppe: {
      position: "relative",
    },
    boutonLippe: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 5,
      bottom: -5,
      borderRadius: RAYONS.grand,
      backgroundColor: THEMES_PARCOURS.intro.primaryDark,
    },
    bouton: {
      borderRadius: RAYONS.grand,
      overflow: "hidden",
    },
    boutonSurface: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      paddingVertical: 18,
    },
    boutonPresse: {
      transform: [{ translateY: 4 }],
    },
    boutonTexte: {
      ...TYPO.bouton,
      color: "#FFFFFF",
    },
    mention: {
      ...TYPO.legende,
      fontSize: 11.5,
      textAlign: "center",
      color: couleurs.texteTertiaire,
    },
  });
