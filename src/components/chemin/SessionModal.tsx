import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { Etape } from "../../domain/parcours/types";
import { LIBELLE_NIVEAU, type InfosSession } from "../../constants/sessions";
import { useCouleurs, useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { PRESSION, RAYONS, type ThemeParcours } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";
import { FeuilleModale } from "../ui/FeuilleModale";
import type { EtatNoeud } from "./calculerChemin";
import { iconeEtape, libelleTypeEtape } from "./icones";

export interface SessionOuverte {
  numero: number;
  infos: InfosSession;
  etapes: { etape: Etape; etat: EtatNoeud }[];
  badge?: string;
}

/** Fiche d'une session : accroche, niveau, liste des étapes et leur état, badge à la clé. */
export function SessionModal({
  session,
  theme,
  toutAccessible,
  onFermer,
  onEtapePress,
}: {
  session: SessionOuverte | null;
  theme: ThemeParcours;
  toutAccessible: boolean;
  onFermer: () => void;
  onEtapePress: (etapeId: string) => void;
}) {
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  if (!session) return null;
  const validees = session.etapes.filter((e) => e.etat === "valide").length;

  return (
    <FeuilleModale visible onFermer={onFermer} hauteurMax="84%">
      <ScrollView contentContainerStyle={styles.contenu} showsVerticalScrollIndicator={false}>
        <View style={styles.entete}>
          <View style={[styles.icone, { backgroundColor: theme.primary }]}>
            <Ionicons name={session.infos.icone} size={22} color="#FFFFFF" />
          </View>
          <View style={styles.textesEntete}>
            <Text style={[styles.surtitre, { color: theme.primary }]}>
              Session {session.numero} · {LIBELLE_NIVEAU[session.infos.niveau]}
            </Text>
            <Text style={styles.titre}>{session.infos.titre}</Text>
          </View>
        </View>

        <Text style={styles.accroche}>{session.infos.accroche}</Text>

        <View style={styles.ligneStats}>
          <Text style={styles.stat}>
            <Text style={[styles.statChiffre, { color: theme.primary }]}>{validees}</Text>/{session.etapes.length} étapes
          </Text>
          {session.badge && (
            <View style={[styles.badge, { backgroundColor: theme.tint }]}>
              <Ionicons name="ribbon" size={13} color={theme.primary} />
              <Text style={[styles.badgeTexte, { color: theme.primary }]}>{session.badge}</Text>
            </View>
          )}
        </View>

        <View style={styles.liste}>
          {session.etapes.map(({ etape, etat }, index) => {
            const ouverte = etat !== "verrouille" || toutAccessible;
            return (
              <Pressable
                key={etape.id}
                disabled={!ouverte}
                onPress={() => {
                  onFermer();
                  onEtapePress(etape.id);
                }}
                accessibilityRole="button"
                style={({ pressed }) => [styles.ligne, pressed && PRESSION, !ouverte && styles.ligneVerrouillee]}
              >
                <View
                  style={[
                    styles.puce,
                    {
                      backgroundColor:
                        etat === "valide" ? theme.primary : etat === "actuel" ? theme.tint : couleurs.verrouilleFond,
                    },
                  ]}
                >
                  {etat === "valide" ? (
                    <Ionicons name="checkmark-sharp" size={15} color="#FFFFFF" />
                  ) : (
                    <Ionicons
                      name={etat === "actuel" ? iconeEtape(etape) : "lock-closed"}
                      size={14}
                      color={etat === "actuel" ? theme.primary : couleurs.verrouilleIcone}
                    />
                  )}
                </View>
                <View style={styles.ligneTextes}>
                  <Text style={styles.ligneType}>
                    {index + 1} · {libelleTypeEtape(etape)}
                  </Text>
                  <Text style={styles.ligneTitre} numberOfLines={2}>
                    {etape.titre}
                  </Text>
                </View>
                {ouverte && <Ionicons name="chevron-forward" size={16} color={couleurs.texteTertiaire} />}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </FeuilleModale>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    contenu: {
      padding: 24,
      paddingTop: 18,
      paddingBottom: 36,
      gap: 14,
    },
    entete: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
    },
    icone: {
      width: 46,
      height: 46,
      borderRadius: RAYONS.moyen,
      alignItems: "center",
      justifyContent: "center",
    },
    textesEntete: {
      flex: 1,
      gap: 3,
    },
    surtitre: {
      ...TYPO.surtitre,
    },
    titre: {
      ...TYPO.titreSection,
      color: couleurs.texte,
    },
    accroche: {
      ...TYPO.corps,
      fontSize: 15,
      color: couleurs.texteAttenue,
    },
    ligneStats: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      flexWrap: "wrap",
    },
    stat: {
      ...TYPO.legende,
      color: couleurs.texteAttenue,
    },
    statChiffre: {
      ...TYPO.chiffre,
      fontSize: 18,
      lineHeight: 22,
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: RAYONS.pilule,
    },
    badgeTexte: {
      ...TYPO.legende,
      fontSize: 11.5,
    },
    liste: {
      gap: 8,
      marginTop: 4,
    },
    ligne: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: couleurs.surfaceAtone,
      borderRadius: RAYONS.grand,
      padding: 12,
    },
    ligneVerrouillee: {
      opacity: 0.55,
    },
    puce: {
      width: 32,
      height: 32,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    ligneTextes: {
      flex: 1,
      gap: 2,
    },
    ligneType: {
      ...TYPO.surtitre,
      fontSize: 10,
      color: couleurs.texteTertiaire,
    },
    ligneTitre: {
      ...TYPO.label,
      color: couleurs.texte,
    },
  });
