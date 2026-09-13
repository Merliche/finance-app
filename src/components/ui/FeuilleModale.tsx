import { useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  type DimensionValue,
} from "react-native";

import { useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { RAYONS } from "../../theme/parcoursTheme";
import { haptiqueLegere } from "../../utils/haptique";

/**
 * Feuille qui monte du bas de l'écran, et qu'on referme en tirant la barre du haut vers
 * le bas — le geste attendu partout ailleurs, et le seul qui tombe sous le pouce quand la
 * feuille occupe la moitié de l'écran. Le fond reste tapable et la barre aussi, pour que
 * le geste ne soit jamais le seul moyen de sortir (lecteur d'écran compris).
 *
 * Le geste n'est capté que sur la barre, pas sur toute la feuille : le contenu défile
 * souvent, et un glissement qui déplacerait à la fois la liste et la feuille rend les
 * deux inutilisables.
 *
 * On ne rejoue pas de sortie animée : franchi le seuil, on referme, et l'animation de
 * sortie du `Modal` prend le relais depuis la position atteinte. Deux animations qui se
 * superposeraient donneraient un à-coup.
 */
/** Distance après laquelle on lâche la feuille, ou vitesse suffisante pour un geste vif. */
const SEUIL_FERMETURE = 90;
const VITESSE_FERMETURE = 0.75;

export function FeuilleModale({
  visible,
  onFermer,
  hauteurMax = "84%",
  children,
}: {
  visible: boolean;
  onFermer: () => void;
  hauteurMax?: DimensionValue;
  children: ReactNode;
}) {
  const styles = useStyles(creerStyles);
  const glissement = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Une feuille rouverte doit repartir en place : sans cette remise à zéro, elle
    // réapparaîtrait à la hauteur où le geste précédent l'avait laissée.
    if (visible) glissement.setValue(0);
  }, [visible, glissement]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // On ne prend la main qu'à partir d'un vrai mouvement vers le bas : un simple
        // appui doit rester un appui, et un geste horizontal ne concerne pas la feuille.
        onMoveShouldSetPanResponder: (_evenement, geste) =>
          geste.dy > 4 && Math.abs(geste.dy) > Math.abs(geste.dx),
        onPanResponderMove: (_evenement, geste) => {
          // Vers le haut, la feuille ne bouge pas : elle est déjà à sa place.
          glissement.setValue(Math.max(0, geste.dy));
        },
        onPanResponderRelease: (_evenement, geste) => {
          if (geste.dy > SEUIL_FERMETURE || geste.vy > VITESSE_FERMETURE) {
            haptiqueLegere();
            onFermer();
            return;
          }
          Animated.spring(glissement, {
            toValue: 0,
            useNativeDriver: true,
            speed: 18,
            bounciness: 6,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(glissement, { toValue: 0, useNativeDriver: true, speed: 18 }).start();
        },
      }),
    [glissement, onFermer]
  );

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onFermer}>
      <Pressable style={styles.fond} onPress={onFermer} accessibilityRole="button" accessibilityLabel="Fermer" />

      <Animated.View
        style={[styles.feuille, { maxHeight: hauteurMax, transform: [{ translateY: glissement }] }]}
      >
        <Pressable
          {...panResponder.panHandlers}
          onPress={onFermer}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          accessibilityHint="Tire vers le bas pour refermer"
          style={styles.zonePoignee}
        >
          <View style={styles.poignee} />
        </Pressable>

        {children}
      </Animated.View>
    </Modal>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    fond: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(16,18,22,0.45)",
    },
    feuille: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: couleurs.surface,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      ...couleurs.ombres.modale,
    },
    // Large et haute bien au-delà du trait visible : c'est la zone qu'on attrape, et une
    // barre de 4 px de haut serait impossible à saisir.
    zonePoignee: {
      paddingTop: 10,
      paddingBottom: 8,
      alignItems: "center",
    },
    poignee: {
      width: 44,
      height: 5,
      borderRadius: RAYONS.pilule,
      backgroundColor: couleurs.verrouilleBordure,
    },
  });
