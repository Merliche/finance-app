import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

import { LimiteErreur } from "../src/components/ui/LimiteErreur";
import { FournisseurTheme, useCouleurs, useMode } from "../src/theme/ModeCouleur";
import { POLICES } from "../src/theme/typographie";

// Garde le splash natif affiché tant que les polices ne sont pas prêtes : sans ça,
// l'app s'affiche une fraction de seconde en police système avant de basculer.
SplashScreen.preventAutoHideAsync().catch(() => {});

// On charge les fichiers TTF directement plutôt que via l'index des paquets
// @expo-google-fonts : l'index `require` TOUTES les graisses (italiques comprises),
// soit ~2 Mo embarqués dans l'app pour 7 fichiers réellement utilisés.
const FICHIERS_POLICES = {
  [POLICES.titre]: require("@expo-google-fonts/bricolage-grotesque/700Bold/BricolageGrotesque_700Bold.ttf"),
  [POLICES.titreExtra]: require("@expo-google-fonts/bricolage-grotesque/800ExtraBold/BricolageGrotesque_800ExtraBold.ttf"),
  [POLICES.regulier]: require("@expo-google-fonts/plus-jakarta-sans/400Regular/PlusJakartaSans_400Regular.ttf"),
  [POLICES.moyen]: require("@expo-google-fonts/plus-jakarta-sans/500Medium/PlusJakartaSans_500Medium.ttf"),
  [POLICES.semi]: require("@expo-google-fonts/plus-jakarta-sans/600SemiBold/PlusJakartaSans_600SemiBold.ttf"),
  [POLICES.gras]: require("@expo-google-fonts/plus-jakarta-sans/700Bold/PlusJakartaSans_700Bold.ttf"),
  [POLICES.extra]: require("@expo-google-fonts/plus-jakarta-sans/800ExtraBold/PlusJakartaSans_800ExtraBold.ttf"),
};

export default function RootLayout() {
  const [policesChargees, erreurPolices] = useFonts(FICHIERS_POLICES);

  useEffect(() => {
    // On masque aussi le splash en cas d'échec de chargement : mieux vaut l'app en
    // police système qu'un écran de démarrage bloqué indéfiniment.
    if (policesChargees || erreurPolices) SplashScreen.hideAsync().catch(() => {});
  }, [policesChargees, erreurPolices]);

  if (!policesChargees && !erreurPolices) return null;

  // Le fournisseur de thème est au-dessus de la limite d'erreur : même l'écran de secours
  // doit s'afficher aux couleurs du mode choisi.
  return (
    <FournisseurTheme>
      <Navigation />
    </FournisseurTheme>
  );
}

function Navigation() {
  const couleurs = useCouleurs();
  const mode = useMode();

  return (
    // La limite d'erreur enveloppe toute la navigation : une exception de rendu, d'où
    // qu'elle vienne, mène à un écran de secours plutôt qu'à un écran vide.
    <LimiteErreur>
      {/* Les icônes de la barre système s'inversent avec le mode, sinon elles
          disparaissent sur le fond sombre. */}
      <StatusBar style={mode === "sombre" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: couleurs.fond },
          headerShadowVisible: false,
          headerTintColor: couleurs.texte,
          headerTitleStyle: { fontFamily: POLICES.gras, fontSize: 16 },
          headerBackButtonDisplayMode: "minimal",
          contentStyle: { backgroundColor: couleurs.fond },
          animation: "slide_from_right",
          // Les écrans utilitaires montent du bas comme des panneaux, les écrans de
          // parcours glissent latéralement : la direction dit à elle seule si on
          // s'enfonce dans le contenu ou si on ouvre un outil par-dessus.
          animationDuration: 280,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false, animation: "fade" }} />
        <Stack.Screen name="bienvenue" options={{ headerShown: false, animation: "fade" }} />
        <Stack.Screen name="parcours/index" options={{ headerShown: false, animation: "fade" }} />
        <Stack.Screen name="parcours/[parcoursId]/index" options={{ headerShown: false }} />
        {/* Les étapes s'enchaînent par `replace` : un fondu évite l'effet "pile qui glisse" à chaque page */}
        <Stack.Screen name="parcours/[parcoursId]/etape/[etapeId]" options={{ headerShown: false, animation: "fade_from_bottom" }} />
        <Stack.Screen name="parcours/[parcoursId]/reward" options={{ headerShown: false, animation: "slide_from_bottom" }} />
        <Stack.Screen name="a-propos" options={{ headerShown: false, animation: "slide_from_bottom" }} />
        <Stack.Screen name="confidentialite" options={{ headerShown: false, animation: "slide_from_bottom" }} />
        {/* La boîte à outils porte son propre bandeau, avec son retour : l'en-tête natif
            clair au-dessus d'un bandeau sombre couperait l'écran en deux. */}
        <Stack.Screen name="outils" options={{ headerShown: false, animation: "slide_from_bottom" }} />
        <Stack.Screen name="profil" options={{ headerShown: false, animation: "slide_from_bottom" }} />
        <Stack.Screen name="bilan" options={{ headerShown: false, animation: "slide_from_bottom" }} />
        <Stack.Screen name="revision" options={{ headerShown: false, animation: "slide_from_bottom" }} />
        <Stack.Screen name="mes-chiffres" options={{ headerShown: false, animation: "slide_from_bottom" }} />
        <Stack.Screen name="glossaire" options={{ headerShown: false, animation: "slide_from_bottom" }} />
      </Stack>
    </LimiteErreur>
  );
}
