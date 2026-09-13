import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ResultatEtape } from "../../../../src/domain/parcours/progress";
import { CelebrationEtape, type Celebration } from "../../../../src/components/etape/CelebrationEtape";
import { Exemple } from "../../../../src/components/etape/Exemple";
import { Exercice } from "../../../../src/components/etape/Exercice";
import { Lecon } from "../../../../src/components/etape/Lecon";
import { Quiz } from "../../../../src/components/etape/Quiz";
import { Scenario } from "../../../../src/components/etape/Scenario";
import { Situation } from "../../../../src/components/etape/Situation";
import { iconeEtape, libelleTypeEtape } from "../../../../src/components/chemin/icones";
import { Apparition } from "../../../../src/components/ui/Apparition";
import { BarreProgression } from "../../../../src/components/ui/BarreProgression";
import { FondAnime } from "../../../../src/components/ui/FondAnime";
import { MotifPoints } from "../../../../src/components/ui/MotifPoints";
import { Reflet } from "../../../../src/components/ui/Reflet";
import { SqueletteEtape } from "../../../../src/components/ui/Squelette";
import { infosSession, sessionDeEtape } from "../../../../src/constants/sessions";
import { estimerDureeLecture } from "../../../../src/domain/parcours/lecture";
import { obtenirElementsLateraux } from "../../../../src/data/content/elementsLateraux";
import { calculerSerie, calculerXp, jourLocal, niveauDepuisXp, XP_PAR_ETAPE } from "../../../../src/domain/parcours/engagement";
import { useParcours } from "../../../../src/hooks/useParcours";
import { useProgressStore } from "../../../../src/state/progressStore";
import { eclaircir } from "../../../../src/theme/couleurs";
import { useMode, useStyles } from "../../../../src/theme/ModeCouleur";
import type { Couleurs } from "../../../../src/theme/palettes";
import { PRESSION, RAYONS, themeDuParcours } from "../../../../src/theme/parcoursTheme";
import { TYPO } from "../../../../src/theme/typographie";
import { haptiqueSucces } from "../../../../src/utils/haptique";

