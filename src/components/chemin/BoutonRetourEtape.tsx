import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useMouvementReduit } from "../../hooks/useMouvementReduit";
import { avecAlpha } from "../../theme/couleurs";
import { useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { PRESSION, RAYONS, type ThemeParcours } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";

/**
 * Pastille flottante qui ramène à l'étape en cours. Elle n'apparaît que quand on s'est
 * éloigné en faisant défiler le chemin — sur une voie de quarante étapes, on part vite
 * explorer le haut ou le bas, et retrouver son point d'avancement à la main est pénible.
 *
 * La flèche indique le sens du retour : vers le haut si l'étape est au-dessus, vers le
 * bas sinon. Elle entre et sort sur ressort, depuis le bas de l'écran, pour qu'elle ne
 * clignote pas au moindre mouvement du doigt.
 */
export function BoutonRetourEtape({
  visible,
  versLeHaut,
  theme,
  onPress,
  decalageBas,
}: {
  visible: boolean;
  versLeHaut: boolean;
  theme: ThemeParcours;
  onPress: () => void;
  /** Marge sous la pastille, zone sûre comprise. */
  decalageBas: number;
}) {
  const styles = useStyles(creerStyles);
  const mouvementReduit = useMouvementReduit();
  const entree = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (mouvementReduit) {
      entree.setValue(visible ? 1 : 0);
      return;
    }
    const animation = Animated.spring(entree, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      speed: 14,
      bounciness: visible ? 8 : 0,
    });
    animation.start();
    return () => animation.stop();
  }, [visible, entree, mouvementReduit]);

  return (
    <Animated.View
      pointerEvents={visible ? "box-none" : "none"}
      style={[
        styles.zone,
        { bottom: decalageBas },
        {
          opacity: entree,
          transform: [{ translateY: entree.interpolate({ inputRange: [0, 1], outputRange: [70, 0] }) }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Revenir à l'étape en cours"
        style={({ pressed }) => [styles.pilule, { backgroundColor: theme.primary }, pressed && PRESSION]}
      >
        <View style={[styles.rondFleche, { backgroundColor: avecAlpha("#FFFFFF", 0.22) }]}>
          <Ionicons name={versLeHaut ? "arrow-up" : "arrow-down"} size={15} color="#FFFFFF" />
        </View>
        <Text style={styles.texte}>Revenir à mon étape</Text>
      </Pressable>
    </Animated.View>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    zone: {
      position: "absolute",
      left: 0,
      right: 0,
      alignItems: "center",
    },
    pilule: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      paddingLeft: 6,
      paddingRight: 16,
      paddingVertical: 6,
      borderRadius: RAYONS.pilule,
      ...couleurs.ombres.flottante,
    },
    rondFleche: {
      width: 28,
      height: 28,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    texte: {
      ...TYPO.label,
      fontSize: 13,
      color: "#FFFFFF",
    },
  });
