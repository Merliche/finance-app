import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Apparition } from "../src/components/ui/Apparition";
import { EnteteEcran } from "../src/components/ui/EnteteEcran";
import { FondAnime } from "../src/components/ui/FondAnime";
import { MODE_TEST_TOUT_ACCESSIBLE } from "../src/constants/modeTest";
import { sessionsAtteintes } from "../src/constants/sessions";
import { VOIES } from "../src/constants/voies";
import { recupererParcoursBundle } from "../src/data/content";
import { obtenirTousLesElementsLateraux } from "../src/data/content/elementsLateraux";
import { construireGlossaire, filtrerGlossaire, grouperParInitiale } from "../src/domain/glossaire";
import type { Parcours } from "../src/domain/parcours/types";
import { useProgressStore } from "../src/state/progressStore";
import { delaiCascade } from "../src/theme/animation";
import { useCouleurs, useMode, useStyles } from "../src/theme/ModeCouleur";
import type { Couleurs } from "../src/theme/palettes";
import { PRESSION, RAYONS, teinteEcran, themeDuParcours } from "../src/theme/parcoursTheme";
import { TYPO } from "../src/theme/typographie";

const PARCOURS_IDS = ["intro", ...VOIES.map((voie) => voie.id)];
const LIBELLE_PARCOURS: Record<string, string> = {
  intro: "Intro",
  ...Object.fromEntries(VOIES.map((voie) => [voie.id, voie.labelParDefaut])),
};

/**
 * Index alphabétique de tous les termes définis dans l'app. Comme la boîte à outils, il
 * ne montre que ce qui a été atteint : afficher d'emblée les 170 termes viderait de son
 * sens la progression, et la plupart ne voudraient rien dire hors de leur leçon.
 */
