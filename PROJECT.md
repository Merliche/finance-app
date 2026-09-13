# Finance App — Document de référence

Ce document cadre les fondations du projet avant tout code. À tenir à jour au fil des décisions.

## 1. Vision

App mobile **gratuite**, **en français**, d'introduction à la finance.

Parcours utilisateur :
1. L'utilisateur suit un **parcours d'intro** (obligatoire).
2. Une fois l'intro terminée, **3 voies** se débloquent, chacune un parcours à part entière : **Banque**, **Marché**, **Entreprise**.
3. À la fin de chaque voie, l'utilisateur débloque une **fiche de synthèse** fabriquée à
   partir du contenu de la voie, qu'il peut emporter. Un livre partenaire pourra s'y
   ajouter plus tard, sans prix ni incitation à l'achat.
4. L'app capture l'**email** de l'utilisateur (à un moment du flow, ex: fin de parcours) pour le prévenir des sorties de livres.

Le système est **générique** : l'intro et les 3 voies sont toutes des instances d'un même concept de `Parcours`. Aucune logique spécifique câblée en dur par voie — tout vient du contenu.

## 2. Décisions de conception actées

| Sujet | Décision | Raison |
|---|---|---|
| Backend | **Supabase** | Héberge le contenu (éditable sans redeploy) + capture d'email. Cohérent avec le projet Football Analyzer déjà sur Supabase. |
| Authentification | **Aucune** — utilisateur anonyme | Pas de friction à l'entrée. Progression stockée localement sur l'appareil. |
| Sync multi-appareil | **Hors scope pour l'instant** | Découle du choix "anonyme". Extension possible plus tard via un ID anonyme persistant synchronisé côté Supabase. |
| Codes promo | **Code fixe partagé par livre**, embarqué dans le contenu du parcours (`recompense.code`) | Simplicité : aucune logique serveur de distribution/attribution nécessaire. |
| Contenu des leçons | **Externalisé** (Supabase, table `jsonb`), avec fallback JSON local bundlé pour offline/dev | Permet d'éditer/ajouter du contenu sans passer par une release app store. |
| Formules de calcul (simulateurs) | **Code**, pas JSON | C'est de la logique métier, pas de l'éditorial — voir §4. |

## 3. Stack technique

- **React Native + Expo** (Expo Router pour la navigation file-based)
- **TypeScript**
- **Zustand** + middleware `persist` (AsyncStorage) pour l'état de progression
- **Supabase** (`@supabase/supabase-js`) :
  - contenu des parcours (table `parcours`, colonne `jsonb`)
  - capture d'email (table `email_subscribers`, insert public via RLS, pas de lecture publique)

## 4. Architecture de dossiers

```
app/                          # Expo Router (écrans)
  _layout.tsx
  index.tsx                   # entrée : redirige vers parcours/intro si non terminé, sinon vers parcours/
  parcours/
    index.tsx                 # choix des 3 voies (débloqué une fois "intro" terminé)
    [parcoursId]/              # "intro" | "banque" | "marche" | "entreprise" — même route pour tous
      index.tsx                # sommaire du parcours
      etape/[etapeId].tsx      # écran d'étape (rendu selon le type)
      reward.tsx                # reveal du code promo (absent/no-op pour "intro")

src/
  domain/parcours/            # logique métier pure (types, calcul de progression)
    types.ts
    progress.ts
    simulateurs/              # moteur de calcul des "exemple" (interet_compose, mensualite_credit…)
  data/
    content/                  # JSON de secours bundlés (offline/dev)
    remote/
      supabaseClient.ts
      contentRepository.ts    # fetch + cache + fallback local
      emailRepository.ts
  state/
    progressStore.ts          # Zustand + persist (AsyncStorage)
    contentStore.ts
  hooks/
  components/
    etape/                    # un composant de rendu par type d'étape (Lecon, Quiz, Exemple, Situation)
  constants/

supabase/
  migrations/
  seed/                       # JSON de départ pour intro/banque/marche/entreprise

PROJECT.md
```

