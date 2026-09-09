import { Link, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { parcoursEstTermine, voieEstDeverrouillee } from "../../../src/domain/parcours/progress";
import { useParcours } from "../../../src/hooks/useParcours";
import { useProgressStore } from "../../../src/state/progressStore";

export default function SommaireParcours() {
  const { parcoursId } = useLocalSearchParams<{ parcoursId: string }>();
  const etat = useParcours(parcoursId);
  // Sélecteurs séparés par champ primitif, pas un objet littéral : un sélecteur
  // Zustand qui retourne une nouvelle référence à chaque rendu fait boucler
  // useSyncExternalStore ("The result of getSnapshot should be cached").
  const parcoursProgression = useProgressStore((state) => state.parcours);
  const emailCapture = useProgressStore((state) => state.emailCapture);
  const progressionGlobale = { parcours: parcoursProgression, emailCapture };

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
  const deverrouillee = voieEstDeverrouillee(parcours, progressionGlobale);

  if (!deverrouillee) {
    return (
      <View style={styles.centre}>
        <Text style={styles.messageErreur}>
          Termine d'abord le parcours d'introduction pour débloquer cette voie.
        </Text>
      </View>
    );
  }

  const progression = progressionGlobale.parcours[parcours.id];
  const etapesCompletees = progression?.etapesCompletees ?? [];
  const termine = progression ? parcoursEstTermine(parcours, progression) : false;

  return (
    <ScrollView contentContainerStyle={styles.conteneur}>
      <Text style={styles.titre}>{parcours.titre}</Text>
      <Text style={styles.description}>{parcours.description}</Text>

      <View style={styles.listeEtapes}>
        {parcours.etapes
          .slice()
          .sort((a, b) => a.ordre - b.ordre)
          .map((etape, index) => {
            const completee = etapesCompletees.includes(etape.id);
            return (
              <Link
                key={etape.id}
                href={{
                  pathname: "/parcours/[parcoursId]/etape/[etapeId]",
                  params: { parcoursId: parcours.id, etapeId: etape.id },
                }}
                asChild
              >
                <Pressable style={styles.etapeLigne}>
                  <Text style={styles.etapePuce}>{completee ? "✅" : `${index + 1}`}</Text>
                  <Text style={styles.etapeTitre}>{etape.titre}</Text>
                </Pressable>
              </Link>
            );
          })}
      </View>

      {termine && parcours.recompense && (
        <Link
          href={{ pathname: "/parcours/[parcoursId]/reward", params: { parcoursId: parcours.id } }}
          asChild
        >
          <Pressable style={styles.boutonRecompense}>
            <Text style={styles.boutonRecompenseTexte}>Voir ta récompense 🎁</Text>
          </Pressable>
        </Link>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    padding: 20,
    gap: 20,
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
  titre: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  description: {
    fontSize: 14,
    color: "#666",
  },
  listeEtapes: {
    gap: 10,
  },
  etapeLigne: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#dfe3eb",
    borderRadius: 10,
    padding: 14,
  },
  etapePuce: {
    fontSize: 15,
    width: 24,
    textAlign: "center",
  },
  etapeTitre: {
    fontSize: 15,
    color: "#1a1a1a",
    flex: 1,
  },
  boutonRecompense: {
    backgroundColor: "#ffb703",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  boutonRecompenseTexte: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
});
