import { ScrollView, StyleSheet } from "react-native";

import type { EtapeLecon } from "../../domain/parcours/types";
import type { ResultatEtape } from "../../domain/parcours/progress";
import { BoutonContinuer } from "./BoutonContinuer";
import { ContenuBlocs } from "./ContenuBlocs";

export function Lecon({
  etape,
  onTerminer,
}: {
  etape: EtapeLecon;
  onTerminer: (resultat: ResultatEtape) => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.conteneur}>
      <ContenuBlocs blocs={etape.contenu} />
      <BoutonContinuer onPress={() => onTerminer({ type: "lecon" })} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    padding: 20,
    gap: 24,
  },
});
