import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { inscrireEmail, type ResultatInscriptionEmail } from "../../../src/data/remote/emailRepository";
import { useParcours } from "../../../src/hooks/useParcours";
import { useProgressStore } from "../../../src/state/progressStore";

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EcranRecompense() {
  const { parcoursId } = useLocalSearchParams<{ parcoursId: string }>();
  const etat = useParcours(parcoursId);
  const enregistrerEmailCapture = useProgressStore((state) => state.enregistrerEmailCapture);
  const emailDejaCapture = useProgressStore((state) => state.emailCapture?.email);

  const [email, setEmail] = useState(emailDejaCapture ?? "");
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState<ResultatInscriptionEmail | undefined>();

  if (etat.statut === "chargement") {
    return (
      <View style={styles.centre}>
        <ActivityIndicator />
      </View>
    );
  }

  if (etat.statut === "erreur") {
    return (
      <View style={styles.centre}>
        <Text style={styles.messageErreur}>Contenu indisponible : {etat.message}</Text>
      </View>
    );
  }

  const { recompense } = etat.parcours;
  if (!recompense) {
    return (
      <View style={styles.centre}>
        <Text style={styles.messageErreur}>Ce parcours ne débloque pas de récompense.</Text>
      </View>
    );
  }

  async function envoyerEmail() {
    if (!REGEX_EMAIL.test(email)) {
      setResultat({ statut: "erreur", message: "Adresse email invalide." });
      return;
    }
    setEnvoi(true);
    const reponse = await inscrireEmail(email, parcoursId);
    setEnvoi(false);
    setResultat(reponse);
    if (reponse.statut === "ok") {
      enregistrerEmailCapture(email);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.conteneur}>
      <Text style={styles.felicitations}>Bravo, parcours terminé ! 🎉</Text>

      <View style={styles.carteRecompense}>
        <Text style={styles.livreTitre}>{recompense.livre.titre}</Text>
        <View style={styles.codeConteneur}>
          <Text style={styles.codeLabel}>Ton code promo</Text>
          <Text style={styles.code}>{recompense.code}</Text>
        </View>
        <Pressable
          style={styles.boutonAmazon}
          onPress={() => Linking.openURL(recompense.livre.urlAmazon)}
        >
          <Text style={styles.boutonAmazonTexte}>Voir le livre sur Amazon</Text>
        </Pressable>
      </View>

      <View style={styles.captureEmail}>
        <Text style={styles.captureTitre}>Être prévenu des prochaines sorties</Text>
        <Text style={styles.captureDescription}>
          Laisse ton email pour être averti des prochains livres.
        </Text>
        <TextInput
          style={styles.champEmail}
          value={email}
          onChangeText={setEmail}
          placeholder="ton@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!envoi}
        />
        <Pressable style={styles.boutonEnvoyer} onPress={envoyerEmail} disabled={envoi}>
          {envoi ? <ActivityIndicator color="#fff" /> : <Text style={styles.boutonEnvoyerTexte}>Valider</Text>}
        </Pressable>

        {resultat?.statut === "ok" && <Text style={styles.messageSucces}>Merci, tu es inscrit(e) !</Text>}
        {resultat?.statut === "deja_inscrit" && (
          <Text style={styles.messageInfo}>Cet email est déjà inscrit.</Text>
        )}
        {resultat?.statut === "erreur" && <Text style={styles.messageErreur}>{resultat.message}</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    padding: 20,
    gap: 24,
  },
  centre: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  messageErreur: {
    fontSize: 14,
    color: "#e03131",
    textAlign: "center",
  },
  felicitations: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: "#1a1a1a",
  },
  carteRecompense: {
    backgroundColor: "#eef2ff",
    borderRadius: 14,
    padding: 20,
    gap: 16,
    alignItems: "center",
  },
  livreTitre: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
  },
  codeConteneur: {
    alignItems: "center",
    gap: 4,
  },
  codeLabel: {
    fontSize: 12,
    color: "#4f5b76",
  },
  code: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#1a1a1a",
  },
  boutonAmazon: {
    backgroundColor: "#ffb703",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    alignSelf: "stretch",
  },
  boutonAmazonTexte: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  captureEmail: {
    gap: 10,
  },
  captureTitre: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  captureDescription: {
    fontSize: 13,
    color: "#666",
  },
  champEmail: {
    borderWidth: 1,
    borderColor: "#dfe3eb",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
  },
  boutonEnvoyer: {
    backgroundColor: "#4f7cff",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  boutonEnvoyerTexte: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  messageSucces: {
    fontSize: 13,
    color: "#2f9e44",
    textAlign: "center",
  },
  messageInfo: {
    fontSize: 13,
    color: "#4f5b76",
    textAlign: "center",
  },
});
