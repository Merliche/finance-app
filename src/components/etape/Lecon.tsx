import { ScrollView, StyleSheet } from "react-native";

import type { EtapeLecon } from "../../domain/parcours/types";
import type { ResultatEtape } from "../../domain/parcours/progress";
import type { ThemeParcours } from "../../theme/parcoursTheme";
import { BoutonContinuer } from "./BoutonContinuer";
import { ContenuBlocs } from "./ContenuBlocs";

export function Lecon({
  etape,
  onTerminer,
  theme,
}: {
  etape: EtapeLecon;
  onTerminer: (resultat: ResultatEtape) => void;
  theme: ThemeParcours;
}) {
  return (
    <ScrollView contentContainerStyle={styles.conteneur} showsVerticalScrollIndicator={false}>
      <ContenuBlocs blocs={etape.contenu} theme={theme} />
      <BoutonContinuer theme={theme} onPress={() => onTerminer({ type: "lecon" })} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    padding: 22,
    paddingBottom: 40,
    gap: 28,
  },
});
