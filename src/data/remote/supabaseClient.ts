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

/**
 * Vrai si les deux variables sont présentes. babel-preset-expo réécrit tout accès à
 * `process.env.EXPO_PUBLIC_*` en lecture du module `expo/virtual/env`, que Metro fige avec
 * les valeurs du build : leur présence est donc décidée à la compilation, pas à l'exécution.
 */
export const supabaseConfigure = Boolean(supabaseUrl && supabaseAnonKey);

if (!supabaseConfigure && __DEV__) {
  console.warn(
    "[supabase] EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY absentes " +
      "(voir .env.example). L'app servira le contenu embarqué et la capture d'email " +
      "sera indisponible."
  );
}

/**
 * `null` quand les clés manquent, plutôt qu'une erreur levée à l'import.
 *
 * Lever ici rendait l'app impossible à démarrer : l'import remonte jusqu'au premier écran,
 * donc une variable oubliée au moment du build produisait un écran noir au lancement, sans
 * message exploitable. C'est aussi ce qui arrive par défaut sur EAS, où `.env` n'est pas
 * envoyé parce qu'il est gitignoré.
 *
 * Or l'app sait déjà se passer du réseau : le contenu descend Supabase → cache → bundle
 * (voir contentRepository.ts), et les 183 étapes voyagent dans le binaire. Une clé
 * manquante doit donc dégrader vers le repli, exactement comme une coupure réseau — pas
 * empêcher le démarrage. Le type `null` force chaque appelant à traiter le cas.
 */
export const supabase = supabaseConfigure
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
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
    })
  : null;
