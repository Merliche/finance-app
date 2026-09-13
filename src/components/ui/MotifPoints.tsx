import { StyleSheet } from "react-native";
import Svg, { Circle, Defs, Pattern, Rect } from "react-native-svg";

/**
 * Trame de points très discrète, façon papier millimétré — une texture qui donne de la
 * matière aux aplats (bandeaux, fond de carte) sans image ni dégradé de plus.
 */
export function MotifPoints({ couleur, opacite = 0.12, pas = 18 }: { couleur: string; opacite?: number; pas?: number }) {
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <Pattern id="motif-points" patternUnits="userSpaceOnUse" width={pas} height={pas}>
          <Circle cx={pas / 2} cy={pas / 2} r={1.1} fill={couleur} opacity={opacite} />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#motif-points)" />
    </Svg>
  );
}
