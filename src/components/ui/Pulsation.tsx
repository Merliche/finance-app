import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing, type StyleProp, type ViewStyle } from "react-native";

/**
 * Battement lent et discret (échelle + opacité). Réservé aux éléments qui signalent
 * quelque chose de vivant — la flamme d'une série en cours, un défi à relever — jamais
 * à de la décoration : au-delà de deux éléments qui battent, l'écran devient agité.
 */
export function Pulsation({
  children,
  actif = true,
  amplitude = 0.09,
  duree = 1100,
  style,
}: {
  children: ReactNode;
  actif?: boolean;
  amplitude?: number;
  duree?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const battement = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!actif) {
      battement.setValue(0);
      return;
    }
    const boucle = Animated.loop(
      Animated.sequence([
        Animated.timing(battement, { toValue: 1, duration: duree, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(battement, { toValue: 0, duration: duree, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    boucle.start();
    return () => boucle.stop();
  }, [battement, actif, duree]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale: battement.interpolate({ inputRange: [0, 1], outputRange: [1, 1 + amplitude] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
