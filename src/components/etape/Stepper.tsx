import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { SimulateurVariable } from "../../domain/parcours/types";
import { useCouleurs, useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { PRESSION, RAYONS } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";

function arrondirPas(valeur: number, pas: number): number {
  const decimales = (pas.toString().split(".")[1] ?? "").length;
  return Number(valeur.toFixed(decimales));
}

/** Contrôle +/- pour une variable de simulateur — utilisé par l'étape "exemple" et par
 * les calculateurs libres des éléments latéraux (mêmes formules, même contrôle). */
export function Stepper({
  variable,
  valeur,
  couleur,
  onChanger,
}: {
  variable: SimulateurVariable;
  valeur: number;
  couleur: string;
  onChanger: (valeur: number) => void;
}) {
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const auMinimum = valeur <= variable.min;
  const auMaximum = valeur >= variable.max;

  return (
    <View style={styles.variable}>
      <Text style={styles.variableLabel}>{variable.label}</Text>

      <View style={styles.stepper}>
        <Pressable
          disabled={auMinimum}
          style={({ pressed }) => [styles.bouton, auMinimum && styles.boutonInactif, pressed && PRESSION]}
          onPress={() => onChanger(Math.max(variable.min, arrondirPas(valeur - variable.pas, variable.pas)))}
        >
          <Ionicons
            name="remove"
            size={22}
            color={auMinimum ? couleurs.texteTertiaire : couleur}
          />
        </Pressable>

        <View style={styles.valeurBloc}>
          <Text style={styles.valeur}>
            {valeur.toLocaleString("fr-FR")}
            {variable.unite ? <Text style={styles.unite}> {variable.unite}</Text> : null}
          </Text>
        </View>

        <Pressable
          disabled={auMaximum}
          style={({ pressed }) => [styles.bouton, auMaximum && styles.boutonInactif, pressed && PRESSION]}
          onPress={() => onChanger(Math.min(variable.max, arrondirPas(valeur + variable.pas, variable.pas)))}
        >
          <Ionicons name="add" size={22} color={auMaximum ? couleurs.texteTertiaire : couleur} />
        </Pressable>
      </View>
    </View>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    variable: {
      gap: 9,
    },
    variableLabel: {
      ...TYPO.label,
      color: couleurs.texteAttenue,
    },
    stepper: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: couleurs.surfaceAtone,
      borderRadius: RAYONS.grand,
      borderWidth: 1,
      borderColor: couleurs.bordure,
      padding: 7,
    },
    bouton: {
      width: 44,
      height: 44,
      borderRadius: RAYONS.moyen,
      backgroundColor: couleurs.surface,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#1A1D23",
      shadowOpacity: 0.06,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    boutonInactif: {
      backgroundColor: "transparent",
      shadowOpacity: 0,
      elevation: 0,
    },
    valeurBloc: {
      flex: 1,
      alignItems: "center",
    },
    valeur: {
      ...TYPO.titreCarte,
      fontSize: 17,
      color: couleurs.texte,
    },
    unite: {
      ...TYPO.legende,
      color: couleurs.texteAttenue,
    },
  });
