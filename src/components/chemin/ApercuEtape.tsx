import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { XP_PAR_ETAPE } from "../../domain/parcours/engagement";
import { estimerDureeLecture } from "../../domain/parcours/lecture";
import type { Etape } from "../../domain/parcours/types";
import { avecAlpha } from "../../theme/couleurs";
import { useCouleurs, useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { PRESSION, RAYONS, type ThemeParcours } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";
import { Apparition } from "../ui/Apparition";
import { MotifPoints } from "../ui/MotifPoints";
import type { EtatNoeud } from "./calculerChemin";
import { iconeEtape, libelleTypeEtape } from "./icones";

export interface ApercuOuvert {
  etape: Etape;
  etat: EtatNoeud;
  /** Numéro de l'étape dans le parcours, tel qu'affiché à l'utilisateur. */
  numero: number;
  /** Titre de la session à laquelle elle appartient, s'il y en a une. */
  session?: string;
}

/**
 * Aperçu d'une étape, ouvert par un appui long sur son nœud. Il répond aux trois
 * questions qu'on se pose avant d'appuyer — de quel genre d'étape s'agit-il, combien de
 * temps ça prend, qu'est-ce que ça rapporte — et donne les premières lignes, sans engager
 * l'étape. Sur un chemin de quarante nœuds, c'est ce qui permet de choisir où aller
 * plutôt que d'ouvrir et de revenir.
 */
const ETIQUETTE_ETAT: Record<EtatNoeud, string> = {
  valide: "Déjà validée",
  actuel: "Ton étape en cours",
  verrouille: "Pas encore accessible",
};

export function ApercuEtape({
  apercu,
  theme,
  toutAccessible,
  onFermer,
  onOuvrir,
}: {
  apercu: ApercuOuvert | null;
  theme: ThemeParcours;
  toutAccessible: boolean;
  onFermer: () => void;
  onOuvrir: (etapeId: string) => void;
}) {
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  if (!apercu) return null;

  const { etape, etat, numero, session } = apercu;
  const minutes = estimerDureeLecture(etape);
  const accessible = etat !== "verrouille" || toutAccessible;
  const premierTexte = etape.contenu.find((bloc) => bloc.type === "texte");
  const accroche = premierTexte && premierTexte.type === "texte" ? premierTexte.texte : undefined;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable
        style={styles.fond}
        onPress={onFermer}
        accessibilityRole="button"
        accessibilityLabel="Fermer l'aperçu"
      />

      <View style={styles.centrage} pointerEvents="box-none">
        <Apparition mode="pop">
          <View style={styles.carte}>
            <LinearGradient
              colors={[theme.primary, theme.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bandeau}
            >
              <MotifPoints couleur="#FFFFFF" opacite={0.14} pas={16} />
              <View style={styles.ligneBandeau}>
                <View style={styles.puceType}>
                  <Ionicons name={iconeEtape(etape)} size={17} color="#FFFFFF" />
                </View>
                <View style={styles.texteBandeau}>
                  <Text style={styles.typeEtape}>{libelleTypeEtape(etape)}</Text>
                  <Text style={styles.positionEtape} numberOfLines={1}>
                    Étape {numero}
                    {session ? ` · ${session}` : ""}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.corps}>
              <Text style={styles.titre}>{etape.titre}</Text>

              <View style={styles.chiffres}>
                <Chiffre icone="time-outline" valeur={`${minutes} min`} couleur={theme.primary} />
                <Chiffre icone="flash-outline" valeur={`+${XP_PAR_ETAPE} XP`} couleur={theme.primary} />
                <Chiffre
                  icone={
                    etat === "valide"
                      ? "checkmark-circle-outline"
                      : etat === "actuel"
                        ? "navigate-outline"
                        : "lock-closed-outline"
                  }
                  valeur={ETIQUETTE_ETAT[etat]}
                  couleur={etat === "valide" ? couleurs.succes : theme.primary}
                />
              </View>

              {accroche && (
                <Text style={styles.accroche} numberOfLines={4}>
                  {accroche}
                </Text>
              )}

              <View style={styles.actions}>
                <Pressable
                  onPress={onFermer}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.boutonSecondaire, pressed && PRESSION]}
                >
                  <Text style={styles.boutonSecondaireTexte}>Fermer</Text>
                </Pressable>
                <Pressable
                  disabled={!accessible}
                  onPress={() => onOuvrir(etape.id)}
                  accessibilityRole="button"
                  accessibilityLabel={accessible ? `Ouvrir : ${etape.titre}` : "Étape verrouillée"}
                  style={({ pressed }) => [
                    styles.boutonPrincipal,
                    { backgroundColor: accessible ? theme.primary : couleurs.verrouilleFond },
                    pressed && PRESSION,
                  ]}
                >
                  <Text
                    style={[
                      styles.boutonPrincipalTexte,
                      { color: accessible ? "#FFFFFF" : couleurs.texteTertiaire },
                    ]}
                  >
                    {etat === "valide" ? "Refaire" : accessible ? "Commencer" : "Verrouillée"}
                  </Text>
                  {accessible && <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />}
                </Pressable>
              </View>
            </View>
          </View>
        </Apparition>
      </View>
    </Modal>
  );
}

