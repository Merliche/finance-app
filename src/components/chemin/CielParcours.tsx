import { useId } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import { avecAlpha, eclaircir, melanger } from "../../theme/couleurs";
import { useCouleurs, useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { type ThemeParcours } from "../../theme/parcoursTheme";

/**
 * Le ciel derrière le chemin. Il n'est pas peint une fois pour toutes : il change avec
 * l'altitude.
 *
 * Le chemin se grimpe du bas vers le haut, et le haut du contenu est l'arrivée. En bas,
 * au départ, le ciel est clair et tiède — un petit matin. À mesure qu'on monte, deux
 * voiles aux couleurs du parcours se révèlent l'un après l'autre, et une grande lueur
 * s'allume derrière le sommet. On sait où on en est sans lire un pourcentage, et
 * l'arrivée se voit venir de loin : c'est la récompense qui éclaire la fin du chemin.
 *
 * Les voiles se superposent au lieu de se remplacer, et le fond de base reste toujours
 * opaque : à aucun moment l'écran ne peut se retrouver transparent, quelle que soit la
 * position de défilement.
 *
 * Seules des opacités sont animées, donc tout passe par le driver natif : le ciel suit le
 * doigt à la fréquence de l'écran, sans jamais solliciter le thread JS.
 */
export function CielParcours({
  theme,
  defilement,
  /** Amplitude totale de défilement, en pixels (hauteur du contenu moins celle de l'écran). */
  course,
}: {
  theme: ThemeParcours;
  defilement: Animated.Value;
  course: number;
}) {
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const idBrut = useId().replace(/[^a-zA-Z0-9]/g, "");
  const idLueur = `lueur-${idBrut}`;
  const idVignette = `vignette-${idBrut}`;

  // Contenu plus court que l'écran : il n'y a pas d'altitude, on montre le ciel du départ.
  const anime = course > 1;
  const voile = (entrees: number[], sorties: number[]) =>
    anime
      ? defilement.interpolate({
          inputRange: entrees.map((fraction) => fraction * course),
          outputRange: sorties,
          extrapolate: "clamp",
        })
      : sorties[sorties.length - 1];

  // Le décalage est nul en haut du contenu (l'arrivée) et maximal en bas (le départ) :
  // les fractions ci-dessous se lisent donc « 0 = sommet, 1 = départ ».
  const opaciteMilieu = voile([0, 0.5, 1], [1, 0.85, 0]);
  const opaciteSommet = voile([0, 0.3, 1], [1, 0, 0]);
  const opaciteLueur = voile([0, 0.25, 1], [1, 0, 0]);

  return (
    <View pointerEvents="none" style={styles.zone}>
      {/* Départ : clair et tiède. Toujours opaque, c'est le sol de tout l'empilement. */}
      <LinearGradient
        colors={[theme.tint, couleurs.fond]}
        locations={[0, 0.62]}
        style={StyleSheet.absoluteFill}
      />

      {/* Mi-pente : la couleur du parcours commence à prendre le dessus. */}
      <Animated.View style={[styles.zone, { opacity: opaciteMilieu }]}>
        <LinearGradient
          colors={[melanger(theme.tint, theme.primary, 0.26), eclaircir(theme.primary, 0.88), couleurs.fond]}
          locations={[0, 0.42, 0.82]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Sommet : le ciel est franchement coloré, mais toujours assez clair pour que les
          bannières blanches et les textes gris restent lisibles par-dessus. */}
      <Animated.View style={[styles.zone, { opacity: opaciteSommet }]}>
        <LinearGradient
          colors={[
            melanger(theme.primary, "#FFFFFF", 0.48),
            melanger(theme.primary, "#FFFFFF", 0.78),
            eclaircir(theme.primary, 0.93),
            couleurs.fond,
          ]}
          locations={[0, 0.3, 0.62, 0.95]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* La lueur de l'arrivée, accrochée en haut de l'écran : elle grandit à l'approche
          du sommet et n'existe nulle part ailleurs. */}
      <Animated.View style={[styles.zone, { opacity: opaciteLueur }]}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id={idLueur} cx="50%" cy="4%" r="72%">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} />
              <Stop offset="0.25" stopColor={eclaircir(theme.primary, 0.72)} stopOpacity={0.55} />
              <Stop offset="0.6" stopColor={theme.primary} stopOpacity={0.16} />
              <Stop offset="1" stopColor={avecAlpha(theme.primary, 0)} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${idLueur})`} />
        </Svg>
      </Animated.View>

      {/* Vignette : les bords se referment très légèrement, le regard reste au centre,
          là où passe le chemin. */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id={idVignette} cx="50%" cy="50%" r="76%">
            <Stop offset="0.55" stopColor="#1A1D23" stopOpacity={0} />
            <Stop offset="1" stopColor="#1A1D23" stopOpacity={0.09} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${idVignette})`} />
      </Svg>
    </View>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    zone: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  });
