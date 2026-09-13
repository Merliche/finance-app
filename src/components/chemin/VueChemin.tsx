import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Defs,
  LinearGradient as DegradeSvg,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

import type { ElementLateral } from "../../domain/elementsLateraux/types";
import { estimerDureeLecture } from "../../domain/parcours/lecture";
import type { Etape, Parcours } from "../../domain/parcours/types";
import { MODE_TEST_TOUT_ACCESSIBLE } from "../../constants/modeTest";
import { infosSession, sessionDeEtape } from "../../constants/sessions";
import { avecAlpha, eclaircir, melanger } from "../../theme/couleurs";
import { useCouleurs, useStyles } from "../../theme/ModeCouleur";
import type { Couleurs } from "../../theme/palettes";
import { PRESSION, RAYONS, type ThemeParcours } from "../../theme/parcoursTheme";
import { PLAFOND_ETIQUETTE, TYPO } from "../../theme/typographie";
import { haptiqueLegere } from "../../utils/haptique";
import { ApercuEtape, type ApercuOuvert } from "./ApercuEtape";
import { BanniereSession } from "./BanniereSession";
import { BoutonRetourEtape } from "./BoutonRetourEtape";
import { CielParcours } from "./CielParcours";
import {
  calculerChemin,
  ecarterDesBandes,
  positionnerElementsLateraux,
  tracerChemin,
  type BandeOccupee,
} from "./calculerChemin";
import { CometeChemin } from "./CometeChemin";
import { ElementLateralModal } from "./ElementLateralModal";
import { iconeEtape, libelleTypeEtape } from "./icones";
import { NoeudChemin } from "./NoeudChemin";
import { RondElementLateral } from "./RondElementLateral";
import { SessionModal, type SessionOuverte } from "./SessionModal";
import { Apparition } from "../ui/Apparition";
import { AppuiRessort } from "../ui/AppuiRessort";
import { FondAnime } from "../ui/FondAnime";
import { MotifPoints } from "../ui/MotifPoints";
import { Poussiere } from "../ui/Poussiere";

type NomIcone = keyof typeof Ionicons.glyphMap;

/** Une destination affichée au sommet du chemin (une voie sur la map, la récompense sur une voie). */
export interface CibleSommet {
  cle: string;
  couleur: string;
  couleurSombre: string;
  icone: NomIcone;
  label: string;
  deverrouille: boolean;
  onPress: () => void;
}

export interface SommetChemin {
  caption: string;
  cibles: CibleSommet[];
}

// Le chemin est calculé "en logique" (calculerChemin place l'étape 0 en haut, comme un
// écran classique) puis affiché EN MIROIR VERTICAL : à l'écran, l'étape 0 se retrouve
// en bas et le chemin monte au fur et à mesure qu'on progresse, façon Duolingo. Le
// sommet, calculé après la dernière étape (donc "en bas" en logique), se retrouve ainsi
// tout en haut une fois à l'écran.
const Y_DEPART = 40;
const SOMMET_MARGE_CHEMIN = 50;
const SOMMET_HAUTEUR_CAPTION = 22;
const SOMMET_MARGE_CAPTION = 22;
const SOMMET_RAYON_MAX = 38;
const SOMMET_HAUTEUR_LABEL = 34;
const SOMMET_MARGE_HAUT = 70;

// Bulle "À suivre" : sa hauteur réelle dépend du titre, on raisonne sur une estimation
// pour la centrer sur le nœud et écarter les ronds latéraux qui la chevaucheraient.
const BULLE_HAUTEUR_ESTIMEE = 142;
const BULLE_LARGEUR_MIN = 118;
const BULLE_LARGEUR_MAX = 182;
const MARGE_BORD = 22;

// Portion de la hauteur visible sous laquelle on garde l'étape en cours (0 = tout en
// haut du viewport, 1 = tout en bas) : on vise la moitié basse, "à portée de pouce".
const CIBLE_VERTICALE = 0.62;

