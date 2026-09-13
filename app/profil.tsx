import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { iconeEtape, libelleTypeEtape } from "../src/components/chemin/icones";
import { ChoixTheme } from "../src/components/profil/ChoixTheme";
import { FicheBadge, type BadgeOuvert } from "../src/components/profil/FicheBadge";
import { Apparition } from "../src/components/ui/Apparition";
import { AppuiRessort } from "../src/components/ui/AppuiRessort";
import { EnteteEcran } from "../src/components/ui/EnteteEcran";
import { FondAnime } from "../src/components/ui/FondAnime";
import { BarreProgression } from "../src/components/ui/BarreProgression";
import { CalendrierActivite } from "../src/components/ui/CalendrierActivite";
import { useCompteur } from "../src/components/ui/useCompteur";
import { infosSession, sessionDeEtape } from "../src/constants/sessions";
import { VOIES } from "../src/constants/voies";
import { recupererParcoursBundle } from "../src/data/content";
import { obtenirTousLesElementsLateraux } from "../src/data/content/elementsLateraux";
import { calculerXp } from "../src/domain/parcours/engagement";
import type { Etape } from "../src/domain/parcours/types";
import { useEngagement } from "../src/hooks/useEngagement";
import { useProgressStore } from "../src/state/progressStore";
import { delaiCascade } from "../src/theme/animation";
import { eclaircir } from "../src/theme/couleurs";
import { useCouleurs, useMode, useStyles } from "../src/theme/ModeCouleur";
import type { Couleurs } from "../src/theme/palettes";
import { PRESSION, RAYONS, teinteEcran, themeDuParcours } from "../src/theme/parcoursTheme";
import { TYPO } from "../src/theme/typographie";
import { haptiqueLegere } from "../src/utils/haptique";

const PARCOURS_IDS = ["intro", ...VOIES.map((v) => v.id)];
const TYPES_COMPTES: Etape["type"][] = ["lecon", "quiz", "exercice", "situation", "exemple"];

