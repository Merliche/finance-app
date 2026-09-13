import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Apparition } from "../src/components/ui/Apparition";
import { EnteteEcran } from "../src/components/ui/EnteteEcran";
import { FondAnime } from "../src/components/ui/FondAnime";
import { formaterEffort, profilEstRenseigne, tauxHoraire } from "../src/domain/parcours/profilFinancier";
import { useProgressStore } from "../src/state/progressStore";
import { useCouleurs, useStyles } from "../src/theme/ModeCouleur";
import type { Couleurs } from "../src/theme/palettes";
import { PRESSION, RAYONS, teinteEcran, THEMES_PARCOURS } from "../src/theme/parcoursTheme";
import { TYPO } from "../src/theme/typographie";
import { haptiqueSucces } from "../src/utils/haptique";

const THEME = THEMES_PARCOURS.intro;

const CHAMPS: { cle: "revenuNet" | "loyer" | "epargne"; label: string; aide: string; icone: keyof typeof Ionicons.glyphMap }[] = [
  {
    cle: "revenuNet",
    label: "Ce que tu touches par mois",
    aide: "Le net qui arrive sur ton compte, primes comprises si elles sont régulières.",
    icone: "wallet-outline",
  },
  {
    cle: "loyer",
    label: "Ton loyer ou ta mensualité",
    aide: "Charges comprises. Laisse vide si tu n'en paies pas.",
    icone: "home-outline",
  },
  {
    cle: "epargne",
    label: "Ce que tu as déjà de côté",
    aide: "Livrets, assurance-vie, ce qui dort sur le compte… une estimation suffit.",
    icone: "shield-checkmark-outline",
  },
];

/** Lit une saisie en euros : espaces et virgule tolérés, vide = champ non renseigné. */
function lireEuros(saisie: string): number | undefined {
  const nettoye = saisie.replace(/\s/g, "").replace(",", ".");
  if (nettoye === "") return undefined;
  const valeur = Number(nettoye);
  return Number.isFinite(valeur) && valeur >= 0 ? valeur : undefined;
}

/**
 * « Mes chiffres » : trois nombres facultatifs qui personnalisent les simulateurs et
 * permettent d'afficher les montants en heures de travail. Rien ne quitte le téléphone —
 * c'est écrit sur l'écran, parce que c'est la première question que tout le monde se pose.
 */
