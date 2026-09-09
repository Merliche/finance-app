// Client Supabase partagé par toute l'app. Pas de repositories ici — juste la connexion.
//
// Clés lues depuis les variables d'environnement EXPO_PUBLIC_* (voir .env.example et le
// README pour comment les renseigner). Le préfixe EXPO_PUBLIC_ est ce qui permet à Metro
// de les inliner dans le bundle JS au build : c'est la convention Expo native pour exposer
// une variable au code client (pas de lib tierce nécessaire). Ça les rend visibles dans
// l'app livrée (donc PAS un mécanisme de secret) — c'est pourquoi seule la clé publique
// "anon" de Supabase doit être utilisée ici, jamais la clé "service_role".
import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variables d'environnement Supabase manquantes : EXPO_PUBLIC_SUPABASE_URL et " +
      "EXPO_PUBLIC_SUPABASE_ANON_KEY doivent être définies dans .env (voir .env.example)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // L'app ne propose pas de compte utilisateur (voir PROJECT.md §2), mais le client
    // Supabase instancie toujours un module de session — sans storage adapter, il tente
    // d'utiliser `window.localStorage`, absent en React Native, et plante. AsyncStorage
    // est donc requis même sans usage prévu de l'auth.
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Nécessite `window`, absent en React Native.
    detectSessionInUrl: false,
  },
});
