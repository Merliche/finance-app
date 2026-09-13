import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EnteteEcran } from "../src/components/ui/EnteteEcran";
import { FondAnime } from "../src/components/ui/FondAnime";
import { Apparition } from "../src/components/ui/Apparition";
import { CONFIDENTIALITE, CONFIDENTIALITE_MAJ } from "../src/constants/confidentialite";
import { CONTACT_EMAIL } from "../src/constants/identite";
import { delaiCascade } from "../src/theme/animation";
import { useCouleurs, useMode, useStyles } from "../src/theme/ModeCouleur";
import type { Couleurs } from "../src/theme/palettes";
import { RAYONS, teinteEcran, themeDuParcours } from "../src/theme/parcoursTheme";
import { TYPO } from "../src/theme/typographie";
import { formaterMoisAnnee } from "../src/domain/parcours/sources";

/**
 * La politique de confidentialité, dans l'application.
 *
 * Les magasins exigent aussi une adresse web publique, et c'est le même texte qui doit s'y
 * trouver : il vit donc en données (`constants/confidentialite.ts`), pas dans cet écran.
 * Cet écran n'en est que la mise en page.
 *
 * Il est atteignable depuis À propos et, surtout, depuis la case de consentement de
 * l'encart email : personne ne doit avoir à chercher ce texte au moment où on lui demande
 * son adresse.
 */
export default function Confidentialite() {
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const mode = useMode();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <>
      <View style={styles.fond} pointerEvents="none">
        <FondAnime theme={themeDuParcours("intro", mode)} intensite={0.26} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.conteneur, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <EnteteEcran
          surtitre="Confidentialité"
          titre="Ce que l'application sait de toi, et ce qu'elle n'en fait pas."
          icone="lock-closed"
          teinte={teinteEcran("apropos")}
          insetHaut={insets.top}
          onRetour={() => (router.canGoBack() ? router.back() : router.replace("/a-propos"))}
        />

        <View style={styles.corps}>
          {CONFIDENTIALITE.map((section, index) => (
            <Apparition key={section.titre} delai={delaiCascade(index, 60)} style={styles.section}>
              <Text style={styles.sectionTitre} accessibilityRole="header">
                {section.titre}
              </Text>
              {section.paragraphes.map((paragraphe) => (
                <Text key={paragraphe} style={styles.paragraphe}>
                  {paragraphe}
                </Text>
              ))}
              {section.points?.map((point) => (
                <View key={point} style={styles.ligne}>
                  <Ionicons
                    name="ellipse"
                    size={5}
                    color={couleurs.texteTertiaire}
                    style={styles.puce}
                  />
                  <Text style={styles.point}>{point}</Text>
                </View>
              ))}
            </Apparition>
          ))}

          <Apparition delai={delaiCascade(CONFIDENTIALITE.length, 60)} style={styles.contact}>
            <Text style={styles.sectionTitre} accessibilityRole="header">
              Nous écrire
            </Text>
            <Text style={styles.paragraphe}>
              Pour toute question sur tes données, ou pour demander le retrait de ton adresse :
            </Text>
            <Text selectable style={styles.adresse}>
              {CONTACT_EMAIL}
            </Text>
            <Text style={styles.maj}>
              Dernière mise à jour : {formaterMoisAnnee(CONFIDENTIALITE_MAJ) ?? CONFIDENTIALITE_MAJ}.
            </Text>
          </Apparition>
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
    corps: {
      paddingHorizontal: 22,
      gap: 18,
    },
    section: {
      gap: 8,
    },
    sectionTitre: {
      ...TYPO.titreCarte,
      fontSize: 16,
      color: couleurs.texte,
    },
    paragraphe: {
      ...TYPO.corps,
      fontSize: 14.5,
      lineHeight: 23,
      color: couleurs.texteAttenue,
    },
    ligne: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    puce: {
      marginTop: 9,
    },
    point: {
      ...TYPO.corps,
      flex: 1,
      fontSize: 14.5,
      lineHeight: 23,
      color: couleurs.texteAttenue,
    },
    contact: {
      gap: 8,
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.carte,
      borderWidth: 1,
      borderColor: couleurs.bordure,
      padding: 18,
      ...couleurs.ombres.carte,
    },
    adresse: {
      ...TYPO.label,
      fontSize: 15,
      color: couleurs.texte,
    },
    maj: {
      ...TYPO.legende,
      fontSize: 11.5,
      marginTop: 4,
      color: couleurs.texteTertiaire,
    },
  });
