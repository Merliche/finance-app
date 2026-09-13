import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import type { InfosSession } from "../../constants/sessions";
import { LIBELLE_NIVEAU } from "../../constants/sessions";
import type { ElementLateral } from "../../domain/elementsLateraux/types";
import { avecAlpha, eclaircir } from "../../theme/couleurs";
import { useCouleurs, useMode, useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { PRESSION, RAYONS, themeDuParcours } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";
import { BarreProgression } from "../ui/BarreProgression";
import { FeuilleModale } from "../ui/FeuilleModale";
import { MotifPoints } from "../ui/MotifPoints";
import { Reflet } from "../ui/Reflet";

export interface BadgeOuvert {
  badge: ElementLateral;
  gagne: boolean;
  /** Étapes validées et total de la session qui porte le badge. */
  faites: number;
  total: number;
  parcoursTitre: string;
  infos?: InfosSession;
}

/**
 * Fiche d'un badge : d'où il vient, et surtout comment on l'obtient.
 *
 * Dans la grille du profil, un badge n'est qu'un ruban et deux mots — on sait qu'on l'a,
 * jamais pourquoi. La fiche répond aux deux questions qu'on se pose en tapant dessus :
 * de quelle session il vient, et ce qu'il a fallu faire. Elle reste utile sur un badge
 * non obtenu, où elle devient une consigne : il reste tant d'étapes, dans telle session.
 */
export function FicheBadge({ ouvert, onFermer }: { ouvert: BadgeOuvert | null; onFermer: () => void }) {
  const mode = useMode();
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  if (!ouvert || ouvert.badge.type !== "badge") return null;

  const { badge, gagne, faites, total, parcoursTitre, infos } = ouvert;
  const theme = themeDuParcours(badge.parcoursId, mode);
  const restantes = Math.max(total - faites, 0);

  return (
    <FeuilleModale visible onFermer={onFermer} hauteurMax="80%">
      <ScrollView contentContainerStyle={styles.contenu} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={
            gagne
              ? [eclaircir(theme.primary, 0.16), theme.primary, theme.primaryDark]
              : [couleurs.surfaceAtone, couleurs.verrouilleFond]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bandeau}
        >
          {gagne && <MotifPoints couleur="#FFFFFF" opacite={0.14} pas={18} />}
          <View style={styles.medaille}>
            {gagne && <Reflet duree={1700} pause={2800} intensite={0.36} largeur={0.5} />}
            <Ionicons
              name={gagne ? "ribbon" : "lock-closed"}
              size={34}
              color={gagne ? "#FFFFFF" : couleurs.verrouilleIcone}
            />
          </View>
          <Text style={[styles.etat, !gagne && styles.etatVerrouille]}>
            {gagne ? "Badge obtenu" : "Badge à débloquer"}
          </Text>
          <Text style={[styles.titre, !gagne && styles.titreVerrouille]}>{badge.titre}</Text>
        </LinearGradient>

        <View style={styles.corps}>
          <View style={styles.provenance}>
            <View style={[styles.puce, { backgroundColor: avecAlpha(theme.primary, 0.12) }]}>
              <Ionicons name={infos?.icone ?? "flag-outline"} size={15} color={theme.primary} />
            </View>
            <View style={styles.provenanceTextes}>
              <Text style={[styles.provenanceSurtitre, { color: theme.primary }]}>
                {parcoursTitre} · Session {badge.session}
                {infos ? ` · ${LIBELLE_NIVEAU[infos.niveau]}` : ""}
              </Text>
              {infos && <Text style={styles.provenanceTitre}>{infos.titre}</Text>}
            </View>
          </View>

          <Text style={styles.description}>{badge.description}</Text>

          <View style={[styles.condition, { borderColor: avecAlpha(theme.primary, 0.2) }]}>
            <View style={styles.conditionLigne}>
              <Ionicons
                name={gagne ? "checkmark-circle" : "flag-outline"}
                size={16}
                color={gagne ? couleurs.succes : theme.primary}
              />
              <Text style={styles.conditionTitre}>Comment on l&apos;obtient</Text>
            </View>
            <Text style={styles.conditionTexte}>
              {total > 0
                ? `En validant les ${total} étapes de la session ${badge.session}.`
                : "En terminant la session correspondante."}
            </Text>
            {total > 0 && (
              <>
                <View style={styles.avancement}>
                  <BarreProgression
                    ratio={faites / total}
                    couleur={gagne ? couleurs.succes : theme.primary}
                    couleurPiste={couleurs.verrouilleFond}
                    hauteur={7}
                  />
                  <Text style={styles.avancementChiffre}>
                    {faites}/{total}
                  </Text>
                </View>
                <Text style={styles.avancementDetail}>
                  {gagne
                    ? "Session terminée : le badge est à toi."
                    : `Il reste ${restantes} étape${restantes > 1 ? "s" : ""} à valider.`}
                </Text>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </FeuilleModale>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    contenu: {
      paddingBottom: 32,
    },
    bandeau: {
      alignItems: "center",
      paddingVertical: 24,
      paddingHorizontal: 24,
      marginHorizontal: 18,
      borderRadius: RAYONS.carte,
      overflow: "hidden",
    },
    medaille: {
      width: 72,
      height: 72,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      backgroundColor: "rgba(255,255,255,0.22)",
      borderWidth: 3,
      borderColor: "rgba(255,255,255,0.38)",
      marginBottom: 14,
    },
    etat: {
      ...TYPO.surtitre,
      color: "rgba(255,255,255,0.78)",
    },
    etatVerrouille: {
      color: couleurs.texteTertiaire,
    },
    titre: {
      ...TYPO.titreSection,
      fontSize: 21,
      lineHeight: 27,
      marginTop: 5,
      color: "#FFFFFF",
      textAlign: "center",
    },
    titreVerrouille: {
      color: couleurs.texteAttenue,
    },
    corps: {
      paddingHorizontal: 24,
      paddingTop: 20,
      gap: 16,
    },
    provenance: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
    },
    puce: {
      width: 32,
      height: 32,
      borderRadius: RAYONS.petit,
      alignItems: "center",
      justifyContent: "center",
    },
    provenanceTextes: {
      flex: 1,
      gap: 2,
    },
    provenanceSurtitre: {
      ...TYPO.surtitre,
      fontSize: 10,
    },
    provenanceTitre: {
      ...TYPO.titreCarte,
      color: couleurs.texte,
    },
    description: {
      ...TYPO.corps,
      fontSize: 15,
      lineHeight: 23,
      color: couleurs.texteAttenue,
    },
    condition: {
      borderWidth: 1,
      borderRadius: RAYONS.carte,
      backgroundColor: couleurs.surfaceAtone,
      padding: 16,
      gap: 9,
    },
    conditionLigne: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    conditionTitre: {
      ...TYPO.label,
      color: couleurs.texte,
    },
    conditionTexte: {
      ...TYPO.corpsMoyen,
      fontSize: 14,
      lineHeight: 21,
      color: couleurs.texteAttenue,
    },
    avancement: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      marginTop: 3,
    },
    avancementChiffre: {
      ...TYPO.chiffre,
      fontSize: 14,
      lineHeight: 18,
      color: couleurs.texte,
      minWidth: 42,
      textAlign: "right",
    },
    avancementDetail: {
      ...TYPO.legende,
      color: couleurs.texteTertiaire,
    },
  });
