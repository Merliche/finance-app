// Doublures communes à tous les tests de composants.
//
// Elles ne corrigent aucun défaut de l'app : ce sont des dépendances natives (moteur
// d'animation, stockage, haptique, navigation) qui n'ont pas d'équivalent dans
// l'environnement Node de Jest. Les regrouper ici évite de les recopier dans chaque
// fichier de test, et garantit que tout nouveau test de rendu part du même socle.

// --- Animations -------------------------------------------------------------
// React Native fournit `AnimatedMock` précisément pour les tests : il remplace timing,
// spring, loop et stagger par des animations qui sautent directement à leur état final.
// Sans lui, `useNativeDriver: true` tente d'atteindre la vue native — inexistante ici —
// et fait planter le processus depuis un timer, après la fin du test.
// On ne garde du mock que les fonctions d'animation : les composants (`Animated.View`,
// `Animated.Text`…) viennent du vrai module, sinon plus rien ne se rendrait.
//
// Le détournement passe par un proxy et non par une copie. Le vrai module expose ses
// composants via des accesseurs paresseux : les recopier (`{ ...reel }`) les évalue tous
// d'un coup, y compris `Animated.ScrollView`, dont la construction échoue si elle se
// produit pendant le chargement de react-native lui-même. Le proxy ne lit un accesseur
// que si le test s'en sert vraiment.
jest.mock("react-native/Libraries/Animated/Animated", () => {
  const reel = jest.requireActual("react-native/Libraries/Animated/Animated").default;
  const sansAnimation = jest.requireActual("react-native/Libraries/Animated/AnimatedMock").default;
  return {
    __esModule: true,
    default: new Proxy(reel, {
      get: (cible, propriete) =>
        propriete in sansAnimation ? sansAnimation[propriete] : Reflect.get(cible, propriete),
    }),
  };
});

// --- Stockage ---------------------------------------------------------------
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// --- Haptique ---------------------------------------------------------------
// Les helpers de l'app avalent déjà les rejets ; le module lui-même n'existe pas ici.
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

// --- Navigation -------------------------------------------------------------
// Les composants testés ne naviguent pas pendant le rendu : un routeur inerte suffit,
// et permet de monter un composant hors de toute pile de navigation.
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => ({}),
  Link: ({ children }) => children,
}));

// --- Zone sûre --------------------------------------------------------------
// `useSafeAreaInsets` lit une valeur fournie par un provider natif. Hors application,
// il n'y en a pas : on rend des marges nulles, ce qui correspond à un écran sans
// encoche et n'affecte aucune des assertions des tests.
jest.mock("react-native-safe-area-context", () => {
  const reel = jest.requireActual("react-native-safe-area-context");
  return {
    ...reel,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

// --- Supabase ---------------------------------------------------------------
// Aucun test ne doit ouvrir de connexion : le vrai client instancie un canal temps réel
// qui cherche un WebSocket inexistant sous Node, et surtout un test qui parle au réseau
// n'est plus un test. La doublure répond « indisponible », ce qui est exactement le cas
// hors ligne : le repository de contenu bascule alors sur le contenu embarqué, et c'est
// ce chemin de repli que les tests d'écran doivent emprunter.
jest.mock("./src/data/remote/supabaseClient", () => {
  const indisponible = () =>
    Promise.resolve({ data: null, error: { message: "réseau indisponible (test)" } });
  const requete = {
    select: () => requete,
    eq: () => requete,
    limit: () => requete,
    order: () => requete,
    insert: indisponible,
    single: indisponible,
    maybeSingle: indisponible,
    then: (resoudre) => indisponible().then(resoudre),
  };
  return { supabase: { from: () => requete } };
});
