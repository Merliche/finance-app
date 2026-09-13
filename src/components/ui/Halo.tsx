import { useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import { avecAlpha } from "../../theme/couleurs";

/**
 * Tache de couleur vraiment diffuse : un dégradé radial qui s'éteint complètement sur
 * ses bords. C'est la différence entre un fond « aurore » et trois disques posés sur
 * l'écran — un cercle plein en faible opacité garde un bord net, parfaitement visible
 * sur un écran de téléphone, alors qu'un dégradé radial n'a pas de contour du tout.
 *
 * L'alpha est porté par les `Stop` (et non par une opacité de vue) pour que le centre
 * puisse être dense pendant que le bord disparaît : c'est ce qui donne du volume.
 */
export function Halo({
  taille,
  couleur,
  opacite = 0.5,
  /** Part du rayon où la couleur est encore à pleine densité. Plus petit = plus doux. */
  noyau = 0.12,
}: {
  taille: number;
  couleur: string;
  opacite?: number;
  noyau?: number;
}) {
  // Un identifiant unique par instance : deux dégradés SVG qui partagent un id se
  // marchent dessus, et la seconde tache prend la couleur de la première.
  const idBrut = useId();
  const id = `halo-${idBrut.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <View pointerEvents="none" style={{ width: taille, height: taille }}>
      <Svg width={taille} height={taille} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={couleur} stopOpacity={opacite} />
            <Stop offset={String(noyau)} stopColor={couleur} stopOpacity={opacite * 0.92} />
            <Stop offset="0.55" stopColor={couleur} stopOpacity={opacite * 0.42} />
            <Stop offset="0.8" stopColor={couleur} stopOpacity={opacite * 0.14} />
            <Stop offset="1" stopColor={avecAlpha(couleur, 0)} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={taille} height={taille} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
