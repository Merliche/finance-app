import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Apparition } from "../src/components/ui/Apparition";
import { EnteteEcran } from "../src/components/ui/EnteteEcran";
import { FondAnime } from "../src/components/ui/FondAnime";
import { BarreProgression } from "../src/components/ui/BarreProgression";
import { VOIES } from "../src/constants/voies";
import { recupererParcoursBundle } from "../src/data/content";
import { questionsARevoir } from "../src/domain/parcours/revision";
import type { Parcours } from "../src/domain/parcours/types";
import { useProgressStore } from "../src/state/progressStore";
import { useCouleurs, useMode, useStyles } from "../src/theme/ModeCouleur";
import type { Couleurs } from "../src/theme/palettes";
import { PRESSION, RAYONS, teinteEcran, themeDuParcours } from "../src/theme/parcoursTheme";
import { TYPO } from "../src/theme/typographie";
import { haptiqueErreur, haptiqueLegere, haptiqueSucces } from "../src/utils/haptique";

const PARCOURS_IDS = ["intro", ...VOIES.map((v) => v.id)];

/**
 * Les trois états de la révision — rien à revoir, série en cours, série terminée —
 * partagent le même bandeau et le même fond. Les enfermer dans un cadre commun évite que
 * l'écran change d'allure selon l'état, et garantit qu'un retour reste toujours atteignable
 * (l'état « rien à revoir » n'en offrait aucun).
 */
function CadreRevision({
  insetHaut,
  onRetour,
  enfants,
  entete,
}: {
  insetHaut: number;
  onRetour: () => void;
  enfants: React.ReactNode;
  entete?: React.ReactNode;
}) {
  const mode = useMode();
  const styles = useStyles(creerStyles);
  return (
    <View style={styles.ecran}>
      <View style={styles.fond} pointerEvents="none">
        <FondAnime theme={themeDuParcours("intro", mode)} intensite={0.28} />
      </View>
      <EnteteEcran
        surtitre="Révision"
        titre="Retravaille ce que tu as manqué."
        icone="refresh-circle"
        teinte={teinteEcran("revision")}
        insetHaut={insetHaut}
        onRetour={onRetour}
      >
        {entete}
      </EnteteEcran>
      {enfants}
    </View>
  );
}

const LETTRES = ["A", "B", "C", "D", "E"];

/**
 * Révision : on repose une par une les questions déjà manquées, des plus tenaces aux plus
 * anciennes. Une bonne réponse suffit à sortir une question de la liste — le but est d'y
 * revenir une fois de plus, pas de faire payer l'erreur.
 *
 * La liste vient du store et se vide au fur et à mesure. On fige donc l'ordre au montage
 * (`useMemo` sans dépendance sur le store), sinon retirer une question ferait sauter la
 * suivante sous le doigt.
 */
