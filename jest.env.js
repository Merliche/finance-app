// Variables d'environnement de l'environnement de test.
//
// Le client Supabase lève au chargement si ses clés manquent, et c'est voulu : une app
// livrée sans clés ne doit pas démarrer à moitié. Jest, lui, ne lit pas le fichier .env,
// et aucun test ne doit jamais atteindre le réseau. On pose donc des valeurs factices,
// assez bien formées pour que le client se construise, et qui ne désignent rien.
//
// Ce fichier passe par `setupFiles` et non `setupFilesAfterEnv` : il doit s'exécuter
// avant que le moindre module de l'app ne soit évalué.
process.env.EXPO_PUBLIC_SUPABASE_URL = "https://tests.invalid";
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "cle-anon-de-test";
