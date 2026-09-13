import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ElementLateralModal } from "../../src/components/chemin/ElementLateralModal";
import { EnteteParcours } from "../../src/components/chemin/EnteteParcours";
import { iconeVoie } from "../../src/components/chemin/icones";
import { VueChemin, type CibleSommet } from "../../src/components/chemin/VueChemin";
import { DefiDuJourModal } from "../../src/components/defi/DefiDuJourModal";
import { Apparition } from "../../src/components/ui/Apparition";
import { SqueletteChemin } from "../../src/components/ui/Squelette";
import { VOIES } from "../../src/constants/voies";
import { recupererParcoursBundle } from "../../src/data/content";
import { obtenirElementsLateraux, saviezVousDuJour } from "../../src/data/content/elementsLateraux";
import type { ElementLateral } from "../../src/domain/elementsLateraux/types";
import { jourLocal } from "../../src/domain/parcours/engagement";
import { trouverReprise } from "../../src/domain/parcours/reprise";
import type { Parcours } from "../../src/domain/parcours/types";
import { useDefiDuJour } from "../../src/hooks/useDefiDuJour";
import { useEngagement } from "../../src/hooks/useEngagement";
import { useParcours } from "../../src/hooks/useParcours";
import { useProgressStore } from "../../src/state/progressStore";
import { useMode, useStyles } from "../../src/theme/ModeCouleur";
import type { Couleurs } from "../../src/theme/palettes";
import { PRESSION, RAYONS, themeDuParcours } from "../../src/theme/parcoursTheme";
import { TYPO } from "../../src/theme/typographie";
import { haptiqueLegere } from "../../src/utils/haptique";

