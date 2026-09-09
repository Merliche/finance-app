import { Image, StyleSheet, Text, View } from "react-native";

import type { ContenuBloc } from "../../domain/parcours/types";

/** Rendu générique des blocs de contenu communs à tous les types d'étape. */
export function ContenuBlocs({ blocs }: { blocs: ContenuBloc[] }) {
  return (
    <View style={styles.conteneur}>
      {blocs.map((bloc, index) => {
        switch (bloc.type) {
          case "texte":
            return (
              <Text key={index} style={styles.texte}>
                {bloc.texte}
              </Text>
            );
          case "definition":
            return (
              <View key={index} style={styles.definition}>
                <Text style={styles.definitionTerme}>{bloc.terme}</Text>
                <Text style={styles.texte}>{bloc.texte}</Text>
              </View>
            );
          case "exemple_texte":
            return (
              <View key={index} style={styles.exempleTexte}>
                <Text style={styles.definitionTerme}>{bloc.titre}</Text>
                <Text style={styles.texte}>{bloc.texte}</Text>
              </View>
            );
          case "image":
            return (
              <View key={index} style={styles.imageConteneur}>
                <Image source={{ uri: bloc.url }} style={styles.image} resizeMode="contain" />
                {bloc.legende ? <Text style={styles.legende}>{bloc.legende}</Text> : null}
              </View>
            );
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    gap: 12,
  },
  texte: {
    fontSize: 15,
    lineHeight: 22,
    color: "#1a1a1a",
  },
  definition: {
    backgroundColor: "#f2f4f7",
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  definitionTerme: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  exempleTexte: {
    borderLeftWidth: 3,
    borderLeftColor: "#4f7cff",
    paddingLeft: 12,
    gap: 4,
  },
  imageConteneur: {
    gap: 4,
  },
  image: {
    width: "100%",
    height: 180,
  },
  legende: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
});
