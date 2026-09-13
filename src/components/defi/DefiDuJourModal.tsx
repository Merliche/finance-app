import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { DefiDuJour } from "../../domain/parcours/defi";
import { XP_PAR_DEFI } from "../../domain/parcours/defi";
import { useCouleurs, useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { PRESSION, RAYONS, type ThemeParcours } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";
import { haptiqueErreur, haptiqueLegere, haptiqueSucces } from "../../utils/haptique";
import { Apparition } from "../ui/Apparition";

const LETTRES = ["A", "B", "C", "D", "E"];

/**
 * Le défi du jour : une question, un seul essai, une petite prime d'XP. Si le défi a
 * déjà été joué aujourd'hui, on montre le résultat sans permettre de rejouer.
 */
export function DefiDuJourModal({
  defi,
  dejaJoue,
  dejaReussi,
  libelleParcours,
  theme,
  onRepondre,
  onFermer,
}: {
  defi: DefiDuJour | null;
  dejaJoue: boolean;
  dejaReussi: boolean;
  libelleParcours: string;
  theme: ThemeParcours;
  onRepondre: (reussi: boolean) => void;
  onFermer: () => void;
}) {
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const [choix, setChoix] = useState<number | undefined>();
  const [valide, setValide] = useState(dejaJoue);

  if (!defi) return null;
  const { question } = defi;
  const reussi = valide && (dejaJoue ? dejaReussi : choix === question.bonneReponseIndex);

  function valider() {
    if (choix === undefined || valide) return;
    const bon = choix === question.bonneReponseIndex;
    setValide(true);
    if (bon) haptiqueSucces();
    else haptiqueErreur();
    onRepondre(bon);
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={styles.fond} onPress={onFermer} accessibilityRole="button" accessibilityLabel="Fermer" />
      <View style={styles.centre} pointerEvents="box-none">
        <Apparition mode="pop" style={styles.carte}>
          <View style={styles.entete}>
            <View style={[styles.eclair, { backgroundColor: theme.primary }]}>
              <Ionicons name="flash" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.enteteTextes}>
              <Text style={[styles.surtitre, { color: theme.primary }]}>Défi du jour</Text>
              <Text style={styles.origine}>
                {defi.estUneRevision ? "Une question que tu avais manquée" : libelleParcours} · +{XP_PAR_DEFI} XP si tu trouves
              </Text>
            </View>
            <Pressable onPress={onFermer} hitSlop={10} accessibilityRole="button" accessibilityLabel="Fermer">
              <Ionicons name="close" size={22} color={couleurs.texteTertiaire} />
            </Pressable>
          </View>

          <Text style={styles.question}>{question.question}</Text>

          <View style={styles.choixListe}>
            {question.choix.map((texte, index) => {
              const selectionne = choix === index;
              const estBonne = index === question.bonneReponseIndex;
              const montreBonne = valide && estBonne;
              const montreErreur = valide && selectionne && !estBonne;
              const couleur = montreBonne ? couleurs.succes : montreErreur ? couleurs.erreur : selectionne ? theme.primary : "transparent";
              const fond = montreBonne ? couleurs.succesFond : montreErreur ? couleurs.erreurFond : selectionne ? theme.tint : couleurs.surfaceAtone;
              return (
                <Pressable
                  key={index}
                  disabled={valide}
                  onPress={() => {
                    haptiqueLegere();
                    setChoix(index);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectionne }}
                  style={({ pressed }) => [styles.choix, { borderColor: couleur, backgroundColor: fond }, pressed && !valide && { opacity: 0.85 }]}
                >
                  <View style={[styles.lettre, { backgroundColor: selectionne || montreBonne ? (couleur === "transparent" ? theme.primary : couleur) : couleurs.surface }]}>
                    {montreBonne ? (
                      <Ionicons name="checkmark-sharp" size={14} color="#FFFFFF" />
                    ) : montreErreur ? (
                      <Ionicons name="close-sharp" size={14} color="#FFFFFF" />
                    ) : (
                      <Text style={[styles.lettreTexte, { color: selectionne ? "#FFFFFF" : couleurs.texteAttenue }]}>{LETTRES[index] ?? index + 1}</Text>
                    )}
                  </View>
                  <Text style={styles.choixTexte}>{texte}</Text>
                </Pressable>
              );
            })}
          </View>

          {valide ? (
            <Apparition mode="pop" style={[styles.verdict, { backgroundColor: reussi ? couleurs.succesFond : couleurs.erreurFond }]}>
              <Ionicons name={reussi ? "sparkles" : "time-outline"} size={17} color={reussi ? couleurs.succes : couleurs.erreur} />
              <Text style={[styles.verdictTexte, { color: reussi ? couleurs.succes : couleurs.erreur }]}>
                {reussi
                  ? dejaJoue
                    ? "Défi relevé aujourd'hui. Reviens demain pour le suivant."
                    : `Bien vu ! +${XP_PAR_DEFI} XP. Reviens demain pour le suivant.`
                  : "Pas cette fois. La bonne réponse est en vert — un nouveau défi demain."}
              </Text>
            </Apparition>
          ) : (
            <Pressable
              onPress={valider}
              disabled={choix === undefined}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.bouton,
                { backgroundColor: choix === undefined ? couleurs.verrouilleFond : theme.primary },
                pressed && choix !== undefined && PRESSION,
              ]}
            >
              <Text style={[styles.boutonTexte, choix === undefined && { color: couleurs.texteTertiaire }]}>Valider</Text>
            </Pressable>
          )}
        </Apparition>
      </View>
    </Modal>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    fond: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(16,18,22,0.5)",
    },
    centre: {
      flex: 1,
      justifyContent: "center",
      padding: 22,
    },
    carte: {
      backgroundColor: couleurs.surface,
      borderRadius: 28,
      padding: 20,
      gap: 14,
      ...couleurs.ombres.modale,
    },
    entete: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
    },
    eclair: {
      width: 36,
      height: 36,
      borderRadius: RAYONS.moyen,
      alignItems: "center",
      justifyContent: "center",
    },
    enteteTextes: {
      flex: 1,
      gap: 2,
    },
    surtitre: {
      ...TYPO.surtitre,
    },
    origine: {
      ...TYPO.legende,
      color: couleurs.texteAttenue,
    },
    question: {
      ...TYPO.titreSection,
      fontSize: 18,
      lineHeight: 25,
      color: couleurs.texte,
    },
    choixListe: {
      gap: 8,
    },
    choix: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      borderWidth: 2,
      borderRadius: RAYONS.grand,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    lettre: {
      width: 26,
      height: 26,
      borderRadius: RAYONS.petit,
      alignItems: "center",
      justifyContent: "center",
    },
    lettreTexte: {
      ...TYPO.legende,
      fontSize: 11.5,
    },
    choixTexte: {
      ...TYPO.corpsMoyen,
      flex: 1,
      fontSize: 14,
      color: couleurs.texte,
    },
    verdict: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      borderRadius: RAYONS.moyen,
      padding: 13,
    },
    verdictTexte: {
      ...TYPO.legende,
      flex: 1,
    },
    bouton: {
      borderRadius: RAYONS.grand,
      paddingVertical: 15,
      alignItems: "center",
    },
    boutonTexte: {
      ...TYPO.bouton,
      color: "#FFFFFF",
    },
  });