function Chiffre({
  icone,
  valeur,
  couleur,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  valeur: string;
  couleur: string;
}) {
  const styles = useStyles(creerStyles);
  return (
    <View style={[styles.chiffre, { backgroundColor: avecAlpha(couleur, 0.09) }]}>
      <Ionicons name={icone} size={13} color={couleur} />
      <Text style={[styles.chiffreTexte, { color: couleur }]} numberOfLines={1}>
        {valeur}
      </Text>
    </View>
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
      backgroundColor: "rgba(20,22,28,0.44)",
    },
    centrage: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 26,
    },
    carte: {
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.carte,
      overflow: "hidden",
      ...couleurs.ombres.modale,
    },
    bandeau: {
      paddingHorizontal: 18,
      paddingVertical: 15,
    },
    ligneBandeau: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
    },
    puceType: {
      width: 34,
      height: 34,
      borderRadius: 999,
      backgroundColor: "rgba(255,255,255,0.22)",
      alignItems: "center",
      justifyContent: "center",
    },
    texteBandeau: {
      flex: 1,
    },
    typeEtape: {
      ...TYPO.titreCarte,
      color: "#FFFFFF",
    },
    positionEtape: {
      ...TYPO.legende,
      fontSize: 11.5,
      color: "rgba(255,255,255,0.82)",
      marginTop: 1,
    },
    corps: {
      paddingHorizontal: 18,
      paddingTop: 15,
      paddingBottom: 16,
    },
    titre: {
      ...TYPO.titreSection,
      color: couleurs.texte,
    },
    chiffres: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 7,
      marginTop: 12,
    },
    chiffre: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: RAYONS.pilule,
    },
    chiffreTexte: {
      ...TYPO.legende,
      fontSize: 11.5,
    },
    accroche: {
      ...TYPO.corps,
      fontSize: 14.5,
      lineHeight: 22,
      color: couleurs.texteAttenue,
      marginTop: 13,
    },
    actions: {
      flexDirection: "row",
      gap: 9,
      marginTop: 17,
    },
    boutonSecondaire: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: RAYONS.pilule,
      backgroundColor: couleurs.surfaceAtone,
      alignItems: "center",
      justifyContent: "center",
    },
    boutonSecondaireTexte: {
      ...TYPO.label,
      color: couleurs.texteAttenue,
    },
    boutonPrincipal: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      paddingVertical: 12,
      borderRadius: RAYONS.pilule,
    },
    boutonPrincipalTexte: {
      ...TYPO.label,
      fontSize: 14,
    },
  });
