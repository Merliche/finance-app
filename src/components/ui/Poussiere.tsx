import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from "react-native";

import { useMouvementReduit } from "../../hooks/useMouvementReduit";
import { avecAlpha } from "../../theme/couleurs";

/**
 * Fines particules qui montent lentement derrière le contenu. Deux raisons, pas une :
 * elles donnent une profondeur que les nappes du fond ne donnent pas (elles bougent plus
 * vite et dans une seule direction, l'œil en déduit un premier plan), et sur un chemin
 * qui se gravit du bas vers le haut, elles poussent le regard dans le sens de la montée.
 *
 * Volontairement peu nombreuses et très pâles : une particule qu'on remarque est une
 * particule de trop. Chaque cycle démarre à un endroit et à un moment différents, donc le
 * flux ne pulse jamais en rythme.
 */
const NB_PARTICULES = 11;

interface Particule {
  x: number;
  taille: number;
  duree: number;
  depart: number;
  derive: number;
  opacite: number;
}

/** Suite pseudo-aléatoire déterministe : même semis à chaque rendu, donc aucun saut. */
function semis(graine: number): () => number {
  let etat = graine;
  return () => {
    etat = (etat * 1664525 + 1013904223) % 4294967296;
    return etat / 4294967296;
  };
}

export function Poussiere({ couleur, hauteur }: { couleur: string; hauteur: number }) {
  const { width } = useWindowDimensions();
  const mouvementReduit = useMouvementReduit();

  const particules = useMemo<Particule[]>(() => {
    const hasard = semis(20260912);
    return Array.from({ length: NB_PARTICULES }, () => ({
      x: hasard() * width,
      taille: 2 + hasard() * 2.6,
      duree: 11000 + hasard() * 12000,
      depart: hasard(),
      derive: (hasard() - 0.5) * 46,
      opacite: 0.1 + hasard() * 0.16,
    }));
  }, [width]);

  const montees = useRef(particules.map((p) => new Animated.Value(p.depart))).current;

  useEffect(() => {
    if (mouvementReduit) return;
    // Chaque particule repart du bas dès qu'elle atteint le haut : une boucle par
    // particule, jamais synchronisée avec les autres puisque les durées diffèrent.
    const animations = particules.map((particule, index) =>
      Animated.loop(
        Animated.timing(montees[index], {
          toValue: 1,
          duration: particule.duree * (1 - particule.depart),
          easing: Easing.linear,
          useNativeDriver: true,
        })
      )
    );
    animations.forEach((animation) => animation.start());
    return () => {
      animations.forEach((animation) => animation.stop());
      montees.forEach((montee, index) => montee.setValue(particules[index].depart));
    };
  }, [particules, montees, mouvementReduit]);

  if (mouvementReduit) return null;

  return (
    <View pointerEvents="none" style={styles.zone}>
      {particules.map((particule, index) => (
        <Animated.View
          key={index}
          style={{
            position: "absolute",
            left: particule.x,
            top: hauteur,
            width: particule.taille,
            height: particule.taille,
            borderRadius: 999,
            backgroundColor: avecAlpha(couleur, particule.opacite),
            transform: [
              { translateY: montees[index].interpolate({ inputRange: [0, 1], outputRange: [0, -hauteur] }) },
              {
                translateX: montees[index].interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, particule.derive, 0],
                }),
              },
            ],
            // Elles naissent et meurent en fondu : aucune n'apparaît ni ne disparaît net.
            opacity: montees[index].interpolate({
              inputRange: [0, 0.12, 0.82, 1],
              outputRange: [0, 1, 1, 0],
            }),
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  zone: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" },
});
