import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from "react-native";

import { useMouvementReduit } from "../../hooks/useMouvementReduit";

/**
 * Pluie de confettis, pour les moments qui le méritent : une session bouclée, un parcours
 * terminé. Volontairement absente d'une simple étape validée — un effet qu'on déclenche à
 * chaque écran cesse d'être une récompense au bout de trois fois.
 *
 * Chaque confetti tombe sur sa propre durée, part d'un décalage différent, tourne à sa
 * propre vitesse et dérive latéralement : aucune ligne ne se forme, la pluie paraît
 * naturelle. Position, rotation et opacité passent toutes par le driver natif, donc
 * l'animation tient ses images même pendant que l'écran de célébration se monte.
 */
const NB_CONFETTIS = 30;

interface Confetti {
  x: number;
  largeur: number;
  hauteur: number;
  couleur: string;
  duree: number;
  retard: number;
  derive: number;
  tours: number;
  rond: boolean;
}

/** Suite pseudo-aléatoire déterministe : la pluie est variée, mais jamais différente. */
function semis(graine: number): () => number {
  let etat = graine;
  return () => {
    etat = (etat * 1664525 + 1013904223) % 4294967296;
    return etat / 4294967296;
  };
}

export function Confettis({
  actif,
  couleurs,
  hauteur,
}: {
  actif: boolean;
  /** Palette de la pluie — en pratique celle du parcours, plus un ou deux accents. */
  couleurs: string[];
  /** Hauteur à parcourir. Par défaut, la hauteur de la fenêtre. */
  hauteur?: number;
}) {
  const { width, height } = useWindowDimensions();
  const mouvementReduit = useMouvementReduit();
  const course = hauteur ?? height;

  const confettis = useMemo<Confetti[]>(() => {
    const hasard = semis(4071993);
    return Array.from({ length: NB_CONFETTIS }, () => {
      const largeur = 6 + hasard() * 6;
      return {
        x: hasard() * width,
        largeur,
        hauteur: largeur * (0.6 + hasard() * 1.1),
        couleur: couleurs[Math.floor(hasard() * couleurs.length)] ?? couleurs[0],
        duree: 2100 + hasard() * 1900,
        retard: hasard() * 900,
        derive: (hasard() - 0.5) * 150,
        tours: 1 + hasard() * 3,
        rond: hasard() > 0.65,
      };
    });
  }, [width, couleurs]);

  const chutes = useRef(confettis.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!actif || mouvementReduit) return;
    chutes.forEach((chute) => chute.setValue(0));
    const animations = confettis.map((confetti, index) =>
      Animated.timing(chutes[index], {
        toValue: 1,
        duration: confetti.duree,
        delay: confetti.retard,
        // Une chute accélère : une interpolation linéaire donne des confettis qui flottent.
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      })
    );
    const ensemble = Animated.parallel(animations);
    ensemble.start();
    return () => ensemble.stop();
  }, [actif, confettis, chutes, mouvementReduit]);

  if (!actif || mouvementReduit) return null;

  return (
    <View pointerEvents="none" style={styles.zone}>
      {confettis.map((confetti, index) => (
        <Animated.View
          key={index}
          style={{
            position: "absolute",
            left: confetti.x,
            top: -30,
            width: confetti.largeur,
            height: confetti.rond ? confetti.largeur : confetti.hauteur,
            borderRadius: confetti.rond ? 999 : 2,
            backgroundColor: confetti.couleur,
            opacity: chutes[index].interpolate({
              inputRange: [0, 0.08, 0.75, 1],
              outputRange: [0, 1, 1, 0],
            }),
            transform: [
              {
                translateY: chutes[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, course + 60],
                }),
              },
              {
                translateX: chutes[index].interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, confetti.derive, confetti.derive * 0.4],
                }),
              },
              {
                rotate: chutes[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", `${Math.round(confetti.tours * 360)}deg`],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  zone: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" },
});
