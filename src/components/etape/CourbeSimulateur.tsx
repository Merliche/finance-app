import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

import type { EchantillonCourbe } from "../../domain/parcours/simulateurs/courbe";
import { formaterCourt } from "../schema/couleurs";
import { bornesY, projeterSerie, tracerCourbe } from "../schema/geometrie";
import { useCouleurs, useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { RAYONS, type ThemeParcours } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";

const HAUTEUR = 156;
const MARGE_HAUT = 12;
const MARGE_BAS = 8;
const MARGE_COTE = 10;

/**
 * Courbe du simulateur, redessinée à chaque mouvement des curseurs. Volontairement sans
 * animation d'entrée : ici l'effet vivant vient de la manipulation directe — on appuie
 * sur « + » et la courbe se déforme tout de suite. Une animation ajouterait un retard
 * entre le geste et le résultat, c'est-à-dire exactement ce qu'on veut éviter.
 *
 * Le repère ne bouge pas quand on change la variable d'abscisse : l'axe couvre toujours
 * toute la plage autorisée, et c'est le point courant qui se déplace dessus. Sans ça,
 * l'échelle sauterait à chaque pression et on ne comparerait plus rien.
 */
export function CourbeSimulateur({
  echantillon,
  theme,
  unite,
}: {
  echantillon: EchantillonCourbe;
  theme: ThemeParcours;
  unite?: string;
}) {
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const [largeur, setLargeur] = useState(0);
  const zone = { largeur: Math.max(largeur - MARGE_COTE * 2, 1), hauteur: HAUTEUR - MARGE_HAUT - MARGE_BAS };

  const trace = useMemo(() => {
    const valeurs = echantillon.points.map((point) => point.y);
    const bornes = bornesY(valeurs);
    const projetes = projeterSerie(valeurs, zone, bornes);
    const d = tracerCourbe(projetes);

    // Position du point courant : on le place à sa vraie abscisse, pas sur un point
    // échantillonné, pour qu'il suive exactement les curseurs.
    const { variable, xCourant } = echantillon;
    const ratioX = (xCourant - variable.min) / (variable.max - variable.min || 1);
    const etendue = bornes.max - bornes.min || 1;
    return {
      d,
      aire: `${d} L${projetes[projetes.length - 1].x},${zone.hauteur} L${projetes[0].x},${zone.hauteur} Z`,
      x: Math.min(Math.max(ratioX, 0), 1) * zone.largeur,
      y: zone.hauteur - ((echantillon.yCourant - bornes.min) / etendue) * zone.hauteur,
    };
  }, [echantillon, zone.largeur, zone.hauteur]);

  return (
    <View style={styles.carte} onLayout={(e) => setLargeur(e.nativeEvent.layout.width)}>
      {largeur > 0 && (
        <Svg width={largeur} height={HAUTEUR}>
          {[0.25, 0.5, 0.75].map((fraction) => (
            <Line
              key={fraction}
              x1={MARGE_COTE}
              x2={largeur - MARGE_COTE}
              y1={MARGE_HAUT + zone.hauteur * fraction}
              y2={MARGE_HAUT + zone.hauteur * fraction}
              stroke={couleurs.bordure}
              strokeWidth={1}
              strokeDasharray="2 5"
            />
          ))}

          <Path d={trace.aire} fill={theme.primary} opacity={0.12} transform={`translate(${MARGE_COTE}, ${MARGE_HAUT})`} />
          <Path
            d={trace.d}
            stroke={theme.primary}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            transform={`translate(${MARGE_COTE}, ${MARGE_HAUT})`}
          />

          {/* Repère vertical + point : où l'on se trouve sur la courbe */}
          <Line
            x1={MARGE_COTE + trace.x}
            x2={MARGE_COTE + trace.x}
            y1={MARGE_HAUT + trace.y}
            y2={MARGE_HAUT + zone.hauteur}
            stroke={theme.primary}
            strokeWidth={1.5}
            strokeDasharray="3 4"
            opacity={0.6}
          />
          <Circle
            cx={MARGE_COTE + trace.x}
            cy={MARGE_HAUT + trace.y}
            r={6}
            fill={theme.primary}
            stroke="#FFFFFF"
            strokeWidth={2.5}
          />
        </Svg>
      )}

      <View style={styles.axe}>
        <Text style={styles.borne}>
          {formaterCourt(echantillon.variable.min, echantillon.variable.unite)}
        </Text>
        <Text style={[styles.courant, { color: theme.primary }]} numberOfLines={1}>
          {formaterCourt(echantillon.xCourant, echantillon.variable.unite)} →{" "}
          {formaterCourt(echantillon.yCourant, unite)}
        </Text>
        <Text style={[styles.borne, styles.borneDroite]}>
          {formaterCourt(echantillon.variable.max, echantillon.variable.unite)}
        </Text>
      </View>
    </View>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    carte: {
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.carte,
      paddingTop: 10,
      paddingBottom: 12,
      paddingHorizontal: 8,
      overflow: "hidden",
    },
    axe: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6,
      paddingHorizontal: MARGE_COTE,
      gap: 8,
    },
    borne: {
      ...TYPO.legende,
      fontSize: 11,
      color: couleurs.texteTertiaire,
      minWidth: 42,
    },
    borneDroite: {
      textAlign: "right",
    },
    courant: {
      ...TYPO.label,
      flex: 1,
      fontSize: 12.5,
      textAlign: "center",
    },
  });
