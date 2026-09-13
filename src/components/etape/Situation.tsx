import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { EtapeSituation, SituationChoix } from "../../domain/parcours/types";
import type { ResultatEtape } from "../../domain/parcours/progress";
import { delaiCascade } from "../../theme/animation";
import { avecAlpha } from "../../theme/couleurs";
import { useCouleurs, useMode, useStyles } from "../../theme/ModeCouleur";
import type { Couleurs, ModeCouleur } from "../../theme/palettes";
import { RAYONS, type ThemeParcours } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";
import { haptiqueLegere } from "../../utils/haptique";
import { Apparition } from "../ui/Apparition";
import { AppuiRessort } from "../ui/AppuiRessort";
import { Reaction } from "../ui/Reaction";
import { BoutonContinuer } from "./BoutonContinuer";
import { ContenuBlocs } from "./ContenuBlocs";

/**
 * Les trois qualités de réponse. Leurs couleurs dépendent de la palette : un vert foncé
 * et un jaune pâle, parfaits sur du papier, deviennent illisibles sur un fond sombre.
 * Elles ne peuvent donc pas être figées au chargement du module.
 */
function qualites(
  couleurs: Couleurs,
  mode: ModeCouleur
): Record<
  SituationChoix["qualite"],
  { label: string; couleur: string; fond: string; icone: keyof typeof Ionicons.glyphMap }
> {
  return {
    recommande: {
      label: "Recommandé",
      couleur: couleurs.succes,
      fond: couleurs.succesFond,
      icone: "checkmark-circle",
    },
    acceptable: {
      label: "Acceptable",
      couleur: mode === "sombre" ? "#E8C766" : "#B8860B",
      fond: mode === "sombre" ? "#332B14" : "#FDF6E3",
      icone: "alert-circle",
    },
    deconseille: {
      label: "Déconseillé",
      couleur: couleurs.erreur,
      fond: couleurs.erreurFond,
      icone: "close-circle",
    },
  };
}

export function Situation({
  etape,
  onTerminer,
  theme,
}: {
  etape: EtapeSituation;
  onTerminer: (resultat: ResultatEtape) => void;
  theme: ThemeParcours;
}) {
  const couleurs = useCouleurs();
  const mode = useMode();
  const styles = useStyles(creerStyles);
  const { situation } = etape;
  const [choixSelectionneId, setChoixSelectionneId] = useState<string | undefined>();
  const choixSelectionne = situation.choix.find((choix) => choix.id === choixSelectionneId);
  const qualite = choixSelectionne ? qualites(couleurs, mode)[choixSelectionne.qualite] : undefined;

  return (
    <ScrollView contentContainerStyle={styles.conteneur} showsVerticalScrollIndicator={false}>
      <ContenuBlocs blocs={etape.contenu} theme={theme} />

      <Apparition delai={220}>
        <View style={[styles.contexte, { borderLeftColor: theme.primary }]}>
          <Ionicons name="chatbubble-ellipses" size={17} color={theme.primary} />
          <Text style={styles.contexteTexte}>{situation.contexte}</Text>
        </View>
      </Apparition>

      <View style={styles.choixListe}>
        {situation.choix.map((choix, index) => {
          const selectionne = choix.id === choixSelectionneId;
          return (
            <Apparition key={choix.id} delai={delaiCascade(index, 300)}>
              {/* Le choix retenu fait un petit bond : sur trois cartes qui se ressemblent,
                  c'est ce qui confirme laquelle vient d'être prise, avant même de lire la
                  couleur. */}
              <Reaction type={selectionne ? "succes" : null}>
                <AppuiRessort
                  echelle={0.975}
                  onPress={() => {
                    haptiqueLegere();
                    setChoixSelectionneId(choix.id);
                  }}
                  accessibilityLabel={choix.texte}
                  styleContenu={[
                    styles.choix,
                    selectionne && {
                      borderColor: theme.primary,
                      backgroundColor: theme.tint,
                      shadowColor: theme.primaryDark,
                      shadowOpacity: 0.16,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.radio,
                      {
                        borderColor: selectionne ? theme.primary : couleurs.verrouilleBordure,
                        backgroundColor: selectionne ? avecAlpha(theme.primary, 0.12) : "transparent",
                      },
                    ]}
                  >
                    {selectionne && <View style={[styles.radioPlein, { backgroundColor: theme.primary }]} />}
                  </View>
                  <Text style={styles.choixTexte}>{choix.texte}</Text>
                </AppuiRessort>
              </Reaction>
            </Apparition>
          );
        })}
      </View>

      {choixSelectionne && qualite && (
        <Apparition key={choixSelectionne.id} mode="pop" style={[styles.feedback, { backgroundColor: qualite.fond }]}>
          <View style={styles.feedbackEntete}>
            <Ionicons name={qualite.icone} size={18} color={qualite.couleur} />
            <Text style={[styles.feedbackQualite, { color: qualite.couleur }]}>{qualite.label}</Text>
          </View>
          <Text style={styles.feedbackTexte}>{choixSelectionne.feedback}</Text>
        </Apparition>
      )}

      <BoutonContinuer
        theme={theme}
        disabled={!choixSelectionneId}
        onPress={() => onTerminer({ type: "situation", choixSelectionneId: choixSelectionneId! })}
      />
    </ScrollView>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    conteneur: {
      padding: 22,
      paddingBottom: 40,
      gap: 22,
    },
    contexte: {
      flexDirection: "row",
      gap: 12,
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.grand,
      borderLeftWidth: 5,
      padding: 16,
      ...couleurs.ombres.carte,
    },
    contexteTexte: {
      ...TYPO.corps,
      flex: 1,
      fontSize: 14.5,
      lineHeight: 22,
      color: couleurs.texte,
    },
    choixListe: {
      gap: 10,
    },
    choix: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 2,
      borderColor: "transparent",
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.grand,
      padding: 15,
      ...couleurs.ombres.carte,
    },
    radio: {
      width: 21,
      height: 21,
      borderRadius: 999,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    radioPlein: {
      width: 10,
      height: 10,
      borderRadius: 999,
    },
    choixTexte: {
      ...TYPO.corpsMoyen,
      flex: 1,
      fontSize: 14.5,
      color: couleurs.texte,
    },
    feedback: {
      borderRadius: RAYONS.grand,
      padding: 16,
      gap: 9,
    },
    feedbackEntete: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },
    feedbackQualite: {
      ...TYPO.surtitre,
    },
    feedbackTexte: {
      ...TYPO.corps,
      fontSize: 14.5,
      lineHeight: 22,
      color: couleurs.texte,
    },
  });