export default function Glossaire() {
  const mode = useMode();
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const progression = useProgressStore((state) => state.parcours);
  const [recherche, setRecherche] = useState("");

  const parcours = useMemo(
    () => PARCOURS_IDS.map(recupererParcoursBundle).filter((p): p is Parcours => p !== undefined),
    []
  );

  const toutes = useMemo(
    () => construireGlossaire(parcours, obtenirTousLesElementsLateraux()),
    [parcours]
  );

  const atteintes = useMemo(() => {
    const parParcours = new Map<string, Set<number>>();
    for (const p of parcours) {
      parParcours.set(p.id, sessionsAtteintes(p.etapes, progression[p.id]?.etapesCompletees ?? []));
    }
    return parParcours;
  }, [parcours, progression]);

  const debloquees = useMemo(
    () =>
      toutes.filter(
        (entree) => MODE_TEST_TOUT_ACCESSIBLE || (atteintes.get(entree.parcoursId)?.has(entree.session) ?? false)
      ),
    [toutes, atteintes]
  );

  const resultats = useMemo(() => filtrerGlossaire(debloquees, recherche), [debloquees, recherche]);
  const groupes = useMemo(() => grouperParInitiale(resultats), [resultats]);

  const teinte = teinteEcran("glossaire");

  return (
    <>
      <View style={styles.fond} pointerEvents="none">
        <FondAnime theme={themeDuParcours("intro", mode)} intensite={0.28} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.conteneur, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <EnteteEcran
          surtitre="Glossaire"
          titre="Tous les mots de finance, dans un seul endroit."
          icone="book"
          teinte={teinte}
          insetHaut={insets.top}
          onRetour={() => (router.canGoBack() ? router.back() : router.replace("/outils"))}
        >
          <Text style={styles.compteur}>
            <Text style={styles.compteurChiffre}>{debloquees.length}</Text> terme
            {debloquees.length > 1 ? "s" : ""} sur {toutes.length} — les autres s'ouvrent en
            avançant sur le chemin.
          </Text>

          <View style={styles.recherche}>
            <Ionicons name="search" size={17} color="rgba(255,255,255,0.75)" />
            <TextInput
              style={styles.champRecherche}
              value={recherche}
              onChangeText={setRecherche}
              placeholder="Chercher un terme ou un mot de sa définition"
              placeholderTextColor="rgba(255,255,255,0.6)"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Chercher dans le glossaire"
            />
            {recherche.length > 0 && (
              <Pressable
                onPress={() => setRecherche("")}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Effacer la recherche"
                style={({ pressed }) => [pressed && PRESSION]}
              >
                <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.75)" />
              </Pressable>
            )}
          </View>
        </EnteteEcran>

        <View style={styles.corps}>

      {groupes.length === 0 && (
        <Apparition mode="pop" style={styles.vide}>
          <Ionicons name="book-outline" size={26} color={couleurs.texteTertiaire} />
          <Text style={styles.videTitre}>
            {debloquees.length === 0
              ? "Le glossaire se remplit en avançant"
              : `Aucun terme pour « ${recherche.trim()} »`}
          </Text>
          <Text style={styles.videTexte}>
            {debloquees.length === 0
              ? "Chaque leçon terminée y ajoute les mots qu'elle définit."
              : "Essaie un autre mot, ou une partie du mot seulement."}
          </Text>
        </Apparition>
      )}

      {groupes.map((groupe, indexGroupe) => (
        <Apparition key={groupe.lettre} delai={delaiCascade(indexGroupe, 60)} style={styles.groupe}>
          <Text style={styles.lettre}>{groupe.lettre}</Text>
          {groupe.entrees.map((entree) => {
            const theme = themeDuParcours(entree.parcoursId, mode);
            return (
              <View key={entree.terme} style={styles.carte}>
                <View style={styles.carteEntete}>
                  <View style={[styles.barre, { backgroundColor: theme.primary }]} />
                  <Text style={styles.terme}>{entree.terme}</Text>
                  <View style={[styles.pastille, { backgroundColor: theme.tint }]}>
                    <Text style={[styles.pastilleTexte, { color: theme.primary }]}>
                      {LIBELLE_PARCOURS[entree.parcoursId] ?? entree.parcoursId}
                    </Text>
                  </View>
                </View>
                <Text style={styles.definition}>{entree.definition}</Text>
              </View>
            );
          })}
        </Apparition>
      ))}
        </View>
      </ScrollView>
    </>
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
    },
    conteneur: {
      gap: 22,
    },
    corps: {
      paddingHorizontal: 22,
      gap: 22,
    },
    compteur: {
      ...TYPO.legende,
      marginTop: 14,
      color: "rgba(255,255,255,0.78)",
    },
    compteurChiffre: {
      ...TYPO.chiffre,
      fontSize: 18,
      lineHeight: 22,
      color: "#FFFFFF",
    },
    recherche: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      marginTop: 16,
      // Posé sur le bandeau : un voile clair translucide plutôt qu'une carte blanche, qui
      // trouerait le dégradé.
      backgroundColor: "rgba(255,255,255,0.16)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.22)",
      borderRadius: RAYONS.pilule,
      paddingHorizontal: 16,
      paddingVertical: 2,
    },
    champRecherche: {
      ...TYPO.corpsMoyen,
      flex: 1,
      fontSize: 14.5,
      paddingVertical: 11,
      color: "#FFFFFF",
    },
    vide: {
      alignItems: "center",
      gap: 6,
      paddingVertical: 30,
    },
    videTitre: {
      ...TYPO.titreCarte,
      color: couleurs.texte,
      textAlign: "center",
    },
    videTexte: {
      ...TYPO.legende,
      color: couleurs.texteAttenue,
      textAlign: "center",
    },
    groupe: {
      gap: 8,
    },
    lettre: {
      ...TYPO.titreEcran,
      fontSize: 20,
      color: couleurs.texteTertiaire,
      marginLeft: 2,
    },
    carte: {
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.grand,
      padding: 14,
      gap: 7,
      ...couleurs.ombres.carte,
    },
    carteEntete: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
    },
    barre: {
      width: 3,
      height: 16,
      borderRadius: RAYONS.pilule,
    },
    terme: {
      ...TYPO.titreCarte,
      flex: 1,
      color: couleurs.texte,
    },
    pastille: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: RAYONS.pilule,
    },
    pastilleTexte: {
      ...TYPO.surtitre,
      fontSize: 9,
    },
    definition: {
      ...TYPO.corps,
      fontSize: 14.5,
      lineHeight: 21,
      color: couleurs.texteAttenue,
    },
  });
