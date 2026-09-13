import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { MODE_TEST_TOUT_ACCESSIBLE } from "../../constants/modeTest";
import { eclaircir } from "../../theme/couleurs";
import { PRESSION, RAYONS, type ThemeParcours } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";
import { Apparition } from "../ui/Apparition";
import { BarreProgression } from "../ui/BarreProgression";
import { MotifPoints } from "../ui/MotifPoints";
import { Pulsation } from "../ui/Pulsation";
import { Reflet } from "../ui/Reflet";
import { useCompteur } from "../ui/useCompteur";

type NomIcone = keyof typeof Ionicons.glyphMap;

export interface Engagement {
  /** Jours consécutifs d'activité. */
  serie: number;
  niveau: number;
  xpDansNiveau: number;
  xpPourSuivant: number;
}

export interface ActionEntete {
  icone: NomIcone;
  label: string;
  onPress: () => void;
}

/**
 * Bandeau héros au-dessus du chemin : dégradé aux couleurs du parcours, trame de points,
 * icône du parcours en filigrane, titre, avancement animé, série et niveau. Gère la zone
 * sûre du haut (`insetHaut`) et, selon l'écran, le retour ou des raccourcis.
 */
export function EnteteParcours({
  titre,
  icone,
  nbCompletees,
  nbTotal,
  theme,
  insetHaut,
  engagement,
  onRetour,
  actions = [],
  style,
  children,
}: {
  titre: string;
  icone: NomIcone;
  nbCompletees: number;
  nbTotal: number;
  theme: ThemeParcours;
  insetHaut: number;
  engagement?: Engagement;
  onRetour?: () => void;
  actions?: ActionEntete[];
  style?: ViewStyle;
  children?: ReactNode;
}) {
  const pluriel = nbCompletees > 1 ? "s" : "";
  const ratio = nbTotal > 0 ? nbCompletees / nbTotal : 0;
  // Le pourcentage monte en même temps que la barre se remplit, au lieu d'être posé.
  const pourcentage = useCompteur(Math.round(ratio * 100), 900);

  return (
    <LinearGradient
      colors={[eclaircir(theme.primary, 0.12), theme.primary, theme.primaryDark]}
      locations={[0, 0.45, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop: insetHaut + 10 }, style]}
    >
      <MotifPoints couleur="#FFFFFF" opacite={0.16} />
      {/* Une lumière traverse le bandeau de loin en loin : la surface prend de la matière
          sans que rien ne bouge en permanence à l'écran. */}
      <Reflet />
      <View pointerEvents="none" style={styles.filigrane}>
        <Ionicons name={icone} size={190} color="rgba(255,255,255,0.09)" />
      </View>

      <View style={styles.ligneHaut}>
        <View style={styles.groupeGauche}>
          {onRetour && (
            <Pressable
              onPress={onRetour}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              hitSlop={8}
              style={({ pressed }) => [styles.boutonRond, pressed && PRESSION]}
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>
          )}
          {actions.map((action) => (
            <Pressable
              key={action.label}
              onPress={action.onPress}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              hitSlop={6}
              style={({ pressed }) => [styles.boutonRond, pressed && PRESSION]}
            >
              <Ionicons name={action.icone} size={19} color="#FFFFFF" />
            </Pressable>
          ))}
        </View>

        <View style={styles.pilules}>
          {engagement && engagement.serie > 0 && (
            <Apparition mode="pop" delai={260}>
              <View
                style={styles.pilule}
                accessibilityLabel={`Série de ${engagement.serie} jour${engagement.serie > 1 ? "s" : ""}`}
              >
                {/* La flamme bat tant que la série court : c'est le seul élément animé en
                    permanence de l'en-tête, et c'est précisément ce qu'on veut entretenir. */}
                <Pulsation amplitude={0.16} duree={900}>
                  <Ionicons name="flame" size={13} color="#FFD166" />
                </Pulsation>
                <Text style={styles.piluleTexte}>{engagement.serie} j</Text>
              </View>
            </Apparition>
          )}
          {engagement && (
            <Apparition mode="pop" delai={340}>
              <View style={styles.pilule} accessibilityLabel={`Niveau ${engagement.niveau}`}>
                <Ionicons name="star" size={12} color="#FFD166" />
                <Text style={styles.piluleTexte}>Niv. {engagement.niveau}</Text>
              </View>
            </Apparition>
          )}
          {MODE_TEST_TOUT_ACCESSIBLE && (
            <View style={styles.pilule}>
              <Ionicons name="flask" size={12} color="#FFFFFF" />
              <Text style={styles.piluleTexte}>Test</Text>
            </View>
          )}
        </View>
      </View>

      <Apparition delai={40}>
        <Text style={styles.titre} accessibilityRole="header">
          {titre}
        </Text>
      </Apparition>

      <Apparition delai={140}>
        <View style={styles.ligneProgression}>
          <BarreProgression ratio={ratio} couleur="#FFFFFF" couleurPiste="rgba(255,255,255,0.26)" />
          <Text style={styles.pourcentage}>{pourcentage}%</Text>
        </View>
        <View style={styles.ligneSousTitre}>
          <Text style={styles.sousTitre}>
            {nbCompletees} étape{pluriel} sur {nbTotal} terminée{pluriel}
          </Text>
          {engagement && (
            <Text style={styles.sousTitre}>
              {engagement.xpDansNiveau}/{engagement.xpPourSuivant} XP
            </Text>
          )}
        </View>
      </Apparition>

      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 22,
    paddingBottom: 24,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: "hidden",
  },
  filigrane: {
    position: "absolute",
    right: -34,
    bottom: -38,
  },
  ligneHaut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 38,
    marginBottom: 10,
  },
  groupeGauche: {
    flexDirection: "row",
    gap: 8,
  },
  boutonRond: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  pilules: {
    flexDirection: "row",
    gap: 6,
  },
  pilule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: RAYONS.pilule,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  piluleTexte: {
    ...TYPO.legende,
    fontSize: 11.5,
    color: "#FFFFFF",
  },
  titre: {
    ...TYPO.titreEcran,
    fontSize: 29,
    lineHeight: 33,
    letterSpacing: -0.9,
    color: "#FFFFFF",
    paddingRight: 30,
  },
  ligneProgression: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pourcentage: {
    ...TYPO.chiffre,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.5,
    color: "#FFFFFF",
    minWidth: 48,
    textAlign: "right",
  },
  ligneSousTitre: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sousTitre: {
    ...TYPO.legende,
    color: "rgba(255,255,255,0.8)",
  },
});
