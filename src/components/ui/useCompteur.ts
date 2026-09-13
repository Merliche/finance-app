import { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";

/** Fait "monter" un nombre de 0 jusqu'à `cible` — pour un score qui se révèle plutôt que de s'afficher. */
export function useCompteur(cible: number, dureeMs = 800): number {
  const valeur = useRef(new Animated.Value(0)).current;
  const [affiche, setAffiche] = useState(0);

  useEffect(() => {
    const abonnement = valeur.addListener(({ value }) => setAffiche(Math.round(value)));
    valeur.setValue(0);
    Animated.timing(valeur, {
      toValue: cible,
      duration: dureeMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => valeur.removeListener(abonnement);
  }, [valeur, cible, dureeMs]);

  return affiche;
}
