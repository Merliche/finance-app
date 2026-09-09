import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useProgressStore, useProgressionHydratee } from "../src/state/progressStore";

// Point d'entrée : redirige vers le parcours "intro" tant qu'il n'est pas terminé,
// sinon vers le choix des voies (voir PROJECT.md §4).
export default function Index() {
  const hydratee = useProgressionHydratee();
  const progressionIntro = useProgressStore((state) => state.parcours["intro"]);

  if (!hydratee) {
    return (
      <View style={styles.chargement}>
        <ActivityIndicator />
      </View>
    );
  }

  if (progressionIntro?.statut === "termine") {
    return <Redirect href="/parcours" />;
  }

  return <Redirect href="/parcours/intro" />;
}

const styles = StyleSheet.create({
  chargement: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
