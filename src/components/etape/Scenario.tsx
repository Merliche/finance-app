import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { EtapeScenario, ScenarioOption } from "../../domain/parcours/types";
import type { ResultatEtape } from "../../domain/parcours/progress";
import { useCouleurs, useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { PRESSION, RAYONS, type ThemeParcours } from "../../theme/parcoursTheme";
import { PLAFOND_PASTILLE, TYPO } from "../../theme/typographie";
import { haptiqueLegere, haptiqueSucces } from "../../utils/haptique";
import { Apparition } from "../ui/Apparition";
import { AppuiRessort } from "../ui/AppuiRessort";
import { BarreProgression } from "../ui/BarreProgression";
import { useCompteur } from "../ui/useCompteur";
import { BoutonContinuer } from "./BoutonContinuer";
import { ContenuBlocs } from "./ContenuBlocs";

const POINTS_MAX_PAR_DECISION = 2;

/** Le bilan affiché : le premier dont le seuil est atteint (les bilans sont triés décroissants). */
export function choisirBilan(bilans: EtapeScenario["scenario"]["bilans"], pourcentage: number) {
  return bilans.find((bilan) => pourcentage >= bilan.seuil) ?? bilans[bilans.length - 1];
}

/**
 * Étude de cas : une histoire où chaque décision entraîne la suivante. On garde à l'écran
 * les choix déjà faits et leurs conséquences — c'est le fil de l'histoire qui enseigne,
 * pas chaque question prise isolément.
 */
export function Scenario({
  etape,
  onTerminer,
  theme,
}: {
  etape: EtapeScenario;
  onTerminer: (resultat: ResultatEtape) => void;
  theme: ThemeParcours;
}) {
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const { scenario } = etape;
  const scrollRef = useRef<ScrollView>(null);
  const [choisies, setChoisies] = useState<ScenarioOption[]>([]);

  const index = choisies.length;
  const termine = index >= scenario.decisions.length;
  const decision = scenario.decisions[index];

  const points = choisies.reduce((total, option) => total + option.points, 0);
  const pointsMax = scenario.decisions.length * POINTS_MAX_PAR_DECISION;
  const pourcentage = pointsMax > 0 ? Math.round((points / pointsMax) * 100) : 0;
  const pointsAffiches = useCompteur(termine ? points : 0);

  function choisir(option: ScenarioOption) {
    haptiqueLegere();
    setChoisies((precedent) => [...precedent, option]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
  }

  function terminer() {
    haptiqueSucces();
    onTerminer({ type: "scenario", score: pourcentage });
  }

  const bilan = termine ? choisirBilan(scenario.bilans, pourcentage) : undefined;

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={styles.conteneur} showsVerticalScrollIndicator={false}>
      <ContenuBlocs blocs={etape.contenu} theme={theme} />

      <Apparition delai={160} style={[styles.intro, { backgroundColor: theme.tint }]}>
        <Ionicons name="play-circle" size={18} color={theme.primary} />
        <Text style={styles.introTexte}>{scenario.intro}</Text>
      </Apparition>

      <View style={styles.ligneProgression}>
        <BarreProgression
          ratio={index / scenario.decisions.length}
          couleur={theme.primary}
          couleurPiste={couleurs.verrouilleFond}
          hauteur={6}
        />
        <Text style={styles.compteur}>
          {Math.min(index + (termine ? 0 : 1), scenario.decisions.length)}/{scenario.decisions.length}
        </Text>
      </View>

      {/* Le fil de l'histoire : ce qui a déjà été décidé, et ce que ça a donné */}
      {choisies.map((option, indexChoisie) => (
        <View key={scenario.decisions[indexChoisie].id} style={styles.passe}>
          <View style={styles.passeEntete}>
            <View style={[styles.passeNumero, { backgroundColor: theme.tintFort }]}>
              <Text
                style={[styles.passeNumeroTexte, { color: theme.primaryDark }]}
                maxFontSizeMultiplier={PLAFOND_PASTILLE}
              >
                {indexChoisie + 1}
              </Text>
            </View>
            <Text style={styles.passeChoix} numberOfLines={2}>
              {option.texte}
            </Text>
          </View>
          <Text style={styles.passeConsequence}>{option.consequence}</Text>
        </View>
      ))}

      {decision && (
        <Apparition key={decision.id} mode="pop" style={styles.carte}>
          <Text style={[styles.surtitre, { color: theme.primary }]}>Décision {index + 1}</Text>
          <Text style={styles.situation}>{decision.situation}</Text>

          <View style={styles.options}>
            {decision.options.map((option) => (
              <AppuiRessort
                key={option.id}
                echelle={0.975}
                onPress={() => choisir(option)}
                accessibilityLabel={option.texte}
                styleContenu={styles.option}
              >
                <Ionicons name="ellipse-outline" size={18} color={theme.primary} />
                <Text style={styles.optionTexte}>{option.texte}</Text>
              </AppuiRessort>
            ))}
          </View>
        </Apparition>
      )}

      {termine && bilan && (
        <Apparition mode="pop" style={styles.bilan}>
          <View style={[styles.bilanEntete, { backgroundColor: theme.primary }]}>
            <Ionicons name="flag" size={22} color="#FFFFFF" />
            <View style={styles.bilanTextes}>
              <Text style={styles.bilanSurtitre}>Fin de l'histoire</Text>
              <Text style={styles.bilanTitre}>{bilan.titre}</Text>
            </View>
            <Text style={styles.bilanScore}>
              {pointsAffiches}/{pointsMax}
            </Text>
          </View>
          <Text style={styles.bilanTexte}>{bilan.texte}</Text>
          <Text style={styles.bilanMention}>
            Aucune de ces trajectoires n'est un échec : le but est de voir ce que chaque choix coûte, ou
            rapporte, sur la durée.
          </Text>
          <BoutonContinuer theme={theme} onPress={terminer} />
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
      gap: 18,
    },
    intro: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 11,
      borderRadius: RAYONS.carte,
      padding: 16,
    },
    introTexte: {
      ...TYPO.corps,
      flex: 1,
      fontSize: 14.5,
      lineHeight: 22,
      color: couleurs.texte,
    },
    ligneProgression: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
    },
    compteur: {
      ...TYPO.legende,
      color: couleurs.texteAttenue,
    },
    passe: {
      borderLeftWidth: 2,
      borderLeftColor: couleurs.bordure,
      paddingLeft: 14,
      gap: 5,
    },
    passeEntete: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
    },
    passeNumero: {
      width: 20,
      height: 20,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    passeNumeroTexte: {
      ...TYPO.legende,
      fontSize: 10.5,
    },
    passeChoix: {
      ...TYPO.label,
      flex: 1,
      fontSize: 13,
      color: couleurs.texte,
    },
    passeConsequence: {
      ...TYPO.legende,
      color: couleurs.texteAttenue,
    },
    carte: {
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.carte,
      padding: 18,
      gap: 10,
      ...couleurs.ombres.carte,
    },
    surtitre: {
      ...TYPO.surtitre,
    },
    situation: {
      ...TYPO.corps,
      fontSize: 15.5,
      lineHeight: 24,
      color: couleurs.texte,
      marginBottom: 4,
    },
    options: {
      gap: 9,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      backgroundColor: couleurs.surfaceAtone,
      borderRadius: RAYONS.grand,
      padding: 14,
    },
    optionTexte: {
      ...TYPO.corpsMoyen,
      flex: 1,
      fontSize: 14.5,
      color: couleurs.texte,
    },
    bilan: {
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.carte,
      padding: 18,
      gap: 13,
      ...couleurs.ombres.carte,
    },
    bilanEntete: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderRadius: RAYONS.grand,
      padding: 14,
      marginHorizontal: -4,
    },
    bilanTextes: {
      flex: 1,
      gap: 2,
    },
    bilanSurtitre: {
      ...TYPO.surtitre,
      color: "rgba(255,255,255,0.75)",
    },
    bilanTitre: {
      ...TYPO.titreCarte,
      fontSize: 16,
      color: "#FFFFFF",
    },
    bilanScore: {
      ...TYPO.chiffre,
      fontSize: 20,
      lineHeight: 24,
      color: "#FFFFFF",
    },
    bilanTexte: {
      ...TYPO.corps,
      fontSize: 14.5,
      lineHeight: 22,
      color: couleurs.texte,
    },
    bilanMention: {
      ...TYPO.legende,
      color: couleurs.texteTertiaire,
    },
  });
