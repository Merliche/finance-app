import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { viderCacheContenu } from "../../data/remote/contentRepository";
import { useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { PRESSION, RAYONS, THEMES_PARCOURS } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";

const THEME = THEMES_PARCOURS.intro;

/**
 * Écran de secours affiché quand un composant lève pendant le rendu. Sans lui, l'app
 * afficherait un écran vide et l'utilisateur n'aurait aucun moyen de repartir.
 *
 * Deux sorties sont proposées, dans l'ordre du plus probable : réessayer (beaucoup
 * d'erreurs sont transitoires), puis vider le cache de contenu — la cause la plus
 * plausible étant un contenu mis en cache que cette version de l'app ne sait plus lire.
 * La progression n'est jamais touchée : ce serait la pire chose à faire au moment où
 * l'utilisateur a déjà un problème.
 */
function EcranSecours({ erreur, onReessayer }: { erreur: Error | undefined; onReessayer: () => void }) {
  const styles = useStyles(creerStyles);
  async function viderPuisReessayer() {
    await viderCacheContenu().catch(() => {
      // Si même le vidage échoue, on retente quand même : le rendu peut repartir.
    });
    onReessayer();
  }

  return (
    <ScrollView contentContainerStyle={styles.conteneur} showsVerticalScrollIndicator={false}>
      <View style={styles.cercle}>
        <Ionicons name="construct-outline" size={30} color={THEME.primary} />
      </View>

      <Text style={styles.titre} accessibilityRole="header">
        Quelque chose s'est mal passé
      </Text>
      <Text style={styles.texte}>
        L'application a rencontré un problème inattendu. Ta progression est enregistrée sur ton téléphone :
        elle n'a pas été perdue.
      </Text>

      <View style={styles.actions}>
        <Pressable
          onPress={onReessayer}
          accessibilityRole="button"
          style={({ pressed }) => [styles.boutonPrincipal, pressed && PRESSION]}
        >
          <Ionicons name="refresh" size={17} color="#FFFFFF" />
          <Text style={styles.boutonPrincipalTexte}>Réessayer</Text>
        </Pressable>

        <Pressable
          onPress={viderPuisReessayer}
          accessibilityRole="button"
          accessibilityHint="Supprime le contenu téléchargé, qui sera récupéré à nouveau"
          style={({ pressed }) => [styles.boutonSecondaire, pressed && PRESSION]}
        >
          <Text style={styles.boutonSecondaireTexte}>Vider le contenu téléchargé et réessayer</Text>
        </Pressable>
      </View>

      {__DEV__ && erreur && (
        <View style={styles.detail}>
          <Text style={styles.detailTitre}>Détail (visible en développement uniquement)</Text>
          <Text style={styles.detailTexte}>{erreur.message}</Text>
        </View>
      )}
    </ScrollView>
  );
}

interface Etat {
  erreur?: Error;
  /** Change à chaque « réessayer » pour remonter entièrement l'arbre d'enfants. */
  tentative: number;
}

/**
 * Limite d'erreur globale. Un composant de classe est obligatoire ici : React n'expose
 * `componentDidCatch` / `getDerivedStateFromError` que sur les classes.
 */
class LimiteErreurBrute extends Component<
  { children: ReactNode; styles: ReturnType<typeof creerStyles> },
  Etat
> {
  state: Etat = { tentative: 0 };

  static getDerivedStateFromError(erreur: Error): Partial<Etat> {
    return { erreur };
  }

  componentDidCatch(erreur: Error, infos: ErrorInfo): void {
    // Pas de service de crash externe dans cette app (aucune donnée n'est collectée) :
    // la console est le seul endroit où l'erreur reste consultable.
    console.error("[crash] rendu interrompu", erreur, infos.componentStack);
  }

  reessayer = (): void => {
    this.setState((precedent) => ({ erreur: undefined, tentative: precedent.tentative + 1 }));
  };

  render(): ReactNode {
    if (this.state.erreur) {
      return (
        <View style={this.props.styles.racine}>
          <EcranSecours erreur={this.state.erreur} onReessayer={this.reessayer} />
        </View>
      );
    }
    // La clé force un remontage complet : sans elle, un enfant resté dans un état
    // incohérent relèverait immédiatement la même erreur.
    return (
      <View key={this.state.tentative} style={this.props.styles.racine}>
        {this.props.children}
      </View>
    );
  }
}

/**
 * Un composant de classe ne peut pas lire de hook, et une limite d'erreur doit être une
 * classe. L'enveloppe lit donc la palette et la lui passe : l'écran de secours suit le
 * mode sombre comme le reste, au lieu de trouer l'écran en blanc au pire moment.
 */
export function LimiteErreur({ children }: { children: ReactNode }) {
  const styles = useStyles(creerStyles);
  return <LimiteErreurBrute styles={styles}>{children}</LimiteErreurBrute>;
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    racine: {
      flex: 1,
    },
    conteneur: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
      gap: 14,
      backgroundColor: couleurs.fond,
    },
    cercle: {
      width: 74,
      height: 74,
      borderRadius: 999,
      backgroundColor: THEME.tint,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    titre: {
      ...TYPO.titreSection,
      fontSize: 21,
      color: couleurs.texte,
      textAlign: "center",
    },
    texte: {
      ...TYPO.corps,
      color: couleurs.texteAttenue,
      textAlign: "center",
    },
    actions: {
      alignSelf: "stretch",
      marginTop: 12,
      gap: 10,
    },
    boutonPrincipal: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: THEME.primary,
      borderRadius: RAYONS.grand,
      paddingVertical: 16,
    },
    boutonPrincipalTexte: {
      ...TYPO.bouton,
      color: "#FFFFFF",
    },
    boutonSecondaire: {
      alignItems: "center",
      backgroundColor: couleurs.surfaceAtone,
      borderRadius: RAYONS.grand,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    boutonSecondaireTexte: {
      ...TYPO.label,
      color: couleurs.texteAttenue,
      textAlign: "center",
    },
    detail: {
      alignSelf: "stretch",
      marginTop: 18,
      padding: 14,
      borderRadius: RAYONS.moyen,
      backgroundColor: couleurs.surface,
      gap: 6,
      ...couleurs.ombres.carte,
    },
    detailTitre: {
      ...TYPO.surtitre,
      color: couleurs.texteTertiaire,
    },
    detailTexte: {
      ...TYPO.legende,
      color: couleurs.erreur,
    },
  });
