import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { RAYONS } from "../../theme/parcoursTheme";
import { Reflet } from "./Reflet";

/**
 * Barre de progression dont le remplissage s'anime à chaque changement de ratio, et dont
 * la partie acquise porte un reflet qui la traverse de temps en temps — la portion gagnée
 * se distingue alors de la piste par autre chose que sa seule couleur.
 */
export function BarreProgression({
  ratio,
  couleur,
  couleurPiste,
  hauteur = 10,
}: {
  ratio: number;
  couleur: string;
  couleurPiste: string;
  hauteur?: number;
}) {
  const largeur = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(largeur, {
      toValue: Math.max(0, Math.min(1, ratio)),
      duration: 700,
      delay: 150,
      easing: Easing.out(Easing.cubic),
      // La largeur en % n'est pas animable par le driver natif.
      useNativeDriver: false,
    }).start();
  }, [largeur, ratio]);

  return (
    <View style={[styles.piste, { height: hauteur, backgroundColor: couleurPiste }]}>
      <Animated.View
        style={[
          styles.remplissage,
          {
            backgroundColor: couleur,
            width: largeur.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
          },
        ]}
      >
        {ratio > 0 && <Reflet duree={1500} pause={4600} intensite={0.4} largeur={0.3} />}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  piste: {
    flex: 1,
    borderRadius: RAYONS.pilule,
    overflow: "hidden",
  },
  remplissage: {
    height: "100%",
    borderRadius: RAYONS.pilule,
    overflow: "hidden",
  },
});