Une seule arborescence de routes pour l'intro et les 3 voies (`parcours/[parcoursId]/...`), pas de système séparé pour l'onboarding : l'intro est un `Parcours` comme les autres (§5), rendue par les mêmes composants d'étape. La seule différence entre "intro" et une "voie" est gérée en logique (redirection dans `app/index.tsx`, absence de `recompense`), pas en routing.

## 5. Modèle de données

### Parcours

```ts
interface Parcours {
  id: string;                    // "intro" | "banque" | "marche" | "entreprise" | "quotidien"
  titre: string;
  description: string;
  ordre: number;
  type: "intro" | "voie";
  prerequisParcoursId?: string;  // les 3 voies dépendent de "intro"
  etapes: Etape[];
  recompense?: {
    livre: { titre: string; urlAmazon: string; imageUrl?: string };
    code: string;
  };
  version: number;               // invalide le cache local à chaque édition de contenu
  chiffresVerifiesLe?: string;   // "AAAA-MM-JJ", affiché dans À propos et le Bilan
  sources?: { libelle: string; url: string }[]; // https uniquement, vérifié au chargement
}
```

### Étape (union discriminée par `type`)

```ts
type Etape = EtapeLecon | EtapeQuiz | EtapeExemple | EtapeSituation;

interface EtapeBase {
  id: string;
  ordre: number;
  titre: string;
  contenu: ContenuBloc[];  // corps générique : texte d'intro/explication, commun à tous les types
}

interface EtapeLecon extends EtapeBase {
  type: "lecon";
}

interface EtapeQuiz extends EtapeBase {
  type: "quiz";
  quiz: { questions: QuizQuestion[]; seuilReussite: number };
}

interface EtapeExemple extends EtapeBase {
  type: "exemple";
  simulateur: Simulateur;
}

interface EtapeSituation extends EtapeBase {
  type: "situation";
  situation: Situation;
}

type ContenuBloc =
  | { type: "texte"; texte: string }
  | { type: "image"; url: string; legende?: string }
  | { type: "exemple_texte"; titre: string; texte: string }
  | { type: "definition"; terme: string; texte: string };

interface QuizQuestion {
  id: string;
  question: string;
  choix: string[];
  bonneReponseIndex: number;
}
```

### Condition de complétion par type d'étape

Le modèle n'a de seuil explicite (`seuilReussite`) que pour `quiz`. Les autres types se complètent selon une règle propre à leur nature, à implémenter dans `src/domain/parcours/progress.ts` :

| Type | Étape marquée complète quand… |
|---|---|
| `lecon` | l'utilisateur a lu le contenu et appuyé sur "continuer" |
| `quiz` | le score obtenu ≥ `seuilReussite` (retry possible sinon) |
| `exemple` | l'utilisateur a manipulé au moins une `SimulateurVariable` (pas juste défilé) puis appuyé sur "continuer" — l'interaction est ce qui fait la valeur pédagogique, donc elle est requise |
| `situation` | l'utilisateur a sélectionné un `choix` et vu le feedback associé, puis appuyé sur "continuer" — n'importe quel choix complète l'étape, il n'y a pas de seuil de réussite car `qualite` est nuancée, pas pass/fail |

### Exemple chiffré interactif (`exemple`)

```ts
interface Simulateur {
  formule: "interet_compose" | "mensualite_credit"; // clé résolue par le moteur de calcul (code) — union fermée, chaque formule = un update de code
  variables: SimulateurVariable[];  // inputs manipulables par l'utilisateur
  resultat: { label: string; unite?: string };
}

interface SimulateurVariable {
  id: string;            // clé passée à la formule
  label: string;
  unite?: string;         // "€", "%", "mois"…
  min: number;
  max: number;
  pas: number;
  valeurParDefaut: number;
}
```

> La formule de calcul est implémentée en code (`src/domain/parcours/simulateurs/`), pas en JSON : c'est de la logique métier réutilisable, pas de l'éditorial. Le contenu éditable sans redeploy porte sur le *choix* des variables/bornes/labels pour une formule existante. Ajouter une nouvelle famille de calcul nécessite un code update ; ajouter un nouvel exemple réutilisant une formule existante ne nécessite qu'une édition Supabase.

