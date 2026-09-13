import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from "react-native";

import { useMouvementReduit } from "../../hooks/useMouvementReduit";
import { eclaircir, melanger } from "../../theme/couleurs";
import type { ThemeParcours } from "../../theme/parcoursTheme";
import { Halo } from "./Halo";

/**
 * Fond « aurore » : cinq nappes de couleur très diffuses qui dérivent lentement derrière
 * le contenu, à des vitesses différentes. C'est ce qui empêche l'écran d'être un aplat
 * mort, sans rien coûter en lisibilité — les nappes sont larges, sans contour, et bougent
 * assez lentement pour qu'on ne les regarde jamais vraiment.
 *
 * Trois choses lui donnent de la profondeur :
 * — chaque nappe a sa propre période, jamais un multiple d'une autre, donc le mouvement
 *   d'ensemble ne se répète pas à l'œil ;
 * — reliée au défilement (`defilement`), chaque nappe glisse à sa propre fraction de la
 *   vitesse du contenu : le fond paraît loin derrière, comme un paysage vu d'un train ;
 * — `progression` réchauffe la palette à mesure qu'on avance dans le parcours, de sorte
 *   que le fond d'un parcours terminé ne ressemble pas à celui d'un parcours neuf.
 *
 * Tout passe par le driver natif (translate/scale uniquement) : aucune charge sur le
 * thread JS, même pendant le défilement du chemin. Si le système demande de réduire les
 * animations, les nappes restent en place — le décor reste, le mouvement s'arrête.
 */

type Interpolation = Animated.AnimatedInterpolation<number>;
type Transformation = { translateX: Interpolation } | { translateY: Interpolation } | { scale: Interpolation };

/** Positions et tailles en fractions de la largeur d'écran : identique sur tout appareil. */
const NAPPES = [
  { x: -0.32, y: -0.12, taille: 1.25, dx: 0.1, dy: 0.14, duree: 15000, opacite: 0.5, teinte: 1, parallaxe: 0.06 },
  { x: 0.42, y: 0.22, taille: 1.0, dx: -0.14, dy: -0.1, duree: 19000, opacite: 0.42, teinte: 0, parallaxe: 0.13 },
  { x: -0.18, y: 0.62, taille: 1.45, dx: 0.09, dy: -0.18, duree: 23000, opacite: 0.36, teinte: 2, parallaxe: 0.2 },
  { x: 0.55, y: 0.95, taille: 0.85, dx: -0.08, dy: 0.12, duree: 17000, opacite: 0.32, teinte: 1, parallaxe: 0.28 },
  { x: 0.05, y: 1.3, taille: 1.1, dx: 0.12, dy: -0.09, duree: 26000, opacite: 0.28, teinte: 0, parallaxe: 0.36 },
] as const;

export function FondAnime({
  theme,
  intensite = 1,
  defilement,
  progression = 0,
}: {
  theme: ThemeParcours;
  intensite?: number;
  /** Décalage de défilement en pixels — branche la parallaxe du fond sur le contenu. */
  defilement?: Animated.Value;
  /** Avancement du parcours, 0 à 1 : réchauffe et densifie la palette. */
  progression?: number;
}) {
  const { width } = useWindowDimensions();
  const mouvementReduit = useMouvementReduit();

  // Une valeur par nappe, chacune en aller-retour continu sur sa propre durée.
  const derives = useRef(NAPPES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (mouvementReduit) return;
    const animations = derives.map((derive, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(derive, {
            toValue: 1,
            duration: NAPPES[index].duree,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(derive, {
            toValue: 0,
            duration: NAPPES[index].duree,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      )
    );
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [derives, mouvementReduit]);

  // Trois teintes tirées du thème, du plus clair au plus soutenu. L'avancement les
  // rapproche de la couleur pleine du parcours : la carte « chauffe » avec la progression.
  const teintes = useMemo(() => {
    const avancement = Math.max(0, Math.min(1, progression));
    return [
      melanger(theme.tint, theme.primary, 0.12 + avancement * 0.28),
      melanger(theme.tintFort, theme.primary, 0.18 + avancement * 0.3),
      eclaircir(theme.primary, 0.62 - avancement * 0.22),
    ];
  }, [theme, progression]);

  return (
    <View pointerEvents="none" style={styles.zone}>
      {NAPPES.map((nappe, index) => {
        const taille = width * nappe.taille;
        const transform: Transformation[] = [
          { translateX: derives[index].interpolate({ inputRange: [0, 1], outputRange: [0, width * nappe.dx] }) },
          { translateY: derives[index].interpolate({ inputRange: [0, 1], outputRange: [0, width * nappe.dy] }) },
          { scale: derives[index].interpolate({ inputRange: [0, 1], outputRange: [1, 1.16] }) },
        ];
        // La parallaxe s'ajoute au mouvement propre : les deux translations se composent.
        if (defilement && !mouvementReduit) {
          transform.push({
            translateY: defilement.interpolate({
              inputRange: [0, 1000],
              outputRange: [0, -1000 * nappe.parallaxe],
            }),
          });
        }
        return (
          <Animated.View
            key={index}
            style={{
              position: "absolute",
              left: width * nappe.x,
              top: width * nappe.y,
              transform,
            }}
          >
            <Halo taille={taille} couleur={teintes[nappe.teinte]} opacite={nappe.opacite * intensite} />
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // `StyleSheet.absoluteFillObject` n'est pas typé dans cette version de RN : on écrit
  // le positionnement à la main plutôt que de perdre le typage du style.
  zone: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
});
