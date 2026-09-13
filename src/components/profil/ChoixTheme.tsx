import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useProgressStore } from "../../state/progressStore";
import { useCouleurs, useMode, useStyles } from "../../theme/ModeCouleur";
import type { Couleurs, PreferenceTheme } from "../../theme/palettes";
import { PRESSION, RAYONS } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";
import { haptiqueLegere } from "../../utils/haptique";

const OPTIONS: { valeur: PreferenceTheme; label: string; icone: keyof typeof Ionicons.glyphMap }[] = [
  { valeur: "systeme", label: "Système", icone: "phone-portrait-outline" },
  { valeur: "clair", label: "Clair", icone: "sunny-outline" },
  { valeur: "sombre", label: "Sombre", icone: "moon-outline" },
];

/**
 * Choix du thème, en trois positions.
 *
 * « Système » est le défaut et reste en premier : c'est le réglage que la plupart des gens
 * veulent sans le savoir, puisqu'il suit le basculement automatique de leur téléphone le
 * soir. Les deux autres sont là pour ceux qui veulent trancher, et le réglage est
 * enregistré comme le reste de la progression.
 */
export function ChoixTheme() {
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const mode = useMode();
  const preference = useProgressStore((etat) => etat.preferenceTheme);
  const choisirTheme = useProgressStore((etat) => etat.choisirTheme);

  return (
    <View style={styles.bloc}>
      <View style={styles.entete}>
        <Ionicons name="color-palette-outline" size={17} color={couleurs.texteAttenue} />
        <Text style={styles.titre}>Apparence</Text>
      </View>

      <View style={styles.segments}>
        {OPTIONS.map((option) => {
          const actif = preference === option.valeur;
          return (
            <Pressable
              key={option.valeur}
              onPress={() => {
                haptiqueLegere();
                choisirTheme(option.valeur);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: actif }}
              accessibilityLabel={`Thème ${option.label}`}
              style={({ pressed }) => [styles.segment, actif && styles.segmentActif, pressed && PRESSION]}
            >
              <Ionicons
                name={option.icone}
                size={16}
                color={actif ? couleurs.texte : couleurs.texteTertiaire}
              />
              <Text style={[styles.segmentTexte, actif && styles.segmentTexteActif]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.detail}>
        {preference === "systeme"
          ? `Suit ton téléphone, actuellement en ${mode === "sombre" ? "sombre" : "clair"}.`
          : "Ce réglage ne change rien à ta progression."}
      </Text>
    </View>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    bloc: {
      gap: 10,
    },
    entete: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    titre: {
      ...TYPO.titreCarte,
      color: couleurs.texte,
    },
    segments: {
      flexDirection: "row",
      gap: 4,
      backgroundColor: couleurs.surfaceAtone,
      borderRadius: RAYONS.pilule,
      padding: 4,
    },
    segment: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 9,
      borderRadius: RAYONS.pilule,
    },
    // La position retenue est une pastille pleine posée sur la piste : c'est le seul
    // repère qui reste lisible dans les deux modes sans changer de couleur d'accent.
    segmentActif: {
      backgroundColor: couleurs.surface,
      ...couleurs.ombres.carte,
    },
    segmentTexte: {
      ...TYPO.legende,
      color: couleurs.texteTertiaire,
    },
    segmentTexteActif: {
      color: couleurs.texte,
    },
    detail: {
      ...TYPO.legende,
      fontSize: 11.5,
      color: couleurs.texteTertiaire,
    },
  });