### Mise en situation (`situation`)

```ts
interface Situation {
  contexte: string;       // "Un client veut épargner sur 2 ans…"
  choix: SituationChoix[];
}

interface SituationChoix {
  id: string;
  texte: string;           // "Livret A"
  feedback: string;         // explication affichée après sélection
  qualite: "recommande" | "acceptable" | "deconseille"; // pas de vrai/faux binaire
}
```

### Progression (locale, Zustand + persist)

```ts
interface ProgressionParcours {
  parcoursId: string;
  etapesCompletees: string[];
  statut: "non_commence" | "en_cours" | "termine";
  dateDebut?: string;
  dateFin?: string;
  derniereActivite?: string;     // sert à choisir la voie proposée par « Reprendre »
  recompenseDebloquee: boolean;
}

interface ProgressionGlobale {
  parcours: Record<string, ProgressionParcours>; // keyed by parcoursId
  emailCapture?: {
    email: string;
    dateCapture: string;
  };
}
```

## 6. Extensions futures (hors scope initial)

- Sync multi-appareil via ID anonyme persistant côté Supabase (si le besoin apparaît sans vouloir imposer un login).
- Nouveaux types d'étapes (le modèle en union discriminée permet d'en ajouter sans casser l'existant).
- Codes promo uniques par utilisateur si la réutilisation/partage du code fixe devient un problème.
- Notifications locales pour entretenir la série (le défi du jour est déjà là, il ne manque
  que le rappel).
- Mesure d'usage anonyme (quelles étapes sont abandonnées, quels outils sont ouverts),
  à n'envisager qu'avec un consentement explicite.
- Mode maintenance piloté depuis Supabase, pour afficher un message si le contenu distant
  doit être retiré en urgence.

## 7. Statut

Phase actuelle : **application complète et navigable de bout en bout**.

Fait :
- Schéma Supabase (`parcours`, `email_subscribers`) + RLS, contrainte d'unicité sur l'email.
- Contenu des 5 parcours écrit et publié (Supabase + fallback JSON bundlé identique) :
  intro (20 étapes, 5 sessions), banque (40, 9 sessions), marché (38, 9), entreprise (36, 9),
  quotidien (48, 12) — difficulté croissante (`src/constants/sessions.ts`). Chaque leçon se
  ferme sur un « À retenir », chaque session sur un quiz. **182 étapes, 44 sessions.**
- 6 types d'étape : `lecon`, `quiz`, `exemple` (simulateur), `situation`, `exercice`
  (problèmes chiffrés ou vrai/faux) et `scenario` (étude de cas : cinq décisions
  enchaînées, conséquences et bilan — une par voie).
- 11 formules de simulateur (`src/domain/parcours/simulateurs/`), chacune documentant ses
  variables dans `VARIABLES_PAR_FORMULE` — ce que vérifient les tests de contenu. Chaque
  simulateur trace sa **courbe en direct** : bouger un curseur déforme la courbe
  (`CourbeSimulateur`, échantillonnage dans `simulateurs/courbe.ts`).
- 46 schémas animés dans les leçons (`src/components/schema/`) : courbes qui se tracent,
  barres qui se remplissent, anneau de répartition, enchaînement de flux. Décrits en
  données, dessinés par le code, rejouables au tap.
- **Validation du contenu distant** (`src/domain/parcours/validation.ts`) : rien venant du
  réseau ou du cache n'atteint l'écran sans passer un validateur exhaustif (types d'étape
  et de bloc, index de bonne réponse dans les bornes, variables de simulateur conformes à
  la formule, séries de schéma cohérentes, sources en https). Un cache invalide est
  supprimé, un distant invalide est ignoré au profit du bundle. Un test garantit que le
  contenu embarqué passe sa propre validation.
