import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { EtapeExemple, SimulateurVariable } from "../../domain/parcours/types";
import type { ResultatEtape } from "../../domain/parcours/progress";
import { resoudreFormule } from "../../domain/parcours/simulateurs";
import { BoutonContinuer } from "./BoutonContinuer";
import { ContenuBlocs } from "./ContenuBlocs";

function arrondirPas(valeur: number, pas: number): number {
  const decimales = (pas.toString().split(".")[1] ?? "").length;
  return Number(valeur.toFixed(decimales));
}

function Stepper({
  variable,
  valeur,
  onChanger,
}: {
  variable: SimulateurVariable;
  valeur: number;
  onChanger: (valeur: number) => void;
}) {
  return (
    <View style={styles.variable}>
      <Text style={styles.variableLabel}>{variable.label}</Text>
      <View style={styles.stepper}>
        <Pressable
          style={styles.stepperBouton}
          onPress={() => onChanger(Math.max(variable.min, arrondirPas(valeur - variable.pas, variable.pas)))}
        >
          <Text style={styles.stepperBoutonTexte}>−</Text>
        </Pressable>
        <Text style={styles.stepperValeur}>
          {valeur}
          {variable.unite ? ` ${variable.unite}` : ""}
        </Text>
        <Pressable
          style={styles.stepperBouton}
          onPress={() => onChanger(Math.min(variable.max, arrondirPas(valeur + variable.pas, variable.pas)))}
        >
          <Text style={styles.stepperBoutonTexte}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function Exemple({
  etape,
  onTerminer,
}: {
  etape: EtapeExemple;
  onTerminer: (resultat: ResultatEtape) => void;
}) {
  const { simulateur } = etape;
  const [valeurs, setValeurs] = useState<Record<string, number>>(() =>
    Object.fromEntries(simulateur.variables.map((variable) => [variable.id, variable.valeurParDefaut]))
  );
  const [aInteragi, setAInteragi] = useState(false);

  const calculer = useMemo(() => resoudreFormule(simulateur.formule), [simulateur.formule]);
  const resultat = calculer(valeurs);

  function changerValeur(variableId: string, valeur: number) {
    setAInteragi(true);
    setValeurs((precedent) => ({ ...precedent, [variableId]: valeur }));
  }

  return (
    <ScrollView contentContainerStyle={styles.conteneur}>
      <ContenuBlocs blocs={etape.contenu} />

      {simulateur.variables.map((variable) => (
        <Stepper
          key={variable.id}
          variable={variable}
          valeur={valeurs[variable.id]}
          onChanger={(valeur) => changerValeur(variable.id, valeur)}
        />
      ))}

      <View style={styles.resultatConteneur}>
        <Text style={styles.resultatLabel}>{simulateur.resultat.label}</Text>
        <Text style={styles.resultatValeur}>
          {resultat.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}
          {simulateur.resultat.unite ? ` ${simulateur.resultat.unite}` : ""}
        </Text>
      </View>

      {!aInteragi && (
        <Text style={styles.indication}>Fais varier au moins une valeur pour continuer.</Text>
      )}

      <BoutonContinuer
        disabled={!aInteragi}
        onPress={() => onTerminer({ type: "exemple", aInteragi })}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    padding: 20,
    gap: 24,
  },
  variable: {
    gap: 8,
  },
  variableLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f2f4f7",
    borderRadius: 10,
    padding: 8,
  },
  stepperBouton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBoutonTexte: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4f7cff",
  },
  stepperValeur: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  resultatConteneur: {
    backgroundColor: "#eef2ff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  resultatLabel: {
    fontSize: 13,
    color: "#4f5b76",
  },
  resultatValeur: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  indication: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
});
