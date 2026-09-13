import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing, type StyleProp, type ViewStyle } from "react-native";

import { useMouvementReduit } from "../../hooks/useMouvementReduit";

export type TypeReaction = "succes" | "erreur" | null;

/**
 * Joue une réaction brève quand `type` passe de rien à quelque chose : un petit bond pour
 * une bonne réponse, une secousse latérale pour une mauvaise.
 *
 * C'est la couche qui manquait à la correction d'un quiz. Les couleurs disent déjà qui a
 * raison, mais elles apparaissent d'un coup, toutes en même temps : rien ne distingue le
 * regard porté sur SA réponse du reste de la grille. Un mouvement, lui, attire l'œil
 * exactement là où il faut, et la secousse est comprise avant même d'être lue.
 *
 * Rien ne se rejoue tant que `type` ne repasse pas par `null` : une correction affichée
 * ne doit pas trembler à chaque rendu.
 */
export function Reaction({
  type,
  children,
  style,
}: {
  type: TypeReaction;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const mouvementReduit = useMouvementReduit();
  const geste = useRef(new Animated.Value(0)).current;
  const precedent = useRef<TypeReaction>(null);

  useEffect(() => {
    const changement = precedent.current !== type;
    precedent.current = type;
    if (!type || !changement || mouvementReduit) return;

    geste.setValue(0);
    const animation = Animated.timing(geste, {
      toValue: 1,
      duration: type === "erreur" ? 420 : 380,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [type, geste, mouvementReduit]);

  const transform =
    type === "erreur"
      ? [
          {
            // Trois allers-retours d'amplitude décroissante : une secousse qui s'amortit,
            // pas un va-et-vient mécanique.
            translateX: geste.interpolate({
              inputRange: [0, 0.15, 0.35, 0.55, 0.75, 0.9, 1],
              outputRange: [0, -9, 7, -5, 3, -1.5, 0],
            }),
          },
        ]
      : [
          {
            scale: geste.interpolate({
              inputRange: [0, 0.35, 0.7, 1],
              outputRange: [1, 1.045, 0.995, 1],
            }),
          },
        ];

  return <Animated.View style={[style, { transform }]}>{children}</Animated.View>;
}
