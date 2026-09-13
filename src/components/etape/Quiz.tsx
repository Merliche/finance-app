import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { EtapeQuiz } from "../../domain/parcours/types";
import type { ResultatEtape } from "../../domain/parcours/progress";
import { useProgressStore } from "../../state/progressStore";
import { useCouleurs, useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { RAYONS, type ThemeParcours } from "../../theme/parcoursTheme";
import { PLAFOND_PASTILLE, TYPO } from "../../theme/typographie";
import { haptiqueErreur, haptiqueLegere, haptiqueSucces } from "../../utils/haptique";
import { Apparition } from "../ui/Apparition";
import { Reaction } from "../ui/Reaction";
import { useCompteur } from "../ui/useCompteur";
import { BoutonContinuer } from "./BoutonContinuer";
import { ContenuBlocs } from "./ContenuBlocs";

const LETTRES = ["A", "B", "C", "D", "E"];

export function Quiz({
  etape,
  parcoursId,
  onTerminer,
  theme,
}: {
  etape: EtapeQuiz;
  parcoursId: string;
  onTerminer: (resultat: ResultatEtape) => void;
  theme: ThemeParcours;
}) {
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const { questions, seuilReussite } = etape.quiz;
  const enregistrerReponses = useProgressStore((state) => state.enregistrerReponses);
  const scrollRef = useRef<ScrollView>(null);
  const [reponses, setReponses] = useState<Record<string, number>>({});
  const [corrige, setCorrige] = useState(false);

  const toutesRepondues = questions.every((question) => reponses[question.id] !== undefined);
  const nombreCorrectes = questions.filter(
    (question) => reponses[question.id] === question.bonneReponseIndex
  ).length;
  const score = Math.round((nombreCorrectes / questions.length) * 100);
  const reussi = score >= seuilReussite;
  const scoreAffiche = useCompteur(corrige ? score : 0);

  function choisir(questionId: string, choixIndex: number) {
    if (corrige) return;
    haptiqueLegere();
    setReponses((precedent) => ({ ...precedent, [questionId]: choixIndex }));
  }

  function valider() {
    setCorrige(true);
    // Ce qui a été manqué alimente l'écran Révision ; ce qui vient d'être réussi en sort.
    enregistrerReponses(
      parcoursId,
      etape.id,
      questions.map((question) => ({
        questionId: question.id,
        correcte: reponses[question.id] === question.bonneReponseIndex,
      }))
    );
    if (reussi) haptiqueSucces();
    else haptiqueErreur();
    // La carte de score apparaît en bas : on y amène l'utilisateur, sinon il peut ne pas
    // voir que quelque chose s'est passé.
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={styles.conteneur} showsVerticalScrollIndicator={false}>
      <ContenuBlocs blocs={etape.contenu} theme={theme} />

      {questions.map((question, indexQuestion) => (
        <Apparition key={question.id} delai={200 + indexQuestion * 120} style={styles.question}>
          <Text style={styles.numeroQuestion}>
            Question {indexQuestion + 1} / {questions.length}
          </Text>
          <Text style={styles.enonce}>{question.question}</Text>

          {question.choix.map((choix, index) => {
            const selectionne = reponses[question.id] === index;
            const estCorrecte = index === question.bonneReponseIndex;
            const montreCorrecte = corrige && estCorrecte;
            const montreErreur = corrige && selectionne && !estCorrecte;

            const couleurBordure = montreCorrecte
              ? couleurs.succes
              : montreErreur
                ? couleurs.erreur
                : selectionne
                  ? theme.primary
                  : "transparent";
            const couleurFond = montreCorrecte
              ? couleurs.succesFond
              : montreErreur
                ? couleurs.erreurFond
                : selectionne
                  ? theme.tint
                  : couleurs.surface;

            return (
              // La bonne réponse fait un petit bond, la mauvaise réponse choisie se
              // secoue : l'œil est conduit à SA réponse, au lieu de balayer une grille
              // qui se colore d'un coup.
              <Reaction
                key={index}
                type={montreCorrecte ? "succes" : montreErreur ? "erreur" : null}
              >
              <Pressable
                disabled={corrige}
                style={({ pressed }) => [
                  styles.choix,
                  { borderColor: couleurBordure, backgroundColor: couleurFond },
                  pressed && !corrige && { opacity: 0.85 },
                ]}
                onPress={() => choisir(question.id, index)}
              >
                <View
                  style={[
                    styles.lettre,
                    {
                      backgroundColor: selectionne || montreCorrecte ? couleurBordure : couleurs.surfaceAtone,
                    },
                  ]}
                >
                  {montreCorrecte ? (
                    <Ionicons name="checkmark-sharp" size={15} color="#FFFFFF" />
                  ) : montreErreur ? (
                    <Ionicons name="close-sharp" size={15} color="#FFFFFF" />
                  ) : (
                    <Text
                      maxFontSizeMultiplier={PLAFOND_PASTILLE}
                      style={[
                        styles.lettreTexte,
                        { color: selectionne ? "#FFFFFF" : couleurs.texteAttenue },
                      ]}
                    >
                      {LETTRES[index] ?? index + 1}
                    </Text>
                  )}
                </View>
                <Text style={styles.choixTexte}>{choix}</Text>
              </Pressable>
              </Reaction>
            );
          })}
        </Apparition>
      ))}

      {!corrige && (
        <BoutonContinuer
          theme={theme}
          label="Valider mes réponses"
          disabled={!toutesRepondues}
          onPress={valider}
        />
      )}

      {corrige && (
        <Apparition mode="pop" style={styles.resultat}>
          <View
            style={[
              styles.carteResultat,
              {
                backgroundColor: reussi ? couleurs.succesFond : couleurs.erreurFond,
              },
            ]}
          >
            <Ionicons
              name={reussi ? "trophy" : "refresh-circle"}
              size={30}
              color={reussi ? couleurs.succes : couleurs.erreur}
            />
            <Text
              style={[
                styles.scoreTexte,
                { color: reussi ? couleurs.succes : couleurs.erreur },
              ]}
            >
              {scoreAffiche}%
            </Text>
            <Text style={styles.messageResultat}>
              {reussi
                ? `Bien joué — ${nombreCorrectes} bonne${nombreCorrectes > 1 ? "s" : ""} réponse${nombreCorrectes > 1 ? "s" : ""} sur ${questions.length}.`
                : `Il faut au moins ${seuilReussite} % pour continuer. Relis les bonnes réponses ci-dessus, puis réessaie.`}
            </Text>
          </View>

          {reussi ? (
            <BoutonContinuer theme={theme} onPress={() => onTerminer({ type: "quiz", score })} />
          ) : (
            <BoutonContinuer
              theme={theme}
              label="Réessayer"
              onPress={() => {
                setReponses({});
                setCorrige(false);
              }}
            />
          )}
        </Apparition>
      )}
    </ScrollView>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    conteneur: {
      padding: 22,
      paddingBottom: 40,
      gap: 26,
    },
    question: {
      gap: 11,
    },
    numeroQuestion: {
      ...TYPO.surtitre,
      color: couleurs.texteTertiaire,
    },
    enonce: {
      ...TYPO.titreCarte,
      fontSize: 16.5,
      lineHeight: 23,
      color: couleurs.texte,
      marginBottom: 2,
    },
    choix: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 2,
      borderRadius: RAYONS.grand,
      paddingVertical: 14,
      paddingHorizontal: 14,
      ...couleurs.ombres.carte,
    },
    lettre: {
      width: 28,
      height: 28,
      borderRadius: RAYONS.petit,
      alignItems: "center",
      justifyContent: "center",
    },
    lettreTexte: {
      ...TYPO.legende,
      fontSize: 12,
    },
    choixTexte: {
      ...TYPO.corpsMoyen,
      flex: 1,
      fontSize: 14.5,
      color: couleurs.texte,
    },
    resultat: {
      gap: 16,
    },
    carteResultat: {
      borderRadius: RAYONS.carte,
      padding: 22,
      alignItems: "center",
      gap: 7,
    },
    scoreTexte: {
      ...TYPO.chiffre,
      fontSize: 34,
    },
    messageResultat: {
      ...TYPO.corpsMoyen,
      fontSize: 14,
      textAlign: "center",
      color: couleurs.texte,
    },
  });
