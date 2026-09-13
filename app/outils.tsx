import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CONFIG_ELEMENT_LATERAL } from "../src/components/chemin/configElementsLateraux";
import { ElementLateralModal } from "../src/components/chemin/ElementLateralModal";
import { Apparition } from "../src/components/ui/Apparition";
import { AppuiRessort } from "../src/components/ui/AppuiRessort";
import { BarreProgression } from "../src/components/ui/BarreProgression";
import { EnteteEcran } from "../src/components/ui/EnteteEcran";
import { FondAnime } from "../src/components/ui/FondAnime";
import { MODE_TEST_TOUT_ACCESSIBLE } from "../src/constants/modeTest";
import { sessionsAtteintes } from "../src/constants/sessions";
import { VOIES } from "../src/constants/voies";
import { recupererParcoursBundle } from "../src/data/content";
import { obtenirTousLesElementsLateraux } from "../src/data/content/elementsLateraux";
import type { ElementLateral, TypeElementLateral } from "../src/domain/elementsLateraux/types";
import { useProgressStore } from "../src/state/progressStore";
import { eclaircir } from "../src/theme/couleurs";
import { useCouleurs, useMode, useStyles } from "../src/theme/ModeCouleur";
import type { Couleurs } from "../src/theme/palettes";
import { PRESSION, RAYONS, teinteEcran, themeDuParcours } from "../src/theme/parcoursTheme";
import { TYPO } from "../src/theme/typographie";
import { haptiqueLegere } from "../src/utils/haptique";

const SECTIONS: { type: TypeElementLateral; titre: string; description: string }[] = [
  { type: "calculateur", titre: "Calculateurs", description: "Rejoue n'importe quel simulateur avec tes propres chiffres." },
  { type: "comparateur", titre: "Comparateurs", description: "Deux options côte à côte, pour trancher vite." },
  { type: "glossaire", titre: "Glossaires", description: "Tous les termes vus dans les leçons." },
  { type: "saviez_vous", titre: "Le saviez-vous", description: "Les anecdotes débloquées au fil du chemin." },
];

const LIBELLE_PARCOURS: Record<string, string> = {
  intro: "Intro",
  ...Object.fromEntries(VOIES.map((v) => [v.id, v.labelParDefaut])),
};

/** Normalise pour une recherche tolérante : sans accents, sans casse. */
function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Un élément correspond si la recherche apparaît dans son titre ou dans son contenu —
 * on cherche aussi dans les termes de glossaire et les points d'un comparateur, sinon
 * chercher « TAEG » ne trouverait rien alors que le mot est bien dans l'app.
 */
function correspond(element: ElementLateral, recherche: string): boolean {
  const termes = normaliser(recherche).split(/\s+/).filter(Boolean);
  const morceaux = [element.titre];
  if (element.type === "calculateur") morceaux.push(element.description, ...element.simulateur.variables.map((v) => v.label));
  if (element.type === "comparateur") morceaux.push(element.optionA.label, element.optionB.label, ...element.optionA.points, ...element.optionB.points, element.conclusion ?? "");
  if (element.type === "glossaire") morceaux.push(...element.entrees.flatMap((e) => [e.terme, e.definition]));
  if (element.type === "saviez_vous") morceaux.push(element.anecdote);
  if (element.type === "badge") morceaux.push(element.description);
  const corpus = normaliser(morceaux.join(" "));
  return termes.every((terme) => corpus.includes(terme));
}

