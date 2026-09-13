import type { Ionicons } from "@expo/vector-icons";
import type { TypeElementLateral } from "../../domain/elementsLateraux/types";

type NomIcone = keyof typeof Ionicons.glyphMap;

/**
 * Différenciation visuelle par type d'élément latéral — icône + couleur, volontairement
 * indépendante du thème de parcours (ce sont des catégories transverses, pas une
 * identité de voie) et plus sourdes que les couleurs de parcours pour rester en retrait
 * du chemin principal.
 */
export const CONFIG_ELEMENT_LATERAL: Record<TypeElementLateral, { icone: NomIcone; couleur: string; label: string }> = {
  calculateur: { icone: "calculator-outline", couleur: "#7C6EF2", label: "Calculateur" },
  comparateur: { icone: "swap-horizontal-outline", couleur: "#2AA9A0", label: "Comparateur" },
  saviez_vous: { icone: "bulb-outline", couleur: "#E0A73B", label: "Le saviez-vous ?" },
  glossaire: { icone: "library-outline", couleur: "#B15FC7", label: "Glossaire" },
  badge: { icone: "ribbon-outline", couleur: "#D46A8F", label: "Badge" },
};
