import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useMouvementReduit } from "../../hooks/useMouvementReduit";
import { COURBES } from "../../theme/animation";
import { avecAlpha } from "../../theme/couleurs";

/**
 * Bande de lumière qui traverse une surface en diagonale, puis revient au bout d'un
 * moment. C'est le détail qui distingue un aplat coloré d'une matière : le bandeau de
 * l'en-tête cesse d'être une zone peinte et devient une surface sur laquelle la lumière
 * tombe.
 *
 * À placer dans un conteneur en `overflow: "hidden"`, sous le contenu : la bande balaie
 * toute la largeur et serait visible au-delà des bords arrondis sans cette découpe. Le
 * passage est rare et lent, pour rester à la limite du perceptible — un reflet qu'on
 * remarque vraiment devient un clignotement.
 *
 * Le trajet est calculé en pixels à partir de la largeur mesurée, et non en pourcentages :
 * le driver natif interpole des nombres et des angles, pas des unités relatives, et une
 * translation en « % » qui lui est confiée est au mieux ignorée.
 */
export function Reflet({
  /** Durée d'un passage. */
  duree = 2200,
  /** Temps d'attente entre deux passages. */
  pause = 5200,
  /** Densité du blanc au cœur de la bande. */
  intensite = 0.16,
  /** Largeur de la bande, en proportion de la largeur du conteneur. */
  largeur = 0.38,
  /** Couleur de la lumière. Blanche sur une surface colorée, claire sur un gris. */
  couleur = "#FFFFFF",
}: {
  duree?: number;
  pause?: number;
  intensite?: number;
  largeur?: number;
  couleur?: string;
}) {
  const mouvementReduit = useMouvementReduit();
  const passage = useRef(new Animated.Value(0)).current;
  const [largeurZone, setLargeurZone] = useState(0);

  const largeurBande = Math.max(24, largeurZone * largeur);
  const pret = largeurZone > 0 && !mouvementReduit;

  useEffect(() => {
    if (!pret) return;
    const boucle = Animated.loop(
      Animated.sequence([
        Animated.delay(pause),
        Animated.timing(passage, {
          toValue: 1,
          duration: duree,
          easing: COURBES.douce,
          useNativeDriver: true,
        }),
      ])
    );
    boucle.start();
    return () => boucle.stop();
  }, [passage, duree, pause, pret]);

  if (mouvementReduit) return null;

  return (
    <View pointerEvents="none" style={styles.zone} onLayout={(e) => setLargeurZone(e.nativeEvent.layout.width)}>
      {pret && (
        <Animated.View
          style={[
            styles.bande,
            {
              width: largeurBande,
              transform: [
                // La bande part entièrement hors du conteneur et en ressort entièrement :
                // elle n'est jamais visible pendant la pause.
                {
                  translateX: passage.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-largeurBande * 1.6, largeurZone + largeurBande * 0.6],
                  }),
                },
                { rotate: "18deg" },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[avecAlpha(couleur, 0), avecAlpha(couleur, intensite), avecAlpha(couleur, 0)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  zone: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" },
  // Débordant en haut et en bas : inclinée, la bande doit encore couvrir toute la hauteur.
  bande: { position: "absolute", top: "-60%", bottom: "-60%", left: 0 },
});