export default function MesChiffres() {
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profil = useProgressStore((state) => state.profilFinancier);
  const enregistrer = useProgressStore((state) => state.enregistrerProfilFinancier);
  const effacer = useProgressStore((state) => state.effacerProfilFinancier);

  const [saisies, setSaisies] = useState<Record<string, string>>({
    revenuNet: profil?.revenuNet?.toString() ?? "",
    loyer: profil?.loyer?.toString() ?? "",
    epargne: profil?.epargne?.toString() ?? "",
  });

  const valeurs = {
    revenuNet: lireEuros(saisies.revenuNet),
    loyer: lireEuros(saisies.loyer),
    epargne: lireEuros(saisies.epargne),
  };
  const quelqueChose = profilEstRenseigne(valeurs);

  function valider() {
    enregistrer(valeurs);
    haptiqueSucces();
    router.back();
  }

  function confirmerEffacement() {
    Alert.alert("Effacer tes chiffres ?", "Les simulateurs repartiront sur des exemples génériques.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Effacer",
        style: "destructive",
        onPress: () => {
          effacer();
          setSaisies({ revenuNet: "", loyer: "", epargne: "" });
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView style={styles.racine} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <View style={styles.fond} pointerEvents="none">
        <FondAnime theme={THEMES_PARCOURS.intro} intensite={0.28} />
      </View>
      <ScrollView
        contentContainerStyle={[styles.conteneur, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <EnteteEcran
          surtitre="Mes chiffres"
          titre="L'app parle de ton argent, pas de celui d'un exemple."
          icone="wallet"
          teinte={teinteEcran("chiffres")}
          insetHaut={insets.top}
          onRetour={() => (router.canGoBack() ? router.back() : router.replace("/parcours"))}
        >
          <Text style={styles.intro}>
            Trois nombres, une seule fois. Les simulateurs démarreront sur ta situation, et les
            montants pourront s'afficher en heures de travail.
          </Text>
        </EnteteEcran>

        <View style={styles.corps}>

        <Apparition delai={120} style={styles.encadreConfiance}>
          <Ionicons name="lock-closed" size={17} color={THEME.primary} />
          <Text style={styles.encadreTexte}>
            Ces chiffres restent sur ton téléphone. Ils ne sont envoyés nulle part, ni à nous ni à personne
            d'autre, et tu peux les effacer à tout moment.
          </Text>
        </Apparition>

        {CHAMPS.map((champ, index) => (
          <Apparition key={champ.cle} delai={200 + index * 90} style={styles.champ}>
            <View style={styles.champEntete}>
              <Ionicons name={champ.icone} size={17} color={THEME.primary} />
              <Text style={styles.champLabel}>{champ.label}</Text>
            </View>
            <View style={styles.saisieLigne}>
              <TextInput
                style={styles.saisie}
                value={saisies[champ.cle]}
                onChangeText={(texte) => setSaisies((precedent) => ({ ...precedent, [champ.cle]: texte }))}
                placeholder="—"
                placeholderTextColor={couleurs.texteTertiaire}
                keyboardType="numbers-and-punctuation"
                inputMode="decimal"
                returnKeyType="done"
                accessibilityLabel={champ.label}
              />
              <Text style={styles.unite}>€</Text>
            </View>
            <Text style={styles.champAide}>{champ.aide}</Text>
          </Apparition>
        ))}

        {valeurs.revenuNet !== undefined && valeurs.revenuNet > 0 && (
          <Apparition mode="pop" style={[styles.apercu, { backgroundColor: THEME.tint }]}>
            <Text style={[styles.apercuSurtitre, { color: THEME.primary }]}>Ce que ça donne</Text>
            <Text style={styles.apercuTexte}>
              Une heure de ton travail vaut environ{" "}
              <Text style={styles.apercuFort}>
                {tauxHoraire(valeurs.revenuNet).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €
              </Text>
              . Un crédit qui coûte 720 € d'intérêts, c'est donc {formaterEffort(720, valeurs.revenuNet)}.
            </Text>
          </Apparition>
        )}

        <View style={styles.actions}>
          <View style={styles.boutonEnveloppe}>
            <View style={styles.boutonLippe} />
            <Pressable
              onPress={valider}
              accessibilityRole="button"
              style={({ pressed }) => [styles.bouton, pressed && styles.boutonPresse]}
            >
              <Text style={styles.boutonTexte}>{quelqueChose ? "Enregistrer" : "Continuer sans"}</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          {profilEstRenseigne(profil) && (
            <Pressable
              onPress={confirmerEffacement}
              accessibilityRole="button"
              style={({ pressed }) => [styles.boutonEffacer, pressed && PRESSION]}
            >
              <Ionicons name="trash-outline" size={15} color={couleurs.erreur} />
              <Text style={styles.boutonEffacerTexte}>Effacer mes chiffres</Text>
            </Pressable>
          )}
        </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    racine: {
      flex: 1,
      backgroundColor: couleurs.fond,
    },
    fond: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    conteneur: {
      gap: 20,
    },
    corps: {
      paddingHorizontal: 22,
      gap: 20,
    },
    intro: {
      ...TYPO.corps,
      fontSize: 14.5,
      lineHeight: 22,
      marginTop: 14,
      color: "rgba(255,255,255,0.8)",
    },
    encadreConfiance: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 11,
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.carte,
      padding: 15,
      ...couleurs.ombres.carte,
    },
    encadreTexte: {
      ...TYPO.legende,
      flex: 1,
      color: couleurs.texte,
    },
    champ: {
      gap: 8,
    },
    champEntete: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    champLabel: {
      ...TYPO.label,
      color: couleurs.texte,
    },
    saisieLigne: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.grand,
      borderWidth: 1.5,
      borderColor: couleurs.bordure,
      paddingHorizontal: 16,
    },
    saisie: {
      ...TYPO.chiffre,
      flex: 1,
      fontSize: 24,
      lineHeight: 30,
      paddingVertical: 12,
      color: couleurs.texte,
    },
    unite: {
      ...TYPO.titreSection,
      color: couleurs.texteAttenue,
    },
    champAide: {
      ...TYPO.legende,
      color: couleurs.texteTertiaire,
    },
    apercu: {
      borderRadius: RAYONS.carte,
      padding: 16,
      gap: 5,
    },
    apercuSurtitre: {
      ...TYPO.surtitre,
    },
    apercuTexte: {
      ...TYPO.corps,
      fontSize: 14.5,
      lineHeight: 22,
      color: couleurs.texte,
    },
    apercuFort: {
      ...TYPO.titreCarte,
      fontSize: 14.5,
    },
    actions: {
      marginTop: 4,
      gap: 16,
    },
    boutonEnveloppe: {
      position: "relative",
    },
    boutonLippe: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 5,
      bottom: -5,
      borderRadius: RAYONS.grand,
      backgroundColor: THEME.primaryDark,
    },
    bouton: {
      borderRadius: RAYONS.grand,
      backgroundColor: THEME.primary,
      paddingVertical: 17,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
    },
    boutonPresse: {
      transform: [{ translateY: 4 }],
    },
    boutonTexte: {
      ...TYPO.bouton,
      color: "#FFFFFF",
    },
    boutonEffacer: {
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    boutonEffacerTexte: {
      ...TYPO.label,
      color: couleurs.erreur,
    },
  });
