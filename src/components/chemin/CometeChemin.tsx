import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { useMouvementReduit } from "../../hooks/useMouvementReduit";
import { avecAlpha, eclaircir } from "../../theme/couleurs";
import type { PointChemin } from "./calculerChemin";
import { echantillonnerChemin, progressionCumulee } from "./calculerChemin";

/**
 * Une lumière qui remonte la portion déjà parcourue du chemin, puis s'éteint, et
 * recommence au bout d'un moment. Elle part du tout premier nœud et s'arrête sur l'étape
 * en cours : en une seconde et demie, elle raconte « voilà où tu en es » mieux qu'un
 * pourcentage, et elle ramène l'œil sur le seul nœud sur lequel il faut appuyer.
 *
 * Elle suit le tracé réel, courbes comprises (`echantillonnerChemin`), et avance à
 * vitesse constante (`progressionCumulee`) — sinon elle ralentirait dans les virages, ce
 * qui se voit immédiatement. Position et opacité passent par le driver natif : la comète
 * ne coûte rien pendant le défilement.
 */
const DUREE_TRAJET = 1700;
const PAUSE_ENTRE_PASSAGES = 5200;
/** Longueur de la traîne, en fraction du trajet. */
const TRAINE = [0, 0.045, 0.09, 0.135] as const;

export function CometeChemin({
  points,
  couleur,
  rayon = 7,
}: {
  /** Centres des nœuds de la portion parcourue, du départ à l'étape en cours. */
  points: PointChemin[];
  couleur: string;
  rayon?: number;
}) {
  const mouvementReduit = useMouvementReduit();
  const avancee = useRef(new Animated.Value(0)).current;

  // Le tracé échantillonné et ses abscisses, recalculés seulement si le chemin change.
  const trajet = useMemo(() => {
    const echantillons = echantillonnerChemin(points, 10);
    const abscisses = progressionCumulee(echantillons);
    // Deux points confondus produiraient deux abscisses égales, et une interpolation
    // Animated exige une entrée strictement croissante : on écarte les doublons.
    const entrees: number[] = [];
    const xs: number[] = [];
    const ys: number[] = [];
    abscisses.forEach((abscisse, index) => {
      if (entrees.length > 0 && abscisse <= entrees[entrees.length - 1]) return;
      entrees.push(abscisse);
      xs.push(echantillons[index].x);
      ys.push(echantillons[index].y);
    });
    return { entrees, xs, ys };
  }, [points]);

  const utilisable = trajet.entrees.length >= 2;

  useEffect(() => {
    if (!utilisable || mouvementReduit) return;
    const boucle = Animated.loop(
      Animated.sequence([
        Animated.timing(avancee, {
          toValue: 1,
          duration: DUREE_TRAJET,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        // La comète est déjà éteinte pendant cette pause (voir l'opacité) : l'écran
        // respire entre deux passages au lieu d'être parcouru en permanence.
        Animated.delay(PAUSE_ENTRE_PASSAGES),
      ])
    );
    boucle.start();
    return () => boucle.stop();
  }, [avancee, utilisable, mouvementReduit]);

  if (!utilisable || mouvementReduit) return null;

  const coeur = eclaircir(couleur, 0.55);

  return (
    <View pointerEvents="none" style={styles.zone}>
      {TRAINE.map((decalage, index) => {
        const taille = rayon * 2 * (1 - index * 0.17);
        // Chaque grain de la traîne lit la même course, en retard d'un cran : il occupe
        // la position que la tête avait un instant plus tôt, donc exactement sur le tracé.
        const entrees = trajet.entrees.map((valeur) => valeur + decalage);
        return (
          <Animated.View
            key={index}
            style={{
              position: "absolute",
              left: -taille / 2,
              top: -taille / 2,
              width: taille,
              height: taille,
              borderRadius: 999,
              backgroundColor: index === 0 ? coeur : avecAlpha(couleur, 0.75 - index * 0.18),
              shadowColor: couleur,
              shadowOpacity: index === 0 ? 0.9 : 0,
              shadowRadius: index === 0 ? 10 : 0,
              shadowOffset: { width: 0, height: 0 },
              opacity: avancee.interpolate({
                inputRange: [0, 0.08, 0.84, 1],
                outputRange: [0, index === 0 ? 1 : 0.85 - index * 0.2, index === 0 ? 1 : 0.85 - index * 0.2, 0],
              }),
              transform: [
                {
                  translateX: avancee.interpolate({
                    inputRange: entrees,
                    outputRange: trajet.xs,
                    extrapolate: "clamp",
                  }),
                },
                {
                  translateY: avancee.interpolate({
                    inputRange: entrees,
                    outputRange: trajet.ys,
                    extrapolate: "clamp",
                  }),
                },
              ],
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  zone: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
});
