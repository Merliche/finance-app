import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useProgressStore, useProgressionHydratee } from "../src/state/progressStore";
import { useCouleurs, useStyles } from "../src/theme/ModeCouleur";
import type { Couleurs } from "../src/theme/palettes";

// Point d'entrée : l'écran de bienvenue au tout premier lancement, sinon "/parcours",
// la map — elle affiche le chemin de l'intro et, une fois celle-ci terminée, la fourche
// vers les 3 voies.
export default function Index() {
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const hydratee = useProgressionHydratee();
  const accueilVu = useProgressStore((state) => state.accueilVu);

  if (!hydratee) {
    return (
      <View style={styles.chargement}>
        <ActivityIndicator color={couleurs.texteAttenue} />
      </View>
    );
  }

  return <Redirect href={accueilVu ? "/parcours" : "/bienvenue"} />;
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    chargement: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: couleurs.fond,
    },
  });
