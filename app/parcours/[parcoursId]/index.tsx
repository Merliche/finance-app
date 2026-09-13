import { themeDuParcours } from "../../../src/theme/parcoursTheme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EnteteParcours } from "../../../src/components/chemin/EnteteParcours";
import { iconeVoie } from "../../../src/components/chemin/icones";
import { VueChemin, type CibleSommet } from "../../../src/components/chemin/VueChemin";
import { SqueletteChemin } from "../../../src/components/ui/Squelette";
import { MODE_TEST_TOUT_ACCESSIBLE } from "../../../src/constants/modeTest";
import { obtenirElementsLateraux } from "../../../src/data/content/elementsLateraux";
import { parcoursEstTermine, voieEstDeverrouillee } from "../../../src/domain/parcours/progress";
import { useEngagement } from "../../../src/hooks/useEngagement";
import { useParcours } from "../../../src/hooks/useParcours";
import { useProgressStore } from "../../../src/state/progressStore";
import { useMode, useStyles } from "../../../src/theme/ModeCouleur";
import type { Couleurs } from "../../../src/theme/palettes";
import { TYPO } from "../../../src/theme/typographie";

// Chemin d'un parcours donné (une voie en pratique) : même rendu que la map d'accueil,
// avec la récompense au sommet au lieu de la fourche vers les voies. Header natif masqué :
// le bandeau porte son propre bouton retour et gère la zone sûre du haut.
export default function CheminParcours() {
  const mode = useMode();
  const styles = useStyles(creerStyles);
  const { parcoursId } = useLocalSearchParams<{ parcoursId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const etat = useParcours(parcoursId);
  const parcoursProgression = useProgressStore((state) => state.parcours);
  const emailCapture = useProgressStore((state) => state.emailCapture);
  const engagement = useEngagement();
  const theme = themeDuParcours(parcoursId, mode);

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
  const progressionGlobale = { parcours: parcoursProgression, emailCapture };

  if (!voieEstDeverrouillee(parcours, progressionGlobale) && !MODE_TEST_TOUT_ACCESSIBLE) {
    return (
      <View style={styles.centre}>
        <Text style={styles.messageErreur}>
          Termine d'abord le parcours d'introduction pour débloquer cette voie.
        </Text>
      </View>
    );
  }

  const progression = parcoursProgression[parcours.id];
  const etapesCompletees = progression?.etapesCompletees ?? [];
  const termine = progression ? parcoursEstTermine(parcours, progression) : false;
  const recompenseOuverte = termine || MODE_TEST_TOUT_ACCESSIBLE;

  const sommet =
    parcours.type === "voie"
    ? {
        caption: termine ? "Fiche débloquée" : "Ta fiche de synthèse",
        cibles: [
          {
            cle: "recompense",
            couleur: theme.primary,
            couleurSombre: theme.primaryDark,
            icone: "gift",
            label: recompenseOuverte ? "Ta fiche" : "À débloquer",
            deverrouille: recompenseOuverte,
            onPress: () =>
              router.push({ pathname: "/parcours/[parcoursId]/reward", params: { parcoursId: parcours.id } }),
          } satisfies CibleSommet,
        ],
      }
    : undefined;

  return (
    <View style={styles.conteneur}>
      <EnteteParcours
        titre={parcours.titre}
        icone={iconeVoie(parcours.id)}
        nbCompletees={etapesCompletees.length}
        nbTotal={parcours.etapes.length}
        theme={theme}
        insetHaut={insets.top}
        engagement={engagement}
        onRetour={() => (router.canGoBack() ? router.back() : router.replace("/parcours"))}
      />

      <VueChemin
        parcours={parcours}
        etapesCompletees={etapesCompletees}
        theme={theme}
        elementsLateraux={obtenirElementsLateraux(parcours.id)}
        sommet={sommet}
        onEtapePress={(etapeId) =>
          router.push({
            pathname: "/parcours/[parcoursId]/etape/[etapeId]",
            params: { parcoursId: parcours.id, etapeId },
          })
        }
      />
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
  });
