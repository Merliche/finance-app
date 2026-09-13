import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import type { TypeElementLateral } from "../../domain/elementsLateraux/types";
import { useMouvementReduit } from "../../hooks/useMouvementReduit";
import { assombrir, avecAlpha, eclaircir, melanger } from "../../theme/couleurs";
import { useCouleurs, useMode } from "../../theme/ModeCouleur";
import { CONFIG_ELEMENT_LATERAL } from "./configElementsLateraux";

/**
 * Rond latéral (calculateur, comparateur, « saviez-vous », glossaire, badge) posé dans la
 * marge du chemin. Il doit se lire comme un bonus à ramasser, pas comme une étape : plus
 * petit qu'un nœud, clair au lieu d'être plein, et coiffé d'un anneau d'aura de sa
 * couleur de catégorie qui le détache du fond sans l'alourdir.
 *
 * Une fois débloqué, il flotte très lentement. Chaque rond a sa propre phase, tirée de
 * son identifiant : deux ronds voisins ne montent jamais ensemble, sinon toute la marge
 * respirerait en chœur, ce qui se remarque immédiatement et devient pénible.
 *
 * Verrouillé, il ne bouge pas et perd sa couleur : rien à ramasser pour l'instant.
 */
const AMPLITUDE = 3.5;
const DUREE_FLOTTEMENT = 2600;

export function RondElementLateral({
  type,
  rayon,
  deverrouille,
  phase = 0,
}: {
  type: TypeElementLateral;
  rayon: number;
  deverrouille: boolean;
  /** Décalage du flottement, entre 0 et 1 — évite que tous les ronds montent ensemble. */
  phase?: number;
}) {
  const taille = rayon * 2;
  const couleurs = useCouleurs();
  const mode = useMode();
  const mouvementReduit = useMouvementReduit();
  const flottement = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!deverrouille || mouvementReduit) return;
    const aller = (vers: number) =>
      Animated.timing(flottement, {
        toValue: vers,
        duration: DUREE_FLOTTEMENT,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    const boucle = Animated.loop(Animated.sequence([aller(1), aller(0)]));
    // Le retard initial décale la phase sans changer la période.
    const depart = setTimeout(() => boucle.start(), Math.round(phase * DUREE_FLOTTEMENT * 2));
    return () => {
      clearTimeout(depart);
      boucle.stop();
    };
  }, [deverrouille, flottement, phase, mouvementReduit]);

  if (!deverrouille) {
    return (
      <View
        style={{
          width: taille,
          height: taille,
          borderRadius: 999,
          backgroundColor: couleurs.verrouilleFond,
          borderWidth: 1.5,
          borderColor: couleurs.verrouilleBordure,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="lock-closed" size={rayon * 0.62} color={couleurs.verrouilleIcone} />
      </View>
    );
  }

  const config = CONFIG_ELEMENT_LATERAL[type];

  return (
    <Animated.View
      style={{
        width: taille,
        height: taille,
        alignItems: "center",
        justifyContent: "center",
        transform: [
          { translateY: flottement.interpolate({ inputRange: [0, 1], outputRange: [AMPLITUDE, -AMPLITUDE] }) },
        ],
      }}
    >
      {/* Anneau d'aura : un large liseré très transparent qui fait respirer le rond sur le
          fond du chemin, là où une simple ombre portée se perd sur les nappes de couleur. */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: taille + 14,
          height: taille + 14,
          borderRadius: 999,
          borderWidth: 7,
          borderColor: avecAlpha(config.couleur, 0.13),
        }}
      />

      <View
        style={{
          width: taille,
          height: taille,
          borderRadius: 999,
          overflow: "hidden",
          borderWidth: 2,
          borderColor: config.couleur,
          shadowColor: config.couleur,
          shadowOpacity: 0.4,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}
      >
        {/* Surface au sommet, teinté en bas : le rond reste plus sourd que les nœuds du
            chemin, qu'il ne doit pas concurrencer, mais cesse d'être une pastille plate. */}
        <LinearGradient
          // Le dégradé part TOUJOURS de la surface du moment, jamais du blanc : en mode
          // sombre, un blanc au centre du rond ferait une lucarne au milieu du chemin.
          colors={[
            couleurs.surface,
            melanger(couleurs.surface, config.couleur, 0.22),
            melanger(couleurs.surface, config.couleur, 0.5),
          ]}
          locations={[0, 0.58, 1]}
          start={{ x: 0.25, y: 0 }}
          end={{ x: 0.75, y: 1 }}
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons
            name={config.icone}
            size={rayon * 0.88}
            color={mode === "sombre" ? eclaircir(config.couleur, 0.32) : assombrir(config.couleur, 0.12)}
          />
        </LinearGradient>
      </View>
    </Animated.View>
  );
}
