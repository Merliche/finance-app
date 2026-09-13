import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useCouleurs, useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { RAYONS, type ThemeParcours } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";

const LIBELLE_NIVEAU = { 1: "Découverte", 2: "Confirmé", 3: "Expert" } as const;

/** Bannière de regroupement au-dessus d'un cluster de nœuds. Grisée si la session n'est pas encore atteinte. */
export function BanniereSession({
  titre,
  numero,
  icone,
  niveau,
  theme,
  active,
  validees,
  total,
  style,
}: {
  titre: string;
  numero: number;
  icone: keyof typeof Ionicons.glyphMap;
  niveau: 1 | 2 | 3;
  theme: ThemeParcours;
  active: boolean;
  validees: number;
  total: number;
  style?: ViewStyle;
}) {
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const terminee = total > 0 && validees === total;
  const couleurTexte = active ? couleurs.texte : couleurs.texteAttenue;

  return (
    <View
      accessibilityRole="header"
      accessibilityLabel={`Session ${numero}, ${titre}, niveau ${LIBELLE_NIVEAU[niveau]}, ${validees} sur ${total} étapes validées`}
      style={[
        styles.banniere,
        {
          backgroundColor: active ? couleurs.surface : couleurs.verrouilleFond,
          borderColor: active ? theme.tintFort : couleurs.verrouilleBordure,
        },
        active && couleurs.ombres.carte,
        style,
      ]}
    >
      <View
        style={[
          styles.icone,
          { backgroundColor: active ? theme.primary : couleurs.verrouilleBordure },
        ]}
      >
        <Ionicons name={active ? (terminee ? "checkmark-sharp" : icone) : "lock-closed"} size={18} color="#FFFFFF" />
      </View>

      <View style={styles.textes}>
        <View style={styles.ligneSurtitre}>
          <Text style={[styles.surtitre, { color: active ? theme.primary : couleurs.texteTertiaire }]}>
            Session {numero}
          </Text>
          <View style={styles.niveau} accessible={false}>
            {[1, 2, 3].map((cran) => (
              <View
                key={cran}
                style={[
                  styles.cran,
                  {
                    backgroundColor:
                      cran <= niveau
                        ? active
                          ? theme.primary
                          : couleurs.verrouilleIcone
                        : active
                          ? theme.tintFort
                          : couleurs.verrouilleBordure,
                  },
                ]}
              />
            ))}
          </View>
        </View>
        <Text numberOfLines={1} style={[styles.titre, { color: couleurTexte }]}>
          {titre}
        </Text>
      </View>

      {active && (
        <View style={[styles.compteur, { backgroundColor: terminee ? theme.primary : theme.tint }]}>
          <Text style={[styles.compteurTexte, { color: terminee ? "#FFFFFF" : theme.primary }]}>
            {validees}/{total}
          </Text>
        </View>
      )}
    </View>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    banniere: {
      position: "absolute",
      left: 22,
      right: 22,
      borderRadius: RAYONS.carte,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      paddingHorizontal: 16,
    },
    icone: {
      width: 38,
      height: 38,
      borderRadius: RAYONS.moyen,
      alignItems: "center",
      justifyContent: "center",
    },
    textes: {
      flex: 1,
    },
    ligneSurtitre: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    surtitre: {
      ...TYPO.surtitre,
    },
    niveau: {
      flexDirection: "row",
      gap: 3,
    },
    cran: {
      width: 10,
      height: 4,
      borderRadius: 2,
    },
    titre: {
      ...TYPO.titreCarte,
      marginTop: 3,
    },
    compteur: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: RAYONS.pilule,
    },
    compteurTexte: {
      ...TYPO.legende,
      fontSize: 11.5,
    },
  });
