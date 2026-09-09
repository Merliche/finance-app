import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { EtapeQuiz } from "../../domain/parcours/types";
import type { ResultatEtape } from "../../domain/parcours/progress";
import { BoutonContinuer } from "./BoutonContinuer";
import { ContenuBlocs } from "./ContenuBlocs";

export function Quiz({
  etape,
  onTerminer,
}: {
  etape: EtapeQuiz;
  onTerminer: (resultat: ResultatEtape) => void;
}) {
  const { questions, seuilReussite } = etape.quiz;
  const [reponses, setReponses] = useState<Record<string, number>>({});
  const [corrige, setCorrige] = useState(false);

  const toutesRepondues = questions.every((question) => reponses[question.id] !== undefined);

  const nombreCorrectes = questions.filter(
    (question) => reponses[question.id] === question.bonneReponseIndex
  ).length;
  const score = Math.round((nombreCorrectes / questions.length) * 100);
  const reussi = score >= seuilReussite;

  function choisir(questionId: string, choixIndex: number) {
    if (corrige) return;
    setReponses((precedent) => ({ ...precedent, [questionId]: choixIndex }));
  }

  function valider() {
    setCorrige(true);
  }

  function reessayer() {
    setReponses({});
    setCorrige(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.conteneur}>
      <ContenuBlocs blocs={etape.contenu} />

      {questions.map((question) => (
        <View key={question.id} style={styles.question}>
          <Text style={styles.enonce}>{question.question}</Text>
          {question.choix.map((choix, index) => {
            const selectionne = reponses[question.id] === index;
            const estCorrecte = index === question.bonneReponseIndex;
            const styleChoix = [
              styles.choix,
              selectionne && styles.choixSelectionne,
              corrige && estCorrecte && styles.choixCorrect,
              corrige && selectionne && !estCorrecte && styles.choixIncorrect,
            ];
            return (
              <Pressable key={index} style={styleChoix} onPress={() => choisir(question.id, index)}>
                <Text style={styles.choixTexte}>{choix}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}

      {!corrige && (
        <BoutonContinuer label="Valider" disabled={!toutesRepondues} onPress={valider} />
      )}

      {corrige && (
        <View style={styles.resultat}>
          <Text style={reussi ? styles.resultatReussi : styles.resultatEchec}>
            {reussi
              ? `Bien joué, ${score}% de bonnes réponses !`
              : `${score}% — il faut au moins ${seuilReussite}% pour continuer.`}
          </Text>
          {reussi ? (
            <BoutonContinuer onPress={() => onTerminer({ type: "quiz", score })} />
          ) : (
            <BoutonContinuer label="Réessayer" onPress={reessayer} />
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    padding: 20,
    gap: 24,
  },
  question: {
    gap: 10,
  },
  enonce: {
    fontSize: 16,
    fontWeight: "600",
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
  choixCorrect: {
    borderColor: "#2f9e44",
    backgroundColor: "#ebfbee",
  },
  choixIncorrect: {
    borderColor: "#e03131",
    backgroundColor: "#fff5f5",
  },
  choixTexte: {
    fontSize: 14,
    color: "#1a1a1a",
  },
  resultat: {
    gap: 12,
  },
  resultatReussi: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2f9e44",
    textAlign: "center",
  },
  resultatEchec: {
    fontSize: 15,
    fontWeight: "600",
    color: "#e03131",
    textAlign: "center",
  },
});
