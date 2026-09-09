import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { supabase } from "../src/data/remote/supabaseClient";

// Écran temporaire de vérification de connexion Supabase — à retirer une fois validé.
// La table interrogée n'existe volontairement pas : une erreur "table introuvable"
// (PGRST205, renvoyée par PostgREST — ou 42P01 si jamais elle remonte de Postgres)
// prouve que la requête a atteint Supabase et a été authentifiée avec la clé anon, ce
// qui est justement ce qu'on veut vérifier ici (pas la présence d'une table).
const CODES_ERREUR_TABLE_ABSENTE = ["PGRST205", "42P01"];

type EtatConnexion =
  | { statut: "en_cours" }
  | { statut: "connecte"; message: string }
  | { statut: "echec"; message: string };

export default function Index() {
  const [etat, setEtat] = useState<EtatConnexion>({ statut: "en_cours" });

  useEffect(() => {
    let annule = false;

    async function verifierConnexionSupabase() {
      try {
        const { error } = await supabase.from("__connexion_test__").select("id").limit(1);
        if (annule) return;

        if (!error || (error.code && CODES_ERREUR_TABLE_ABSENTE.includes(error.code))) {
          const message = error
            ? `Supabase a répondu (table absente, attendu) : ${error.message}`
            : "Supabase a répondu avec des données.";
          console.log("[supabase] connexion OK —", message);
          setEtat({ statut: "connecte", message });
        } else {
          const message = `${error.code ?? "?"} — ${error.message}`;
          console.log("[supabase] connexion en échec —", message);
          setEtat({ statut: "echec", message });
        }
      } catch (erreur) {
        if (annule) return;
        const message = erreur instanceof Error ? erreur.message : String(erreur);
        console.log("[supabase] connexion en échec —", message);
        setEtat({ statut: "echec", message });
      }
    }

    verifierConnexionSupabase();
    return () => {
      annule = true;
    };
  }, []);

  return (
    <View style={styles.conteneur}>
      <Text style={styles.titre}>Test de connexion Supabase</Text>
      <Text style={styles.statut}>
        {etat.statut === "en_cours" && "Connexion en cours…"}
        {etat.statut === "connecte" && "✅ Connecté"}
        {etat.statut === "echec" && "❌ Échec"}
      </Text>
      {etat.statut !== "en_cours" && <Text style={styles.message}>{etat.message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 8,
  },
  titre: {
    fontSize: 16,
    fontWeight: "600",
  },
  statut: {
    fontSize: 18,
  },
  message: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
});
