import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { eclaircir } from "../../theme/couleurs";
import { useCouleurs, useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { PRESSION, RAYONS, type ThemeParcours } from "../../theme/parcoursTheme";
import { TYPO } from "../../theme/typographie";
import { Apparition } from "../ui/Apparition";
import { Confettis } from "../ui/Confettis";
import { Reflet } from "../ui/Reflet";
import { useCompteur } from "../ui/useCompteur";

/** Ce qu'on vient d'accomplir, du plus petit au plus grand. */
export type NiveauCelebration = "etape" | "session" | "parcours";

export interface Celebration {
  niveau: NiveauCelebration;
  titreEtape: string;
  session?: { numero: number; titre: string };
  /** Titre du badge latéral rattaché à la session terminée, s'il y en a un. */
  badge?: string;
  /** "intro" : les voies s'ouvrent ; "voie" : la récompense est débloquée. */
  typeParcours: "intro" | "voie";
  /** XP gagnée par cette validation (0 si l'étape était déjà validée). */
  xpGagne: number;
  /** Série de jours consécutifs après cette validation. */
  serie: number;
  /** Renseigné uniquement quand cette étape fait franchir un palier d'XP. */
  niveauAtteint?: number;
}

const NB_PARTICULES = 16;

/**
 * Moment de célébration après une étape validée. Pas juste un toast : c'est ce qui
 * donne le sentiment de progression au chemin. L'intensité suit ce qui vient d'être
 * franchi (étape < session < parcours).
 */
export function CelebrationEtape({
  celebration,
  theme,
  onContinuer,
  onVoirRecompense,
}: {
  celebration: Celebration | null;
  theme: ThemeParcours;
  onContinuer: () => void;
  onVoirRecompense?: () => void;
}) {
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const apparition = useRef(new Animated.Value(0)).current;
  const eclat = useRef(new Animated.Value(0)).current;
  // L'XP monte au lieu de s'afficher : un gain qui défile se ressent comme un gain.
  const xpAffiche = useCompteur(celebration?.xpGagne ?? 0, 900);

  // Angles/distances figés une fois pour toutes : pas de Math.random() dans le rendu.
  const particules = useMemo(
    () =>
      Array.from({ length: NB_PARTICULES }, (_, index) => {
        const angle = (index / NB_PARTICULES) * Math.PI * 2 + (index % 2) * 0.2;
        const distance = 90 + (index % 3) * 26;
        return {
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance,
          taille: 6 + (index % 3) * 3,
          couleur: index % 3 === 0 ? theme.primary : index % 3 === 1 ? theme.tintFort : theme.primaryDark,
        };
      }),
    [theme]
  );

  useEffect(() => {
    if (!celebration) return;
    apparition.setValue(0);
    eclat.setValue(0);
    Animated.parallel([
      Animated.spring(apparition, { toValue: 1, useNativeDriver: true, friction: 6, tension: 70 }),
      Animated.timing(eclat, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [celebration, apparition, eclat]);

  if (!celebration) return null;

  const { niveau, typeParcours } = celebration;
  const estParcours = niveau === "parcours";
  const estSession = niveau === "session";

  const icone: keyof typeof Ionicons.glyphMap = estParcours ? "trophy" : estSession ? "ribbon" : "checkmark-sharp";
  const surtitre = estParcours ? "Parcours terminé" : estSession ? "Session terminée" : "Étape validée";
  const titre = estParcours
    ? typeParcours === "intro"
      ? "Les quatre voies s'ouvrent à toi"
      : "Ta récompense est débloquée"
    : estSession && celebration.session
      ? celebration.session.titre
      : celebration.titreEtape;
  const texte = estParcours
    ? typeParcours === "intro"
      ? "Tu as posé toutes les fondations. Banque, Marché, Entreprise ou Quotidien : à toi de choisir par où continuer."
      : "Tu es allé jusqu'au bout. Ton code promo t'attend au sommet du chemin."
    : estSession
      ? `Session ${celebration.session?.numero} bouclée. La suivante t'attend sur le chemin.`
      : "Bien joué, on continue.";

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onContinuer}>
      <View style={styles.fond}>
        {/* Les confettis sont réservés aux vrais paliers : une session bouclée, une voie
            terminée. Sur chaque étape, ils cesseraient d'être une récompense. */}
        <Confettis
          actif={estSession || estParcours}
          couleurs={[theme.primary, theme.tintFort, eclaircir(theme.primary, 0.4), "#FFD166", "#FFFFFF"]}
        />
        <Animated.View
          style={[
            styles.carte,
            {
              opacity: apparition,
              transform: [{ scale: apparition.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) }],
            },
          ]}
        >
          <View style={styles.zoneIcone}>
            {particules.map((particule, index) => (
              <Animated.View
                key={index}
                pointerEvents="none"
                style={{
                  position: "absolute",
                  width: particule.taille,
                  height: particule.taille,
                  borderRadius: 999,
                  backgroundColor: particule.couleur,
                  opacity: eclat.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 0] }),
                  transform: [
                    { translateX: eclat.interpolate({ inputRange: [0, 1], outputRange: [0, particule.dx] }) },
                    { translateY: eclat.interpolate({ inputRange: [0, 1], outputRange: [0, particule.dy] }) },
                  ],
                }}
              />
            ))}
            <View style={[styles.icone, estParcours && styles.iconeGrande]}>
              <LinearGradient
                colors={[eclaircir(theme.primary, 0.26), theme.primary, theme.primaryDark]}
                locations={[0, 0.55, 1]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.iconeFond}
              >
                <Reflet duree={1600} pause={2400} intensite={0.3} largeur={0.5} />
                <Ionicons name={icone} size={estParcours ? 44 : 34} color="#FFFFFF" />
              </LinearGradient>
            </View>
          </View>

          <Text style={[styles.surtitre, { color: theme.primary }]}>{surtitre}</Text>
          <Text style={styles.titre}>{titre}</Text>
          <Text style={styles.texte}>{texte}</Text>

          <View style={styles.gains}>
            {celebration.xpGagne > 0 && (
              <View style={[styles.gain, { backgroundColor: theme.tint, borderColor: theme.tintFort }]}>
                <Ionicons name="star" size={14} color={theme.primary} />
                <Text style={[styles.gainTexte, { color: theme.primary }]}>+{xpAffiche} XP</Text>
              </View>
            )}
            {celebration.serie >= 2 && (
              <View style={[styles.gain, styles.gainSerie]}>
                <Ionicons name="flame" size={14} color={couleurs.ambre} />
                <Text style={[styles.gainTexte, { color: couleurs.ambre }]}>{celebration.serie} jours de suite</Text>
              </View>
            )}
          </View>

          {/* Le passage de niveau était le seul palier de progression qui passait
              inaperçu : il a maintenant sa propre bande, au-dessus du badge. */}
          {celebration.niveauAtteint !== undefined && (
            <Apparition mode="pop" delai={260} style={[styles.niveau, { backgroundColor: theme.primary }]}>
              <Ionicons name="trending-up" size={17} color="#FFFFFF" />
              <Text style={styles.niveauTexte}>Niveau {celebration.niveauAtteint} atteint</Text>
            </Apparition>
          )}

          {celebration.badge && (
            <View style={[styles.badge, { backgroundColor: theme.tint, borderColor: theme.tintFort }]}>
              <Ionicons name="ribbon" size={15} color={theme.primary} />
              <Text style={[styles.badgeTexte, { color: theme.primary }]}>Badge débloqué · {celebration.badge}</Text>
            </View>
          )}

          <View style={styles.actions}>
            {estParcours && typeParcours === "voie" && onVoirRecompense && (
              <Pressable
                onPress={onVoirRecompense}
                accessibilityRole="button"
                style={({ pressed }) => [styles.boutonPrincipal, { backgroundColor: theme.primary }, pressed && PRESSION]}
              >
                <Ionicons name="gift" size={17} color="#FFFFFF" />
                <Text style={styles.boutonPrincipalTexte}>Voir ma récompense</Text>
              </Pressable>
            )}
            <Pressable
              onPress={onContinuer}
              accessibilityRole="button"
              style={({ pressed }) => [
                estParcours && typeParcours === "voie" ? styles.boutonSecondaire : styles.boutonPrincipal,
                !(estParcours && typeParcours === "voie") && { backgroundColor: theme.primary },
                pressed && PRESSION,
              ]}
            >
              <Text
                style={
                  estParcours && typeParcours === "voie"
                    ? [styles.boutonSecondaireTexte, { color: theme.primary }]
                    : styles.boutonPrincipalTexte
                }
              >
                {estParcours ? (typeParcours === "intro" ? "Choisir ma voie" : "Retour au chemin") : "Continuer"}
              </Text>
              {!(estParcours && typeParcours === "voie") && <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    fond: {
      flex: 1,
      backgroundColor: "rgba(16,18,22,0.55)",
      alignItems: "center",
      justifyContent: "center",
      padding: 26,
    },
    carte: {
      width: "100%",
      maxWidth: 380,
      backgroundColor: couleurs.surface,
      borderRadius: 30,
      paddingHorizontal: 24,
      paddingTop: 30,
      paddingBottom: 22,
      alignItems: "center",
      gap: 8,
      ...couleurs.ombres.modale,
    },
    zoneIcone: {
      width: 120,
      height: 120,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    icone: {
      width: 84,
      height: 84,
      borderRadius: 999,
      overflow: "hidden",
      borderWidth: 3,
      borderColor: "rgba(255,255,255,0.35)",
      ...couleurs.ombres.flottante,
    },
    iconeFond: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    iconeGrande: {
      width: 100,
      height: 100,
    },
    surtitre: {
      ...TYPO.surtitre,
    },
    titre: {
      ...TYPO.titreSection,
      fontSize: 22,
      lineHeight: 28,
      color: couleurs.texte,
      textAlign: "center",
    },
    texte: {
      ...TYPO.corpsMoyen,
      fontSize: 14.5,
      color: couleurs.texteAttenue,
      textAlign: "center",
    },
    gains: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 8,
      marginTop: 8,
    },
    gain: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: RAYONS.pilule,
      borderWidth: 1,
    },
    gainSerie: {
      backgroundColor: couleurs.ambreFond,
      borderColor: couleurs.ambreBordure,
    },
    gainTexte: {
      ...TYPO.legende,
      fontSize: 12,
    },
    niveau: {
      marginTop: 4,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 9,
      paddingHorizontal: 15,
      borderRadius: RAYONS.pilule,
    },
    niveauTexte: {
      ...TYPO.label,
      fontSize: 13.5,
      color: "#FFFFFF",
    },
    badge: {
      marginTop: 2,
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingVertical: 8,
      paddingHorizontal: 13,
      borderRadius: RAYONS.pilule,
      borderWidth: 1,
    },
    badgeTexte: {
      ...TYPO.legende,
      fontSize: 12,
    },
    actions: {
      alignSelf: "stretch",
      marginTop: 16,
      gap: 10,
    },
    boutonPrincipal: {
      borderRadius: RAYONS.grand,
      paddingVertical: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    boutonPrincipalTexte: {
      ...TYPO.bouton,
      color: "#FFFFFF",
    },
    boutonSecondaire: {
      borderRadius: RAYONS.grand,
      paddingVertical: 14,
      alignItems: "center",
      backgroundColor: couleurs.surfaceAtone,
    },
    boutonSecondaireTexte: {
      ...TYPO.label,
      fontSize: 15,
    },
  });
