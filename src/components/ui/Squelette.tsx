import { StyleSheet, View, type ViewStyle } from "react-native";

import { useCouleurs, useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { RAYONS } from "../../theme/parcoursTheme";
import { Reflet } from "./Reflet";

/**
 * Bloc de chargement traversé par une lumière. Le battement d'opacité qu'on utilisait
 * avant disait « attends » ; un balayage dit « ça arrive » — c'est un mouvement qui va
 * quelque part, et il rend l'attente sensiblement plus courte.
 *
 * Le décalage (`retard`) sert à ne pas faire scintiller tous les blocs à l'unisson : une
 * page de squelettes synchronisés clignote, une page décalée ondule.
 */
export function Squelette({ style, retard = 0 }: { style?: ViewStyle; retard?: number }) {
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  return (
    <View style={[styles.bloc, style]}>
      <Reflet
        duree={1100}
        pause={450 + retard}
        intensite={0.85}
        largeur={0.45}
        couleur={couleurs.surface}
      />
    </View>
  );
}

/** Squelette d'un écran de chemin : bandeau, puis quelques nœuds — le temps que le contenu arrive. */
export function SqueletteChemin({ insetHaut }: { insetHaut: number }) {
  const styles = useStyles(creerStyles);
  return (
    <View style={styles.ecran} accessibilityLabel="Chargement">
      <View style={[styles.bandeau, { paddingTop: insetHaut + 20 }]}>
        <Squelette style={{ width: 38, height: 38, borderRadius: 999 }} />
        <Squelette style={{ width: "60%", height: 30, marginTop: 24 }} retard={90} />
        <Squelette style={{ width: "100%", height: 10, marginTop: 22, borderRadius: 999 }} retard={180} />
      </View>
      <View style={styles.noeuds}>
        {[0, 1, 2, 3, 4].map((index) => (
          <Squelette
            key={index}
            retard={index * 110}
            style={{
              width: 60,
              height: 60,
              borderRadius: 999,
              alignSelf: index % 3 === 0 ? "center" : index % 3 === 1 ? "flex-end" : "flex-start",
              marginHorizontal: 70,
            }}
          />
        ))}
      </View>
    </View>
  );
}

/** Squelette d'une étape : bandeau + quelques lignes de texte. */
export function SqueletteEtape({ insetHaut }: { insetHaut: number }) {
  const styles = useStyles(creerStyles);
  return (
    <View style={styles.ecran} accessibilityLabel="Chargement">
      <View style={[styles.bandeau, { paddingTop: insetHaut + 8, paddingBottom: 38 }]}>
        <Squelette style={{ width: 38, height: 38, borderRadius: 999 }} />
        <Squelette style={{ width: "40%", height: 12, marginTop: 20 }} retard={80} />
        <Squelette style={{ width: "85%", height: 26, marginTop: 10 }} retard={160} />
      </View>
      <View style={styles.lignes}>
        <Squelette style={{ width: "100%", height: 16 }} retard={60} />
        <Squelette style={{ width: "92%", height: 16 }} retard={140} />
        <Squelette style={{ width: "70%", height: 16 }} retard={220} />
        <Squelette style={{ width: "100%", height: 90, marginTop: 10, borderRadius: RAYONS.carte }} retard={300} />
      </View>
    </View>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    ecran: {
      flex: 1,
      backgroundColor: couleurs.fond,
    },
    bloc: {
      backgroundColor: couleurs.verrouilleBordure,
      borderRadius: RAYONS.petit,
      // La lumière balaie l'intérieur du bloc : sans découpe, elle déborderait des coins.
      overflow: "hidden",
    },
    bandeau: {
      paddingHorizontal: 22,
      paddingBottom: 26,
    },
    noeuds: {
      paddingTop: 30,
      gap: 44,
    },
    lignes: {
      padding: 22,
      gap: 12,
    },
  });
