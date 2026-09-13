import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import type { ContenuBloc } from "../../domain/parcours/types";
import { delaiCascade } from "../../theme/animation";
import { assombrir, avecAlpha, eclaircir } from "../../theme/couleurs";
import { useCouleurs, useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { RAYONS, type ThemeParcours } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";
import { Schema } from "../schema/Schema";
import { Apparition } from "../ui/Apparition";
import { Reflet } from "../ui/Reflet";

/**
 * Rendu des blocs de contenu communs à tous les types d'étape. Les blocs apparaissent en
 * cascade ; le premier paragraphe est mis en avant comme un chapeau, les définitions et
 * exemples deviennent des cartes, et le récapitulatif "à retenir" ferme la leçon sur un
 * aplat sombre — un rythme de lecture, pas un mur de texte.
 */
export function ContenuBlocs({ blocs, theme }: { blocs: ContenuBloc[]; theme: ThemeParcours }) {
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const indexPremierTexte = blocs.findIndex((bloc) => bloc.type === "texte");

  return (
    <View style={styles.conteneur}>
      {blocs.map((bloc, index) => (
        <Apparition key={index} delai={delaiCascade(index, 90)}>
          {rendreBloc(bloc, index === indexPremierTexte, theme, styles, couleurs)}
        </Apparition>
      ))}
    </View>
  );
}

/**
 * Rendu d'un bloc. Ce n'est pas un composant : la feuille de style et la palette lui sont
 * passées plutôt que lues par un hook, sans quoi l'ordre des hooks dépendrait du type de
 * bloc rencontré.
 */
function rendreBloc(
  bloc: ContenuBloc,
  estChapeau: boolean,
  theme: ThemeParcours,
  styles: ReturnType<typeof creerStyles>,
  couleurs: Couleurs
) {
  switch (bloc.type) {
    case "texte":
      return <Text style={estChapeau ? styles.chapeau : styles.texte}>{bloc.texte}</Text>;

    case "definition":
      return (
        <View style={[styles.definition, { borderColor: avecAlpha(theme.primary, 0.16) }]}>
          <LinearGradient
            colors={[eclaircir(theme.primary, 0.22), theme.primary, theme.primaryDark]}
            style={styles.definitionBarre}
          />
          <View style={styles.definitionTextes}>
            <View style={styles.definitionEntete}>
              <Ionicons name="bookmark" size={13} color={theme.primary} />
              <Text style={[styles.definitionTerme, { color: theme.primary }]}>{bloc.terme}</Text>
            </View>
            <Text style={styles.texteCarte}>{bloc.texte}</Text>
          </View>
        </View>
      );

    case "exemple_texte":
      return (
        <LinearGradient
          colors={[eclaircir(theme.primary, 0.9), theme.tint]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.exemple, { borderColor: theme.tintFort }]}
        >
          <Ionicons name="sparkles" size={64} color={theme.primary} style={styles.exempleDecor} />
          <Text style={[styles.exempleSurtitre, { color: theme.primary }]}>Exemple</Text>
          <Text style={styles.exempleTitre}>{bloc.titre}</Text>
          <Text style={styles.texteCarte}>{bloc.texte}</Text>
        </LinearGradient>
      );

    case "liste":
      return (
        <View style={styles.liste}>
          {bloc.titre ? <Text style={styles.listeTitre}>{bloc.titre}</Text> : null}
          {bloc.items.map((item, index) => (
            <View key={index} style={styles.listeLigne}>
              <LinearGradient
                colors={[eclaircir(theme.primary, 0.18), theme.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.listeNumero}
              >
                <Text style={styles.listeNumeroTexte}>{index + 1}</Text>
              </LinearGradient>
              <Text style={styles.listeTexte}>{item}</Text>
            </View>
          ))}
        </View>
      );

    case "schema":
      return <Schema schema={bloc.schema} theme={theme} />;

    case "a_retenir":
      return (
        <LinearGradient
          colors={[assombrir(theme.primaryDark, 0.55), couleurs.texte]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.retenir}
        >
          {/* C'est la carte qui ferme la leçon : un reflet la distingue du reste sans
              qu'elle ait besoin d'être plus grande. */}
          <Reflet duree={2000} pause={5000} intensite={0.1} largeur={0.34} />
          <View style={styles.retenirEntete}>
            <View style={[styles.retenirPuce, { backgroundColor: avecAlpha(theme.primary, 0.3) }]}>
              <Ionicons name="bookmark" size={12} color={eclaircir(theme.primary, 0.45)} />
            </View>
            <Text style={styles.retenirSurtitre}>À retenir</Text>
          </View>
          {bloc.points.map((point, index) => (
            <Apparition key={index} delai={delaiCascade(index, 260)} style={styles.retenirLigne}>
              <LinearGradient
                colors={[eclaircir(theme.primary, 0.2), theme.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.retenirCoche}
              >
                <Ionicons name="checkmark-sharp" size={12} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.retenirTexte}>{point}</Text>
            </Apparition>
          ))}
        </LinearGradient>
      );

  }
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    conteneur: {
      gap: 18,
    },
    chapeau: {
      ...TYPO.corps,
      fontSize: 17.5,
      lineHeight: 28,
      color: couleurs.texte,
    },
    texte: {
      ...TYPO.corps,
      color: couleurs.texte,
    },
    texteCarte: {
      ...TYPO.corps,
      fontSize: 14.5,
      lineHeight: 22,
      color: couleurs.texte,
    },
    definition: {
      flexDirection: "row",
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.carte,
      borderWidth: 1,
      overflow: "hidden",
      ...couleurs.ombres.carte,
    },
    definitionBarre: {
      width: 6,
    },
    definitionTextes: {
      flex: 1,
      gap: 6,
      padding: 16,
    },
    definitionEntete: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },
    definitionTerme: {
      ...TYPO.surtitre,
    },
    exemple: {
      borderRadius: RAYONS.carte,
      borderWidth: 1,
      padding: 18,
      gap: 6,
      overflow: "hidden",
    },
    exempleDecor: {
      position: "absolute",
      right: -8,
      top: -10,
      opacity: 0.12,
    },
    exempleSurtitre: {
      ...TYPO.surtitre,
    },
    exempleTitre: {
      ...TYPO.titreCarte,
      fontSize: 16,
      color: couleurs.texte,
      marginBottom: 2,
    },
    liste: {
      gap: 10,
    },
    listeTitre: {
      ...TYPO.titreCarte,
      fontSize: 16,
      color: couleurs.texte,
      marginBottom: 2,
    },
    listeLigne: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.grand,
      padding: 14,
      ...couleurs.ombres.carte,
    },
    listeNumero: {
      width: 28,
      height: 28,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    listeNumeroTexte: {
      ...TYPO.label,
      fontSize: 13,
      color: "#FFFFFF",
    },
    listeTexte: {
      ...TYPO.corps,
      flex: 1,
      fontSize: 14.5,
      lineHeight: 22,
      color: couleurs.texte,
      paddingTop: 3,
    },
    retenir: {
      borderRadius: RAYONS.carte,
      padding: 18,
      gap: 11,
      overflow: "hidden",
    },
    retenirEntete: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 2,
    },
    retenirPuce: {
      width: 22,
      height: 22,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    retenirSurtitre: {
      ...TYPO.surtitre,
      color: "rgba(255,255,255,0.68)",
    },
    retenirLigne: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 11,
    },
    retenirCoche: {
      width: 20,
      height: 20,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
    },
    retenirTexte: {
      ...TYPO.corpsMoyen,
      fontSize: 14.5,
      lineHeight: 21,
      flex: 1,
      color: "#FFFFFF",
    },
  });
