import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import type { Schema } from "../../domain/parcours/types";
import { useCouleurs, useMode, useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { RAYONS, type ThemeParcours } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";
import { couleurRole, formaterCourt } from "./couleurs";

type SchemaBarres = Extract<Schema, { kind: "barres" }>;

const DUREE = 900;
const DECALAGE = 140;

/**
 * Barres horizontales qui se remplissent l'une après l'autre. Horizontal plutôt que
 * vertical : sur un écran de téléphone, les libellés restent lisibles et la comparaison
 * se lit de haut en bas comme une liste.
 */
export function SchemaBarres({ schema, theme }: { schema: SchemaBarres; theme: ThemeParcours }) {
  const couleurs = useCouleurs();
  const mode = useMode();
  const styles = useStyles(creerStyles);
  const max = Math.max(...schema.barres.map((b) => Math.abs(b.valeur)), 1);
  const progressions = useRef(schema.barres.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    progressions.forEach((p) => p.setValue(0));
    const animation = Animated.stagger(
      DECALAGE,
      progressions.map((p) => Animated.timing(p, { toValue: 1, duration: DUREE, easing: Easing.out(Easing.cubic), useNativeDriver: false }))
    );
    animation.start();
    return () => animation.stop();
  }, [progressions]);

  return (
    <View style={styles.liste}>
      {schema.barres.map((barre, index) => {
        const couleur = couleurRole(barre.role, theme, couleurs, mode);
        const ratio = Math.abs(barre.valeur) / max;
        const progression = progressions[index];
        return (
          <View key={`${barre.label}-${index}`} style={styles.ligne}>
            <Text style={styles.label} numberOfLines={2}>
              {barre.label}
            </Text>
            <View style={styles.piste}>
              <Animated.View
                style={[
                  styles.barre,
                  {
                    backgroundColor: couleur,
                    width: progression.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${Math.max(ratio * 100, 3)}%`] }),
                  },
                ]}
              />
              <Animated.Text
                style={[
                  styles.valeur,
                  {
                    color: ratio > 0.55 ? "#FFFFFF" : couleur,
                    opacity: progression.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0, 1] }),
                    ...(ratio > 0.55 ? { right: `${100 - ratio * 100 + 3}%` } : { left: `${ratio * 100 + 3}%` }),
                  },
                ]}
              >
                {formaterCourt(barre.valeur, schema.unite)}
              </Animated.Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    liste: {
      gap: 10,
    },
    ligne: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    label: {
      ...TYPO.legende,
      width: "34%",
      color: couleurs.texte,
    },
    piste: {
      flex: 1,
      height: 28,
      borderRadius: RAYONS.petit,
      backgroundColor: couleurs.surfaceAtone,
      justifyContent: "center",
      overflow: "hidden",
    },
    barre: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      borderRadius: RAYONS.petit,
    },
    valeur: {
      ...TYPO.label,
      fontSize: 12,
      position: "absolute",
    },
  });