/** Tableau de bord : XP, série, avancement par parcours, collection de badges. */
export default function Profil() {
  const mode = useMode();
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [badgeOuvert, setBadgeOuvert] = useState<BadgeOuvert | null>(null);
  const progression = useProgressStore((state) => state.parcours);
  const nbDefisReussis = useProgressStore((state) => state.defisReussis.length);
  const nbDefisJoues = useProgressStore((state) => state.defisJoues.length);
  const nbARevoir = useProgressStore((state) => Object.keys(state.questionsRatees).length);
  const profilFinancier = useProgressStore((state) => state.profilFinancier);
  const joursActifs = useProgressStore((state) => state.joursActifs);
  const engagement = useEngagement();
  const xpAffichee = useCompteur(calculerXp(progression, nbDefisReussis), 900);

  // Compte des étapes validées par type, tous parcours confondus — pour les "chiffres de tête".
  const compteParType = new Map<Etape["type"], number>();
  for (const parcoursId of PARCOURS_IDS) {
    const parcours = recupererParcoursBundle(parcoursId);
    const completees = new Set(progression[parcoursId]?.etapesCompletees ?? []);
    for (const etape of parcours?.etapes ?? []) {
      if (completees.has(etape.id)) compteParType.set(etape.type, (compteParType.get(etape.type) ?? 0) + 1);
    }
  }

  // Un badge est gagné quand toutes les étapes de sa session sont validées.
  const badges = obtenirTousLesElementsLateraux()
    .filter((e) => e.type === "badge")
    .map((badge) => {
      const parcours = recupererParcoursBundle(badge.parcoursId);
      const completees = new Set(progression[badge.parcoursId]?.etapesCompletees ?? []);
      const etapesSession = parcours?.etapes.filter((et) => sessionDeEtape(et) === badge.session) ?? [];
      const faites = etapesSession.filter((et) => completees.has(et.id)).length;
      const gagne = etapesSession.length > 0 && faites === etapesSession.length;
      // La fiche du badge a besoin de plus que « gagné ou non » : elle explique d'où il
      // vient et ce qu'il reste à faire pour l'obtenir.
      return {
        badge,
        gagne,
        faites,
        total: etapesSession.length,
        parcoursTitre: parcours?.titre ?? badge.parcoursId,
        infos: infosSession(badge.parcoursId, badge.session),
      };
    });
  const nbGagnes = badges.filter((b) => b.gagne).length;

  /**
   * Partage de progression — le seul canal de diffusion d'une app sans budget publicitaire.
   * Volontairement du texte : générer une image demanderait une dépendance de capture
   * d'écran, pour un gain douteux face à un message court et lisible partout.
   */
  async function partager() {
    const derniers = badges
      .filter((b) => b.gagne)
      .slice(-3)
      .map((b) => `• ${b.badge.titre}`)
      .join("\n");
    const serie = engagement.serie >= 2 ? `\n${engagement.serie} jours d'affilée.` : "";

    await Share.share({
      message:
        `J'apprends la finance perso : niveau ${engagement.niveau}, ` +
        `${calculerXp(progression, nbDefisReussis)} XP, ${nbGagnes} badge${nbGagnes > 1 ? "s" : ""}.` +
        serie +
        (derniers ? `\n\nDerniers badges :\n${derniers}` : ""),
    }).catch(() => {
      // Partage annulé ou indisponible : rien à signaler, l'utilisateur a déjà vu la feuille.
    });
  }

  // Prochain badge : celui de la session en cours du parcours le plus avancé (non terminé).
  const prochain = (() => {
    for (const { badge, gagne } of badges) {
      if (gagne) continue;
      const parcours = recupererParcoursBundle(badge.parcoursId);
      const completees = new Set(progression[badge.parcoursId]?.etapesCompletees ?? []);
      const etapesSession = parcours?.etapes.filter((et) => sessionDeEtape(et) === badge.session) ?? [];
      const faites = etapesSession.filter((et) => completees.has(et.id)).length;
      if (faites > 0) return { badge, restantes: etapesSession.length - faites, infos: infosSession(badge.parcoursId, badge.session) };
    }
    return undefined;
  })();

  return (
    <>
      <View style={styles.fond} pointerEvents="none">
        <FondAnime theme={themeDuParcours("intro", mode)} intensite={0.28} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.conteneur, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <EnteteEcran
          surtitre="Ton tableau de bord"
          titre="Où tu en es, en un coup d'œil."
          icone="person-circle"
          teinte={teinteEcran("profil")}
          insetHaut={insets.top}
          onRetour={() => (router.canGoBack() ? router.back() : router.replace("/parcours"))}
        >
        <View style={styles.ligneXp}>
          <Text style={styles.xp} accessibilityLabel={`${xpAffichee} points d'expérience`}>
            {xpAffichee}
          </Text>
          <Text style={styles.xpUnite}>XP</Text>
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="star" size={16} color="#FFD166" />
            <Text style={styles.statTexte}>Niveau {engagement.niveau}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="flame" size={16} color="#FFA766" />
            <Text style={styles.statTexte}>
              {engagement.serie} jour{engagement.serie > 1 ? "s" : ""} de suite
            </Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="ribbon" size={16} color="#DDA9EE" />
            <Text style={styles.statTexte}>
              {nbGagnes}/{badges.length} badges
            </Text>
          </View>
        </View>
        <View style={styles.niveauBarre}>
          <BarreProgression
            ratio={engagement.xpDansNiveau / engagement.xpPourSuivant}
            couleur="#FFFFFF"
            couleurPiste="rgba(255,255,255,0.26)"
            hauteur={8}
          />
          <Text style={styles.niveauTexte}>
            {engagement.xpPourSuivant - engagement.xpDansNiveau} XP avant le niveau {engagement.niveau + 1}
          </Text>
        </View>
        </EnteteEcran>

        <View style={styles.corps}>
      <Apparition delai={80} style={styles.raccourcis}>
        {[
          {
            href: "/bilan" as const,
            icone: "book-outline" as const,
            titre: "Mon bilan",
            detail: "Ce que tu sais maintenant",
          },
          {
            href: "/revision" as const,
            icone: "refresh-outline" as const,
            titre: "Réviser mes erreurs",
            detail: nbARevoir > 0 ? `${nbARevoir} question${nbARevoir > 1 ? "s" : ""} en attente` : "Rien à revoir",
            pastille: nbARevoir,
          },
          {
            href: "/mes-chiffres" as const,
            icone: "person-circle-outline" as const,
            titre: "Mes chiffres",
            detail: profilFinancier?.revenuNet ? "Simulateurs personnalisés" : "Personnaliser les simulateurs",
          },
        ].map((raccourci) => (
          <AppuiRessort
            key={raccourci.href}
            echelle={0.975}
            onPress={() => router.push(raccourci.href)}
            accessibilityLabel={`${raccourci.titre} : ${raccourci.detail}`}
            styleContenu={styles.raccourci}
          >
              <View style={styles.raccourciIcone}>
                <Ionicons name={raccourci.icone} size={19} color={couleurs.texte} />
                {"pastille" in raccourci && (raccourci.pastille ?? 0) > 0 && (
                  <View style={styles.raccourciPastille}>
                    <Text style={styles.raccourciPastilleTexte}>{raccourci.pastille}</Text>
                  </View>
                )}
              </View>
              <View style={styles.raccourciTextes}>
                <Text style={styles.raccourciTitre}>{raccourci.titre}</Text>
                <Text style={styles.raccourciDetail}>{raccourci.detail}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={couleurs.texteTertiaire} />
          </AppuiRessort>
        ))}
      </Apparition>

      <Apparition delai={90}>
        <ChoixTheme />
      </Apparition>

      <Apparition delai={100} style={styles.bloc}>
        <Text style={styles.blocTitre}>En chiffres</Text>
        <View style={styles.grilleChiffres}>
          {TYPES_COMPTES.map((type) => {
            const exemple = { type } as Etape;
            return (
              <View key={type} style={styles.chiffre}>
                <Ionicons name={iconeEtape(exemple)} size={17} color={couleurs.texteAttenue} />
                <Text style={styles.chiffreValeur}>{compteParType.get(type) ?? 0}</Text>
                <Text style={styles.chiffreLabel} numberOfLines={1}>
                  {libelleTypeEtape(exemple)}
                  {(compteParType.get(type) ?? 0) > 1 ? "s" : ""}
                </Text>
              </View>
            );
          })}
          <View style={styles.chiffre}>
            <Ionicons name="flash-outline" size={17} color={couleurs.texteAttenue} />
            <Text style={styles.chiffreValeur}>{nbDefisReussis}</Text>
            <Text style={styles.chiffreLabel} numberOfLines={1}>
              Défi{nbDefisReussis > 1 ? "s" : ""}
              {nbDefisJoues > 0 ? ` / ${nbDefisJoues}` : ""}
            </Text>
          </View>
        </View>
      </Apparition>

      {prochain && (
        <Apparition delai={160}>
          <View style={[styles.prochain, { backgroundColor: themeDuParcours(prochain.badge.parcoursId, mode).tint }]}>
            <View style={[styles.prochainIcone, { backgroundColor: themeDuParcours(prochain.badge.parcoursId, mode).primary }]}>
              <Ionicons name="ribbon-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.prochainTextes}>
              <Text style={[styles.prochainSurtitre, { color: themeDuParcours(prochain.badge.parcoursId, mode).primary }]}>Prochain badge</Text>
              <Text style={styles.prochainTitre}>{prochain.badge.titre}</Text>
              <Text style={styles.prochainTexte}>
                Encore {prochain.restantes} étape{prochain.restantes > 1 ? "s" : ""}
                {prochain.infos ? ` dans « ${prochain.infos.titre} »` : ""}.
              </Text>
            </View>
          </View>
        </Apparition>
      )}

      <Apparition delai={200} style={styles.bloc}>
        <Text style={styles.blocTitre}>Ta régularité</Text>
        <View style={styles.carteCalendrier}>
          <CalendrierActivite joursActifs={joursActifs} theme={themeDuParcours("intro", mode)} />
        </View>
      </Apparition>

      <Apparition delai={240} style={styles.bloc}>
        <Text style={styles.blocTitre}>Avancement</Text>
        {PARCOURS_IDS.map((parcoursId) => {
          const parcours = recupererParcoursBundle(parcoursId);
          if (!parcours) return null;
          const theme = themeDuParcours(parcoursId, mode);
          const nb = progression[parcoursId]?.etapesCompletees.length ?? 0;
          return (
            <Link
              key={parcoursId}
              href={parcoursId === "intro" ? "/parcours" : { pathname: "/parcours/[parcoursId]", params: { parcoursId } }}
              asChild
            >
              <Pressable style={({ pressed }) => [styles.carteParcours, pressed && PRESSION]} accessibilityRole="button">
                <View style={[styles.pastille, { backgroundColor: theme.primary }]} />
                <View style={styles.carteParcoursTextes}>
                  <View style={styles.carteParcoursLigne}>
                    <Text style={styles.carteParcoursTitre}>{parcours.titre}</Text>
                    <Text style={[styles.carteParcoursCompte, { color: theme.primary }]}>
                      {nb}/{parcours.etapes.length}
                    </Text>
                  </View>
                  <BarreProgression ratio={nb / parcours.etapes.length} couleur={theme.primary} couleurPiste={theme.tint} hauteur={6} />
                </View>
              </Pressable>
            </Link>
          );
        })}
      </Apparition>

      <Apparition delai={340} style={styles.bloc}>
        <View style={styles.ligneTitreBadges}>
          <Text style={styles.blocTitre}>Badges</Text>
          {nbGagnes > 0 && (
            <Pressable
              onPress={partager}
              accessibilityRole="button"
              accessibilityLabel="Partager ma progression"
              style={({ pressed }) => [styles.boutonPartage, pressed && PRESSION]}
            >
              <Ionicons name="share-outline" size={15} color={couleurs.texteAttenue} />
              <Text style={styles.boutonPartageTexte}>Partager</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.grille}>
          {badges.map((entree, index) => {
            const { badge, gagne } = entree;
            const theme = themeDuParcours(badge.parcoursId, mode);
            return (
              <Apparition
                key={badge.id}
                mode="pop"
                delai={delaiCascade(index, 360)}
                style={styles.badgeCase}
              >
              <AppuiRessort
                echelle={0.94}
                onPress={() => {
                  haptiqueLegere();
                  setBadgeOuvert(entree);
                }}
                accessibilityLabel={`${badge.titre}${gagne ? ", obtenu" : ", à débloquer"}`}
                accessibilityHint="Ouvre la fiche du badge"
                styleContenu={[styles.badge, !gagne && styles.badgeVerrouille]}
              >
                {gagne ? (
                  <LinearGradient
                    colors={[eclaircir(theme.primary, 0.22), theme.primary, theme.primaryDark]}
                    start={{ x: 0.15, y: 0 }}
                    end={{ x: 0.85, y: 1 }}
                    style={styles.badgeCercle}
                  >
                    <Ionicons name="ribbon" size={22} color="#FFFFFF" />
                  </LinearGradient>
                ) : (
                  <View style={[styles.badgeCercle, { backgroundColor: couleurs.verrouilleFond }]}>
                    <Ionicons name="lock-closed" size={22} color={couleurs.verrouilleIcone} />
                  </View>
                )}
                <Text style={[styles.badgeTitre, !gagne && { color: couleurs.texteTertiaire }]} numberOfLines={2}>
                  {badge.titre}
                </Text>
              </AppuiRessort>
              </Apparition>
            );
          })}
        </View>
      </Apparition>
        </View>
      </ScrollView>

      <FicheBadge ouvert={badgeOuvert} onFermer={() => setBadgeOuvert(null)} />
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
      gap: 26,
    },
    corps: {
      paddingHorizontal: 22,
      gap: 26,
    },
    ligneXp: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 8,
      marginTop: 16,
    },
    xp: {
      ...TYPO.chiffre,
      fontSize: 50,
      lineHeight: 56,
      letterSpacing: -2,
      color: "#FFFFFF",
    },
    xpUnite: {
      ...TYPO.titreSection,
      color: "rgba(255,255,255,0.82)",
    },
    stats: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 12,
    },
    stat: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      // Posées sur le bandeau : un voile clair translucide, et surtout pas une carte
      // blanche — leur texte est blanc, il disparaîtrait dessus.
      backgroundColor: "rgba(255,255,255,0.16)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.22)",
      borderRadius: RAYONS.pilule,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    statTexte: {
      ...TYPO.legende,
      color: "rgba(255,255,255,0.9)",
    },
    niveauBarre: {
      marginTop: 16,
      gap: 6,
    },
    niveauTexte: {
      ...TYPO.legende,
      marginTop: 7,
      color: "rgba(255,255,255,0.78)",
    },
    bloc: {
      gap: 10,
    },
    carteCalendrier: {
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.grand,
      padding: 14,
      ...couleurs.ombres.carte,
    },
    ligneTitreBadges: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    boutonPartage: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: RAYONS.pilule,
      backgroundColor: couleurs.surfaceAtone,
    },
    boutonPartageTexte: {
      ...TYPO.legende,
      color: couleurs.texteAttenue,
    },
    raccourcis: {
      gap: 8,
    },
    raccourci: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.grand,
      padding: 14,
      ...couleurs.ombres.carte,
    },
    raccourciIcone: {
      width: 38,
      height: 38,
      borderRadius: RAYONS.moyen,
      backgroundColor: couleurs.surfaceAtone,
      alignItems: "center",
      justifyContent: "center",
    },
    raccourciPastille: {
      position: "absolute",
      top: -5,
      right: -5,
      minWidth: 19,
      height: 19,
      paddingHorizontal: 5,
      borderRadius: 999,
      backgroundColor: couleurs.erreur,
      alignItems: "center",
      justifyContent: "center",
    },
    raccourciPastilleTexte: {
      ...TYPO.legende,
      fontSize: 10.5,
      color: "#FFFFFF",
    },
    raccourciTextes: {
      flex: 1,
      gap: 2,
    },
    raccourciTitre: {
      ...TYPO.label,
      color: couleurs.texte,
    },
    raccourciDetail: {
      ...TYPO.legende,
      color: couleurs.texteAttenue,
    },
    grilleChiffres: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chiffre: {
      width: "31%",
      flexGrow: 1,
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.grand,
      paddingVertical: 12,
      paddingHorizontal: 10,
      gap: 3,
      ...couleurs.ombres.carte,
    },
    chiffreValeur: {
      ...TYPO.chiffre,
      fontSize: 22,
      lineHeight: 26,
      color: couleurs.texte,
    },
    chiffreLabel: {
      ...TYPO.legende,
      fontSize: 11,
      color: couleurs.texteAttenue,
    },
    prochain: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      borderRadius: RAYONS.carte,
      padding: 15,
    },
    prochainIcone: {
      width: 42,
      height: 42,
      borderRadius: RAYONS.moyen,
      alignItems: "center",
      justifyContent: "center",
    },
    prochainTextes: {
      flex: 1,
      gap: 2,
    },
    prochainSurtitre: {
      ...TYPO.surtitre,
    },
    prochainTitre: {
      ...TYPO.titreCarte,
      color: couleurs.texte,
    },
    prochainTexte: {
      ...TYPO.legende,
      color: couleurs.texteAttenue,
    },
    blocTitre: {
      ...TYPO.titreSection,
      color: couleurs.texte,
      marginBottom: 2,
    },
    carteParcours: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.grand,
      padding: 14,
      ...couleurs.ombres.carte,
    },
    pastille: {
      width: 10,
      height: 38,
      borderRadius: RAYONS.pilule,
    },
    carteParcoursTextes: {
      flex: 1,
      gap: 8,
    },
    carteParcoursLigne: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    carteParcoursTitre: {
      ...TYPO.label,
      color: couleurs.texte,
    },
    carteParcoursCompte: {
      ...TYPO.legende,
    },
    grille: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    badgeCase: {
      width: "30%",
      flexGrow: 1,
    },
    badge: {
      alignItems: "center",
      gap: 8,
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.grand,
      paddingVertical: 14,
      paddingHorizontal: 8,
      ...couleurs.ombres.carte,
    },
    badgeVerrouille: {
      backgroundColor: couleurs.surfaceAtone,
      shadowOpacity: 0,
      elevation: 0,
    },
    badgeCercle: {
      width: 46,
      height: 46,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeTitre: {
      ...TYPO.legende,
      fontSize: 11.5,
      textAlign: "center",
      color: couleurs.texte,
    },
  });
