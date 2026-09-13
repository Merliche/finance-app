import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing, type StyleProp, type ViewStyle } from "react-native";

/**
 * Fait apparaître ses enfants à l'arrivée sur l'écran : fondu + glissement vers le haut
 * ("monter") ou fondu + zoom depuis le centre ("pop"). Un `delai` par élément permet
 * d'échelonner une liste. Utilise le driver natif : aucune charge sur le thread JS.
 */
export function Apparition({
  children,
  delai = 0,
  mode = "monter",
  style,
}: {
  children: ReactNode;
  delai?: number;
  mode?: "monter" | "pop";
  style?: StyleProp<ViewStyle>;
}) {
  const progression = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation =
      mode === "pop"
        ? Animated.spring(progression, { toValue: 1, useNativeDriver: true, friction: 6, tension: 90, delay: delai })
        : Animated.timing(progression, {
            toValue: 1,
            duration: 420,
            delay: delai,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          });
    animation.start();
    return () => animation.stop();
  }, [progression, delai, mode]);

  const transform =
    mode === "pop"
      ? [{ scale: progression.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) }]
      : [{ translateY: progression.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }];

  return (
    <Animated.View
      style={[style, { opacity: progression.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }), transform }]}
    >
      {children}
    </Animated.View>
  );
}
