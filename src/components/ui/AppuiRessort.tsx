import { useRef, type ReactNode } from "react";
import { Animated, Pressable, type StyleProp, type ViewStyle } from "react-native";

import { useMouvementReduit } from "../../hooks/useMouvementReduit";

/**
 * Zone pressable dont le contenu s'enfonce et revient sur ressort. Un `scale` figé
 * pendant l'appui (ce que fait un style `pressed`) donne un clic sec ; un ressort donne
 * la sensation d'un objet qu'on repousse — c'est ce petit rebond au relâchement que l'œil
 * lit comme « l'appli répond ».
 *
 * Le ressort de retour est volontairement moins amorti que celui de l'enfoncement : on
 * s'enfonce net, on rebondit. Tout passe par le driver natif.
 */
export function AppuiRessort({
  children,
  onPress,
  onLongPress,
  disabled = false,
  echelle = 0.91,
  style,
  styleContenu,
  accessibilityLabel,
  accessibilityHint,
  hitSlop,
}: {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  /** Échelle atteinte pendant l'appui. */
  echelle?: number;
  style?: StyleProp<ViewStyle>;
  /** Styles portés par la vue animée : la carte tout entière s'enfonce, pas son cadre. */
  styleContenu?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  hitSlop?: number;
}) {
  const mouvementReduit = useMouvementReduit();
  const enfoncement = useRef(new Animated.Value(0)).current;

  const animerVers = (valeur: number, rebond: boolean) => {
    if (mouvementReduit) {
      enfoncement.setValue(valeur);
      return;
    }
    Animated.spring(enfoncement, {
      toValue: valeur,
      useNativeDriver: true,
      speed: rebond ? 20 : 40,
      bounciness: rebond ? 10 : 0,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      // 260 ms : assez long pour ne pas se déclencher sur un appui normal, assez court
      // pour qu'on découvre l'aperçu sans avoir l'impression d'attendre.
      delayLongPress={260}
      onPressIn={() => animerVers(1, false)}
      onPressOut={() => animerVers(0, true)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      hitSlop={hitSlop}
      style={style}
    >
      <Animated.View
        style={[
          styleContenu,
          {
            transform: [{ scale: enfoncement.interpolate({ inputRange: [0, 1], outputRange: [1, echelle] }) }],
            opacity: enfoncement.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] }),
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
