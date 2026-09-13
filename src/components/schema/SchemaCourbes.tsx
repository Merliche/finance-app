import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

import type { Schema } from "../../domain/parcours/types";
import { useCouleurs, useMode, useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { type ThemeParcours } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";
import { couleurRole, formaterCourt } from "./couleurs";
import { bornesY, longueurPolyligne, projeterSerie, tracerCourbe } from "./geometrie";

type SchemaCourbes = Extract<Schema, { kind: "courbes" }>;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const HAUTEUR = 170;
const MARGE_HAUT = 14;
const MARGE_BAS = 10;
const MARGE_DROITE = 14;
const MARGE_GAUCHE = 8;
const DUREE_TRACE = 1400;
const DECALAGE_SERIE = 320;

/**
 * Courbes qui se dessinent progressivement (effet "stylo") : la série principale d'abord,
 * puis les suivantes, chacune terminée par un point ; la légende révèle la valeur finale
 * quand le tracé arrive au bout.
 */
export function SchemaCourbes({ schema, theme, largeur }: { schema: SchemaCourbes; theme: ThemeParcours; largeur: number }) {
  const couleurs = useCouleurs();
  const mode = useMode();
  const styles = useStyles(creerStyles);
  const zone = useMemo(
    () => ({ largeur: largeur - MARGE_GAUCHE - MARGE_DROITE, hauteur: HAUTEUR - MARGE_HAUT - MARGE_BAS }),
    [largeur]
  );
  const bornes = useMemo(() => bornesY(schema.series.flatMap((s) => s.points)), [schema]);

  const series = useMemo(
    () =>
      schema.series.map((serie) => {
        const points = projeterSerie(serie.points, zone, bornes);
        return {
          label: serie.label,
          valeurFinale: serie.points[serie.points.length - 1] ?? 0,
          couleur: couleurRole(serie.role, theme, couleurs, mode),
          points,
          d: tracerCourbe(points),
          longueur: longueurPolyligne(points) * 1.15 + 10,
        };
      }),
    [schema, theme, zone, bornes]
  );

  const progressions = useRef(series.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    progressions.forEach((p) => p.setValue(0));
    const animation = Animated.stagger(
      DECALAGE_SERIE,
      progressions.map((p) =>
        Animated.timing(p, { toValue: 1, duration: DUREE_TRACE, easing: Easing.inOut(Easing.cubic), useNativeDriver: false })
      )
    );
    animation.start();
    return () => animation.stop();
  }, [progressions]);

  const etendue = bornes.max - bornes.min || 1;
  const yZero = zone.hauteur - ((0 - bornes.min) / etendue) * zone.hauteur;

  return (
    <View>
      <View style={{ width: largeur, height: HAUTEUR }}>
        {/* Repères : lignes horizontales discrètes et axe du zéro */}
        <Svg width={largeur} height={HAUTEUR} style={StyleSheet.absoluteFill}>
          {[0.25, 0.5, 0.75].map((f) => (
            <Line
              key={f}
              x1={MARGE_GAUCHE}
              x2={largeur - MARGE_DROITE}
              y1={MARGE_HAUT + zone.hauteur * f}
              y2={MARGE_HAUT + zone.hauteur * f}
              stroke={couleurs.bordure}
              strokeWidth={1}
              strokeDasharray="2 5"
            />
          ))}
          <Line
            x1={MARGE_GAUCHE}
            x2={largeur - MARGE_DROITE}
            y1={MARGE_HAUT + yZero}
            y2={MARGE_HAUT + yZero}
            stroke={couleurs.bordure}
            strokeWidth={1.5}
          />
        </Svg>

        {/* Une couche SVG par série, pour animer chacune indépendamment */}
        {series.map((serie, index) => {
          const dernier = serie.points[serie.points.length - 1];
          const progression = progressions[index];
          return (
            <Svg
              key={serie.label}
              width={zone.largeur}
              height={zone.hauteur + MARGE_HAUT}
              style={{ position: "absolute", left: MARGE_GAUCHE, top: 0 }}
              viewBox={`0 ${-MARGE_HAUT} ${zone.largeur} ${zone.hauteur + MARGE_HAUT}`}
            >
              {index === 0 && dernier && (
                <AnimatedPath
                  d={`${serie.d} L${dernier.x},${zone.hauteur} L${serie.points[0].x},${zone.hauteur} Z`}
                  fill={serie.couleur}
                  opacity={progression.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 0, 0.1] })}
                />
              )}
              <AnimatedPath
                d={serie.d}
                stroke={serie.couleur}
                strokeWidth={index === 0 ? 3.5 : 2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray={`${serie.longueur} ${serie.longueur}`}
                strokeDashoffset={progression.interpolate({ inputRange: [0, 1], outputRange: [serie.longueur, 0] })}
              />
              {dernier && (
                <AnimatedCircle
                  cx={dernier.x}
                  cy={dernier.y}
                  r={progression.interpolate({ inputRange: [0, 0.85, 1], outputRange: [0, 0, 5] })}
                  fill={serie.couleur}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
              )}
            </Svg>
          );
        })}
      </View>

      {/* Étiquettes de l'axe horizontal */}
      <View style={[styles.axeX, { marginLeft: MARGE_GAUCHE, marginRight: MARGE_DROITE }]}>
        {schema.axeX.map((etiquette, index) => (
          <Text
            key={`${etiquette}-${index}`}
            style={[
              styles.etiquette,
              { textAlign: index === 0 ? "left" : index === schema.axeX.length - 1 ? "right" : "center" },
            ]}
            numberOfLines={1}
          >
            {etiquette}
          </Text>
        ))}
      </View>

      {/* Légende : une ligne par série, valeur finale révélée en fin de tracé */}
      <View style={styles.legende}>
        {series.map((serie, index) => (
          <View key={serie.label} style={styles.ligneLegende}>
            <View style={[styles.pastille, { backgroundColor: serie.couleur }]} />
            <Text style={styles.legendeTexte} numberOfLines={1}>
              {serie.label}
            </Text>
            <Animated.Text
              style={[
                styles.valeurFinale,
                {
                  color: serie.couleur,
                  opacity: progressions[index].interpolate({ inputRange: [0, 0.85, 1], outputRange: [0, 0, 1] }),
                },
              ]}
            >
              {formaterCourt(serie.valeurFinale, schema.unite)}
            </Animated.Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    axeX: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 4,
    },
    etiquette: {
      ...TYPO.legende,
      fontSize: 11,
      flex: 1,
      color: couleurs.texteTertiaire,
    },
    legende: {
      marginTop: 12,
      gap: 6,
    },
    ligneLegende: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    pastille: {
      width: 10,
      height: 10,
      borderRadius: 999,
    },
    legendeTexte: {
      ...TYPO.legende,
      flex: 1,
      color: couleurs.texte,
    },
    valeurFinale: {
      ...TYPO.titreCarte,
      fontSize: 14,
    },
  });
