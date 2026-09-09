import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { EtapeSituation } from "../../domain/parcours/types";
import type { ResultatEtape } from "../../domain/parcours/progress";
import { BoutonContinuer } from "./BoutonContinuer";
import { ContenuBlocs } from "./ContenuBlocs";

const LABEL_QUALITE: Record<string, string> = {
  recommande: "Recommandé",
  acceptable: "Acceptable",
  deconseille: "Déconseillé",
};

export function Situation({
  etape,
  onTerminer,
}: {
  etape: EtapeSituation;
  onTerminer: (resultat: ResultatEtape) => void;
}) {
  const { situation } = etape;
  const [choixSelectionneId, setChoixSelectionneId] = useState<string | undefined>();

  const choixSelectionne = situation.choix.find((choix) => choix.id === choixSelectionneId);

  return (
    <ScrollView contentContainerStyle={styles.conteneur}>
      <ContenuBlocs blocs={etape.contenu} />

      <View style={styles.contexte}>
        <Text style={styles.contexteTexte}>{situation.contexte}</Text>
      </View>

      {situation.choix.map((choix) => {
        const selectionne = choix.id === choixSelectionneId;
        return (
          <Pressable
            key={choix.id}
            style={[styles.choix, selectionne && styles.choixSelectionne]}
            onPress={() => setChoixSelectionneId(choix.id)}
          >
            <Text style={styles.choixTexte}>{choix.texte}</Text>
          </Pressable>
        );
      })}

      {choixSelectionne && (
        <View style={styles.feedback}>
          <Text style={styles.feedbackQualite}>{LABEL_QUALITE[choixSelectionne.qualite]}</Text>
          <Text style={styles.feedbackTexte}>{choixSelectionne.feedback}</Text>
        </View>
      )}

      <BoutonContinuer
        disabled={!choixSelectionneId}
        onPress={() => onTerminer({ type: "situation", choixSelectionneId: choixSelectionneId! })}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    padding: 20,
    gap: 20,
  },
  contexte: {
    backgroundColor: "#f2f4f7",
    borderRadius: 10,
    padding: 14,
  },
  contexteTexte: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: "italic",
    color: "#1a1a1a",
  },
  choix: {
    borderWidth: 1,
    borderColor: "#dfe3eb",
    borderRadius: 10,
    padding: 12,
  },
  choixSelectionne: {
    borderColor: "#4f7cff",
    backgroundColor: "#eef2ff",
  },
  choixTexte: {
    fontSize: 14,
    color: "#1a1a1a",
  },
  feedback: {
    backgroundColor: "#fff9db",
    borderRadius: 10,
    padding: 14,
    gap: 6,
  },
  feedbackQualite: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#5c4b00",
  },
  feedbackTexte: {
    fontSize: 14,
    lineHeight: 20,
    color: "#1a1a1a",
  },
});
