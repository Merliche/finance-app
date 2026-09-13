import { useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { EtapeExercice, ExerciceItem } from "../../domain/parcours/types";
import type { ResultatEtape } from "../../domain/parcours/progress";
import { useCouleurs, useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { PRESSION, RAYONS, type ThemeParcours } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";
import { haptiqueErreur, haptiqueLegere, haptiqueSucces } from "../../utils/haptique";
import { Apparition } from "../ui/Apparition";
import { Reaction } from "../ui/Reaction";
import { useCompteur } from "../ui/useCompteur";
import { BoutonContinuer } from "./BoutonContinuer";
import { ContenuBlocs } from "./ContenuBlocs";

/** Lit une saisie française ("1 250,5" ou "1250.5") en nombre ; NaN si vide ou illisible. */
export function lireNombre(saisie: string): number {
  const nettoye = saisie.replace(/\s/g, "").replace(",", ".");
  if (nettoye === "" || nettoye === "-" || nettoye === ".") return Number.NaN;
  return Number(nettoye);
}

export function reponseCorrecte(item: ExerciceItem, reponse: number | boolean): boolean {
  if (item.type === "vrai_faux") return reponse === item.reponse;
  return typeof reponse === "number" && Number.isFinite(reponse) && Math.abs(reponse - item.reponse) <= item.tolerance;
}

/**
 * Exercice : les problèmes défilent un par un (une carte à la fois, comme un cahier
 * d'exercices), avec vérification immédiate et explication. Le score final décide de
 * la validation, comme un quiz — on peut recommencer autant de fois qu'on veut.
 */
export function Exercice({
  etape,
  onTerminer,
  theme,
}: {
  etape: EtapeExercice;
  onTerminer: (resultat: ResultatEtape) => void;
  theme: ThemeParcours;
}) {
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const { items, seuilReussite } = etape.exercice;
  const scrollRef = useRef<ScrollView>(null);
  const secousse = useRef(new Animated.Value(0)).current;

  const [index, setIndex] = useState(0);
  const [saisie, setSaisie] = useState("");
  const [reponse, setReponse] = useState<number | boolean | undefined>();
  const [verifie, setVerifie] = useState(false);
  const [indiceVisible, setIndiceVisible] = useState(false);
  const [resultats, setResultats] = useState<boolean[]>([]);

  const termine = index >= items.length;
  const item = items[index];
  const nbCorrects = resultats.filter(Boolean).length;
  const score = items.length > 0 ? Math.round((nbCorrects / items.length) * 100) : 0;
  const reussi = score >= seuilReussite;
  const scoreAffiche = useCompteur(termine ? score : 0);

  function secouer() {
    secousse.setValue(0);
    Animated.sequence([
      Animated.timing(secousse, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(secousse, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(secousse, { toValue: 0.6, duration: 60, useNativeDriver: true }),
      Animated.timing(secousse, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function verifier(valeur: number | boolean) {
    if (!item || verifie) return;
    const correcte = reponseCorrecte(item, valeur);
    setReponse(valeur);
    setVerifie(true);
    setResultats((precedent) => [...precedent, correcte]);
    if (correcte) haptiqueSucces();
    else {
      haptiqueErreur();
      secouer();
    }
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
  }

  function suivant() {
    haptiqueLegere();
    setIndex((i) => i + 1);
    setSaisie("");
    setReponse(undefined);
    setVerifie(false);
    setIndiceVisible(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function recommencer() {
    setIndex(0);
    setResultats([]);
    setSaisie("");
    setReponse(undefined);
    setVerifie(false);
    setIndiceVisible(false);
  }

  const correcte = item && reponse !== undefined ? reponseCorrecte(item, reponse) : false;
  const nombreSaisi = lireNombre(saisie);

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.conteneur}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ContenuBlocs blocs={etape.contenu} theme={theme} />

      {/* Fil d'avancement : un point par problème, coloré selon le résultat */}
      <View style={styles.fil} accessibilityLabel={`Problème ${Math.min(index + 1, items.length)} sur ${items.length}`}>
        {items.map((it, i) => (
          <View
            key={it.id}
            style={[
              styles.point,
              {
                backgroundColor:
                  i < resultats.length
                    ? resultats[i]
                      ? couleurs.succes
                      : couleurs.erreur
                    : i === index
                      ? theme.primary
                      : couleurs.verrouilleBordure,
                width: i === index && !termine ? 22 : 8,
              },
            ]}
          />
        ))}
      </View>

      {!termine && item && (
        <Apparition key={item.id} mode="pop">
          <Animated.View
            style={[
              styles.carte,
              { transform: [{ translateX: secousse.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) }] },
            ]}
          >
            <Text style={[styles.numero, { color: theme.primary }]}>
              Problème {index + 1} / {items.length}
            </Text>
            <Text style={styles.enonce}>{item.enonce}</Text>

            {item.type === "nombre" ? (
              <>
                <Reaction type={verifie ? (correcte ? "succes" : "erreur") : null}>
                <View
                  style={[
                    styles.champ,
                    {
                      borderColor: verifie ? (correcte ? couleurs.succes : couleurs.erreur) : theme.tintFort,
                      backgroundColor: verifie ? (correcte ? couleurs.succesFond : couleurs.erreurFond) : couleurs.surfaceAtone,
                    },
                  ]}
                >
                  <TextInput
                    style={styles.saisie}
                    value={saisie}
                    onChangeText={setSaisie}
                    editable={!verifie}
                    keyboardType="numbers-and-punctuation"
                    inputMode="decimal"
                    placeholder="Ta réponse"
                    placeholderTextColor={couleurs.texteTertiaire}
                    returnKeyType="done"
                    onSubmitEditing={() => Number.isFinite(nombreSaisi) && verifier(nombreSaisi)}
                    accessibilityLabel="Réponse numérique"
                  />
                  {item.unite ? <Text style={styles.unite}>{item.unite}</Text> : null}
                </View>
                </Reaction>

                {!verifie && item.indice && (
                  <Pressable
                    onPress={() => {
                      haptiqueLegere();
                      setIndiceVisible((v) => !v);
                    }}
                    accessibilityRole="button"
                    style={styles.indiceBouton}
                  >
                    <Ionicons name="bulb-outline" size={14} color={couleurs.texteAttenue} />
                    <Text style={styles.indiceBoutonTexte}>{indiceVisible ? "Masquer l'indice" : "Un indice ?"}</Text>
                  </Pressable>
                )}
                {!verifie && indiceVisible && item.indice && <Text style={styles.indice}>{item.indice}</Text>}

                {!verifie && (
                  <BoutonContinuer
                    theme={theme}
                    label="Vérifier"
                    disabled={!Number.isFinite(nombreSaisi)}
                    onPress={() => verifier(nombreSaisi)}
                  />
                )}
              </>
            ) : (
              <View style={styles.vraiFaux}>
                {[true, false].map((valeur) => {
                  const choisi = reponse === valeur;
                  const estBonne = valeur === item.reponse;
                  const couleur = verifie && (choisi || estBonne) ? (estBonne ? couleurs.succes : couleurs.erreur) : theme.primary;
                  const fond = verifie && (choisi || estBonne) ? (estBonne ? couleurs.succesFond : couleurs.erreurFond) : couleurs.surfaceAtone;
                  return (
                    <Reaction
                      key={String(valeur)}
                      type={verifie && (choisi || estBonne) ? (estBonne ? "succes" : "erreur") : null}
                      style={styles.vraiFauxCellule}
                    >
                    <Pressable
                      disabled={verifie}
                      onPress={() => verifier(valeur)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: choisi }}
                      style={({ pressed }) => [
                        styles.boutonVraiFaux,
                        { borderColor: verifie && (choisi || estBonne) ? couleur : "transparent", backgroundColor: fond },
                        pressed && !verifie && PRESSION,
                      ]}
                    >
                      <Ionicons
                        name={valeur ? "checkmark-circle" : "close-circle"}
                        size={22}
                        color={verifie && (choisi || estBonne) ? couleur : couleurs.texteAttenue}
                      />
                      <Text style={[styles.vraiFauxTexte, verifie && (choisi || estBonne) && { color: couleur }]}>
                        {valeur ? "Vrai" : "Faux"}
                      </Text>
                    </Pressable>
                    </Reaction>
                  );
                })}
              </View>
            )}
          </Animated.View>

          {verifie && (
            <Apparition mode="pop" style={[styles.feedback, { backgroundColor: correcte ? couleurs.succesFond : couleurs.erreurFond }]}>
              <View style={styles.feedbackEntete}>
                <Ionicons
                  name={correcte ? "checkmark-circle" : "information-circle"}
                  size={18}
                  color={correcte ? couleurs.succes : couleurs.erreur}
                />
                <Text style={[styles.feedbackTitre, { color: correcte ? couleurs.succes : couleurs.erreur }]}>
                  {correcte
                    ? "Exact"
                    : item.type === "nombre"
                      ? `La réponse était ${item.reponse.toLocaleString("fr-FR")}${item.unite ? ` ${item.unite}` : ""}`
                      : `C'était ${item.reponse ? "vrai" : "faux"}`}
                </Text>
              </View>
              <Text style={styles.feedbackTexte}>{item.explication}</Text>
              <BoutonContinuer theme={theme} label={index + 1 < items.length ? "Problème suivant" : "Voir mon score"} onPress={suivant} />
            </Apparition>
          )}
        </Apparition>
      )}

      {termine && (
        <Apparition mode="pop" style={styles.resultat}>
          <View style={[styles.carteResultat, { backgroundColor: reussi ? couleurs.succesFond : couleurs.erreurFond }]}>
            <Ionicons name={reussi ? "trophy" : "refresh-circle"} size={30} color={reussi ? couleurs.succes : couleurs.erreur} />
            <Text style={[styles.scoreTexte, { color: reussi ? couleurs.succes : couleurs.erreur }]}>{scoreAffiche}%</Text>
            <Text style={styles.messageResultat}>
              {reussi
                ? `${nbCorrects} problème${nbCorrects > 1 ? "s" : ""} sur ${items.length} résolu${nbCorrects > 1 ? "s" : ""}. Les chiffres, c'est de la pratique — et tu en as.`
                : `Il faut au moins ${seuilReussite} % pour valider. Reprends les explications, puis retente : chaque essai compte.`}
            </Text>
          </View>
          {reussi ? (
            <BoutonContinuer theme={theme} onPress={() => onTerminer({ type: "exercice", score })} />
          ) : (
            <BoutonContinuer theme={theme} label="Recommencer" onPress={recommencer} />
          )}
        </Apparition>
      )}
    </ScrollView>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    conteneur: {
      padding: 22,
      paddingBottom: 40,
      gap: 20,
    },
    fil: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
    },
    point: {
      height: 8,
      borderRadius: 999,
    },
    carte: {
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.carte,
      padding: 18,
      gap: 14,
      ...couleurs.ombres.carte,
    },
    numero: {
      ...TYPO.surtitre,
    },
    enonce: {
      ...TYPO.titreCarte,
      fontSize: 16.5,
      lineHeight: 24,
      color: couleurs.texte,
    },
    champ: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 2,
      borderRadius: RAYONS.grand,
      paddingHorizontal: 16,
      paddingVertical: 6,
      gap: 8,
    },
    saisie: {
      ...TYPO.chiffre,
      fontSize: 24,
      lineHeight: 30,
      flex: 1,
      paddingVertical: 8,
      color: couleurs.texte,
    },
    unite: {
      ...TYPO.label,
      color: couleurs.texteAttenue,
    },
    indiceBouton: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 6,
      paddingVertical: 4,
    },
    indiceBoutonTexte: {
      ...TYPO.legende,
      color: couleurs.texteAttenue,
    },
    indice: {
      ...TYPO.legende,
      color: couleurs.texte,
      backgroundColor: couleurs.ambreFond,
      borderRadius: RAYONS.moyen,
      padding: 12,
    },
    vraiFaux: {
      flexDirection: "row",
      gap: 10,
    },
    vraiFauxCellule: {
      flex: 1,
    },
    boutonVraiFaux: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 16,
      borderRadius: RAYONS.grand,
      borderWidth: 2,
    },
    vraiFauxTexte: {
      ...TYPO.bouton,
      color: couleurs.texte,
    },
    feedback: {
      marginTop: 14,
      borderRadius: RAYONS.grand,
      padding: 16,
      gap: 10,
    },
    feedbackEntete: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },
    feedbackTitre: {
      ...TYPO.label,
      flex: 1,
    },
    feedbackTexte: {
      ...TYPO.corps,
      fontSize: 14.5,
      lineHeight: 22,
      color: couleurs.texte,
      marginBottom: 4,
    },
    resultat: {
      gap: 16,
    },
    carteResultat: {
      borderRadius: RAYONS.carte,
      padding: 22,
      alignItems: "center",
      gap: 7,
    },
    scoreTexte: {
      ...TYPO.chiffre,
      fontSize: 34,
    },
    messageResultat: {
      ...TYPO.corpsMoyen,
      fontSize: 14,
      textAlign: "center",
      color: couleurs.texte,
    },
  });
