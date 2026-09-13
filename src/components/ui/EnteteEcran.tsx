import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { PRESSION, RAYONS, type TeinteEcran } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";
import { Apparition } from "./Apparition";
import { MotifPoints } from "./MotifPoints";
import { Reflet } from "./Reflet";

type NomIcone = keyof typeof Ionicons.glyphMap;

export interface ActionEntete {
  icone: NomIcone;
  label: string;
  onPress: () => void;
}

/**
 * Bandeau des écrans qui ne sont pas un chemin : outils, glossaire, profil, bilan,
 * révision, mes chiffres, à propos.
 *
 * Il remplace les en-têtes natifs. Une barre système claire posée au-dessus d'un contenu
 * coloré coupe l'écran en deux et fait basculer l'application du côté « application
 * système » ; un bandeau qui descend jusqu'au contenu, avec son propre retour, la fait
 * ressembler à ce qu'elle est. C'est aussi ce qui donne à chaque écran une couleur propre
 * tout en gardant une seule grammaire : dégradé en diagonale, trame de points, reflet qui
 * passe de loin en loin, grande icône en filigrane.
 *
 * Le `children` sert à ce qui doit vivre DANS le bandeau — un champ de recherche, une
 * barre d'avancement — plutôt qu'en dessous : cela évite que chaque écran réinvente sa
 * zone de contrôles.
 */
export function EnteteEcran({
  surtitre,
  titre,
  icone,
  teinte,
  insetHaut,
  onRetour,
  actions = [],
  children,
}: {
  surtitre: string;
  titre: string;
  /** Icône en filigrane, très pâle, dans le coin bas droit. */
  icone: NomIcone;
  teinte: TeinteEcran;
  insetHaut: number;
  onRetour?: () => void;
  actions?: ActionEntete[];
  children?: ReactNode;
}) {
  return (
    <LinearGradient
      colors={[teinte.clair, teinte.moyen, teinte.sombre]}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.bandeau, { paddingTop: insetHaut + 14 }]}
    >
      <MotifPoints couleur="#FFFFFF" opacite={0.13} pas={20} />
      <Reflet />
      <View style={styles.filigrane} pointerEvents="none">
        <Ionicons name={icone} size={150} color="rgba(255,255,255,0.09)" />
      </View>

      {(onRetour || actions.length > 0) && (
        <View style={styles.ligneHaut}>
          {onRetour && (
            <Pressable
              onPress={onRetour}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              hitSlop={8}
              style={({ pressed }) => [styles.boutonRond, pressed && PRESSION]}
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>
          )}
          <View style={styles.espace} />
          {actions.map((action) => (
            <Pressable
              key={action.label}
              onPress={action.onPress}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              hitSlop={6}
              style={({ pressed }) => [styles.boutonRond, pressed && PRESSION]}
            >
              <Ionicons name={action.icone} size={19} color="#FFFFFF" />
            </Pressable>
          ))}
        </View>
      )}

      <Apparition>
        <Text style={styles.surtitre}>{surtitre}</Text>
        <Text style={styles.titre} accessibilityRole="header">
          {titre}
        </Text>
      </Apparition>

      {children && <Apparition delai={120}>{children}</Apparition>}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bandeau: {
    paddingHorizontal: 22,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
  },
  filigrane: {
    position: "absolute",
    right: -28,
    bottom: -38,
  },
  ligneHaut: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  espace: {
    flex: 1,
  },
  boutonRond: {
    width: 38,
    height: 38,
    borderRadius: RAYONS.pilule,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  surtitre: {
    ...TYPO.surtitre,
    color: "rgba(255,255,255,0.72)",
  },
  titre: {
    ...TYPO.titreEcran,
    fontSize: 26,
    lineHeight: 31,
    marginTop: 6,
    color: "#FFFFFF",
    paddingRight: 24,
  },
});
