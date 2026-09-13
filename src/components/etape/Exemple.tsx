import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import type { EtapeExemple } from "../../domain/parcours/types";
import type { ResultatEtape } from "../../domain/parcours/progress";
import { formaterEffort, valeursDepart, variablesPersonnalisees } from "../../domain/parcours/profilFinancier";
import { formaterResultat, resoudreFormule } from "../../domain/parcours/simulateurs";
import { echantillonnerSimulateur } from "../../domain/parcours/simulateurs/courbe";
import { useProgressStore } from "../../state/progressStore";
import { useCouleurs, useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { PRESSION, RAYONS, type ThemeParcours } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";
import { Apparition } from "../ui/Apparition";
import { BoutonContinuer } from "./BoutonContinuer";
import { ContenuBlocs } from "./ContenuBlocs";
import { CourbeSimulateur } from "./CourbeSimulateur";
import { Stepper } from "./Stepper";

export function Exemple({
  etape,
  onTerminer,
  theme,
}: {
  etape: EtapeExemple;
  onTerminer: (resultat: ResultatEtape) => void;
  theme: ThemeParcours;
}) {
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const { simulateur } = etape;
  const router = useRouter();
  const profil = useProgressStore((state) => state.profilFinancier);

  // Le profil ne sert qu'au point de départ : une fois l'écran ouvert, les curseurs
  // appartiennent à l'utilisateur et ne sont plus repris en main.
  const [valeurs, setValeurs] = useState<Record<string, number>>(() => valeursDepart(simulateur, profil));
  const [aInteragi, setAInteragi] = useState(false);

  const calculer = useMemo(() => resoudreFormule(simulateur.formule), [simulateur.formule]);
  const resultat = calculer(valeurs);
  const echantillon = useMemo(() => echantillonnerSimulateur(simulateur, valeurs), [simulateur, valeurs]);

  const personnalisees = variablesPersonnalisees(simulateur, profil);
  const effort =
    simulateur.resultat.unite === "€" && profil?.revenuNet ? formaterEffort(resultat, profil.revenuNet) : undefined;

  function changerValeur(variableId: string, valeur: number) {
    setAInteragi(true);
    setValeurs((precedent) => ({ ...precedent, [variableId]: valeur }));
  }

  return (
    <ScrollView contentContainerStyle={styles.conteneur} showsVerticalScrollIndicator={false}>
      <ContenuBlocs blocs={etape.contenu} theme={theme} />

      {echantillon && (
        <Apparition delai={200}>
          <CourbeSimulateur echantillon={echantillon} theme={theme} unite={simulateur.resultat.unite} />
        </Apparition>
      )}

      {personnalisees.length > 0 && (
        <Pressable
          onPress={() => router.push("/mes-chiffres")}
          accessibilityRole="button"
          accessibilityHint="Modifier tes chiffres personnels"
          style={({ pressed }) => [styles.pilulePerso, { backgroundColor: theme.tint }, pressed && PRESSION]}
        >
          <Ionicons name="person-circle-outline" size={15} color={theme.primary} />
          <Text style={[styles.pilulePersoTexte, { color: theme.primary }]}>
            Départ calé sur tes chiffres
          </Text>
          <Ionicons name="chevron-forward" size={13} color={theme.primary} />
        </Pressable>
      )}

      <View style={styles.controles}>
        {simulateur.variables.map((variable, index) => (
          <Apparition key={variable.id} delai={260 + index * 90}>
            <Stepper
              variable={variable}
              valeur={valeurs[variable.id]}
              couleur={theme.primary}
              onChanger={(valeur) => changerValeur(variable.id, valeur)}
            />
          </Apparition>
        ))}
      </View>

      <Apparition mode="pop" delai={520} style={[styles.resultatConteneur, { backgroundColor: theme.primary }]}>
        <Text style={styles.resultatLabel}>{simulateur.resultat.label}</Text>
        <Text style={styles.resultatValeur}>{formaterResultat(resultat, simulateur.resultat.unite)}</Text>
        {effort && <Text style={styles.resultatEffort}>≈ {effort}</Text>}
      </Apparition>

      {!aInteragi && (
        <View style={styles.indication}>
          <Ionicons name="hand-left" size={15} color={couleurs.texteAttenue} />
          <Text style={styles.indicationTexte}>Fais varier au moins une valeur pour continuer.</Text>
        </View>
      )}

      <BoutonContinuer
        theme={theme}
        disabled={!aInteragi}
        onPress={() => onTerminer({ type: "exemple", aInteragi })}
      />
    </ScrollView>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    conteneur: {
      padding: 22,
      paddingBottom: 40,
      gap: 22,
    },
    pilulePerso: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 7,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: RAYONS.pilule,
      marginTop: -8,
    },
    pilulePersoTexte: {
      ...TYPO.legende,
      fontSize: 12,
    },
    controles: {
      gap: 16,
    },
    resultatConteneur: {
      borderRadius: RAYONS.carte,
      paddingVertical: 24,
      paddingHorizontal: 18,
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
    indication: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },
    indicationTexte: {
      ...TYPO.legende,
      color: couleurs.texteAttenue,
    },
  });
