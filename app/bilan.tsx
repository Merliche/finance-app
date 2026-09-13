import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Apparition } from "../src/components/ui/Apparition";
import { EnteteEcran } from "../src/components/ui/EnteteEcran";
import { FondAnime } from "../src/components/ui/FondAnime";
import { useCompteur } from "../src/components/ui/useCompteur";
import { infosSession } from "../src/constants/sessions";
import { VOIES } from "../src/constants/voies";
import { recupererParcoursBundle } from "../src/data/content";
import { bilanDuParcours, compterPoints, compterTermes, type ParcoursBilan } from "../src/domain/parcours/bilan";
import { formaterMoisAnnee, verificationLaPlusAncienne } from "../src/domain/parcours/sources";
import type { Parcours } from "../src/domain/parcours/types";
import { useProgressStore } from "../src/state/progressStore";
import { delaiCascade } from "../src/theme/animation";
import { useCouleurs, useMode, useStyles } from "../src/theme/ModeCouleur";
import type { Couleurs } from "../src/theme/palettes";
import { PRESSION, RAYONS, teinteEcran, themeDuParcours } from "../src/theme/parcoursTheme";
import { TYPO } from "../src/theme/typographie";
import { haptiqueLegere } from "../src/utils/haptique";

const PARCOURS_IDS = ["intro", ...VOIES.map((v) => v.id)];

/**
 * Le bilan : tout ce qui a été retenu, rassemblé en une page relisible. C'est le seul
 * écran de l'app qui ne demande rien — on vient y constater ce qu'on sait.
 */
