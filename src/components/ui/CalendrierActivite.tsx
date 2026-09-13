import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { jourLocal } from "../../domain/parcours/engagement";
import { useCouleurs, useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { type ThemeParcours } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";

const JOURS_PAR_SEMAINE = 7;
const INITIALES = ["L", "M", "M", "J", "V", "S", "D"];

/**
 * Construit les colonnes du damier : une colonne par semaine, du lundi au dimanche, en
 * remontant `nbSemaines` en arrière depuis aujourd'hui. Les cases postérieures à
 * aujourd'hui valent `null` — la semaine en cours n'est pas encore finie.
 */
export function construireSemaines(
  aujourdhui: Date,
  nbSemaines: number
): ({ jour: string; futur: boolean } | null)[][] {
  // On se cale sur le lundi de la semaine en cours (getDay : 0 = dimanche).
  const jourSemaine = (aujourdhui.getDay() + 6) % 7;
  const lundiCourant = new Date(aujourdhui);
  lundiCourant.setDate(aujourdhui.getDate() - jourSemaine);

  const cleAujourdhui = jourLocal(aujourdhui);
  const semaines: ({ jour: string; futur: boolean } | null)[][] = [];

  for (let semaine = nbSemaines - 1; semaine >= 0; semaine--) {
    const colonne: ({ jour: string; futur: boolean } | null)[] = [];
    for (let jour = 0; jour < JOURS_PAR_SEMAINE; jour++) {
      const date = new Date(lundiCourant);
      date.setDate(lundiCourant.getDate() - semaine * 7 + jour);
      const cle = jourLocal(date);
      colonne.push(cle > cleAujourdhui ? null : { jour: cle, futur: false });
    }
    semaines.push(colonne);
  }
  return semaines;
}

/**
 * Damier d'activité, façon calendrier de contributions : une case par jour, colorée si
 * une étape a été validée ce jour-là. Aucune donnée nouvelle n'est collectée — les jours
 * actifs sont déjà stockés pour calculer la série.
 */
export function CalendrierActivite({
  joursActifs,
  theme,
  nbSemaines = 17,
}: {
  joursActifs: string[];
  theme: ThemeParcours;
  nbSemaines?: number;
}) {
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const actifs = useMemo(() => new Set(joursActifs), [joursActifs]);
  const semaines = useMemo(() => construireSemaines(new Date(), nbSemaines), [nbSemaines]);
  const nbActifs = useMemo(
    () => semaines.flat().filter((case_) => case_ !== null && actifs.has(case_.jour)).length,
    [semaines, actifs]
  );

  return (
    <View style={styles.conteneur}>
      <View style={styles.grille}>
        <View style={styles.initiales}>
          {INITIALES.map((initiale, index) => (
            // Une lettre sur deux : sept libellés empilés seraient illisibles à cette taille.
            <Text key={index} style={styles.initiale}>
              {index % 2 === 0 ? initiale : ""}
            </Text>
          ))}
        </View>

        {semaines.map((colonne, indexColonne) => (
          <View key={indexColonne} style={styles.colonne}>
            {colonne.map((case_, indexJour) => (
              <View
                key={indexJour}
                style={[
                  styles.case_,
                  case_ === null
                    ? styles.caseFuture
                    : { backgroundColor: actifs.has(case_.jour) ? theme.primary : couleurs.verrouilleFond },
                ]}
              />
            ))}
          </View>
        ))}
      </View>

      <Text style={styles.legende} accessibilityLabel={`${nbActifs} jours actifs sur les ${nbSemaines} dernières semaines`}>
        <Text style={[styles.legendeChiffre, { color: theme.primary }]}>{nbActifs}</Text> jour
        {nbActifs > 1 ? "s" : ""} d'activité sur {nbSemaines} semaines
      </Text>
    </View>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    conteneur: {
      gap: 10,
    },
    grille: {
      flexDirection: "row",
      gap: 3,
    },
    initiales: {
      gap: 3,
      marginRight: 3,
    },
    initiale: {
      ...TYPO.legende,
      fontSize: 8.5,
      lineHeight: 13,
      height: 13,
      width: 9,
      color: couleurs.texteTertiaire,
    },
    colonne: {
      flex: 1,
      gap: 3,
    },
    case_: {
      height: 13,
      borderRadius: 3,
    },
    caseFuture: {
      backgroundColor: "transparent",
    },
    legende: {
      ...TYPO.legende,
      color: couleurs.texteAttenue,
    },
    legendeChiffre: {
      ...TYPO.titreCarte,
      fontSize: 13,
    },
  });