// Écran d'accueil : le chemin de l'intro, puis la fourche vers les 3 voies au sommet.
// Le header natif est masqué (voir _layout.tsx) : le bandeau gère la zone sûre du haut.
export default function Map() {
  const mode = useMode();
  const styles = useStyles(creerStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const etat = useParcours("intro");
  const progressionParcours = useProgressStore((state) => state.parcours);
  const engagement = useEngagement();
  const defi = useDefiDuJour();
  const [anecdoteOuverte, setAnecdoteOuverte] = useState<ElementLateral | null>(null);
  const [defiOuvert, setDefiOuvert] = useState(false);

  if (etat.statut === "chargement") {
    return <SqueletteChemin insetHaut={insets.top} />;
  }

  if (etat.statut === "erreur") {
    return (
      <View style={styles.centre}>
        <Text style={styles.messageErreur}>Contenu indisponible : {etat.message}</Text>
      </View>
    );
  }

  const { parcours } = etat;
  const theme = themeDuParcours(parcours.id, mode);
  const progressionIntro = progressionParcours[parcours.id];
  const etapesCompletees = progressionIntro?.etapesCompletees ?? [];
  const introTerminee = progressionIntro?.statut === "termine";
  const anecdoteDuJour = saviezVousDuJour(jourLocal(new Date()));

  // Reprise : on ne la propose que si elle mène ailleurs que sur cette carte. Pour l'intro,
  // la bulle « À suivre » est déjà posée à côté du nœud courant — une pastille de plus
  // ferait doublon.
  const reprise = trouverReprise(
    VOIES.map((voie) => recupererParcoursBundle(voie.id)).filter((p): p is Parcours => p !== undefined),
    progressionParcours
  );

  const cibles: CibleSommet[] = VOIES.map((voie) => {
    const themeVoie = themeDuParcours(voie.id, mode);
    return {
      cle: voie.id,
      couleur: themeVoie.primary,
      couleurSombre: themeVoie.primaryDark,
      icone: iconeVoie(voie.id),
      label: voie.labelParDefaut,
      deverrouille: introTerminee,
      onPress: () => router.push({ pathname: "/parcours/[parcoursId]", params: { parcoursId: voie.id } }),
    };
  });

  return (
    <View style={styles.conteneur}>
      <EnteteParcours
        titre={parcours.titre}
        icone="compass"
        nbCompletees={etapesCompletees.length}
        nbTotal={parcours.etapes.length}
        theme={theme}
        insetHaut={insets.top}
        engagement={engagement}
        actions={[
          { icone: "grid", label: "Boîte à outils", onPress: () => router.push("/outils") },
          { icone: "person", label: "Profil", onPress: () => router.push("/profil") },
        ]}
      >
        {reprise && (
          <Apparition mode="pop" delai={300}>
            <Pressable
              onPress={() => {
                haptiqueLegere();
                router.push({
                  pathname: "/parcours/[parcoursId]/etape/[etapeId]",
                  params: { parcoursId: reprise.parcoursId, etapeId: reprise.etape.id },
                });
              }}
              accessibilityRole="button"
              accessibilityLabel={`Reprendre ${reprise.parcoursTitre} : ${reprise.etape.titre}`}
              style={({ pressed }) => [styles.reprise, pressed && PRESSION]}
            >
              <View style={styles.repriseIcone}>
                <Ionicons name="play" size={15} color={themeDuParcours(reprise.parcoursId, mode).primary} />
              </View>
              <View style={styles.repriseTextes}>
                <Text style={styles.repriseSurtitre}>Reprendre · {reprise.parcoursTitre}</Text>
                <Text style={styles.repriseTitre} numberOfLines={1}>
                  {reprise.etape.titre}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color="rgba(255,255,255,0.75)" />
            </Pressable>
          </Apparition>
        )}

        <View style={styles.rangeeBas}>
          {defi.defi && (
            <Apparition mode="pop" delai={380}>
              <Pressable
                onPress={() => {
                  haptiqueLegere();
                  setDefiOuvert(true);
                }}
                accessibilityRole="button"
                accessibilityLabel={defi.dejaJoue ? "Défi du jour, déjà joué" : "Défi du jour"}
                style={({ pressed }) => [styles.pilule, styles.piluleDefi, pressed && PRESSION]}
              >
                <Ionicons name={defi.dejaJoue ? (defi.dejaReussi ? "checkmark-circle" : "time") : "flash"} size={13} color="#FFFFFF" />
                <Text style={styles.piluleTexte}>{defi.dejaJoue ? "Défi relevé" : "Défi du jour"}</Text>
              </Pressable>
            </Apparition>
          )}
          {anecdoteDuJour && (
            <Apparition mode="pop" delai={420}>
              <Pressable
                onPress={() => {
                  haptiqueLegere();
                  setAnecdoteOuverte(anecdoteDuJour);
                }}
                accessibilityRole="button"
                style={({ pressed }) => [styles.pilule, pressed && PRESSION]}
              >
                <Ionicons name="bulb" size={13} color="#FFD166" />
                <Text style={styles.piluleTexte}>Le saviez-vous du jour</Text>
              </Pressable>
            </Apparition>
          )}
          <Link href="/a-propos" asChild>
            <Pressable accessibilityRole="link" hitSlop={6} style={({ pressed }) => [styles.pilule, pressed && PRESSION]}>
              <Ionicons name="information-circle" size={13} color="rgba(255,255,255,0.85)" />
              <Text style={styles.piluleTexte}>Pas un conseil en investissement</Text>
            </Pressable>
          </Link>
        </View>
      </EnteteParcours>

      <VueChemin
        parcours={parcours}
        etapesCompletees={etapesCompletees}
        theme={theme}
        elementsLateraux={obtenirElementsLateraux(parcours.id)}
        sommet={{ caption: "Choisis ta voie", cibles }}
        onEtapePress={(etapeId) =>
          router.push({
            pathname: "/parcours/[parcoursId]/etape/[etapeId]",
            params: { parcoursId: parcours.id, etapeId },
          })
        }
      />

      <ElementLateralModal element={anecdoteOuverte} onFermer={() => setAnecdoteOuverte(null)} />
      {defiOuvert && defi.defi && (
        <DefiDuJourModal
          defi={defi.defi}
          dejaJoue={defi.dejaJoue}
          dejaReussi={defi.dejaReussi}
          libelleParcours={defi.defi.parcoursId === "intro" ? "Intro" : VOIES.find((v) => v.id === defi.defi?.parcoursId)?.labelParDefaut ?? ""}
          theme={themeDuParcours(defi.defi.parcoursId, mode)}
          onRepondre={defi.jouer}
          onFermer={() => setDefiOuvert(false)}
        />
      )}
    </View>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    conteneur: {
      flex: 1,
      backgroundColor: couleurs.fond,
    },
    centre: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    messageErreur: {
      ...TYPO.corpsMoyen,
      color: couleurs.texteAttenue,
      textAlign: "center",
    },
    reprise: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 16,
      backgroundColor: "rgba(255,255,255,0.16)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.28)",
      borderRadius: RAYONS.grand,
      paddingVertical: 11,
      paddingHorizontal: 13,
    },
    repriseIcone: {
      width: 32,
      height: 32,
      borderRadius: 999,
      backgroundColor: couleurs.surface,
      alignItems: "center",
      justifyContent: "center",
      paddingLeft: 2,
    },
    repriseTextes: {
      flex: 1,
      gap: 2,
    },
    repriseSurtitre: {
      ...TYPO.surtitre,
      fontSize: 9.5,
      color: "rgba(255,255,255,0.8)",
    },
    repriseTitre: {
      ...TYPO.label,
      color: "#FFFFFF",
    },
    rangeeBas: {
      marginTop: 14,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    pilule: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(0,0,0,0.18)",
      borderRadius: RAYONS.pilule,
      paddingVertical: 7,
      paddingHorizontal: 11,
    },
    piluleDefi: {
      backgroundColor: "rgba(255,255,255,0.22)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.35)",
    },
    piluleTexte: {
      ...TYPO.legende,
      fontSize: 11.5,
      color: "rgba(255,255,255,0.92)",
    },
  });
