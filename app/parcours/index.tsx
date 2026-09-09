import { Link } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { voieEstDeverrouillee } from "../../src/domain/parcours/progress";
import type { Parcours } from "../../src/domain/parcours/types";
import { VOIES } from "../../src/constants/voies";
import { useParcours } from "../../src/hooks/useParcours";
import { useProgressStore } from "../../src/state/progressStore";

const LABEL_STATUT: Record<string, string> = {
  non_commence: "À commencer",
  en_cours: "En cours",
  termine: "Terminé",
};

function CarteVoie({ voieId, labelParDefaut }: { voieId: string; labelParDefaut: string }) {
  // Sélecteurs séparés par champ primitif : un sélecteur qui retourne un objet/tableau
  // littéral crée une nouvelle référence à chaque rendu, ce que useSyncExternalStore
  // (utilisé par Zustand) détecte comme "changé" en permanence → boucle infinie de
  // rendu ("The result of getSnapshot should be cached"). L'objet ProgressionGlobale
  // ci-dessous n'est reconstruit qu'après ces deux sélecteurs stables, pas à l'intérieur
  // d'un sélecteur Zustand : ce n'est donc pas soumis à cette contrainte.
  const parcoursProgression = useProgressStore((state) => state.parcours);
  const emailCapture = useProgressStore((state) => state.emailCapture);
  const progressionGlobale = { parcours: parcoursProgression, emailCapture };
  const progression = parcoursProgression[voieId];
  const etat = useParcours(voieId);

  // Les 3 voies dépendent toutes de "intro" (voir PROJECT.md §1) : ce prérequis est
  // connu même avant que le vrai Parcours de la voie ne soit chargé, ce qui permet
  // d'afficher le cadenas sans attendre le fetch réseau.
  const parcoursPourVerrou: Pick<Parcours, "prerequisParcoursId"> =
    etat.statut === "charge" ? etat.parcours : { prerequisParcoursId: "intro" };
  const deverrouillee = voieEstDeverrouillee(parcoursPourVerrou as Parcours, progressionGlobale);

  const titre = etat.statut === "charge" ? etat.parcours.titre : labelParDefaut;
  const description = etat.statut === "charge" ? etat.parcours.description : "Bientôt disponible.";
  const disponible = etat.statut === "charge";

  const contenu = (
    <View style={[styles.carte, !deverrouillee && styles.carteVerrouillee]}>
      <View style={styles.carteEntete}>
        <Text style={styles.carteTitre}>{titre}</Text>
        {!deverrouillee && <Text style={styles.cadenas}>🔒</Text>}
      </View>
      <Text style={styles.carteDescription}>{description}</Text>
      {deverrouillee && progression && (
        <Text style={styles.carteStatut}>{LABEL_STATUT[progression.statut]}</Text>
      )}
      {etat.statut === "chargement" && deverrouillee && <ActivityIndicator size="small" />}
    </View>
  );

  if (!deverrouillee || !disponible) {
    return <Pressable disabled style={styles.carteConteneur}>{contenu}</Pressable>;
  }

  return (
    <Link href={{ pathname: "/parcours/[parcoursId]", params: { parcoursId: voieId } }} asChild>
      <Pressable style={styles.carteConteneur}>{contenu}</Pressable>
    </Link>
  );
}

export default function ChoixVoies() {
  return (
    <ScrollView contentContainerStyle={styles.conteneur}>
      <Text style={styles.titrePage}>Choisis ta voie</Text>
      <Text style={styles.sousTitre}>
        Chaque voie est un parcours complet, avec un code promo à la clé.
      </Text>
      {VOIES.map((voie) => (
        <CarteVoie key={voie.id} voieId={voie.id} labelParDefaut={voie.labelParDefaut} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    padding: 20,
    gap: 16,
  },
  titrePage: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  sousTitre: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  carteConteneur: {
    borderRadius: 12,
  },
  carte: {
    borderWidth: 1,
    borderColor: "#dfe3eb",
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  carteVerrouillee: {
    opacity: 0.5,
  },
  carteEntete: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  carteTitre: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  cadenas: {
    fontSize: 16,
  },
  carteDescription: {
    fontSize: 13,
    color: "#666",
  },
  carteStatut: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4f7cff",
  },
});
