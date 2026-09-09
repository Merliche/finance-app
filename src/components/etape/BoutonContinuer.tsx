import { Pressable, StyleSheet, Text } from "react-native";

export function BoutonContinuer({
  label = "Continuer",
  disabled,
  onPress,
}: {
  label?: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.bouton, disabled && styles.boutonDesactive]}
    >
      <Text style={[styles.texte, disabled && styles.texteDesactive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bouton: {
    backgroundColor: "#4f7cff",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  boutonDesactive: {
    backgroundColor: "#dfe3eb",
  },
  texte: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  texteDesactive: {
    color: "#9aa1ad",
  },
});
