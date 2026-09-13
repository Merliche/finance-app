import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { eclaircir } from "../../theme/couleurs";
import { useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { RAYONS, type ThemeParcours } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";
import { Reflet } from "../ui/Reflet";

export function BoutonContinuer({
  label = "Continuer",
  disabled,
  onPress,
  theme,
}: {
  label?: string;
  disabled?: boolean;
  onPress: () => void;
  theme: ThemeParcours;
}) {
  const styles = useStyles(creerStyles);
  return (
    <View style={styles.enveloppe}>
      {/* Lèvre inférieure : le bouton s'enfonce visuellement quand on appuie. */}
      {!disabled && <View style={[styles.lippe, { backgroundColor: theme.primaryDark }]} />}

      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: Boolean(disabled) }}
        style={({ pressed }) => [styles.bouton, pressed && !disabled && styles.boutonPresse]}
      >
        {disabled ? (
          <View style={[styles.surface, styles.boutonDesactive]}>
            <Text style={[styles.texte, styles.texteDesactive]}>{label}</Text>
          </View>
        ) : (
          <LinearGradient
            colors={[eclaircir(theme.primary, 0.16), theme.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.surface}
          >
            {/* L'action principale de chaque étape : un reflet la fait exister sans avoir
                besoin de clignoter ni de grossir. */}
            <Reflet duree={1800} pause={4200} intensite={0.22} largeur={0.32} />
            <Text style={styles.texte}>{label}</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </LinearGradient>
        )}
      </Pressable>
    </View>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    enveloppe: {
      position: "relative",
    },
    lippe: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 5,
      bottom: -5,
      borderRadius: RAYONS.grand,
    },
    bouton: {
      borderRadius: RAYONS.grand,
      // La découpe est portée par le pressable : sans elle, le reflet déborderait des
      // angles arrondis du dégradé.
      overflow: "hidden",
    },
    surface: {
      paddingVertical: 17,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    boutonPresse: {
      transform: [{ translateY: 4 }],
    },
    boutonDesactive: {
      backgroundColor: couleurs.verrouilleFond,
    },
    texte: {
      ...TYPO.bouton,
      color: "#FFFFFF",
    },
    texteDesactive: {
      color: couleurs.texteTertiaire,
    },
  });