export default function EcranEtape() {
  const mode = useMode();
  const styles = useStyles(creerStyles);
  const { parcoursId, etapeId } = useLocalSearchParams<{ parcoursId: string; etapeId: string }>();
  const etat = useParcours(parcoursId);
  const completerEtape = useProgressStore((state) => state.completerEtape);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = themeDuParcours(parcoursId, mode);
  const [celebration, setCelebration] = useState<Celebration | null>(null);

  if (etat.statut === "chargement") {
    return <SqueletteEtape insetHaut={insets.top} />;
  }

  if (etat.statut === "erreur") {
    return (
      <View style={styles.centre}>
        <Text style={styles.messageErreur}>Contenu indisponible : {etat.message}</Text>
      </View>
    );
  }

  const { parcours } = etat;
  const etapesTriees = parcours.etapes.slice().sort((a, b) => a.ordre - b.ordre);
  const etapeIndex = etapesTriees.findIndex((e) => e.id === etapeId);
  const etape = etapesTriees[etapeIndex];

  if (!etape) {
    return (
      <View style={styles.centre}>
        <Text style={styles.messageErreur}>Étape introuvable.</Text>
      </View>
    );
  }

  function retourAuChemin() {
    if (router.canGoBack()) router.back();
    else
      router.replace(
        parcours.type === "intro"
          ? { pathname: "/parcours" }
          : { pathname: "/parcours/[parcoursId]", params: { parcoursId: parcours.id } }
      );
  }

  function onTerminer(resultat: ResultatEtape) {
    const avant = useProgressStore.getState();
    const dejaValidee = (avant.parcours[parcours.id]?.etapesCompletees ?? []).includes(etape.id);
    const niveauAvant = niveauDepuisXp(calculerXp(avant.parcours, avant.defisReussis.length)).niveau;
    completerEtape(parcours, etape.id, resultat);
    haptiqueSucces();

    // On lit l'état APRÈS complétion pour savoir ce que cette étape vient de boucler :
    // juste elle-même, toute sa session, ou le parcours entier.
    const apres = useProgressStore.getState();
    const progression = apres.parcours[parcours.id];
    const completees = new Set(progression?.etapesCompletees ?? []);
    const session = sessionDeEtape(etape);
    const sessionTerminee =
      session !== null && etapesTriees.filter((e) => sessionDeEtape(e) === session).every((e) => completees.has(e.id));
    const parcoursTermine = progression?.statut === "termine";

    const badge =
      session !== null
        ? obtenirElementsLateraux(parcours.id).find((el) => el.type === "badge" && el.session === session)?.titre
        : undefined;
    const infos = session !== null ? infosSession(parcours.id, session) : undefined;
    const niveauApres = niveauDepuisXp(calculerXp(apres.parcours, apres.defisReussis.length)).niveau;

    setCelebration({
      niveau: parcoursTermine ? "parcours" : sessionTerminee ? "session" : "etape",
      titreEtape: etape.titre,
      session: session !== null && infos ? { numero: session, titre: infos.titre } : undefined,
      badge: sessionTerminee ? badge : undefined,
      typeParcours: parcours.type,
      xpGagne: dejaValidee ? 0 : XP_PAR_ETAPE,
      serie: calculerSerie(apres.joursActifs, jourLocal(new Date())),
      niveauAtteint: niveauApres > niveauAvant ? niveauApres : undefined,
    });
  }

  function continuer() {
    setCelebration(null);
    const etapeSuivante = etapesTriees[etapeIndex + 1];
    if (etapeSuivante) {
      // `replace` : les étapes s'enchaînent sans empiler l'historique, le bouton retour
      // ramène toujours au chemin d'où l'on est parti.
      router.replace({
        pathname: "/parcours/[parcoursId]/etape/[etapeId]",
        params: { parcoursId: parcours.id, etapeId: etapeSuivante.id },
      });
    } else {
      retourAuChemin();
    }
  }

  function voirRecompense() {
    setCelebration(null);
    router.replace({ pathname: "/parcours/[parcoursId]/reward", params: { parcoursId: parcours.id } });
  }

  const session = sessionDeEtape(etape);
  const infos = session !== null ? infosSession(parcours.id, session) : undefined;
  const dureeMinutes = estimerDureeLecture(etape);

  return (
    <View style={styles.conteneur}>
      <LinearGradient
        colors={[eclaircir(theme.primary, 0.12), theme.primary, theme.primaryDark]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 8 }]}
      >
        <MotifPoints couleur="#FFFFFF" opacite={0.16} />
        <Reflet />
        <View style={styles.iconeDecor} pointerEvents="none">
          <Ionicons name={iconeEtape(etape)} size={118} color="rgba(255,255,255,0.08)" />
        </View>

        <View style={styles.ligneHaut}>
          <Pressable
            onPress={retourAuChemin}
            accessibilityRole="button"
            accessibilityLabel="Retour au chemin"
            hitSlop={8}
            style={({ pressed }) => [styles.boutonRetour, pressed && PRESSION]}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>
          <View style={styles.pastilleType}>
            <Ionicons name={iconeEtape(etape)} size={13} color="#FFFFFF" />
            <Text style={styles.pastilleTexte}>{libelleTypeEtape(etape)}</Text>
          </View>
          <View style={styles.pastilleType} accessibilityLabel={`Environ ${dureeMinutes} minute${dureeMinutes > 1 ? "s" : ""}`}>
            <Ionicons name="time-outline" size={13} color="#FFFFFF" />
            <Text style={styles.pastilleTexte}>{dureeMinutes} min</Text>
          </View>
          <Text style={styles.compteur}>
            {etapeIndex + 1}/{etapesTriees.length}
          </Text>
        </View>

        <Apparition delai={40}>
          {infos && (
            <Text style={styles.session}>
              Session {session} · {infos.titre}
            </Text>
          )}
          <Text style={styles.titre} accessibilityRole="header">
            {etape.titre}
          </Text>
        </Apparition>

        <Apparition delai={140}>
          <View style={styles.ligneProgression}>
            <BarreProgression
              ratio={(etapeIndex + 1) / etapesTriees.length}
              couleur="#FFFFFF"
              couleurPiste="rgba(255,255,255,0.28)"
              hauteur={6}
            />
          </View>
        </Apparition>
      </LinearGradient>

      {/* Le contenu remonte sur le bandeau comme une feuille : la couleur reste présente sans écraser la lecture */}
      <View style={[styles.feuille, { paddingBottom: insets.bottom }]}>
        {/* Très en retrait : la lecture prime, mais la feuille cesse d'être un aplat
            blanc — ce sont les mêmes nappes que sur le chemin, en beaucoup plus discret. */}
        <FondAnime theme={theme} intensite={0.3} />
        {etape.type === "lecon" && <Lecon etape={etape} onTerminer={onTerminer} theme={theme} />}
        {etape.type === "quiz" && <Quiz etape={etape} parcoursId={parcours.id} onTerminer={onTerminer} theme={theme} />}
        {etape.type === "exemple" && <Exemple etape={etape} onTerminer={onTerminer} theme={theme} />}
        {etape.type === "situation" && <Situation etape={etape} onTerminer={onTerminer} theme={theme} />}
        {etape.type === "exercice" && <Exercice etape={etape} onTerminer={onTerminer} theme={theme} />}
        {etape.type === "scenario" && <Scenario etape={etape} onTerminer={onTerminer} theme={theme} />}
      </View>

      <CelebrationEtape
        celebration={celebration}
        theme={theme}
        onContinuer={continuer}
        onVoirRecompense={parcours.type === "voie" ? voirRecompense : undefined}
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
    hero: {
      paddingHorizontal: 22,
      paddingBottom: 38,
      overflow: "hidden",
    },
    iconeDecor: {
      position: "absolute",
      right: 4,
      bottom: 6,
    },
    ligneHaut: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 16,
    },
    boutonRetour: {
      width: 38,
      height: 38,
      borderRadius: 999,
      backgroundColor: "rgba(255,255,255,0.18)",
      alignItems: "center",
      justifyContent: "center",
    },
    pastilleType: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: RAYONS.pilule,
      backgroundColor: "rgba(255,255,255,0.18)",
    },
    pastilleTexte: {
      ...TYPO.surtitre,
      fontSize: 10,
      color: "#FFFFFF",
    },
    compteur: {
      ...TYPO.legende,
      marginLeft: "auto",
      color: "rgba(255,255,255,0.75)",
    },
    session: {
      ...TYPO.legende,
      color: "rgba(255,255,255,0.75)",
      marginBottom: 6,
    },
    titre: {
      ...TYPO.titreEcran,
      fontSize: 24,
      lineHeight: 30,
      color: "#FFFFFF",
      paddingRight: 40,
    },
    ligneProgression: {
      marginTop: 18,
      flexDirection: "row",
    },
    feuille: {
      flex: 1,
      marginTop: -22,
      backgroundColor: couleurs.fond,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      overflow: "hidden",
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
