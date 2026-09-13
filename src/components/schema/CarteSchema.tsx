import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { RAYONS, type ThemeParcours } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";

/**
 * Carte qui encadre un schéma : sur-titre, titre, légende. Un tap n'importe où rejoue
 * l'animation (le graphique est remonté via une clé) — c'est l'affordance "gif" : on
 * peut revoir le mouvement autant de fois qu'on veut.
 */
export function CarteSchema({
  titre,
  legende,
  theme,
  children,
}: {
  titre?: string;
  legende?: string;
  theme: ThemeParcours;
  children: (largeur: number, cle: number) => ReactNode;
}) {
  const styles = useStyles(creerStyles);
  const [largeur, setLargeur] = useState(0);
  const [cle, setCle] = useState(0);

  return (
    <Pressable
      onPress={() => setCle((c) => c + 1)}
      accessibilityRole="button"
      accessibilityLabel={`Schéma${titre ? ` : ${titre}` : ""}. Appuyer pour rejouer l'animation`}
      style={({ pressed }) => [styles.carte, pressed && { opacity: 0.94 }]}
    >
      <View style={styles.entete}>
        <View style={styles.enteteTextes}>
          <Text style={[styles.surtitre, { color: theme.primary }]}>Schéma</Text>
          {titre ? <Text style={styles.titre}>{titre}</Text> : null}
        </View>
        <View style={[styles.rejouer, { backgroundColor: theme.tint }]}>
          <Ionicons name="play" size={11} color={theme.primary} />
        </View>
      </View>

      <View style={styles.zone} onLayout={(e) => setLargeur(e.nativeEvent.layout.width)}>
        {largeur > 0 ? children(largeur, cle) : null}
      </View>

      {legende ? <Text style={styles.legende}>{legende}</Text> : null}
    </Pressable>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    carte: {
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.carte,
      padding: 16,
      gap: 12,
      ...couleurs.ombres.carte,
    },
    entete: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    enteteTextes: {
      flex: 1,
      gap: 3,
    },
    surtitre: {
      ...TYPO.surtitre,
    },
    titre: {
      ...TYPO.titreCarte,
      fontSize: 15.5,
      color: couleurs.texte,
    },
    rejouer: {
      width: 26,
      height: 26,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      paddingLeft: 2,
    },
    zone: {
      alignSelf: "stretch",
    },
    legende: {
      ...TYPO.legende,
      color: couleurs.texteAttenue,
    },
  });