export default function Bilan() {
  const mode = useMode();
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const progression = useProgressStore((state) => state.parcours);
  const [deplie, setDeplie] = useState<Record<string, boolean>>({});

  const bilans = PARCOURS_IDS.map((parcoursId) => {
    const parcours = recupererParcoursBundle(parcoursId);
    return parcours ? bilanDuParcours(parcours, progression[parcoursId]) : undefined;
  }).filter((bilan): bilan is ParcoursBilan => bilan !== undefined && bilan.sessions.length > 0);

  const verifieLe = verificationLaPlusAncienne(
    PARCOURS_IDS.map(recupererParcoursBundle).filter((p): p is Parcours => p !== undefined)
  );
  const nbPoints = compterPoints(bilans);
  const nbTermes = compterTermes(bilans);
  const pointsAffiches = useCompteur(nbPoints, 900);

  const retour = () => (router.canGoBack() ? router.back() : router.replace("/parcours"));

  if (bilans.length === 0) {
    // L'état vide porte le même bandeau que l'écran rempli. Sans lui, il n'offrait aucune
    // sortie depuis que les en-têtes natifs sont masqués : un cul-de-sac.
    return (
      <View style={styles.ecran}>
        <View style={styles.fond} pointerEvents="none">
          <FondAnime theme={themeDuParcours("intro", mode)} intensite={0.28} />
        </View>
        <EnteteEcran
          surtitre="Ce que tu sais maintenant"
          titre="Ton bilan, point par point."
          icone="ribbon"
          teinte={teinteEcran("bilan")}
          insetHaut={insets.top}
          onRetour={retour}
        />
        <ScrollView
          contentContainerStyle={styles.centreDefilant}
          showsVerticalScrollIndicator={false}
        >
          <Apparition mode="pop" style={styles.videCercle}>
            <Ionicons name="book-outline" size={30} color={couleurs.texteTertiaire} />
          </Apparition>
          <Apparition delai={140}>
            <Text style={styles.videTitre}>Ton bilan se remplit tout seul</Text>
            <Text style={styles.videTexte}>
              Chaque leçon terminée dépose ici ce qu'il faut en retenir. Reviens après ta
              première session.
            </Text>
          </Apparition>
        </ScrollView>
      </View>
    );
  }

  return (
    <>
      <View style={styles.fond} pointerEvents="none">
        <FondAnime theme={themeDuParcours("intro", mode)} intensite={0.28} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.conteneur, { paddingBottom: insets.bottom + 36 }]}
        showsVerticalScrollIndicator={false}
      >
        <EnteteEcran
          surtitre="Ce que tu sais maintenant"
          titre="Ton bilan, point par point."
          icone="ribbon"
          teinte={teinteEcran("bilan")}
          insetHaut={insets.top}
          onRetour={retour}
        >
          <View style={styles.ligneChiffre}>
            <Text style={styles.chiffre}>{pointsAffiches}</Text>
            <Text style={styles.chiffreUnite}>
              point{nbPoints > 1 ? "s" : ""} retenu{nbPoints > 1 ? "s" : ""}
            </Text>
          </View>
          <Text style={styles.intro}>
            Et {nbTermes} terme{nbTermes > 1 ? "s" : ""} de finance que tu sais définir. Tout ce
            qui suit vient des leçons que tu as réellement terminées.
          </Text>
        </EnteteEcran>

        <View style={styles.corps}>

      {bilans.map((bilan, indexBilan) => {
        const theme = themeDuParcours(bilan.parcoursId, mode);
        const ouvert = deplie[bilan.parcoursId] ?? indexBilan === 0;
        const nbPointsParcours = bilan.sessions.reduce((n, session) => n + session.points.length, 0);

        return (
          <Apparition key={bilan.parcoursId} delai={delaiCascade(indexBilan, 60)} style={styles.bloc}>
            <Pressable
              onPress={() => {
                haptiqueLegere();
                setDeplie((precedent) => ({ ...precedent, [bilan.parcoursId]: !ouvert }));
              }}
              accessibilityRole="button"
              accessibilityState={{ expanded: ouvert }}
              style={({ pressed }) => [styles.enteteParcours, { backgroundColor: theme.tint }, pressed && PRESSION]}
            >
              <View style={[styles.pastilleParcours, { backgroundColor: theme.primary }]} />
              <View style={styles.enteteTextes}>
                <Text style={styles.parcoursTitre}>{bilan.titre}</Text>
                <Text style={styles.parcoursCompte}>
                  {nbPointsParcours} point{nbPointsParcours > 1 ? "s" : ""} · {bilan.nbEtapesValidees}/
                  {bilan.nbEtapesTotal} étapes
                </Text>
              </View>
              <Ionicons name={ouvert ? "chevron-up" : "chevron-down"} size={18} color={theme.primary} />
            </Pressable>

            {ouvert &&
              bilan.sessions.map((session) => {
                const infos = infosSession(bilan.parcoursId, session.numero);
                return (
                  <View key={session.numero} style={styles.session}>
                    <View style={styles.sessionEntete}>
                      <Text style={[styles.sessionNumero, { color: theme.primary }]}>Session {session.numero}</Text>
                      {infos && (
                        <Text style={styles.sessionTitre} numberOfLines={1}>
                          {infos.titre}
                        </Text>
                      )}
                    </View>

                    {session.points.map((point, index) => (
                      <View key={index} style={styles.ligne}>
                        <View style={[styles.coche, { backgroundColor: theme.primary }]}>
                          <Ionicons name="checkmark-sharp" size={11} color="#FFFFFF" />
                        </View>
                        <Text style={styles.point}>{point}</Text>
                      </View>
                    ))}

                    {session.termes.length > 0 && (
                      <Text style={styles.termes}>
                        <Text style={styles.termesLabel}>Termes : </Text>
                        {session.termes.join(" · ")}
                      </Text>
                    )}
                  </View>
                );
              })}
          </Apparition>
        );
      })}

      <Text style={styles.mention}>
        Contenu éducatif — ne constitue pas un conseil en investissement.
        {verifieLe ? ` Chiffres vérifiés en ${formaterMoisAnnee(verifieLe) ?? verifieLe}.` : ""}
      </Text>
        </View>
      </ScrollView>
    </>
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
      gap: 22,
    },
    corps: {
      paddingHorizontal: 22,
      gap: 22,
    },
    // Conteneur défilant : `flexGrow` garde le centrage quand le contenu tient, et
    // autorise le défilement quand il dépasse — sur un écran court, le paragraphe
    // d'explication était purement coupé.
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
      width: 70,
      height: 70,
      borderRadius: 999,
      backgroundColor: couleurs.surfaceAtone,
      alignItems: "center",
      justifyContent: "center",
    },
    videTitre: {
      ...TYPO.titreSection,
      color: couleurs.texte,
      textAlign: "center",
    },
    videTexte: {
      ...TYPO.corps,
      marginTop: 8,
      color: couleurs.texteAttenue,
      textAlign: "center",
    },
    ligneChiffre: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 9,
      marginTop: 16,
    },
    chiffre: {
      ...TYPO.chiffre,
      fontSize: 52,
      lineHeight: 58,
      letterSpacing: -2.2,
      color: "#FFFFFF",
    },
    chiffreUnite: {
      ...TYPO.titreSection,
      color: "rgba(255,255,255,0.82)",
    },
    intro: {
      ...TYPO.corps,
      fontSize: 14.5,
      lineHeight: 22,
      marginTop: 8,
      color: "rgba(255,255,255,0.78)",
    },
    bloc: {
      gap: 12,
    },
    enteteParcours: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderRadius: RAYONS.carte,
      padding: 14,
    },
    pastilleParcours: {
      width: 8,
      height: 34,
      borderRadius: RAYONS.pilule,
    },
    enteteTextes: {
      flex: 1,
      gap: 2,
    },
    parcoursTitre: {
      ...TYPO.titreCarte,
      color: couleurs.texte,
    },
    parcoursCompte: {
      ...TYPO.legende,
      color: couleurs.texteAttenue,
    },
    session: {
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.carte,
      padding: 16,
      gap: 10,
      ...couleurs.ombres.carte,
    },
    sessionEntete: {
      gap: 2,
    },
    sessionNumero: {
      ...TYPO.surtitre,
    },
    sessionTitre: {
      ...TYPO.titreCarte,
      color: couleurs.texte,
    },
    ligne: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    coche: {
      width: 18,
      height: 18,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    point: {
      ...TYPO.corpsMoyen,
      flex: 1,
      fontSize: 14.5,
      lineHeight: 21,
      color: couleurs.texte,
    },
    termes: {
      ...TYPO.legende,
      marginTop: 2,
      color: couleurs.texteAttenue,
    },
    termesLabel: {
      ...TYPO.surtitre,
      fontSize: 10,
      color: couleurs.texteTertiaire,
    },
    mention: {
      ...TYPO.legende,
      fontSize: 11.5,
      textAlign: "center",
      color: couleurs.texteTertiaire,
    },
  });
