import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FicheSyntheseVue } from "../../../src/components/recompense/FicheSyntheseVue";
import { Apparition } from "../../../src/components/ui/Apparition";
import { AppuiRessort } from "../../../src/components/ui/AppuiRessort";
import { Confettis } from "../../../src/components/ui/Confettis";
import { EnteteEcran } from "../../../src/components/ui/EnteteEcran";
import { FondAnime } from "../../../src/components/ui/FondAnime";
import { Reflet } from "../../../src/components/ui/Reflet";
import { inscrireEmail, type ResultatInscriptionEmail } from "../../../src/data/remote/emailRepository";
import { construireFiche } from "../../../src/domain/parcours/fiche";
import { infosSession } from "../../../src/constants/sessions";
import { useParcours } from "../../../src/hooks/useParcours";
import { haptiqueLegere, haptiqueSucces } from "../../../src/utils/haptique";
import { useProgressStore } from "../../../src/state/progressStore";
import { eclaircir } from "../../../src/theme/couleurs";
import { useCouleurs, useMode, useStyles } from "../../../src/theme/ModeCouleur";
import type { Couleurs } from "../../../src/theme/palettes";
import { PRESSION, RAYONS, teinteEcran, themeDuParcours } from "../../../src/theme/parcoursTheme";
import { TYPO } from "../../../src/theme/typographie";

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EcranRecompense() {
  const mode = useMode();
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const { parcoursId } = useLocalSearchParams<{ parcoursId: string }>();
  const etat = useParcours(parcoursId);
  const enregistrerEmailCapture = useProgressStore((state) => state.enregistrerEmailCapture);
  const emailDejaCapture = useProgressStore((state) => state.emailCapture?.email);
  const theme = themeDuParcours(parcoursId, mode);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [codeCopie, setCodeCopie] = useState(false);
  const [consenti, setConsenti] = useState(false);

  const [email, setEmail] = useState(emailDejaCapture ?? "");
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState<ResultatInscriptionEmail | undefined>();

  if (etat.statut === "chargement") {
    return (
      <View style={styles.centre}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (etat.statut === "erreur") {
    return (
      <View style={styles.centre}>
        <Text style={styles.messageErreur}>Contenu indisponible : {etat.message}</Text>
      </View>
    );
  }

  const { recompense } = etat.parcours;
  // La fiche se fabrique à partir du contenu de la voie : il n'y a rien à renseigner pour
  // qu'elle existe, et elle suit le contenu quand il change.
  const fiche = construireFiche(etat.parcours, (session) =>
    infosSession(etat.parcours.id, session)?.titre
  );

  async function envoyerEmail() {
    if (!consenti) {
      setResultat({ statut: "erreur", message: "Coche la case pour donner ton accord." });
      return;
    }
    if (!REGEX_EMAIL.test(email)) {
      setResultat({ statut: "erreur", message: "Adresse email invalide." });
      return;
    }
    setEnvoi(true);
    const reponse = await inscrireEmail(email, parcoursId);
    setEnvoi(false);
    setResultat(reponse);
    // "deja_inscrit" n'est pas une erreur pour l'utilisateur : l'email EST bien
    // enregistré côté serveur (juste déjà présent, ex: après une autre voie terminée
    // avec le même email) — la progression locale doit refléter cet état aussi.
    if (reponse.statut === "ok" || reponse.statut === "deja_inscrit") {
      enregistrerEmailCapture(email);
    }
  }

  const emailValide = REGEX_EMAIL.test(email);

  async function copierCode(code: string) {
    const copie = await Clipboard.setStringAsync(code).catch(() => false);
    if (!copie) return;
    haptiqueSucces();
    setCodeCopie(true);
    // La confirmation retombe d'elle-même : un bouton qui reste « Copié » pour toujours
    // ne dit plus rien au tap suivant.
    setTimeout(() => setCodeCopie(false), 2200);
  }

  return (
    // Sans ça, sur iOS le clavier recouvre le champ email en bas de l'écran.
    <KeyboardAvoidingView
      style={styles.racine}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
    <View style={styles.fond} pointerEvents="none">
      <FondAnime theme={theme} intensite={0.35} />
    </View>

    <ScrollView
      contentContainerStyle={[styles.conteneur, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <EnteteEcran
        surtitre="Parcours terminé"
        titre={etat.parcours.titre}
        icone="trophy"
        teinte={teinteEcran("recompense")}
        insetHaut={insets.top}
        onRetour={() => (router.canGoBack() ? router.back() : router.replace("/parcours"))}
      >
        <View style={styles.celebration}>
          <Apparition mode="pop" delai={120} style={styles.medaille}>
            <Reflet duree={1700} pause={2600} intensite={0.34} largeur={0.5} />
            <Ionicons name="trophy" size={42} color="#FFFFFF" />
          </Apparition>
        </View>
      </EnteteEcran>

      <View style={styles.corps}>

      <FicheSyntheseVue fiche={fiche} theme={theme} />

      {/* Le livre partenaire n'existe pas encore. Le bloc reste en place, prêt à
          l'accueillir : jamais de prix, jamais « acheter », et il n'est qu'un supplément —
          la récompense de la voie est la fiche ci-dessus. */}
      {recompense && (
        <Apparition delai={440} style={[styles.carteRecompense, { backgroundColor: theme.tint, borderColor: theme.tintFort }]}>
          <Text style={[styles.surtitre, { color: theme.primary }]}>Pour aller plus loin</Text>
          <Text style={styles.livreTitre}>{recompense.livre.titre}</Text>

          {/* Le code est fait pour être collé ailleurs : il se copie d'un tap plutôt que
              de se recopier à la main, caractère par caractère. */}
          <AppuiRessort
            echelle={0.96}
            onPress={() => copierCode(recompense.code)}
            accessibilityLabel={`Copier le code de réduction ${recompense.code}`}
            accessibilityHint="Copie le code dans le presse-papiers"
            styleContenu={[
              styles.codeBloc,
              { borderColor: codeCopie ? couleurs.succes : theme.tintFort },
            ]}
          >
            <Text style={styles.codeLabel}>Code de réduction</Text>
            <Text style={[styles.code, { color: theme.primary }]}>{recompense.code}</Text>
            <View style={styles.codeAction}>
              <Ionicons
                name={codeCopie ? "checkmark-circle" : "copy-outline"}
                size={14}
                color={codeCopie ? couleurs.succes : theme.primary}
              />
              <Text
                style={[
                  styles.codeActionTexte,
                  { color: codeCopie ? couleurs.succes : theme.primary },
                ]}
              >
                {codeCopie ? "Copié" : "Appuie pour copier"}
              </Text>
            </View>
          </AppuiRessort>

          <Pressable
            style={({ pressed }) => [styles.boutonAmazon, { backgroundColor: theme.primary }, pressed && PRESSION]}
            onPress={() => Linking.openURL(recompense.livre.urlAmazon)}
          >
            <Ionicons name="open-outline" size={17} color="#FFFFFF" />
            <Text style={styles.boutonAmazonTexte}>Voir le livre sur Amazon</Text>
          </Pressable>
        </Apparition>
      )}

      <Apparition delai={440} style={styles.carteEmail}>
        <Text style={styles.captureTitre}>Être prévenu des sorties de livres</Text>
        <Text style={styles.captureDescription}>
          Facultatif. Rien dans l'application ne dépend de ton adresse : la fiche, ta
          progression et tous les contenus restent accessibles sans la donner.
        </Text>

        <TextInput
          style={styles.champEmail}
          value={email}
          onChangeText={setEmail}
          placeholder="ton@email.com"
          placeholderTextColor={couleurs.texteTertiaire}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!envoi}
        />

        {/* Le consentement est explicite, décoché par défaut, et donne accès au texte
            complet avant de cocher. Sans lui, le bouton reste inerte : c'est l'exigence du
            RGPD comme celle des magasins d'applications. */}
        <Pressable
          onPress={() => {
            haptiqueLegere();
            setConsenti((precedent) => !precedent);
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consenti }}
          accessibilityLabel="J'accepte que mon adresse soit enregistrée pour recevoir les nouveautés"
          style={({ pressed }) => [styles.consentement, pressed && PRESSION]}
        >
          <View
            style={[
              styles.caseAcocher,
              {
                borderColor: consenti ? theme.primary : couleurs.verrouilleBordure,
                backgroundColor: consenti ? theme.primary : "transparent",
              },
            ]}
          >
            {consenti && <Ionicons name="checkmark-sharp" size={13} color="#FFFFFF" />}
          </View>
          <Text style={styles.consentementTexte}>
            J&apos;accepte que mon adresse soit enregistrée pour recevoir les nouveautés. Je peux
            demander son retrait à tout moment.
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/confidentialite")}
          accessibilityRole="link"
          accessibilityLabel="Lire la politique de confidentialité"
          style={({ pressed }) => [styles.lienPolitique, pressed && PRESSION]}
        >
          <Ionicons name="lock-closed-outline" size={13} color={theme.primary} />
          <Text style={[styles.lienPolitiqueTexte, { color: theme.primary }]}>
            Lire la politique de confidentialité
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.boutonEnvoyer,
            { backgroundColor: theme.primary },
            (envoi || !emailValide || !consenti) && styles.boutonDesactive,
            pressed && emailValide && consenti && !envoi && PRESSION,
          ]}
          onPress={envoyerEmail}
          disabled={envoi || !emailValide || !consenti}
          accessibilityRole="button"
          accessibilityLabel="Valider mon inscription"
          accessibilityState={{ disabled: envoi || !emailValide || !consenti }}
        >
          {envoi ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={[styles.boutonEnvoyerTexte, !emailValide && { color: couleurs.texteTertiaire }]}
            >
              Valider
            </Text>
          )}
        </Pressable>

        {resultat?.statut === "ok" && (
          <View style={styles.message}>
            <Ionicons name="checkmark-circle" size={16} color={couleurs.succes} />
            <Text style={[styles.messageTexte, { color: couleurs.succes }]}>
              Merci, tu es inscrit(e) !
            </Text>
          </View>
        )}
        {resultat?.statut === "deja_inscrit" && (
          <View style={styles.message}>
            <Ionicons name="information-circle" size={16} color={couleurs.texteAttenue} />
            <Text style={styles.messageTexte}>Cet email est déjà inscrit.</Text>
          </View>
        )}
        {resultat?.statut === "erreur" && (
          <View style={styles.message}>
            <Ionicons name="alert-circle" size={16} color={couleurs.erreur} />
            <Text style={[styles.messageTexte, { color: couleurs.erreur }]}>{resultat.message}</Text>
          </View>
        )}
      </Apparition>

      <Text style={styles.disclaimer}>
        Contenu éducatif — ne constitue pas un conseil en investissement. Le livre et le code promo
        ci-dessus sont proposés à titre informatif.
      </Text>
      </View>
    </ScrollView>
      <Confettis
        actif
        couleurs={[theme.primary, theme.tintFort, eclaircir(theme.primary, 0.4), "#E7C24B", "#FFFFFF"]}
      />
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
      gap: 22,
    },
    corps: {
      paddingHorizontal: 22,
      gap: 22,
    },
    centre: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    messageErreur: {
      ...TYPO.corpsMoyen,
      color: couleurs.texteAttenue,
      textAlign: "center",
    },
    celebration: {
      alignItems: "center",
      marginTop: 18,
    },
    medaille: {
      width: 86,
      height: 86,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      backgroundColor: "rgba(255,255,255,0.2)",
      borderWidth: 3,
      borderColor: "rgba(255,255,255,0.4)",
    },
    carteRecompense: {
      borderRadius: RAYONS.carte,
      borderWidth: 1,
      padding: 22,
      gap: 8,
      alignItems: "center",
    },
    surtitre: {
      ...TYPO.surtitre,
    },
    livreTitre: {
      ...TYPO.titreSection,
      color: couleurs.texte,
      textAlign: "center",
    },
    codeBloc: {
      alignItems: "center",
      gap: 3,
      borderWidth: 1.5,
      marginVertical: 10,
      paddingVertical: 14,
      paddingHorizontal: 26,
      borderRadius: RAYONS.moyen,
      backgroundColor: couleurs.surface,
      alignSelf: "stretch",
    },
    codeLabel: {
      ...TYPO.surtitre,
      fontSize: 10,
      color: couleurs.texteTertiaire,
    },
    code: {
      ...TYPO.chiffre,
      fontSize: 26,
      letterSpacing: 2,
    },
    codeAction: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 5,
    },
    codeActionTexte: {
      ...TYPO.legende,
      fontSize: 11.5,
    },
    boutonAmazon: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: RAYONS.grand,
      paddingVertical: 15,
      paddingHorizontal: 20,
      alignSelf: "stretch",
    },
    boutonAmazonTexte: {
      ...TYPO.label,
      fontSize: 14.5,
      color: "#FFFFFF",
    },
    carteEmail: {
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.carte,
      borderWidth: 1,
      borderColor: couleurs.bordure,
      padding: 20,
      gap: 12,
      ...couleurs.ombres.carte,
    },
    captureTitre: {
      ...TYPO.titreCarte,
      fontSize: 16,
      color: couleurs.texte,
    },
    captureDescription: {
      ...TYPO.legende,
      color: couleurs.texteAttenue,
    },
    champEmail: {
      ...TYPO.corpsMoyen,
      borderWidth: 1.5,
      borderColor: couleurs.bordure,
      backgroundColor: couleurs.surfaceAtone,
      borderRadius: RAYONS.moyen,
      paddingHorizontal: 15,
      paddingVertical: 14,
      color: couleurs.texte,
    },
    consentement: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 11,
      marginTop: 4,
    },
    caseAcocher: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
    },
    consentementTexte: {
      ...TYPO.legende,
      flex: 1,
      fontSize: 12.5,
      lineHeight: 19,
      color: couleurs.texteAttenue,
    },
    lienPolitique: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
      paddingVertical: 4,
    },
    lienPolitiqueTexte: {
      ...TYPO.legende,
      fontSize: 12.5,
    },
    boutonEnvoyer: {
      borderRadius: RAYONS.moyen,
      paddingVertical: 15,
      alignItems: "center",
    },
    boutonDesactive: {
      backgroundColor: couleurs.verrouilleFond,
    },
    boutonEnvoyerTexte: {
      ...TYPO.label,
      fontSize: 15,
      color: "#FFFFFF",
    },
    message: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    messageTexte: {
      ...TYPO.legende,
      color: couleurs.texteAttenue,
    },
    disclaimer: {
      ...TYPO.legende,
      fontSize: 11.5,
      lineHeight: 16,
      color: couleurs.texteTertiaire,
      textAlign: "center",
    },
  });
