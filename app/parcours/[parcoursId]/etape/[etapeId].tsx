import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import type { ResultatEtape } from "../../../../src/domain/parcours/progress";
import { Exemple } from "../../../../src/components/etape/Exemple";
import { Lecon } from "../../../../src/components/etape/Lecon";
import { Quiz } from "../../../../src/components/etape/Quiz";
import { Situation } from "../../../../src/components/etape/Situation";
import { useParcours } from "../../../../src/hooks/useParcours";
import { useProgressStore } from "../../../../src/state/progressStore";

export default function EcranEtape() {
  const { parcoursId, etapeId } = useLocalSearchParams<{ parcoursId: string; etapeId: string }>();
  const etat = useParcours(parcoursId);
  const completerEtape = useProgressStore((state) => state.completerEtape);
  const router = useRouter();

  if (etat.statut === "chargement") {
    return (
      <View style={styles.centre}>
        <ActivityIndicator />
      </View>
    );
  }

  if (etat.statut === "erreur") {
    return (
      <View style={styles.centre}>
        <Text style={styles.messageErreur}>Contenu indisponible : {etat.message}</Text>
      </View>
    );
  }

  const { parcours } = etat;
  const etapesTriees = parcours.etapes.slice().sort((a, b) => a.ordre - b.ordre);
  const etapeIndex = etapesTriees.findIndex((e) => e.id === etapeId);
  const etape = etapesTriees[etapeIndex];

  if (!etape) {
    return (
      <View style={styles.centre}>
        <Text style={styles.messageErreur}>Étape introuvable.</Text>
      </View>
    );
  }

  function onTerminer(resultat: ResultatEtape) {
    completerEtape(parcours, etape.id, resultat);

    const etapeSuivante = etapesTriees[etapeIndex + 1];
    if (etapeSuivante) {
      router.replace({
        pathname: "/parcours/[parcoursId]/etape/[etapeId]",
        params: { parcoursId: parcours.id, etapeId: etapeSuivante.id },
      });
    } else {
      router.replace({ pathname: "/parcours/[parcoursId]", params: { parcoursId: parcours.id } });
    }
  }

  return (
    <View style={styles.conteneur}>
      <Text style={styles.titre}>{etape.titre}</Text>
      {etape.type === "lecon" && <Lecon etape={etape} onTerminer={onTerminer} />}
      {etape.type === "quiz" && <Quiz etape={etape} onTerminer={onTerminer} />}
      {etape.type === "exemple" && <Exemple etape={etape} onTerminer={onTerminer} />}
      {etape.type === "situation" && <Situation etape={etape} onTerminer={onTerminer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
  },
  titre: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  centre: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  messageErreur: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});
