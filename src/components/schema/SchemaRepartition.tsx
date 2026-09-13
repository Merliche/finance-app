import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import type { Schema } from "../../domain/parcours/types";
import { useCouleurs, useMode, useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { type ThemeParcours } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";
import { paletteRepartition } from "./couleurs";
import { normaliserParts } from "./geometrie";

type SchemaRepartition = Extract<Schema, { kind: "repartition" }>;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const TAILLE = 150;
const EPAISSEUR = 22;
const DUREE_TOTALE = 1500;

/** Anneau dont chaque part se dessine à la suite de la précédente, légende avec les pourcentages. */
export function SchemaRepartition({ schema, theme }: { schema: SchemaRepartition; theme: ThemeParcours }) {
  const couleurs = useCouleurs();
  const mode = useMode();
  const styles = useStyles(creerStyles);
  const rayon = (TAILLE - EPAISSEUR) / 2;
  const circonference = 2 * Math.PI * rayon;
  const palette = paletteRepartition(theme, couleurs, mode);
  const parts = useMemo(() => normaliserParts(schema.parts.map((p) => p.valeur)), [schema]);
  const progression = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progression.setValue(0);
    const animation = Animated.timing(progression, {
      toValue: 1,
      duration: DUREE_TOTALE,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [progression]);

  const principale = parts.reduce((meilleur, part, index) => (part.fraction > parts[meilleur].fraction ? index : meilleur), 0);

  return (
    <View style={styles.conteneur}>
      <View style={{ width: TAILLE, height: TAILLE }}>
        <Svg width={TAILLE} height={TAILLE}>
          <G rotation={-90} origin={`${TAILLE / 2}, ${TAILLE / 2}`}>
            <Circle cx={TAILLE / 2} cy={TAILLE / 2} r={rayon} stroke={couleurs.surfaceAtone} strokeWidth={EPAISSEUR} fill="none" />
            {parts.map((part, index) => {
              if (part.fraction <= 0) return null;
              const longueur = part.fraction * circonference;
              // Chaque part est révélée pendant sa propre fenêtre de la progression globale
              // (de `depart` à `depart + fraction`) : l'anneau se remplit d'un seul geste continu.
              // Bornes clampées : la somme des fractions peut dépasser 1 d'un epsilon
              // flottant, et Animated exige une inputRange croissante.
              const debut = Math.min(part.depart, 1);
              const fin = Math.min(Math.max(part.depart + part.fraction, debut), 1);
              const visible = progression.interpolate({
                inputRange: [0, debut, fin, 1],
                outputRange: [longueur, longueur, 0, 0],
                extrapolate: "clamp",
              });
              return (
                <AnimatedCircle
                  key={index}
                  cx={TAILLE / 2}
                  cy={TAILLE / 2}
                  r={rayon}
                  stroke={palette[index % palette.length]}
                  strokeWidth={EPAISSEUR}
                  fill="none"
                  strokeDasharray={`${longueur} ${circonference}`}
                  strokeDashoffset={visible}
                  rotation={part.depart * 360}
                  origin={`${TAILLE / 2}, ${TAILLE / 2}`}
                />
              );
            })}
          </G>
        </Svg>
        <View style={styles.centre} pointerEvents="none">
          <Text style={[styles.centreValeur, { color: palette[principale % palette.length] }]}>
            {Math.round(parts[principale]?.fraction * 100 || 0)}%
          </Text>
          <Text style={styles.centreLabel} numberOfLines={1}>
            {schema.parts[principale]?.label}
          </Text>
        </View>
      </View>

      <View style={styles.legende}>
        {schema.parts.map((part, index) => (
          <Animated.View
            key={`${part.label}-${index}`}
            style={[
              styles.ligne,
              {
                opacity: progression.interpolate({
                  inputRange: [0, Math.min(parts[index].depart + 0.05, 1), Math.min(parts[index].depart + 0.2, 1), 1],
                  outputRange: [0.25, 0.25, 1, 1],
                }),
              },
            ]}
          >
            <View style={[styles.pastille, { backgroundColor: palette[index % palette.length] }]} />
            <Text style={styles.label} numberOfLines={2}>
              {part.label}
            </Text>
            <Text style={[styles.pourcentage, { color: palette[index % palette.length] }]}>
              {Math.round(parts[index].fraction * 100)}%
            </Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    conteneur: {
      flexDirection: "row",
      alignItems: "center",
      gap: 18,
      flexWrap: "wrap",
    },
    centre: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: EPAISSEUR + 6,
    },
    centreValeur: {
      ...TYPO.chiffre,
      fontSize: 26,
      lineHeight: 30,
    },
    centreLabel: {
      ...TYPO.legende,
      fontSize: 10.5,
      color: couleurs.texteAttenue,
      textAlign: "center",
    },
    legende: {
      flex: 1,
      minWidth: 130,
      gap: 9,
    },
    ligne: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    pastille: {
      width: 10,
      height: 10,
      borderRadius: 3,
    },
    label: {
      ...TYPO.legende,
      flex: 1,
      color: couleurs.texte,
    },
    pourcentage: {
      ...TYPO.titreCarte,
      fontSize: 13.5,
    },
  });
