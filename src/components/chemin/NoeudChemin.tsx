import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useMouvementReduit } from "../../hooks/useMouvementReduit";
import { assombrir, avecAlpha, eclaircir } from "../../theme/couleurs";
import { useCouleurs } from "../../theme/ModeCouleur";
import { type ThemeParcours } from "../../theme/parcoursTheme";
import type { EtatNoeud } from "./calculerChemin";

/**
 * Nœud d'étape sur le chemin. Trois états, trois lectures immédiates :
 * — validé : bille pleine aux couleurs du parcours, coche blanche ;
 * — actuel : plus grand, deux halos qui battent en décalé, flottement vertical ;
 * — verrouillé : mat, gris, cadenas.
 *
 * La bille n'est pas un aplat : dégradé du clair (en haut à gauche) vers le sombre (en
 * bas à droite), lèvre plus foncée sous la bille, reflet en arc sur le dessus. C'est ce
 * trio qui donne le volume — un rond de couleur unie, aussi rond soit-il, reste un rond.
 *
 * Les deux halos de l'étape en cours battent à des périodes volontairement différentes
 * (1 900 et 2 600 ms) : ils ne se superposent jamais deux fois de la même façon, et
 * l'appel reste vivant au lieu de clignoter.
 */
export function NoeudChemin({
  etat,
  theme,
  rayon,
  icone,
}: {
  etat: EtatNoeud;
  theme: ThemeParcours;
  rayon: number;
  /** Nom d'icône Ionicons affiché uniquement pour le nœud "actuel" (le type de l'étape à venir). */
  icone: keyof typeof Ionicons.glyphMap;
}) {
  const taille = rayon * 2;
  const couleurs = useCouleurs();
  const mouvementReduit = useMouvementReduit();
  const halo1 = useRef(new Animated.Value(0)).current;
  const halo2 = useRef(new Animated.Value(0)).current;
  const flottement = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (etat !== "actuel" || mouvementReduit) return;
    const onde = (valeur: Animated.Value, duree: number, retard: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(retard),
          Animated.timing(valeur, { toValue: 1, duration: duree, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ])
      );
    // Léger va-et-vient vertical : le nœud « respire », l'œil comprend qu'il est vivant.
    const bob = Animated.loop(
      Animated.sequence([
        Animated.timing(flottement, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(flottement, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    const animations = [onde(halo1, 1900, 0), onde(halo2, 2600, 700), bob];
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [etat, halo1, halo2, flottement, mouvementReduit]);

  if (etat === "verrouille") {
    return (
      <View
        style={{
          width: taille,
          height: taille,
          borderRadius: 999,
          backgroundColor: couleurs.verrouilleFond,
          borderWidth: 2,
          borderColor: couleurs.verrouilleBordure,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="lock-closed" size={rayon * 0.62} color={couleurs.verrouilleIcone} />
      </View>
    );
  }

  const estActuel = etat === "actuel";
  const clair = eclaircir(theme.primary, estActuel ? 0.3 : 0.2);
  const sombre = assombrir(theme.primary, 0.12);

  return (
    <Animated.View
      style={{
        width: taille,
        height: taille,
        transform: [
          { translateY: estActuel ? flottement.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) : 0 },
        ],
      }}
    >
      {estActuel &&
        [halo1, halo2].map((halo, index) => (
          <Animated.View
            key={index}
            pointerEvents="none"
            style={{
              position: "absolute",
              left: -14,
              top: -14,
              width: taille + 28,
              height: taille + 28,
              borderRadius: 999,
              borderWidth: index === 0 ? 3 : 2,
              borderColor: theme.primary,
              opacity: halo.interpolate({ inputRange: [0, 0.6, 1], outputRange: [index === 0 ? 0.5 : 0.3, 0.14, 0] }),
              transform: [{ scale: halo.interpolate({ inputRange: [0, 1], outputRange: [0.88, index === 0 ? 1.3 : 1.45] }) }],
            }}
          />
        ))}

      {/* Lèvre inférieure : donne l'épaisseur du « bouton 3D » */}
      <View
        style={{
          position: "absolute",
          top: estActuel ? 7 : 5,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 999,
          backgroundColor: theme.primaryDark,
        }}
      />

      <View
        style={{
          width: taille,
          height: taille,
          borderRadius: 999,
          overflow: "hidden",
          borderWidth: 2,
          borderColor: avecAlpha("#FFFFFF", 0.28),
          shadowColor: theme.primaryDark,
          shadowOpacity: estActuel ? 0.45 : 0.25,
          shadowRadius: estActuel ? 14 : 8,
          shadowOffset: { width: 0, height: estActuel ? 6 : 3 },
          elevation: estActuel ? 6 : 3,
        }}
      >
        <LinearGradient
          colors={[clair, theme.primary, sombre]}
          locations={[0, 0.52, 1]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}
        >
          {/* Reflet : une calotte claire sur le tiers haut, comme la lumière sur une bille. */}
          <LinearGradient
            pointerEvents="none"
            colors={[avecAlpha("#FFFFFF", 0.4), avecAlpha("#FFFFFF", 0)]}
            style={{
              position: "absolute",
              top: -taille * 0.12,
              left: taille * 0.1,
              width: taille * 0.8,
              height: taille * 0.56,
              borderRadius: 999,
            }}
          />
          {etat === "valide" ? (
            <Ionicons name="checkmark-sharp" size={rayon * 0.9} color="#FFFFFF" />
          ) : (
            <Ionicons name={icone} size={rayon * 0.78} color="#FFFFFF" />
          )}
        </LinearGradient>
      </View>
    </Animated.View>
  );
}
