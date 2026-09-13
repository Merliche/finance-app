import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { ElementLateral } from "../../domain/elementsLateraux/types";
import { useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { PRESSION, RAYONS } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";
import { FeuilleModale } from "../ui/FeuilleModale";
import { CalculateurLibre } from "./CalculateurLibre";
import { CONFIG_ELEMENT_LATERAL } from "./configElementsLateraux";

export function ElementLateralModal({
  element,
  onFermer,
}: {
  element: ElementLateral | null;
  onFermer: () => void;
}) {
  const styles = useStyles(creerStyles);
  if (!element) return null;
  const config = CONFIG_ELEMENT_LATERAL[element.type];

  return (
    <FeuilleModale visible onFermer={onFermer} hauteurMax="82%">
      <ScrollView contentContainerStyle={styles.contenu} showsVerticalScrollIndicator={false}>
        <View style={styles.entete}>
          <View style={[styles.puce, { backgroundColor: config.couleur }]}>
            <Ionicons name={config.icone} size={21} color="#FFFFFF" />
          </View>
          <Text style={[styles.categorie, { color: config.couleur }]}>{config.label}</Text>
        </View>

        <Text style={styles.titre}>{element.titre}</Text>

        {element.type === "calculateur" && (
          <CalculateurLibre
            simulateur={element.simulateur}
            description={element.description}
            couleur={config.couleur}
          />
        )}

        {element.type === "comparateur" && (
          <>
            <View style={styles.comparateur}>
              {[element.optionA, element.optionB].map((option, indexOption) => (
                <View
                  key={indexOption}
                  style={[styles.colonne, indexOption === 0 && { borderColor: config.couleur + "55" }]}
                >
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  {option.points.map((point, index) => (
                    <View key={index} style={styles.lignePoint}>
                      <View style={[styles.puceListe, { backgroundColor: config.couleur }]} />
                      <Text style={styles.point}>{point}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
            {element.conclusion && (
              <View style={[styles.conclusion, { backgroundColor: config.couleur + "14" }]}>
                <Ionicons name="sparkles" size={15} color={config.couleur} />
                <Text style={styles.conclusionTexte}>{element.conclusion}</Text>
              </View>
            )}
          </>
        )}

        {element.type === "saviez_vous" && <Text style={styles.texte}>{element.anecdote}</Text>}

        {element.type === "glossaire" &&
          element.entrees.map((entree, index) => (
            <View key={index} style={styles.entreeGlossaire}>
              <View style={[styles.barreTerme, { backgroundColor: config.couleur }]} />
              <View style={styles.texteGlossaire}>
                <Text style={styles.terme}>{entree.terme}</Text>
                <Text style={styles.texte}>{entree.definition}</Text>
              </View>
            </View>
          ))}

        {element.type === "badge" && (
          <View style={styles.badge}>
            <View style={[styles.badgeCercle, { backgroundColor: config.couleur }]}>
              <Ionicons name="ribbon" size={34} color="#FFFFFF" />
            </View>
            <Text style={[styles.texte, styles.badgeTexte]}>{element.description}</Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [styles.boutonFermer, pressed && PRESSION]}
          onPress={onFermer}
        >
          <Text style={styles.boutonFermerTexte}>Fermer</Text>
        </Pressable>
      </ScrollView>
    </FeuilleModale>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    contenu: {
      padding: 24,
      paddingTop: 18,
      gap: 15,
    },
    entete: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
    },
    puce: {
      width: 38,
      height: 38,
      borderRadius: RAYONS.moyen,
      alignItems: "center",
      justifyContent: "center",
    },
    categorie: {
      ...TYPO.surtitre,
    },
    titre: {
      ...TYPO.titreSection,
      color: couleurs.texte,
    },
    texte: {
      ...TYPO.corps,
      color: couleurs.texte,
    },
    comparateur: {
      flexDirection: "row",
      gap: 11,
    },
    colonne: {
      flex: 1,
      gap: 9,
      backgroundColor: couleurs.surfaceAtone,
      borderRadius: RAYONS.grand,
      borderWidth: 1,
      borderColor: couleurs.bordure,
      padding: 14,
    },
    optionLabel: {
      ...TYPO.label,
      color: couleurs.texte,
    },
    lignePoint: {
      flexDirection: "row",
      gap: 8,
      alignItems: "flex-start",
    },
    puceListe: {
      width: 5,
      height: 5,
      borderRadius: 999,
      marginTop: 6,
    },
    point: {
      ...TYPO.legende,
      flex: 1,
      color: couleurs.texteAttenue,
    },
    conclusion: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 9,
      borderRadius: RAYONS.moyen,
      padding: 13,
    },
    conclusionTexte: {
      ...TYPO.legende,
      flex: 1,
      color: couleurs.texte,
    },
    entreeGlossaire: {
      flexDirection: "row",
      gap: 12,
    },
    barreTerme: {
      width: 3,
      borderRadius: RAYONS.pilule,
    },
    texteGlossaire: {
      flex: 1,
      gap: 3,
    },
    terme: {
      ...TYPO.titreCarte,
      color: couleurs.texte,
    },
    badge: {
      alignItems: "center",
      gap: 14,
      paddingVertical: 8,
    },
    badgeCercle: {
      width: 78,
      height: 78,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeTexte: {
      textAlign: "center",
    },
    boutonFermer: {
      marginTop: 6,
      alignSelf: "center",
      paddingHorizontal: 26,
      paddingVertical: 12,
      borderRadius: RAYONS.pilule,
      backgroundColor: couleurs.surfaceAtone,
    },
    boutonFermerTexte: {
      ...TYPO.label,
      color: couleurs.texteAttenue,
    },
  });