- **Filet anti-crash** (`src/components/ui/LimiteErreur.tsx`) : une erreur de rendu affiche
  un écran de secours qui propose de réessayer ou de vider le contenu téléchargé, et
  rappelle que la progression est intacte.
- **Reprise** (`src/domain/parcours/reprise.ts`) : une pastille « Reprendre » mène
  directement à la première étape non validée de la voie la plus récemment travaillée.
- **Chiffres et sources** : chaque parcours porte une date de vérification
  (`chiffresVerifiesLe`) et ses sources officielles, affichées dans À propos et rappelées
  dans le Bilan (`src/domain/parcours/sources.ts`).
- **Glossaire global** (`app/glossaire.tsx`) : 129 termes issus des leçons et des glossaires
  de session, index A–Z, recherche insensible aux accents, doublons fusionnés sur la
  définition la plus complète (`src/domain/glossaire.ts`).
- « Mes chiffres » (`app/mes-chiffres.tsx`) : revenu, loyer, épargne saisis une fois et
  gardés sur le téléphone. Ils personnalisent le départ des simulateurs et permettent
  d'afficher les montants en heures de travail (`domain/parcours/profilFinancier.ts`).
- Révision des erreurs : les questions manquées sont mémorisées, ressortent en priorité
  dans le défi du jour, et se retravaillent dans `app/revision.tsx`.
- Bilan (`app/bilan.tsx`) : « ce que tu sais maintenant », reconstruit à partir des blocs
  « À retenir » et des définitions des étapes réellement validées.
- Moteur de progression, store Zustand persisté, repositories (contenu avec cache/version,
  email). Le bundle l'emporte quand sa version dépasse celle du distant.
- **Confidentialité** : politique complète écrite sur ce que l'app fait réellement. Le
  texte n'existe qu'une fois (`src/constants/confidentialite.json`) et alimente DEUX
  sorties : l'écran `app/confidentialite.tsx` et les pages web `docs/index.html` (accueil et support) et `docs/confidentialite.html`,
  régénérée par `npm run site`. Un texte juridique recopié à deux endroits
  diverge en quelques mois, et un test vérifie que la page publiée reprend mot pour mot
  chaque paragraphe de l'application. La page est autonome, sans script ni ressource
  externe, et suit le thème du système. Elle est atteignable
  depuis À propos et depuis l'encart email lui-même. L'encart porte une case de
  consentement décochée par défaut, sans laquelle le bouton d'envoi reste inerte, et rien
  dans l'application ne dépend de l'adresse. Les emails sont hébergés en Irlande, donc
  dans l'Union européenne.
- **Configuration de publication** : `app.json` porte le nom, l'identifiant de paquet,
  `userInterfaceStyle: "automatic"` (sans quoi le mode sombre ne pourrait jamais suivre le
  système), la déclaration d'exemption de chiffrement, et un splash déclinué clair/sombre.
  L'identifiant de paquet est `com.merliche.finance`, volontairement générique : il est
  figé dès la première soumission, alors que le nom affiché peut encore changer.
  `eas.json` définit trois profils de build. Icône, icône adaptative, splash et favicon
  sont générés aux couleurs de l'app, l'icône iOS étant sans canal alpha comme l'exige
  l'App Store.
- **Fiche de synthèse de fin de voie** (`domain/parcours/fiche.ts`, `FicheSyntheseVue`) :
  la récompense se fabrique à partir du contenu, il n'y a rien à rédiger pour qu'elle
  existe et elle suit le contenu quand il change. Elle rassemble les points clés et le
  vocabulaire par session, plus les bons réflexes et les pièges tirés des choix
  recommandés et déconseillés des mises en situation. Entre 45 et 66 points clés par voie.
  Un bouton l'exporte en texte brut, lisible tel quel dans une note ou un mail.
  La déduplication des termes se fait PAR SESSION : un même mot redéfini plus loin désigne
  souvent autre chose, et garder « la plus longue » ferait apparaître la mauvaise
  définition sous le mauvais titre.