/** Boîte à outils : tous les éléments latéraux de tous les parcours, réunis en un endroit. */
export default function Outils() {
  const mode = useMode();
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const progression = useProgressStore((state) => state.parcours);
  const [ouvert, setOuvert] = useState<ElementLateral | null>(null);
  const [filtre, setFiltre] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");

  // Un outil est débloqué si la session qui le porte est atteinte dans son parcours —
  // même règle que sur la map, calculée ici sur le contenu bundlé.
  const atteintes = new Map<string, Set<number>>();
  for (const parcoursId of ["intro", ...VOIES.map((v) => v.id)]) {
    const parcours = recupererParcoursBundle(parcoursId);
    if (parcours) atteintes.set(parcoursId, sessionsAtteintes(parcours.etapes, progression[parcoursId]?.etapesCompletees ?? []));
  }
  const estDebloque = (element: ElementLateral) =>
    MODE_TEST_TOUT_ACCESSIBLE || (atteintes.get(element.parcoursId)?.has(element.session) ?? false);

  const tous = obtenirTousLesElementsLateraux();
  const nbDebloques = tous.filter((e) => e.type !== "badge" && estDebloque(e)).length;
  const nbTotal = tous.filter((e) => e.type !== "badge").length;
  const visibles = tous
    .filter((e) => (filtre ? e.parcoursId === filtre : true))
    .filter((e) => (recherche.trim() ? correspond(e, recherche) : true));
  const aucunResultat = recherche.trim().length > 0 && visibles.filter((e) => e.type !== "badge").length === 0;

  const ratioDebloques = nbTotal > 0 ? nbDebloques / nbTotal : 0;

  return (
    <>
      {/* Les outils appartiennent à tous les parcours : leur fond emprunte la teinte du
          tronc commun plutôt que celle d'une voie, et reste très en retrait. */}
      <View style={styles.fond} pointerEvents="none">
        <FondAnime theme={themeDuParcours("intro", mode)} intensite={0.3} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.conteneur, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <EnteteEcran
          surtitre="Boîte à outils"
          titre="Tout ce que tu as débloqué, à portée de main."
          icone="construct"
          teinte={teinteEcran("outils")}
          insetHaut={insets.top}
          onRetour={() => (router.canGoBack() ? router.back() : router.replace("/parcours"))}
        >
          <View style={styles.heroProgression}>
            <BarreProgression
              ratio={ratioDebloques}
              couleur="#FFFFFF"
              couleurPiste="rgba(255,255,255,0.24)"
              hauteur={8}
            />
            <Text style={styles.heroChiffre}>
              {nbDebloques}/{nbTotal}
            </Text>
          </View>
          <Text style={styles.compteur}>Les autres s'ouvrent en avançant sur le chemin.</Text>
        </EnteteEcran>

        <View style={styles.corps}>
        <Apparition delai={40}>
          <Link href="/glossaire" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ouvrir le glossaire"
              style={({ pressed }) => [styles.glossaire, pressed && PRESSION]}
            >
              <View style={styles.glossaireIcone}>
                <Ionicons name="book" size={19} color="#FFFFFF" />
              </View>
              <View style={styles.glossaireTextes}>
                <Text style={styles.glossaireTitre}>Glossaire</Text>
                <Text style={styles.glossaireDetail}>Tous les termes définis, de A à Z</Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={couleurs.texteTertiaire} />
            </Pressable>
          </Link>
        </Apparition>

        <Apparition delai={60}>
          <View style={styles.recherche}>
            <Ionicons name="search" size={17} color={couleurs.texteTertiaire} />
            <TextInput
              style={styles.champRecherche}
              value={recherche}
              onChangeText={setRecherche}
              placeholder="Chercher un mot : TAEG, inflation, marge…"
              placeholderTextColor={couleurs.texteTertiaire}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Chercher dans les outils"
            />
            {recherche.length > 0 && (
              <Pressable onPress={() => setRecherche("")} hitSlop={10} accessibilityRole="button" accessibilityLabel="Effacer la recherche">
                <Ionicons name="close-circle" size={18} color={couleurs.texteTertiaire} />
              </Pressable>
            )}
          </View>
        </Apparition>

        {/* Filtre par parcours : on retrouve vite les outils de la voie qu'on suit */}
        <Apparition delai={80}>
          <ScrollView horizontal showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtres}>
            {[null, "intro", ...VOIES.map((v) => v.id)].map((id) => {
              const actif = filtre === id;
              const theme = id ? themeDuParcours(id, mode) : undefined;
              return (
                <Pressable
                  key={id ?? "tous"}
                  onPress={() => {
                    haptiqueLegere();
                    setFiltre(id);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: actif }}
                  style={({ pressed }) => [
                    styles.filtre,
                    actif && { backgroundColor: theme?.primary ?? couleurs.texte, borderColor: theme?.primary ?? couleurs.texte },
                    pressed && PRESSION,
                  ]}
                >
                  {theme && <View style={[styles.filtrePastille, { backgroundColor: actif ? "#FFFFFF" : theme.primary }]} />}
                  <Text style={[styles.filtreTexte, actif && { color: "#FFFFFF" }]}>{id ? LIBELLE_PARCOURS[id] : "Tous"}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Apparition>

        {aucunResultat && (
          <Apparition mode="pop" style={styles.vide}>
            <Ionicons name="search" size={26} color={couleurs.texteTertiaire} />
            <Text style={styles.videTitre}>Aucun outil pour « {recherche.trim()} »</Text>
            <Text style={styles.videTexte}>Essaie un autre mot, ou enlève le filtre de parcours.</Text>
          </Apparition>
        )}

        {SECTIONS.map((section, indexSection) => {
          const elements = visibles.filter((e) => e.type === section.type);
          if (elements.length === 0) return null;
          const config = CONFIG_ELEMENT_LATERAL[section.type];
          return (
            <Apparition key={section.type} delai={120 + indexSection * 90} style={styles.section}>
              <View style={styles.sectionEntete}>
                <LinearGradient
                  colors={[eclaircir(config.couleur, 0.22), config.couleur]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sectionIcone}
                >
                  <Ionicons name={config.icone} size={17} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.sectionTextes}>
                  <Text style={styles.sectionTitre}>{section.titre}</Text>
                  <Text style={styles.sectionDescription}>{section.description}</Text>
                </View>
              </View>

              <View style={styles.liste}>
                {elements.map((element) => {
                  const debloque = estDebloque(element);
                  const theme = themeDuParcours(element.parcoursId, mode);
                  return (
                    <AppuiRessort
                      key={element.id}
                      disabled={!debloque}
                      echelle={0.975}
                      onPress={() => {
                        haptiqueLegere();
                        setOuvert(element);
                      }}
                      accessibilityLabel={`${element.titre}${debloque ? "" : ", verrouillé"}`}
                      styleContenu={[styles.carte, !debloque && styles.carteVerrouillee]}
                    >
                      {/* Filet vertical à la couleur de la voie : on repère d'un coup
                          d'œil à quel parcours appartient chaque outil, sans lire. */}
                      <View
                        style={[
                          styles.filetParcours,
                          { backgroundColor: debloque ? theme.primary : couleurs.verrouilleBordure },
                        ]}
                      />
                      {debloque ? (
                        <LinearGradient
                          colors={[eclaircir(config.couleur, 0.2), config.couleur]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.carteIcone}
                        >
                          <Ionicons name={config.icone} size={17} color="#FFFFFF" />
                        </LinearGradient>
                      ) : (
                        <View style={[styles.carteIcone, { backgroundColor: couleurs.verrouilleFond }]}>
                          <Ionicons name="lock-closed" size={15} color={couleurs.verrouilleIcone} />
                        </View>
                      )}
                      <View style={styles.carteTextes}>
                        <Text
                          style={[styles.carteTitre, !debloque && { color: couleurs.texteAttenue }]}
                          numberOfLines={2}
                        >
                          {element.titre}
                        </Text>
                        <Text style={styles.carteProvenance}>
                          {LIBELLE_PARCOURS[element.parcoursId] ?? element.parcoursId} · Session {element.session}
                        </Text>
                      </View>
                      {debloque && (
                        <Ionicons name="chevron-forward" size={16} color={couleurs.texteTertiaire} />
                      )}
                    </AppuiRessort>
                  );
                })}
              </View>
            </Apparition>
          );
        })}
        </View>
      </ScrollView>

      <ElementLateralModal element={ouvert} onFermer={() => setOuvert(null)} />
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
      gap: 26,
    },
    corps: {
      paddingHorizontal: 22,
      gap: 26,
    },
    heroProgression: {
      marginTop: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    heroChiffre: {
      ...TYPO.chiffre,
      fontSize: 17,
      lineHeight: 21,
      color: "#FFFFFF",
      minWidth: 54,
      textAlign: "right",
    },
    compteur: {
      ...TYPO.legende,
      marginTop: 8,
      color: "rgba(255,255,255,0.76)",
    },
    glossaire: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.grand,
      padding: 14,
      ...couleurs.ombres.carte,
    },
    glossaireIcone: {
      width: 38,
      height: 38,
      borderRadius: RAYONS.moyen,
      backgroundColor: couleurs.texte,
      alignItems: "center",
      justifyContent: "center",
    },
    glossaireTextes: {
      flex: 1,
      gap: 2,
    },
    glossaireTitre: {
      ...TYPO.label,
      color: couleurs.texte,
    },
    glossaireDetail: {
      ...TYPO.legende,
      color: couleurs.texteAttenue,
    },
    recherche: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.pilule,
      paddingHorizontal: 16,
      paddingVertical: 4,
      ...couleurs.ombres.carte,
    },
    champRecherche: {
      ...TYPO.corpsMoyen,
      flex: 1,
      fontSize: 14.5,
      paddingVertical: 12,
      color: couleurs.texte,
    },
    vide: {
      alignItems: "center",
      gap: 6,
      paddingVertical: 26,
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
    filtres: {
      flexDirection: "row",
      gap: 8,
      // La liste est déjà dans un conteneur au gabarit de l'écran : une marge de plus à
      // droite laisserait un vide après la dernière pastille.
      paddingRight: 2,
    },
    filtre: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: RAYONS.pilule,
      borderWidth: 1.5,
      borderColor: couleurs.bordure,
      backgroundColor: couleurs.surface,
    },
    filtrePastille: {
      width: 8,
      height: 8,
      borderRadius: 999,
    },
    filtreTexte: {
      ...TYPO.label,
      color: couleurs.texte,
    },
    section: {
      gap: 12,
    },
    sectionEntete: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    sectionIcone: {
      width: 34,
      height: 34,
      borderRadius: RAYONS.petit,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionTextes: {
      flex: 1,
    },
    sectionTitre: {
      ...TYPO.titreCarte,
      color: couleurs.texte,
    },
    sectionDescription: {
      ...TYPO.legende,
      color: couleurs.texteAttenue,
    },
    liste: {
      gap: 8,
    },
    carte: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.grand,
      paddingVertical: 13,
      paddingLeft: 18,
      paddingRight: 14,
      borderWidth: 1,
      borderColor: couleurs.bordure,
      overflow: "hidden",
      ...couleurs.ombres.carte,
    },
    carteVerrouillee: {
      backgroundColor: couleurs.surfaceAtone,
      shadowOpacity: 0,
      elevation: 0,
    },
    filetParcours: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 5,
    },
    carteIcone: {
      width: 36,
      height: 36,
      borderRadius: RAYONS.moyen,
      alignItems: "center",
      justifyContent: "center",
    },
    carteTextes: {
      flex: 1,
      gap: 2,
    },
    carteTitre: {
      ...TYPO.label,
      color: couleurs.texte,
    },
    carteProvenance: {
      ...TYPO.legende,
      fontSize: 11.5,
      color: couleurs.texteTertiaire,
    },
  });
