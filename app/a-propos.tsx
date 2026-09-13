import { useRouter } from "expo-router";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { VOIES } from "../src/constants/voies";
import { recupererParcoursBundle } from "../src/data/content";
import { formaterMoisAnnee, sourcesUniques, verificationLaPlusAncienne } from "../src/domain/parcours/sources";
import type { Parcours } from "../src/domain/parcours/types";
import { EnteteEcran } from "../src/components/ui/EnteteEcran";
import { FondAnime } from "../src/components/ui/FondAnime";
import { useProgressStore } from "../src/state/progressStore";
import { useCouleurs, useMode, useStyles } from "../src/theme/ModeCouleur";
import type { Couleurs } from "../src/theme/palettes";
import { PRESSION, RAYONS, THEMES_PARCOURS, teinteEcran, themeDuParcours } from "../src/theme/parcoursTheme";
import { TYPO } from "../src/theme/typographie";
import { haptiqueLegere, haptiqueSucces } from "../src/utils/haptique";

const PARCOURS_IDS = ["intro", ...VOIES.map((voie) => voie.id)];

export default function APropos() {
  const mode = useMode();
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reinitialiser = useProgressStore((state) => state.reinitialiser);

  const parcours = PARCOURS_IDS.map(recupererParcoursBundle).filter((p): p is Parcours => p !== undefined);
  const verifieLe = verificationLaPlusAncienne(parcours);
  const sources = sourcesUniques(parcours);

  function ouvrir(url: string) {
    haptiqueLegere();
    Linking.openURL(url).catch(() => {
      Alert.alert("Lien indisponible", "Impossible d'ouvrir ce lien depuis l'application.");
    });
  }

  function confirmerReinitialisation() {
    Alert.alert(
      "Recommencer depuis le début ?",
      "Toute ta progression sur l'intro et les voies sera effacée. Cette action est définitive.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Tout effacer",
          style: "destructive",
          onPress: () => {
            reinitialiser();
            haptiqueSucces();
            router.replace("/parcours");
          },
        },
      ]
    );
  }

  return (
    <>
      <View style={styles.fond} pointerEvents="none">
        <FondAnime theme={THEMES_PARCOURS.intro} intensite={0.26} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.conteneur, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <EnteteEcran
          surtitre="À propos"
          titre="Ce que fait cette application, et ce qu'elle ne fait pas."
          icone="information-circle"
          teinte={teinteEcran("apropos")}
          insetHaut={insets.top}
          onRetour={() => (router.canGoBack() ? router.back() : router.replace("/parcours"))}
        />

        <View style={styles.corps}>
      <Pressable
        onPress={() => router.push("/confidentialite")}
        accessibilityRole="link"
        accessibilityLabel="Lire la politique de confidentialité"
        style={({ pressed }) => [styles.lienConfidentialite, pressed && PRESSION]}
      >
        <View style={styles.lienConfidentialiteIcone}>
          <Ionicons name="lock-closed" size={16} color={couleurs.texte} />
        </View>
        <View style={styles.lienConfidentialiteTextes}>
          <Text style={styles.lienConfidentialiteTitre}>Confidentialité</Text>
          <Text style={styles.lienConfidentialiteDetail}>
            Ce qui reste sur ton téléphone, ce qui ne part jamais
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={couleurs.texteTertiaire} />
      </Pressable>

      <Text style={styles.paragraphe}>
        Cette application est un parcours gratuit et éducatif pour découvrir les bases de la
        finance personnelle : le budget, les intérêts composés, l'inflation, le crédit, puis un
        aperçu de la banque, du marché et de l'entreprise.
      </Text>

      <View style={styles.encadre}>
        <View style={styles.encadreEntete}>
          <Ionicons name="shield-checkmark" size={18} color={couleurs.texte} />
          <Text accessibilityRole="header" style={styles.encadreTitre}>
            Avertissement
          </Text>
        </View>
        <Text style={styles.encadreTexte}>
          Le contenu de cette application est éducatif et généraliste. Il ne constitue en aucun
          cas un conseil en investissement, ni une recommandation personnalisée. Pour toute
          décision financière, rapproche-toi d'un professionnel qualifié.
        </Text>
      </View>

      <View style={styles.encadre}>
        <View style={styles.encadreEntete}>
          <Ionicons name="calendar-clear-outline" size={18} color={couleurs.texte} />
          <Text accessibilityRole="header" style={styles.encadreTitre}>
            Chiffres et sources
          </Text>
        </View>
        <Text style={styles.encadreTexte}>
          Les montants, taux et barèmes cités dans les leçons
          {verifieLe ? ` ont été vérifiés en ${formaterMoisAnnee(verifieLe) ?? verifieLe}` : " sont donnés à titre indicatif"}.
          Ils évoluent : plafonds de livrets, barème de l'impôt, taux de remboursement changent
          au moins une fois par an. En cas de doute, la source officielle fait foi.
        </Text>

        <View style={styles.dates}>
          {parcours.map((p) => (
            <View key={p.id} style={styles.dateLigne}>
              <View style={[styles.datePastille, { backgroundColor: themeDuParcours(p.id, mode).primary }]} />
              <Text style={styles.dateTitre} numberOfLines={1}>
                {p.titre}
              </Text>
              <Text style={styles.dateValeur}>
                {p.chiffresVerifiesLe ? formaterMoisAnnee(p.chiffresVerifiesLe) ?? p.chiffresVerifiesLe : "—"}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sourcesTitre}>Vérifier soi-même</Text>
        {sources.map((source) => (
          <Pressable
            key={source.url}
            onPress={() => ouvrir(source.url)}
            accessibilityRole="link"
            accessibilityLabel={`Ouvrir ${source.libelle}`}
            style={({ pressed }) => [styles.source, pressed && PRESSION]}
          >
            <Ionicons name="open-outline" size={15} color={couleurs.texteAttenue} />
            <Text style={styles.sourceTexte}>{source.libelle}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.paragraphe}>
        Les livres recommandés et les codes promo proposés en fin de parcours le sont à titre
        purement informatif.
      </Text>

      <Text style={styles.paragraphe}>
        Ta progression est enregistrée uniquement sur cet appareil : l'application ne demande
        aucun compte et ne collecte rien d'autre que l'adresse email que tu choisis de laisser
        en fin de parcours.
      </Text>

      <View style={styles.zoneDanger}>
        <Text style={styles.zoneDangerTitre}>Recommencer</Text>
        <Text style={styles.zoneDangerTexte}>
          Efface toute ta progression pour refaire les parcours depuis le début.
        </Text>
        <Pressable
          onPress={confirmerReinitialisation}
          accessibilityRole="button"
          style={({ pressed }) => [styles.boutonDanger, pressed && PRESSION]}
        >
          <Ionicons name="refresh" size={16} color={couleurs.erreur} />
          <Text style={styles.boutonDangerTexte}>Réinitialiser ma progression</Text>
        </Pressable>
      </View>
        </View>
      </ScrollView>
    </>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    fond: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    conteneur: {
      gap: 18,
    },
    lienConfidentialite: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.grand,
      borderWidth: 1,
      borderColor: couleurs.bordure,
      padding: 14,
      ...couleurs.ombres.carte,
    },
    lienConfidentialiteIcone: {
      width: 34,
      height: 34,
      borderRadius: RAYONS.moyen,
      backgroundColor: couleurs.surfaceAtone,
      alignItems: "center",
      justifyContent: "center",
    },
    lienConfidentialiteTextes: {
      flex: 1,
      gap: 2,
    },
    lienConfidentialiteTitre: {
      ...TYPO.label,
      color: couleurs.texte,
    },
    lienConfidentialiteDetail: {
      ...TYPO.legende,
      fontSize: 11.5,
      color: couleurs.texteAttenue,
    },
    corps: {
      paddingHorizontal: 22,
      gap: 18,
    },
    paragraphe: {
      ...TYPO.corps,
      color: couleurs.texte,
    },
    encadre: {
      backgroundColor: couleurs.surface,
      borderWidth: 1,
      borderColor: couleurs.bordure,
      borderRadius: RAYONS.carte,
      padding: 18,
      gap: 10,
    },
    encadreEntete: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    encadreTitre: {
      ...TYPO.titreCarte,
      color: couleurs.texte,
    },
    encadreTexte: {
      ...TYPO.corps,
      fontSize: 14.5,
      lineHeight: 22,
      color: couleurs.texteAttenue,
    },
    dates: {
      marginTop: 4,
      gap: 7,
    },
    dateLigne: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
    },
    datePastille: {
      width: 7,
      height: 7,
      borderRadius: 999,
    },
    dateTitre: {
      ...TYPO.legende,
      flex: 1,
      color: couleurs.texte,
    },
    dateValeur: {
      ...TYPO.legende,
      color: couleurs.texteAttenue,
    },
    sourcesTitre: {
      ...TYPO.surtitre,
      marginTop: 8,
      color: couleurs.texteTertiaire,
    },
    source: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      paddingVertical: 7,
    },
    sourceTexte: {
      ...TYPO.legende,
      flex: 1,
      color: couleurs.texteAttenue,
      textDecorationLine: "underline",
    },
    zoneDanger: {
      marginTop: 10,
      paddingTop: 22,
      borderTopWidth: 1,
      borderTopColor: couleurs.bordure,
      gap: 8,
    },
    zoneDangerTitre: {
      ...TYPO.titreCarte,
      color: couleurs.texte,
    },
    zoneDangerTexte: {
      ...TYPO.legende,
      color: couleurs.texteAttenue,
    },
    boutonDanger: {
      marginTop: 6,
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: RAYONS.moyen,
      borderWidth: 1.5,
      borderColor: couleurs.erreur,
      backgroundColor: couleurs.erreurFond,
    },
    boutonDangerTexte: {
      ...TYPO.label,
      color: couleurs.erreur,
    },
  });
