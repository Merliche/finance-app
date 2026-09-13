import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { Simulateur } from "../../domain/parcours/types";
import { formaterEffort, valeursDepart } from "../../domain/parcours/profilFinancier";
import { formaterResultat, resoudreFormule } from "../../domain/parcours/simulateurs";
import { echantillonnerSimulateur } from "../../domain/parcours/simulateurs/courbe";
import { useProgressStore } from "../../state/progressStore";
import { CourbeSimulateur } from "../etape/CourbeSimulateur";
import { Stepper } from "../etape/Stepper";
import { useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { RAYONS, THEMES_PARCOURS } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";

/**
 * Version autonome d'un simulateur d'étape "exemple" : mêmes formules, même contrôle
 * (Stepper), même courbe, mais sans notion de complétion — un élément latéral se rejoue
 * librement, il ne fait pas progresser le parcours.
 */
export function CalculateurLibre({
  simulateur,
  description,
  couleur,
}: {
  simulateur: Simulateur;
  description?: string;
  couleur: string;
}) {
  const styles = useStyles(creerStyles);
  const profil = useProgressStore((state) => state.profilFinancier);
  const [valeurs, setValeurs] = useState<Record<string, number>>(() => valeursDepart(simulateur, profil));

  const calculer = useMemo(() => resoudreFormule(simulateur.formule), [simulateur.formule]);
  const resultat = calculer(valeurs);
  const echantillon = useMemo(() => echantillonnerSimulateur(simulateur, valeurs), [simulateur, valeurs]);

  // Les éléments latéraux ont leur propre couleur de catégorie, indépendante des
  // parcours : on la réinjecte dans la forme d'un thème pour la courbe.
  const theme = { ...THEMES_PARCOURS.intro, primary: couleur };
  const effort =
    simulateur.resultat.unite === "€" && profil?.revenuNet ? formaterEffort(resultat, profil.revenuNet) : undefined;

  return (
    <View style={styles.conteneur}>
      {description && <Text style={styles.description}>{description}</Text>}

      {echantillon && <CourbeSimulateur echantillon={echantillon} theme={theme} unite={simulateur.resultat.unite} />}

      {simulateur.variables.map((variable) => (
        <Stepper
          key={variable.id}
          variable={variable}
          valeur={valeurs[variable.id]}
          couleur={couleur}
          onChanger={(valeur) => setValeurs((precedent) => ({ ...precedent, [variable.id]: valeur }))}
        />
      ))}

      <View style={[styles.resultatConteneur, { backgroundColor: couleur }]}>
        <Text style={styles.resultatLabel}>{simulateur.resultat.label}</Text>
        <Text style={styles.resultatValeur}>{formaterResultat(resultat, simulateur.resultat.unite)}</Text>
        {effort && <Text style={styles.resultatEffort}>≈ {effort}</Text>}
      </View>
    </View>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    conteneur: {
      gap: 16,
      alignSelf: "stretch",
    },
    description: {
      ...TYPO.legende,
      color: couleurs.texteAttenue,
    },
    resultatConteneur: {
      borderRadius: RAYONS.grand,
      paddingVertical: 20,
      paddingHorizontal: 16,
      alignItems: "center",
      gap: 6,
    },
    resultatLabel: {
      ...TYPO.surtitre,
      color: "rgba(255,255,255,0.75)",
    },
    resultatValeur: {
      ...TYPO.chiffre,
      color: "#FFFFFF",
    },
    resultatEffort: {
      ...TYPO.legende,
      color: "rgba(255,255,255,0.85)",
    },
  });