- Le bloc du livre partenaire reste en place dans l'écran récompense, prêt à l'accueillir,
  mais ne s'affiche que si le contenu en déclare un. Le code s'y copie d'un tap
  (`expo-clipboard`). Jamais de prix, jamais « acheter » : c'est un supplément, pas la
  récompense.
- Engagement : XP, niveaux, série de jours, défi du jour, célébrations (dont une bannière
  « Niveau N atteint »), 44 badges — un par session —, calendrier d'activité et partage de
  progression dans le Profil. Chaque badge de la grille ouvre sa fiche (`FicheBadge`) :
  d'où il vient, ce qu'il récompense, et la condition exacte pour l'obtenir avec
  l'avancement de sa session. Un badge non obtenu y devient une consigne plutôt qu'un
  cadenas.
- Visuel : chemin façon Duolingo orienté bas → haut, départ et arrivée centrés (le tronc
  de l'arbre), fourche à quatre branches, thème par `parcoursId`, squelettes de chargement,
  transitions par type de navigation. Le calcul du chemin est mémoïsé (`VueChemin`), le
  rendu ne recalcule plus les positions à chaque frame.
- **Mode sombre** (`src/theme/palettes.ts`, `ModeCouleur.tsx`) : deux palettes complètes,
  un fournisseur au-dessus de la navigation, et un réglage à trois positions dans le Profil
  — Système, Clair, Sombre — enregistré avec la progression. Aucune couleur d'interface
  n'est plus écrite en dur : chaque feuille de style est une fabrique
  `creerStyles(couleurs)`, construite une fois par palette (`useStyles`), et les couleurs
  en ligne se lisent par `useCouleurs()`. Les voiles des parcours (`tint`, `tintFort`) sont
  DÉRIVÉS du mode plutôt qu'écrits deux fois, donc une nouvelle voie suit toute seule et
  les deux modes ne peuvent pas diverger. En sombre, une surface se détache en étant plus
  claire que son fond, pas en portant une ombre, et l'on évite le noir et le blanc purs.
- **Grammaire de mouvement partagée** (`src/theme/animation.ts`) : cinq durées, quatre
  courbes, trois ressorts, un décalage de cascade plafonné. Aucune durée ne s'écrit au cas
  par cas — c'est ce qui fait que deux écrans différents bougent de la même façon.
- **Bandeau commun à tous les écrans secondaires** (`EnteteEcran`) : dégradé en diagonale,
  trame de points, reflet qui passe de loin en loin, grande icône en filigrane, bouton de
  retour. Les en-têtes natifs sont masqués partout — une barre système claire au-dessus
  d'un contenu coloré coupait l'écran en deux. Chaque écran a sa teinte propre
  (`TEINTES_ECRAN`), toutes de la même famille profonde et peu saturée.
- **Ciel du chemin** (`CielParcours`) : le fond change avec l'altitude. En bas, au départ,
  il est clair et tiède ; en montant, deux voiles aux couleurs du parcours se révèlent l'un
  après l'autre et une grande lueur s'allume derrière le sommet. On sait où on en est sans
  lire un pourcentage, et l'arrivée se voit venir. Seules des opacités sont animées, donc
  tout suit le doigt côté natif ; le fond de base reste opaque en toute position.
- **Fond « aurore »** (`FondAnime`) : cinq nappes en dégradé radial (`Halo`) qui dérivent
  sur des périodes toutes différentes, glissent en parallaxe avec le défilement, et dont
  la palette se réchauffe à mesure que le parcours avance. Des particules montent lentement
  derrière le chemin (`Poussiere`). Tout passe par le driver natif : le fond ne coûte rien
  au thread JS pendant le défilement.
- **Chemin** : la portion parcourue est un câble plein — lueur large, dégradé du sombre au
  clair, filet de reflet ; la portion restante garde ses pointillés mais sur un sillon
  continu teinté du parcours, sans quoi elle disparaissait sur fond clair (c'était le cas
  de l'intro, dont presque tout le chemin est encore à faire) ; une comète
  (`CometeChemin`) remonte de temps à autre le trajet déjà fait, en suivant les courbes
  réelles (`echantillonnerChemin`) et à vitesse constante (`progressionCumulee`) ; un foyer
  de lumière en dégradé radial désigne l'étape en cours. Les nœuds sont des billes en
  dégradé avec reflet et lèvre d'ombre, l'étape en cours portant deux halos qui battent en
  décalé.
- **Interactions** : les fiches qui montent du bas (outil, comparateur, anecdote, session)
  se referment en tirant la barre du haut vers le bas (`FeuilleModale`) — le geste n'est
  capté que sur la barre, pas sur la feuille, pour ne pas entrer en conflit avec le
  défilement du contenu ; la barre et le fond restent tapables, donc le geste n'est jamais
  le seul moyen de sortir ; appui long sur un nœud pour un aperçu de l'étape — type, durée,
  XP, premières lignes — sans l'ouvrir (`ApercuEtape`) ; retour sur ressort à chaque appui
  (`AppuiRessort`) ; pastille flottante qui ramène à l'étape en cours dès qu'on s'en
  éloigne (`BoutonRetourEtape`, avec hystérésis pour ne pas clignoter) ; correction de quiz
  qui fait bondir la bonne réponse et secoue la mauvaise (`Reaction`) ; confettis sur les
  vrais paliers seulement, session ou parcours (`Confettis`) ; reflet qui traverse les
  bandeaux, le bouton principal et la barre de progression (`Reflet`).
- **Micro-interactions** : appui sur ressort partout où l'on tape une carte
  (`AppuiRessort`, avec un ressort de retour moins amorti que celui de l'enfoncement) ;
  bond ou secousse à la correction d'un quiz, d'un exercice et au choix d'une mise en
  situation (`Reaction`) ; squelettes de chargement traversés par une lumière, décalés les
  uns des autres (`Squelette`) ; compteurs qui montent au lieu de s'afficher.
- **Cartes de leçon** : définition à barre dégradée et contour teinté, exemple sur dégradé,
  liste à pastilles numérotées pleines, et « À retenir » qui ferme la leçon sur un dégradé
  sombre parcouru d'un reflet, ses points apparaissant l'un après l'autre.
- **Transitions cohérentes** : les écrans de parcours glissent latéralement, les écrans
  utilitaires montent du bas comme des panneaux. La direction dit à elle seule si on
  s'enfonce dans le contenu ou si on ouvre un outil par-dessus.
- **Taille de police du système respectée.** C'est le comportement par défaut de React
  Native et il n'est désactivé nulle part : un test parcourt toutes les sources pour s'en
  assurer. Six textes seulement portent un plafond (`PLAFOND_PASTILLE`,
  `PLAFOND_ETIQUETTE`), ceux qui vivent dans une boîte qui ne peut pas grandir — un numéro
  dans une pastille ronde, une lettre de réponse dans un carré. Agrandis sans limite, ils
  déborderaient, et le réglage d'accessibilité produirait l'inverse de ce qu'on cherche.
- **Mouvement réduit respecté** (`useMouvementReduit`) : le réglage d'accessibilité du
  système arrête toutes les animations décoratives — nappes, poussière, comète, reflets,
  confettis, ressorts, reflets, squelettes — et laisse les animations qui portent du sens. L'abonnement suit le
  réglage même s'il change pendant l'exécution.
- 120 éléments latéraux (calculateurs, comparateurs, saviez-vous, glossaires, badges),
  définis en données et rattachés à une session. Chaque rond porte un anneau d'aura à la
  couleur de sa catégorie et flotte très lentement, sur une phase qui lui est propre pour
  qu'aucun voisin ne monte en même temps. Ils occupent l'intérieur de la plage de
  leur session, jamais la hauteur exacte de son premier ou de son dernier nœud, et
  `ecarterDesBandes` les écarte des bannières et de la bulle « À suivre » en cherchant la
  place libre la plus proche — un simple décalage vers le bas les déposait dans l'obstacle
  suivant, ou hors de l'écran.
- Écrans Outils (bandeau graphite propre à la boîte à outils, avancement des outils
  débloqués, recherche plein texte, filtre par parcours, cartes portant l'icône de leur
  famille et un filet à la couleur de leur voie), Glossaire, Profil, Bilan, Révision,
  Mes chiffres, À propos + disclaimer.
- Mode test (`src/constants/modeTest.ts`) : tout accessible en `__DEV__`.
- 396 tests, 33 suites (`npx jest`), dont un jeu d'invariants sur le contenu embarqué
  (`src/data/content/__tests__/contenu.test.ts`) dérivé de `VOIES` — ajouter une voie sans
  la bundler fait échouer les tests —, six tests de rendu, un par type d'étape
  (`src/components/etape/__tests__/rendu.test.tsx`), cinq sur le chemin lui-même
  (`src/components/chemin/__tests__/vueChemin.test.tsx`), qui garantissent qu'il se monte
  et reste lisible malgré ses dégradés, ses SVG et ses animations natives, et quatre sur
  les fiches latérales, qui vérifient qu'il reste toujours un moyen annoncé de refermer,
  quatre sur l'écran Outils, et quinze sur les écrans secondaires — dont un invariant qui
  vérifie que chacun, état vide compris, offre un retour : les en-têtes natifs étant
  masqués, un écran sans bouton de retour serait un cul-de-sac (c'était le cas du Bilan
  vide, trouvé par ce test). Un autre invariant remonte, pour chaque texte blanc, jusqu'au
  premier ancêtre qui peint réellement derrière lui, et refuse qu'il s'agisse d'un fond
  clair opaque : c'est ce qui rendait les trois pastilles du Profil illisibles, blanc sur
  blanc, sans que rien dans le rendu ne le signale. Le même principe garde le mode sombre
  durable (`app/__tests__/modeSombre.test.tsx`) : quatre écrans sont montés réellement en
  sombre et aucune couleur propre au mode clair ne doit y apparaître, donc un composant
  ajouté plus tard avec une couleur en dur fait échouer la suite. Enfin, les palettes
  elles-mêmes sont testées (`src/theme/__tests__/palettes.test.ts`) : mêmes jetons de part
  et d'autre, et contrastes au-dessus des seuils AA — ce test a d'ailleurs révélé que le
  texte atténué et le texte tertiaire du mode CLAIR étaient sous les seuils depuis le
  début, et ils ont été assombris juste ce qu'il fallait.
- Tous les énoncés chiffrés se font de tête : aucun exercice ne demande de calculatrice.
  C'est une contrainte de rédaction du contenu, à tenir pour toute nouvelle question —
  les nombres se choisissent ronds, et un `indice` donne le chemin de calcul.

Reste à faire avant publication :
- **Publier la politique de confidentialité sur une page web.** Le texte existe
  (`src/constants/confidentialite.ts`) et l'écran `app/confidentialite.tsx` l'affiche ;
  Apple et Google exigent en plus une adresse publique atteignable sans installer l'app.
  C'est fait : GitHub Pages sert le dossier `docs/`, avec une page d'accueil qui tient
  lieu d'adresse de support et la politique.
- **Renseigner la fiche du magasin** : description, captures (iPhone 6,7" et 6,5"),
  catégorie, classification d'âge, adresse de support, et la déclaration de collecte de
  données (« adresse email », finalité marketing, liée à l'identité).
- **Première compilation et vérification sur appareil réel.** Aucune build n'a jamais été
  produite : tout n'a été validé que par le bundler Metro, `expo-doctor` (21/21) et les
  tests de rendu. Une première compilation EAS révèle souvent des choses qu'aucun test
  JavaScript ne voit — polices, icônes, permissions, plugins.
- Le **mode test** (`ACTIVER_MODE_TEST`) est désormais à `false` : l'application se
  comporte en développement comme chez un utilisateur, verrous compris. Le repasser à
  `true` rouvre tout le contenu sans progression, ce qui reste pratique pour relire une
  session précise ; le garde-fou `&& __DEV__` l'empêche de toute façon d'exister dans une
  build de distribution.
