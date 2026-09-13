import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { Schema } from "../../domain/parcours/types";
import { useCouleurs, useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { RAYONS, type ThemeParcours } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";

type SchemaFlux = Extract<Schema, { kind: "flux" }>;

const DECALAGE = 260;

/**
 * Enchaînement de cases numérotées reliées par des flèches, révélées une à une de haut
 * en bas — pour montrer un mécanisme (la banque centrale monte ses taux → … → les prix
 * ralentissent) plutôt que de le raconter.
 */
export function SchemaFlux({ schema, theme }: { schema: SchemaFlux; theme: ThemeParcours }) {
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const progressions = useRef(schema.etapes.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    progressions.forEach((p) => p.setValue(0));
    const animation = Animated.stagger(
      DECALAGE,
      progressions.map((p) => Animated.spring(p, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }))
    );
    animation.start();
    return () => animation.stop();
  }, [progressions]);

  return (
    <View style={styles.colonne}>
      {schema.etapes.map((etape, index) => {
        const progression = progressions[index];
        const derniere = index === schema.etapes.length - 1;
        return (
          <View key={`${etape.label}-${index}`}>
            <Animated.View
              style={[
                styles.carte,
                {
                  borderColor: derniere ? theme.primary : couleurs.bordure,
                  backgroundColor: derniere ? theme.tint : couleurs.surfaceAtone,
                  opacity: progression,
                  transform: [
                    { translateY: progression.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) },
                    { scale: progression.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
                  ],
                },
              ]}
            >
              <View style={[styles.numero, { backgroundColor: theme.primary }]}>
                <Text style={styles.numeroTexte}>{index + 1}</Text>
              </View>
              <View style={styles.textes}>
                <Text style={styles.label}>{etape.label}</Text>
                {etape.detail ? <Text style={styles.detail}>{etape.detail}</Text> : null}
              </View>
            </Animated.View>

            {!derniere && (
              <Animated.View
                style={[
                  styles.fleche,
                  {
                    opacity: progressions[index + 1].interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
                    transform: [{ translateY: progressions[index + 1].interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }],
                  },
                ]}
              >
                <View style={[styles.flecheTrait, { backgroundColor: theme.tintFort }]} />
                <Ionicons name="chevron-down" size={16} color={theme.primary} style={styles.flechePointe} />
              </Animated.View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    colonne: {
      gap: 0,
    },
    carte: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1.5,
      borderRadius: RAYONS.grand,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    numero: {
      width: 26,
      height: 26,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    numeroTexte: {
      ...TYPO.label,
      fontSize: 12,
      color: "#FFFFFF",
    },
    textes: {
      flex: 1,
      gap: 2,
    },
    label: {
      ...TYPO.label,
      fontSize: 14,
      color: couleurs.texte,
    },
    detail: {
      ...TYPO.legende,
      color: couleurs.texteAttenue,
    },
    fleche: {
      alignItems: "center",
      height: 26,
      justifyContent: "center",
    },
    flecheTrait: {
      width: 3,
      height: 14,
      borderRadius: 2,
      marginBottom: -6,
    },
    flechePointe: {
      marginTop: -2,
    },
  });
