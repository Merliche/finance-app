# Finance App — Document de référence

Ce document cadre les fondations du projet avant tout code. À tenir à jour au fil des décisions.

## 1. Vision

App mobile **gratuite**, **en français**, d'introduction à la finance.

Parcours utilisateur :
1. L'utilisateur suit un **parcours d'intro** (obligatoire).
2. Une fois l'intro terminée, **3 voies** se débloquent, chacune un parcours à part entière : **Banque**, **Marché**, **Entreprise**.
3. À la fin de chaque voie, l'utilisateur débloque un **code promo** pour un livre correspondant (vendu sur Amazon, lien externe).
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
  id: string;                    // "intro" | "banque" | "marche" | "entreprise"
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
- Nouvelles formules de simulateur au-delà de `interet_compose` / `mensualite_credit`.
- Codes promo uniques par utilisateur si la réutilisation/partage du code fixe devient un problème.

## 7. Statut

Phase actuelle : **cadrage**, aucun code écrit. Prochaine étape à discuter : scaffolding Expo + mise en place Supabase (schéma + seed du contenu d'intro).
