import { useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ficheEnTexte, type ConseilFiche, type FicheSynthese } from "../../domain/parcours/fiche";
import { delaiCascade } from "../../theme/animation";
import { avecAlpha, eclaircir } from "../../theme/couleurs";
import { useCouleurs, useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { PRESSION, RAYONS, type ThemeParcours } from "../../theme/parcoursTheme";
import { PLAFOND_PASTILLE, TYPO } from "../../theme/typographie";
import { Apparition } from "../ui/Apparition";
import { AppuiRessort } from "../ui/AppuiRessort";
import { MotifPoints } from "../ui/MotifPoints";
import { Reflet } from "../ui/Reflet";
import { haptiqueLegere, haptiqueSucces } from "../../utils/haptique";

/**
 * La fiche de synthèse d'une voie terminée : le document qu'on garde.
 *
 * Elle est longue par nature — une voie, c'est une cinquantaine de points clés et une
 * vingtaine de termes. Tout déplier d'un coup donnerait un mur illisible, tout replier
 * donnerait une liste de titres sans substance. La première session s'ouvre donc seule,
 * les autres attendent, et les compteurs disent d'emblée ce que la fiche contient.
 *
 * Le bouton de partage produit la version texte complète (`ficheEnTexte`) : c'est ce qui
 * fait d'elle une vraie récompense plutôt qu'un écran de plus. On peut se l'envoyer, la
 * coller dans ses notes, l'imprimer.
 */
export function FicheSyntheseVue({ fiche, theme }: { fiche: FicheSynthese; theme: ThemeParcours }) {
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const [depliees, setDepliees] = useState<Record<number, boolean>>({});

  async function partager() {
    haptiqueSucces();
    await Share.share({ message: ficheEnTexte(fiche) }).catch(() => {});
  }

  return (
    <View style={styles.zone}>
      <Apparition delai={200}>
        <LinearGradient
          colors={[eclaircir(theme.primary, 0.12), theme.primary, theme.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.entete}
        >
          <MotifPoints couleur="#FFFFFF" opacite={0.13} pas={18} />
          <Reflet duree={2000} pause={4200} intensite={0.2} largeur={0.34} />

          <View style={styles.enteteLigne}>
            <View style={styles.enteteIcone}>
              <Ionicons name="document-text" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.enteteTextes}>
              <Text style={styles.enteteSurtitre}>Ta récompense</Text>
              <Text style={styles.enteteTitre}>Fiche de synthèse</Text>
            </View>
          </View>

          <Text style={styles.enteteDetail}>
            Tout ce que cette voie t&apos;a appris, rassemblé en un document à relire quand tu en
            as besoin.
          </Text>

          <View style={styles.compteurs}>
            <Compteur valeur={fiche.nbPoints} label={fiche.nbPoints > 1 ? "points clés" : "point clé"} />
            <Compteur valeur={fiche.nbDefinitions} label={fiche.nbDefinitions > 1 ? "termes" : "terme"} />
            <Compteur valeur={fiche.nbSessions} label={fiche.nbSessions > 1 ? "sessions" : "session"} />
          </View>

          <Pressable
            onPress={partager}
            accessibilityRole="button"
            accessibilityLabel="Partager ma fiche de synthèse"
            style={({ pressed }) => [styles.boutonPartage, pressed && PRESSION]}
          >
            <Ionicons name="share-outline" size={16} color={theme.primary} />
            <Text style={[styles.boutonPartageTexte, { color: theme.primary }]}>
              Emporter ma fiche
            </Text>
          </Pressable>
        </LinearGradient>
      </Apparition>

      {fiche.sections.map((section, index) => {
        // La première session est ouverte : sans elle, la fiche ressemblerait à un
        // sommaire vide alors qu'elle est justement le contenu.
        const ouverte = depliees[section.session] ?? index === 0;
        return (
          <Apparition key={section.session} delai={delaiCascade(index, 280)}>
            <AppuiRessort
              echelle={0.985}
              onPress={() => {
                haptiqueLegere();
                setDepliees((precedent) => ({ ...precedent, [section.session]: !ouverte }));
              }}
              accessibilityLabel={`Session ${section.session}${section.titre ? ` : ${section.titre}` : ""}`}
              accessibilityHint={ouverte ? "Replier" : "Déplier"}
              styleContenu={styles.section}
            >
              <View style={styles.sectionEntete}>
                <View style={[styles.sectionNumero, { backgroundColor: avecAlpha(theme.primary, 0.13) }]}>
                  <Text
                    style={[styles.sectionNumeroTexte, { color: theme.primary }]}
                    maxFontSizeMultiplier={PLAFOND_PASTILLE}
                  >
                    {section.session}
                  </Text>
                </View>
                <View style={styles.sectionTextes}>
                  <Text style={styles.sectionTitre} numberOfLines={2}>
                    {section.titre ?? `Session ${section.session}`}
                  </Text>
                  <Text style={styles.sectionDetail}>
                    {section.points.length} point{section.points.length > 1 ? "s" : ""}
                    {section.definitions.length > 0
                      ? ` · ${section.definitions.length} terme${section.definitions.length > 1 ? "s" : ""}`
                      : ""}
                  </Text>
                </View>
                <Ionicons
                  name={ouverte ? "chevron-up" : "chevron-down"}
                  size={17}
                  color={couleurs.texteTertiaire}
                />
              </View>

              {ouverte && (
                <View style={styles.sectionCorps}>
                  {section.points.map((point, indexPoint) => (
                    <View key={indexPoint} style={styles.point}>
                      <View style={[styles.puce, { backgroundColor: theme.primary }]} />
                      <Text style={styles.pointTexte}>{point}</Text>
                    </View>
                  ))}

                  {section.definitions.length > 0 && (
                    <View style={styles.definitions}>
                      {section.definitions.map((definition) => (
                        <Text key={definition.terme} style={styles.definition}>
                          <Text style={[styles.definitionTerme, { color: theme.primary }]}>
                            {definition.terme}
                          </Text>
                          {"  "}
                          {definition.texte}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </AppuiRessort>
          </Apparition>
        );
      })}

      {fiche.reflexes.length > 0 && (
        <Apparition delai={360}>
          <BlocConseils
            titre="Les bons réflexes"
            detail="Ce qu'il faut faire, tiré des mises en situation."
            icone="checkmark-circle"
            couleur={couleurs.succes}
            conseils={fiche.reflexes}
          />
        </Apparition>
      )}

      {fiche.pieges.length > 0 && (
        <Apparition delai={400}>
          <BlocConseils
            titre="Les pièges à éviter"
            detail="Les erreurs que la voie t'a montrées."
            icone="alert-circle"
            couleur={couleurs.erreur}
            conseils={fiche.pieges}
          />
        </Apparition>
      )}
    </View>
  );
}

function Compteur({ valeur, label }: { valeur: number; label: string }) {
  const styles = useStyles(creerStyles);
  return (
    <View style={styles.compteur}>
      <Text style={styles.compteurValeur}>{valeur}</Text>
      <Text style={styles.compteurLabel}>{label}</Text>
    </View>
  );
}

function BlocConseils({
  titre,
  detail,
  icone,
  couleur,
  conseils,
}: {
  titre: string;
  detail: string;
  icone: keyof typeof Ionicons.glyphMap;
  couleur: string;
  conseils: ConseilFiche[];
}) {
  const styles = useStyles(creerStyles);
  return (
    <View style={[styles.section, { borderColor: avecAlpha(couleur, 0.3) }]}>
      <View style={styles.sectionEntete}>
        <View style={[styles.sectionNumero, { backgroundColor: avecAlpha(couleur, 0.14) }]}>
          <Ionicons name={icone} size={17} color={couleur} />
        </View>
        <View style={styles.sectionTextes}>
          <Text style={styles.sectionTitre}>{titre}</Text>
          <Text style={styles.sectionDetail}>{detail}</Text>
        </View>
      </View>

      <View style={styles.sectionCorps}>
        {conseils.map((conseil, index) => (
          <View key={index} style={styles.conseil}>
            <Text style={[styles.conseilGeste, { color: couleur }]}>{conseil.geste}</Text>
            <Text style={styles.conseilRaison}>{conseil.raison}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    zone: {
      gap: 12,
    },
    entete: {
      borderRadius: RAYONS.carte,
      padding: 20,
      overflow: "hidden",
    },
    enteteLigne: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    enteteIcone: {
      width: 38,
      height: 38,
      borderRadius: RAYONS.moyen,
      backgroundColor: "rgba(255,255,255,0.22)",
      alignItems: "center",
      justifyContent: "center",
    },
    enteteTextes: {
      flex: 1,
    },
    enteteSurtitre: {
      ...TYPO.surtitre,
      color: "rgba(255,255,255,0.78)",
    },
    enteteTitre: {
      ...TYPO.titreSection,
      fontSize: 20,
      color: "#FFFFFF",
      marginTop: 2,
    },
    enteteDetail: {
      ...TYPO.corps,
      fontSize: 14,
      lineHeight: 21,
      color: "rgba(255,255,255,0.86)",
      marginTop: 14,
    },
    compteurs: {
      flexDirection: "row",
      gap: 8,
      marginTop: 16,
    },
    compteur: {
      flex: 1,
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.16)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
      borderRadius: RAYONS.moyen,
      paddingVertical: 10,
    },
    compteurValeur: {
      ...TYPO.chiffre,
      fontSize: 22,
      lineHeight: 26,
      color: "#FFFFFF",
    },
    compteurLabel: {
      ...TYPO.legende,
      fontSize: 10.5,
      color: "rgba(255,255,255,0.82)",
      marginTop: 1,
    },
    boutonPartage: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 16,
      paddingVertical: 13,
      borderRadius: RAYONS.pilule,
      backgroundColor: "#FFFFFF",
    },
    boutonPartageTexte: {
      ...TYPO.label,
      fontSize: 14,
    },
    section: {
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.carte,
      borderWidth: 1,
      borderColor: couleurs.bordure,
      padding: 16,
      ...couleurs.ombres.carte,
    },
    sectionEntete: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    sectionNumero: {
      width: 34,
      height: 34,
      borderRadius: RAYONS.petit,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionNumeroTexte: {
      ...TYPO.chiffre,
      fontSize: 15,
      lineHeight: 19,
    },
    sectionTextes: {
      flex: 1,
      gap: 2,
    },
    sectionTitre: {
      ...TYPO.titreCarte,
      color: couleurs.texte,
    },
    sectionDetail: {
      ...TYPO.legende,
      fontSize: 11.5,
      color: couleurs.texteTertiaire,
    },
    sectionCorps: {
      marginTop: 14,
      gap: 11,
    },
    point: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    puce: {
      width: 6,
      height: 6,
      borderRadius: 999,
      marginTop: 8,
    },
    pointTexte: {
      ...TYPO.corpsMoyen,
      flex: 1,
      fontSize: 14.5,
      lineHeight: 22,
      color: couleurs.texte,
    },
    definitions: {
      gap: 10,
      marginTop: 4,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: couleurs.bordure,
    },
    definition: {
      ...TYPO.corps,
      fontSize: 14,
      lineHeight: 21,
      color: couleurs.texteAttenue,
    },
    definitionTerme: {
      ...TYPO.label,
      fontSize: 14,
    },
    conseil: {
      gap: 3,
    },
    conseilGeste: {
      ...TYPO.label,
      fontSize: 14,
      lineHeight: 20,
    },
    conseilRaison: {
      ...TYPO.corps,
      fontSize: 13.5,
      lineHeight: 20,
      color: couleurs.texteAttenue,
    },
  });