// Marges de tolérance avant d'annoncer que l'étape en cours n'est plus à l'écran. Les
// deux seuils diffèrent volontairement : on n'affiche la pastille de retour que lorsque
// le nœud est franchement sorti, et on ne la retire que lorsqu'il est franchement
// revenu — sans cet écart, elle clignoterait à chaque hésitation du doigt.
const SEUIL_SORTIE = 40;
const SEUIL_RETOUR = 130;

const LIBELLE_ETAT = { valide: "validée", actuel: "à faire maintenant", verrouille: "verrouillée" } as const;

export function VueChemin({
  parcours,
  etapesCompletees,
  theme,
  elementsLateraux,
  sommet,
  onEtapePress,
}: {
  parcours: Parcours;
  etapesCompletees: string[];
  theme: ThemeParcours;
  elementsLateraux: ElementLateral[];
  sommet?: SommetChemin;
  onEtapePress: (etapeId: string) => void;
}) {
  const couleurs = useCouleurs();
  const styles = useStyles(creerStyles);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [hauteurVisible, setHauteurVisible] = useState(0);
  const [elementLateralOuvert, setElementLateralOuvert] = useState<ElementLateral | null>(null);
  const [sessionOuverte, setSessionOuverte] = useState<SessionOuverte | null>(null);
  const [apercu, setApercu] = useState<ApercuOuvert | null>(null);
  const [etapeHorsEcran, setEtapeHorsEcran] = useState<"haut" | "bas" | null>(null);

  // Position de défilement, partagée avec le fond (parallaxe) sans repasser par l'état
  // React : la valeur vit côté natif, le rendu n'est jamais relancé par le défilement.
  const defilement = useRef(new Animated.Value(0)).current;

  const etapesTriees = useMemo(
    () => parcours.etapes.slice().sort((a, b) => a.ordre - b.ordre),
    [parcours.etapes]
  );

  // Le tracé complet — jusqu'à 48 nœuds, leurs bannières et leur géométrie — est
  // recalculé à chaque rendu sans ce mémo, y compris pendant le défilement.
  const { noeuds, bannieres, yFin } = useMemo(() => {
    const validees = new Set(etapesCompletees);
    return calculerChemin({
      items: etapesTriees,
      estComplete: (etape: Etape) => validees.has(etape.id),
      session: sessionDeEtape,
      largeurEcran: width,
      yDepart: Y_DEPART,
    });
  }, [etapesTriees, etapesCompletees, width]);

  const centre = width / 2;
  const decalage = Math.min(width * 0.22, 90);
  const nbCibles = sommet?.cibles.length ?? 0;

  // Écartement des cibles de la fourche. On vise l'écartement des couloirs du chemin
  // (agréable à l'œil), mais deux contraintes priment : les ronds ne doivent jamais se
  // chevaucher, et les deux extrêmes doivent tenir dans l'écran. Avec trois voies le
  // compromis est sans effet ; avec quatre, c'est lui qui évite le tas. Le rayon lui-même
  // se réduit quand l'écran est trop étroit pour les aligner à taille normale.
  const rayonCible = Math.min(
    SOMMET_RAYON_MAX,
    nbCibles > 0 ? (width - 2 * MARGE_BORD - 8 * (nbCibles - 1)) / (2 * nbCibles) : SOMMET_RAYON_MAX
  );
  const ecartMinimum = rayonCible * 2 + 8;
  const ecartMaximum = nbCibles > 1 ? (width - 2 * MARGE_BORD - rayonCible * 2) / (nbCibles - 1) : 0;
  const ecartCibles = nbCibles > 1 ? Math.min(Math.max((2 * decalage) / (nbCibles - 1), ecartMinimum), ecartMaximum) : 0;
  const largeurLabel = nbCibles > 1 ? ecartCibles - 4 : 96;
  const positionsCibles = sommet
    ? sommet.cibles.map((_, index) => centre + (index - (nbCibles - 1) / 2) * ecartCibles)
    : [];

  const yCaption = yFin + SOMMET_MARGE_CHEMIN;
  const yCibles = yCaption + SOMMET_HAUTEUR_CAPTION + SOMMET_MARGE_CAPTION + rayonCible;
  const hauteurTotale = sommet
    ? yCibles + rayonCible + SOMMET_HAUTEUR_LABEL + SOMMET_MARGE_HAUT
    : yFin + SOMMET_MARGE_HAUT;

  const mirror = useCallback((y: number) => hauteurTotale - y, [hauteurTotale]);

  const dernierNoeud = noeuds[noeuds.length - 1];
  const noeudActuel = noeuds.find((noeud) => noeud.etat === "actuel");
  const yCibleEcran = mirror(noeudActuel ? noeudActuel.y : yCibles);
  const ratioAvancement = noeuds.length > 0 ? etapesCompletees.length / noeuds.length : 0;

  const defilementVoulu = useCallback(() => {
    const maxDecalage = Math.max(hauteurTotale - hauteurVisible, 0);
    return Math.min(Math.max(yCibleEcran - hauteurVisible * CIBLE_VERTICALE, 0), maxDecalage);
  }, [hauteurTotale, hauteurVisible, yCibleEcran]);

  useEffect(() => {
    if (!hauteurVisible) return;
    scrollRef.current?.scrollTo({ y: defilementVoulu(), animated: false });
  }, [hauteurVisible, defilementVoulu]);

  // Le suivi de visibilité lit des valeurs qui changent à chaque rendu : on les garde
  // dans des refs pour que l'écouteur de défilement, lui, reste stable.
  const reperes = useRef({ yCibleEcran, hauteurVisible, horsEcran: etapeHorsEcran });
  reperes.current = { yCibleEcran, hauteurVisible, horsEcran: etapeHorsEcran };

  const surDefilement = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: defilement } } }], {
        useNativeDriver: true,
        listener: (evenement: { nativeEvent: { contentOffset: { y: number } } }) => {
          const { yCibleEcran: cible, hauteurVisible: hauteur, horsEcran } = reperes.current;
          if (!hauteur) return;
          const haut = evenement.nativeEvent.contentOffset.y;
          const marge = horsEcran ? SEUIL_RETOUR : SEUIL_SORTIE;
          const nouveau = cible < haut + marge ? "haut" : cible > haut + hauteur - marge ? "bas" : null;
          if (nouveau !== horsEcran) setEtapeHorsEcran(nouveau);
        },
      }),
    [defilement]
  );

  // Une session est "atteinte" dès qu'au moins un de ses nœuds n'est plus verrouillé —
  // sert à griser les bannières et à déverrouiller les éléments latéraux rattachés.
  const { sessionsAtteintes, compteParSession } = useMemo(() => {
    const atteintes = new Set<number>();
    const comptes = new Map<number, { validees: number; total: number }>();
    for (const noeud of noeuds) {
      const s = sessionDeEtape(noeud.item);
      if (s === null) continue;
      if (noeud.etat !== "verrouille") atteintes.add(s);
      const compte = comptes.get(s) ?? { validees: 0, total: 0 };
      compte.total += 1;
      if (noeud.etat === "valide") compte.validees += 1;
      comptes.set(s, compte);
    }
    return { sessionsAtteintes: atteintes, compteParSession: comptes };
  }, [noeuds]);

  // --- Bulle "À suivre" : géométrie, et écartement des ronds latéraux qu'elle couvrirait.
  const bulle = noeudActuel
    ? (() => {
        const aGauche = noeudActuel.x >= centre;
        const espace = aGauche
          ? noeudActuel.x - noeudActuel.rayon - 12 - MARGE_BORD
          : width - (noeudActuel.x + noeudActuel.rayon + 12) - MARGE_BORD;
        const largeur = Math.max(BULLE_LARGEUR_MIN, Math.min(BULLE_LARGEUR_MAX, espace));
        const centreY = Math.min(
          Math.max(mirror(noeudActuel.y), BULLE_HAUTEUR_ESTIMEE / 2 + 8),
          hauteurTotale - BULLE_HAUTEUR_ESTIMEE / 2 - 8
        );
        return { aGauche, largeur, centreY, top: centreY - BULLE_HAUTEUR_ESTIMEE / 2 };
      })()
    : null;

  // Le placement des éléments latéraux ne dépend pas de la bulle : on le mémorise, et
  // seul l'écartement anti-chevauchement est recalculé quand la bulle bouge.
  const elementsPlaces = useMemo(
    () =>
      positionnerElementsLateraux({
        elements: elementsLateraux,
        sessionDeElement: (element) => element.session,
        noeuds,
        sessionDeNoeud: sessionDeEtape,
        largeurEcran: width,
      }),
    [elementsLateraux, noeuds, width]
  );

  // Ce que les éléments latéraux ne doivent jamais recouvrir : les bannières de session,
  // qui barrent toute la largeur, et la bulle « À suivre », qui n'occupe qu'un côté.
  const bandesBannieres = useMemo<BandeOccupee[]>(
    () =>
      bannieres.map((banniere) => {
        const centreBanniere = mirror(banniere.y + banniere.hauteur / 2);
        return {
          debut: centreBanniere - banniere.hauteur / 2 - 6,
          fin: centreBanniere + banniere.hauteur / 2 + 6,
        };
      }),
    [bannieres, mirror]
  );

  const elementsPositionnes = elementsPlaces.map((position) => {
    const bandes = [...bandesBannieres];
    if (bulle) {
      const memeCote = bulle.aGauche ? position.x < centre : position.x >= centre;
      if (memeCote) {
        bandes.push({
          debut: bulle.centreY - BULLE_HAUTEUR_ESTIMEE / 2 - 8,
          fin: bulle.centreY + BULLE_HAUTEUR_ESTIMEE / 2 + 8,
        });
      }
    }
    const yEcran = ecarterDesBandes(
      mirror(position.y),
      position.rayon,
      bandes,
      position.rayon + 8,
      hauteurTotale - position.rayon - 8
    );
    return { ...position, yEcran };
  });

  const indexPremierNonValide = noeuds.findIndex((n) => n.etat !== "valide");
  const finParcouru = indexPremierNonValide === -1 ? noeuds.length - 1 : indexPremierNonValide;
  const tracesParcouru = useMemo(
    () => noeuds.slice(0, finParcouru + 1).map((n) => ({ x: n.x, y: mirror(n.y) })),
    [noeuds, finParcouru, mirror]
  );
  const tracesRestant = noeuds.slice(finParcouru).map((n) => ({ x: n.x, y: mirror(n.y) }));

  // Les dégradés SVG sont identifiés globalement : préfixer par le parcours évite que
  // deux chemins montés en même temps (transition d'écran) se volent leurs couleurs.
  const idTrace = `trace-${parcours.id}`;
  const idFoyer = `foyer-${parcours.id}`;

  function ouvrirEtape(etapeId: string) {
    haptiqueLegere();
    setApercu(null);
    onEtapePress(etapeId);
  }

  function ouvrirApercu(index: number) {
    const noeud = noeuds[index];
    haptiqueLegere();
    const session = sessionDeEtape(noeud.item);
    setApercu({
      etape: noeud.item,
      etat: noeud.etat,
      numero: index + 1,
      session: session !== null ? infosSession(parcours.id, session)?.titre : undefined,
    });
  }

  // Les nœuds surgissent en cascade depuis l'étape en cours (là où le regard arrive),
  // plafonné pour qu'un long parcours ne fasse pas attendre.
  const indexActuel = noeuds.findIndex((n) => n.etat === "actuel");
  const delaiNoeud = (index: number) =>
    80 + Math.min(Math.abs(index - (indexActuel === -1 ? noeuds.length - 1 : indexActuel)), 8) * 45;

  return (
    <View style={styles.zone}>
      {/* Le fond de la carte n'est pas peint une fois pour toutes : le ciel s'assombrit
          et se colore à mesure qu'on grimpe, des nappes dérivent et glissent en parallaxe,
          et de fines particules montent dans le sens de la montée. */}
      <CielParcours theme={theme} defilement={defilement} course={Math.max(hauteurTotale - hauteurVisible, 0)} />
      <FondAnime theme={theme} intensite={0.75} defilement={defilement} progression={ratioAvancement} />
      <MotifPoints couleur={theme.primaryDark} opacite={0.06} pas={22} />
      {hauteurVisible > 0 && <Poussiere couleur={theme.primary} hauteur={hauteurVisible} />}

      <Animated.ScrollView
        ref={scrollRef}
        onLayout={(e) => setHauteurVisible(e.nativeEvent.layout.height)}
        onScroll={surDefilement}
        scrollEventThrottle={32}
        contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width, height: hauteurTotale }}>
          {/* Foyer de lumière derrière l'étape en cours : le seul endroit du chemin que
              l'œil doit trouver sans chercher. */}
          {noeudActuel && (
            <Svg
              style={StyleSheet.absoluteFill}
              width={width}
              height={hauteurTotale}
              pointerEvents="none"
            >
              <Defs>
                <RadialGradient id={idFoyer} cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={theme.primary} stopOpacity={0.3} />
                  <Stop offset="0.5" stopColor={theme.primary} stopOpacity={0.12} />
                  <Stop offset="1" stopColor={theme.primary} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Rect
                x={noeudActuel.x - 190}
                y={mirror(noeudActuel.y) - 190}
                width={380}
                height={380}
                fill={`url(#${idFoyer})`}
              />
            </Svg>
          )}

          {/* Tracé du chemin, derrière les nœuds. La portion parcourue est pleine et
              lumineuse, la portion restante pointillée et grise : la frontière entre les
              deux se lit d'un coup d'œil, sans compter les nœuds. */}
          <Svg style={StyleSheet.absoluteFill} width={width} height={hauteurTotale} pointerEvents="none">
            <Defs>
              <DegradeSvg id={idTrace} x1="0" y1={hauteurTotale} x2="0" y2="0" gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor={theme.primaryDark} />
                <Stop offset="1" stopColor={eclaircir(theme.primary, 0.25)} />
              </DegradeSvg>
            </Defs>

            {tracesRestant.length > 1 && (
              <>
                {/* Un sillon continu sous les pointillés : la route à venir se suit d'un
                    bout à l'autre. Sans lui, de petits points espacés de quinze pixels sur
                    un fond clair ne dessinent plus rien — c'était le cas de l'intro, dont
                    presque tout le chemin est encore à faire. */}
                <Path
                  d={tracerChemin(tracesRestant)}
                  stroke={avecAlpha(theme.primaryDark, 0.13)}
                  strokeWidth={13}
                  strokeLinecap="round"
                  fill="none"
                />
                <Path
                  d={tracerChemin(tracesRestant)}
                  stroke={melanger(couleurs.verrouilleBordure, theme.primaryDark, 0.42)}
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeDasharray="3 11"
                  fill="none"
                />
              </>
            )}

            {tracesParcouru.length > 1 && (
              <>
                {/* Nappe large et très diffuse : la lueur autour du câble. */}
                <Path
                  d={tracerChemin(tracesParcouru)}
                  stroke={theme.primary}
                  strokeWidth={20}
                  strokeLinecap="round"
                  opacity={0.12}
                  fill="none"
                />
                <Path
                  d={tracerChemin(tracesParcouru)}
                  stroke={`url(#${idTrace})`}
                  strokeWidth={8}
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Filet clair sur le dessus : relief, comme un reflet sur un câble. */}
                <Path
                  d={tracerChemin(tracesParcouru)}
                  stroke={avecAlpha("#FFFFFF", 0.4)}
                  strokeWidth={2}
                  strokeLinecap="round"
                  fill="none"
                />
              </>
            )}

            {dernierNoeud &&
              sommet?.cibles.map((cible, index) => {
                const ouverte = cible.deverrouille || MODE_TEST_TOUT_ACCESSIBLE;
                return (
                  <Path
                    key={cible.cle}
                    d={tracerChemin([
                      { x: dernierNoeud.x, y: mirror(dernierNoeud.y) },
                      { x: positionsCibles[index], y: mirror(yCibles) },
                    ])}
                    stroke={
                      ouverte
                        ? cible.couleur
                        : melanger(couleurs.verrouilleBordure, theme.primaryDark, 0.42)
                    }
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeDasharray="3 11"
                    opacity={ouverte ? 0.7 : 1}
                    fill="none"
                  />
                );
              })}
          </Svg>

          {/* La lumière qui remonte le chemin déjà parcouru. */}
          <CometeChemin points={tracesParcouru} couleur={theme.primary} />

          {/* Bannières de session */}
          {bannieres.map((banniere) => {
            const infos = infosSession(parcours.id, banniere.session);
            if (!infos) return null;
            const centreY = banniere.y + banniere.hauteur / 2;
            const compte = compteParSession.get(banniere.session);
            const ouvrirSession = () => {
              haptiqueLegere();
              const etapesSession = noeuds
                .filter((n) => sessionDeEtape(n.item) === banniere.session)
                .map((n) => ({ etape: n.item, etat: n.etat }));
              const badge = elementsLateraux.find((el) => el.type === "badge" && el.session === banniere.session)?.titre;
              setSessionOuverte({ numero: banniere.session, infos, etapes: etapesSession, badge });
            };
            return (
              <Apparition
                key={banniere.session}
                delai={60}
                style={{ position: "absolute", left: 0, right: 0, top: mirror(centreY) - banniere.hauteur / 2, height: banniere.hauteur }}
              >
                <Pressable
                  onPress={ouvrirSession}
                  accessibilityRole="button"
                  accessibilityHint="Ouvre la fiche de la session"
                  style={({ pressed }) => [StyleSheet.absoluteFill, pressed && PRESSION]}
                >
                  <BanniereSession
                    numero={banniere.session}
                    titre={infos.titre}
                    icone={infos.icone}
                    niveau={infos.niveau}
                    theme={theme}
                    active={sessionsAtteintes.has(banniere.session)}
                    validees={compte?.validees ?? 0}
                    total={compte?.total ?? 0}
                    style={{ top: 0, height: banniere.hauteur }}
                  />
                </Pressable>
              </Apparition>
            );
          })}

          {/* Nœuds d'étape */}
          {noeuds.map((noeud, index) => (
            <Apparition
              key={noeud.item.id}
              mode="pop"
              delai={delaiNoeud(index)}
              style={{ position: "absolute", left: noeud.x - noeud.rayon, top: mirror(noeud.y) - noeud.rayon }}
            >
              <AppuiRessort
                disabled={noeud.etat === "verrouille" && !MODE_TEST_TOUT_ACCESSIBLE}
                onPress={() => ouvrirEtape(noeud.item.id)}
                onLongPress={() => ouvrirApercu(index)}
                accessibilityLabel={`Étape ${index + 1}, ${libelleTypeEtape(noeud.item)} : ${noeud.item.titre}, ${LIBELLE_ETAT[noeud.etat]}`}
                accessibilityHint="Appui long pour un aperçu"
                hitSlop={6}
              >
                <NoeudChemin etat={noeud.etat} theme={theme} rayon={noeud.rayon} icone={iconeEtape(noeud.item)} />
              </AppuiRessort>
            </Apparition>
          ))}

          {/* Éléments latéraux */}
          {elementsPositionnes.map((position, index) => {
            const deverrouille = sessionsAtteintes.has(position.item.session);
            return (
              <Apparition
                key={position.item.id}
                mode="pop"
                delai={380 + (index % 6) * 50}
                style={{
                  position: "absolute",
                  left: position.x - position.rayon,
                  top: position.yEcran - position.rayon,
                }}
              >
                <AppuiRessort
                  disabled={!deverrouille && !MODE_TEST_TOUT_ACCESSIBLE}
                  onPress={() => {
                    haptiqueLegere();
                    setElementLateralOuvert(position.item);
                  }}
                  accessibilityLabel={`${position.item.titre}${deverrouille ? "" : ", verrouillé"}`}
                  hitSlop={8}
                >
                  <RondElementLateral
                    type={position.item.type}
                    rayon={position.rayon}
                    deverrouille={deverrouille}
                    // Une phase par élément, dérivée de son rang : les ronds voisins ne
                    // flottent jamais en même temps.
                    phase={(index % 7) / 7}
                  />
                </AppuiRessort>
              </Apparition>
            );
          })}

          {/* Bulle d'appel de l'étape en cours — tappable, même action que le nœud */}
          {noeudActuel && bulle && (
            <Apparition
              delai={520}
              style={{
                position: "absolute",
                top: bulle.top,
                width: bulle.largeur,
                ...(bulle.aGauche ? { left: MARGE_BORD } : { right: MARGE_BORD }),
              }}
            >
              <Pressable
                onPress={() => ouvrirEtape(noeudActuel.item.id)}
                onLongPress={() => ouvrirApercu(indexActuel)}
                delayLongPress={260}
                accessibilityRole="button"
                accessibilityLabel={`Continuer : ${noeudActuel.item.titre}`}
                style={({ pressed }) => [styles.bulle, pressed && PRESSION]}
              >
                {/* Bec pointant vers le nœud : la bulle appartient visiblement à l'étape,
                    elle ne flotte pas à côté. */}
                <View
                  style={[
                    styles.bec,
                    bulle.aGauche ? { right: -5 } : { left: -5 },
                    { top: BULLE_HAUTEUR_ESTIMEE / 2 - 6 },
                  ]}
                />
                <View style={styles.bulleEntete}>
                  <Text style={[styles.bulleSurtitre, { color: theme.primary }]}>À suivre</Text>
                  <View style={[styles.bulleDuree, { backgroundColor: avecAlpha(theme.primary, 0.1) }]}>
                    <Ionicons name="time-outline" size={10} color={theme.primary} />
                    <Text style={[styles.bulleDureeTexte, { color: theme.primary }]}>
                      {estimerDureeLecture(noeudActuel.item)} min
                    </Text>
                  </View>
                </View>
                <Text style={styles.bulleTitre} numberOfLines={3}>
                  {noeudActuel.item.titre}
                </Text>
                <LinearGradient
                  colors={[eclaircir(theme.primary, 0.12), theme.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.bulleBouton}
                >
                  <Text style={styles.bulleBoutonTexte}>Continuer</Text>
                  <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
                </LinearGradient>
              </Pressable>
            </Apparition>
          )}

          {/* Sommet du chemin */}
          {sommet && (
            <>
              <Text style={[styles.caption, { top: mirror(yCaption) }]}>{sommet.caption}</Text>
              {sommet.cibles.map((cible, index) => {
                const ouverte = cible.deverrouille || MODE_TEST_TOUT_ACCESSIBLE;
                return (
                  <Apparition
                    key={cible.cle}
                    mode="pop"
                    delai={200 + index * 90}
                    style={{
                      position: "absolute",
                      left: positionsCibles[index] - rayonCible,
                      top: mirror(yCibles) - rayonCible,
                    }}
                  >
                    <AppuiRessort
                      disabled={!ouverte}
                      onPress={() => {
                        haptiqueLegere();
                        cible.onPress();
                      }}
                      accessibilityLabel={`${cible.label}${ouverte ? "" : ", verrouillé"}`}
                    >
                      {/* Le centrage doit vivre à l'intérieur de la vue animée : posé sur
                          le pressable, il n'atteindrait plus le rond ni son libellé. */}
                      <View style={{ alignItems: "center" }}>
                      {ouverte ? (
                        <View style={{ width: rayonCible * 2, height: rayonCible * 2 }}>
                          <View
                            style={{
                              position: "absolute",
                              top: 7,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              borderRadius: 999,
                              backgroundColor: cible.couleurSombre,
                            }}
                          />
                          <View
                            style={{
                              width: rayonCible * 2,
                              height: rayonCible * 2,
                              borderRadius: 999,
                              overflow: "hidden",
                              borderWidth: 2,
                              borderColor: avecAlpha("#FFFFFF", 0.24),
                            }}
                          >
                            <LinearGradient
                              colors={[eclaircir(cible.couleur, 0.24), cible.couleur, cible.couleurSombre]}
                              locations={[0, 0.55, 1]}
                              start={{ x: 0.15, y: 0 }}
                              end={{ x: 0.85, y: 1 }}
                              style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
                            >
                              <Ionicons name={cible.icone} size={Math.round(rayonCible * 0.74)} color="#FFFFFF" />
                            </LinearGradient>
                          </View>
                        </View>
                      ) : (
                        <View
                          style={{
                            width: rayonCible * 2,
                            height: rayonCible * 2,
                            borderRadius: 999,
                            backgroundColor: couleurs.verrouilleFond,
                            borderWidth: 2,
                            borderColor: couleurs.verrouilleBordure,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons
                            name="lock-closed"
                            size={Math.round(rayonCible * 0.63)}
                            color={couleurs.verrouilleIcone}
                          />
                        </View>
                      )}
                      <Text
                        numberOfLines={2}
                        maxFontSizeMultiplier={PLAFOND_ETIQUETTE}
                        style={[
                          styles.labelCible,
                          { color: ouverte ? cible.couleur : couleurs.texteAttenue, width: largeurLabel },
                        ]}
                      >
                        {cible.label}
                      </Text>
                      </View>
                    </AppuiRessort>
                  </Apparition>
                );
              })}
            </>
          )}
        </View>
      </Animated.ScrollView>

      {/* Fondu sous l'en-tête : les nœuds glissent dessous au lieu d'être coupés net */}
      <LinearGradient
        pointerEvents="none"
        colors={[couleurs.fond, "rgba(246,245,242,0)"]}
        style={styles.fonduHaut}
      />

      <BoutonRetourEtape
        visible={etapeHorsEcran !== null && noeudActuel !== undefined}
        versLeHaut={etapeHorsEcran === "haut"}
        theme={theme}
        decalageBas={insets.bottom + 18}
        onPress={() => {
          haptiqueLegere();
          scrollRef.current?.scrollTo({ y: defilementVoulu(), animated: true });
        }}
      />

      <ApercuEtape
        apercu={apercu}
        theme={theme}
        toutAccessible={MODE_TEST_TOUT_ACCESSIBLE}
        onFermer={() => setApercu(null)}
        onOuvrir={ouvrirEtape}
      />
      <ElementLateralModal element={elementLateralOuvert} onFermer={() => setElementLateralOuvert(null)} />
      <SessionModal
        session={sessionOuverte}
        theme={theme}
        toutAccessible={MODE_TEST_TOUT_ACCESSIBLE}
        onFermer={() => setSessionOuverte(null)}
        onEtapePress={onEtapePress}
      />
    </View>
  );
}

const creerStyles = (couleurs: Couleurs) =>
  StyleSheet.create({
    zone: {
      flex: 1,
    },
    fonduHaut: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 26,
    },
    bulle: {
      position: "absolute",
      backgroundColor: couleurs.surface,
      borderRadius: RAYONS.grand,
      borderWidth: 1,
      borderColor: couleurs.bordure,
      paddingHorizontal: 14,
      paddingVertical: 13,
      ...couleurs.ombres.flottante,
    },
    bec: {
      position: "absolute",
      width: 12,
      height: 12,
      backgroundColor: couleurs.surface,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: couleurs.bordure,
      transform: [{ rotate: "-45deg" }],
    },
    bulleEntete: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 6,
    },
    bulleSurtitre: {
      ...TYPO.surtitre,
      fontSize: 10,
    },
    bulleDuree: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: RAYONS.pilule,
    },
    bulleDureeTexte: {
      ...TYPO.legende,
      fontSize: 10,
    },
    bulleTitre: {
      ...TYPO.label,
      marginTop: 6,
      color: couleurs.texte,
    },
    bulleBouton: {
      marginTop: 11,
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderRadius: RAYONS.pilule,
    },
    bulleBoutonTexte: {
      ...TYPO.legende,
      fontSize: 12.5,
      color: "#FFFFFF",
    },
    caption: {
      position: "absolute",
      left: 0,
      right: 0,
      textAlign: "center",
      ...TYPO.surtitre,
      color: couleurs.texteTertiaire,
    },
    labelCible: {
      ...TYPO.legende,
      marginTop: 9,
      textAlign: "center",
    },
  });