export default function Revision() {
  const mode = useMode();
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const questionsRatees = useProgressStore((state) => state.questionsRatees);
  const enregistrerReponses = useProgressStore((state) => state.enregistrerReponses);

  const [index, setIndex] = useState(0);
  const [choix, setChoix] = useState<number | undefined>();
  const [corrige, setCorrige] = useState(false);
  const [reussies, setReussies] = useState(0);

  const file = useMemo(() => {
    const parcours = PARCOURS_IDS.map(recupererParcoursBundle).filter((p): p is Parcours => p !== undefined);
    return questionsARevoir(questionsRatees, parcours);
    // Volontairement figé au montage : voir le commentaire du composant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const courante = file[index];
  const termine = index >= file.length;
  const theme = themeDuParcours(courante?.parcoursId ?? "intro", mode);

  function valider() {
    if (choix === undefined || !courante) return;
    const correcte = choix === courante.question.bonneReponseIndex;
    setCorrige(true);
    if (correcte) {
      setReussies((n) => n + 1);
      haptiqueSucces();
    } else {
      haptiqueErreur();
    }
    enregistrerReponses(courante.parcoursId, courante.etapeId, [{ questionId: courante.questionId, correcte }]);
  }

  function suivante() {
    haptiqueLegere();
    setIndex((i) => i + 1);
    setChoix(undefined);
    setCorrige(false);
  }

  if (file.length === 0) {
    return (
      <CadreRevision
        insetHaut={insets.top}
        onRetour={() => (router.canGoBack() ? router.back() : router.replace("/parcours"))}
        enfants={
          <ScrollView
            contentContainerStyle={[styles.centreDefilant, { paddingBottom: insets.bottom + 32 }]}
            showsVerticalScrollIndicator={false}
          >
            <Apparition mode="pop" style={styles.videCercle}>
              <Ionicons name="checkmark-done" size={34} color={couleurs.succes} />
            </Apparition>
            <Apparition delai={140}>
              <Text style={styles.videTitre}>Rien à revoir</Text>
              <Text style={styles.videTexte}>
                Toutes les questions que tu as manquées ont été retravaillées. Les prochaines
                erreurs atterriront ici automatiquement.
              </Text>
            </Apparition>
          </ScrollView>
        }
      />
    );
  }

  if (termine) {
    const restantes = Object.keys(questionsRatees).length;
    return (
      <CadreRevision
        insetHaut={insets.top}
        onRetour={() => (router.canGoBack() ? router.back() : router.replace("/parcours"))}
        enfants={
      <ScrollView
        contentContainerStyle={[styles.centreDefilant, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Apparition mode="pop" style={styles.videCercle}>
          <Ionicons name="sparkles" size={32} color={couleurs.succes} />
        </Apparition>
        <Apparition delai={140}>
          <Text style={styles.videTitre}>
            {reussies} sur {file.length}
          </Text>
          <Text style={styles.videTexte}>
            {restantes === 0
              ? "Tout est retravaillé. Ta liste de révision est vide."
              : `Il reste ${restantes} question${restantes > 1 ? "s" : ""} à revoir — reviens quand tu veux.`}
          </Text>
        </Apparition>
        <Apparition delai={260} style={styles.videActions}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            style={({ pressed }) => [styles.boutonPrincipal, { backgroundColor: theme.primary }, pressed && PRESSION]}
          >
            <Text style={styles.boutonPrincipalTexte}>Terminer</Text>
          </Pressable>
        </Apparition>
      </ScrollView>
        }
      />
    );
  }

  const { question } = courante;

  return (
    <CadreRevision
      insetHaut={insets.top}
      onRetour={() => (router.canGoBack() ? router.back() : router.replace("/parcours"))}
      entete={
        <View style={styles.entete}>
          <Text style={styles.compteur}>
            {index + 1} / {file.length}
          </Text>
          <BarreProgression
            ratio={index / file.length}
            couleur="#FFFFFF"
            couleurPiste="rgba(255,255,255,0.26)"
            hauteur={6}
          />
        </View>
      }
      enfants={
    <ScrollView
      contentContainerStyle={[styles.conteneur, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >

      <Apparition key={courante.questionId} mode="pop" style={styles.carte}>
        <View style={styles.origine}>
          <View style={[styles.pastille, { backgroundColor: theme.tint }]}>
            <Ionicons name="refresh" size={12} color={theme.primary} />
          </View>
          <Text style={styles.origineTexte} numberOfLines={1}>
            {courante.etapeTitre}
          </Text>
          {courante.nbEchecs > 1 && (
            <Text style={styles.echecs}>manquée {courante.nbEchecs} fois</Text>
          )}
        </View>

        <Text style={styles.enonce}>{question.question}</Text>

        {question.choix.map((texte, indexChoix) => {
          const selectionne = choix === indexChoix;
          const estBonne = indexChoix === question.bonneReponseIndex;
          const montreBonne = corrige && estBonne;
          const montreErreur = corrige && selectionne && !estBonne;
          const couleur = montreBonne
            ? couleurs.succes
            : montreErreur
              ? couleurs.erreur
              : selectionne
                ? theme.primary
                : "transparent";
          const fond = montreBonne
            ? couleurs.succesFond
            : montreErreur
              ? couleurs.erreurFond
              : selectionne
                ? theme.tint
                : couleurs.surfaceAtone;

          return (
            <Pressable
              key={indexChoix}
              disabled={corrige}
              onPress={() => {
                haptiqueLegere();
                setChoix(indexChoix);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: selectionne }}
              style={({ pressed }) => [
                styles.choix,
                { borderColor: couleur, backgroundColor: fond },
                pressed && !corrige && { opacity: 0.85 },
              ]}
            >
              <View
                style={[
                  styles.lettre,
                  { backgroundColor: selectionne || montreBonne ? (couleur === "transparent" ? theme.primary : couleur) : couleurs.surface },
                ]}
              >
                {montreBonne ? (
                  <Ionicons name="checkmark-sharp" size={14} color="#FFFFFF" />
                ) : montreErreur ? (
                  <Ionicons name="close-sharp" size={14} color="#FFFFFF" />
                ) : (
                  <Text style={[styles.lettreTexte, { color: selectionne ? "#FFFFFF" : couleurs.texteAttenue }]}>
                    {LETTRES[indexChoix] ?? indexChoix + 1}
                  </Text>
                )}
              </View>
              <Text style={styles.choixTexte}>{texte}</Text>
            </Pressable>
          );
        })}
      </Apparition>

      {corrige ? (
        <Apparition mode="pop" style={styles.actions}>
          <Pressable
            onPress={suivante}
            accessibilityRole="button"
            style={({ pressed }) => [styles.boutonPrincipal, { backgroundColor: theme.primary }, pressed && PRESSION]}
          >
            <Text style={styles.boutonPrincipalTexte}>
              {index + 1 < file.length ? "Question suivante" : "Voir le bilan"}
            </Text>
            <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
          </Pressable>
        </Apparition>
      ) : (
        <View style={styles.actions}>
          <Pressable
            onPress={valider}
            disabled={choix === undefined}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.boutonPrincipal,
              { backgroundColor: choix === undefined ? couleurs.verrouilleFond : theme.primary },
              pressed && choix !== undefined && PRESSION,
            ]}
          >
            <Text style={[styles.boutonPrincipalTexte, choix === undefined && { color: couleurs.texteTertiaire }]}>
              Valider
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
      }
    />
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    ecran: {
      flex: 1,
      backgroundColor: couleurs.fond,
    },
    fond: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    conteneur: {
      padding: 22,
      gap: 22,
    },
    // Voir le commentaire équivalent dans le Bilan : sous un bandeau, un état vide non
    // défilant se fait couper dès que l'écran est court.
    centreDefilant: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
      gap: 14,
    },
    centre: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
      gap: 14,
    },
    videCercle: {
      width: 72,
      height: 72,
      borderRadius: 999,
      backgroundColor: couleurs.succesFond,
      alignItems: "center",
      justifyContent: "center",
    },
    videTitre: {
      ...TYPO.titreEcran,
      fontSize: 24,
      color: couleurs.texte,
      textAlign: "center",
    },
    videTexte: {
      ...TYPO.corps,
      marginTop: 8,
      color: couleurs.texteAttenue,
      textAlign: "center",
    },
    videActions: {
      alignSelf: "stretch",
      marginTop: 10,
    },
    entete: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 16,
    },
    compteur: {
      ...TYPO.chiffre,
      fontSize: 15,
      lineHeight: 19,
      color: "#FFFFFF",
      minWidth: 52,
    },
    carte: {
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.carte,
      padding: 18,
      gap: 10,
      ...couleurs.ombres.carte,
    },
    origine: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    pastille: {
      width: 22,
      height: 22,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    origineTexte: {
      ...TYPO.legende,
      flex: 1,
      color: couleurs.texteAttenue,
    },
    echecs: {
      ...TYPO.legende,
      fontSize: 11,
      color: couleurs.erreur,
    },
    enonce: {
      ...TYPO.titreCarte,
      fontSize: 16.5,
      lineHeight: 23,
      color: couleurs.texte,
      marginBottom: 4,
    },
    choix: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      borderWidth: 2,
      borderRadius: RAYONS.grand,
      paddingVertical: 13,
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
      fontSize: 14.5,
      color: couleurs.texte,
    },
    actions: {
      gap: 10,
    },
    boutonPrincipal: {
      borderRadius: RAYONS.grand,
      paddingVertical: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    boutonPrincipalTexte: {
      ...TYPO.bouton,
      color: "#FFFFFF",
    },
  });
