// Types du domaine "parcours" — voir PROJECT.md §5 pour le contexte et les décisions de conception.
// Types purs uniquement : aucune logique ici (le calcul de progression vit dans progress.ts).

/**
 * Un parcours de leçons : l'intro et les 3 voies (Banque, Marché, Entreprise)
 * sont toutes des instances de ce même type — aucune logique spécifique par voie.
 */
export interface Parcours {
  id: string; // "intro" | "banque" | "marche" | "entreprise"
  titre: string;
  description: string;
  ordre: number;
  type: "intro" | "voie";
  prerequisParcoursId?: string; // les 3 voies dépendent de "intro"
  etapes: Etape[];
  recompense?: {
    livre: { titre: string; urlAmazon: string; imageUrl?: string };
    code: string; // code promo fixe, partagé par livre
  };
  version: number; // invalide le cache local à chaque édition de contenu
}

/** Étape d'un parcours — union discriminée par `type`. */
export type Etape = EtapeLecon | EtapeQuiz | EtapeExemple | EtapeSituation;

interface EtapeBase {
  id: string;
  ordre: number;
  titre: string;
  contenu: ContenuBloc[]; // corps générique : texte d'intro/explication, commun à tous les types
}

export interface EtapeLecon extends EtapeBase {
  type: "lecon";
}

export interface EtapeQuiz extends EtapeBase {
  type: "quiz";
  quiz: { questions: QuizQuestion[]; seuilReussite: number };
}

export interface EtapeExemple extends EtapeBase {
  type: "exemple";
  simulateur: Simulateur;
}

export interface EtapeSituation extends EtapeBase {
  type: "situation";
  situation: Situation;
}

/** Bloc de contenu générique utilisé dans `EtapeBase.contenu`. */
export type ContenuBloc =
  | { type: "texte"; texte: string }
  | { type: "image"; url: string; legende?: string }
  | { type: "exemple_texte"; titre: string; texte: string }
  | { type: "definition"; terme: string; texte: string };

export interface QuizQuestion {
  id: string;
  question: string;
  choix: string[];
  bonneReponseIndex: number;
}

/** Exemple chiffré interactif (étape `exemple`). */
export interface Simulateur {
  formule: "interet_compose" | "mensualite_credit"; // clé résolue par le moteur de calcul (code, pas JSON)
  variables: SimulateurVariable[]; // inputs manipulables par l'utilisateur
  resultat: { label: string; unite?: string };
}

export interface SimulateurVariable {
  id: string; // clé passée à la formule
  label: string;
  unite?: string; // "€", "%", "mois"…
  min: number;
  max: number;
  pas: number;
  valeurParDefaut: number;
}

/** Mise en situation type conseiller (étape `situation`). */
export interface Situation {
  contexte: string; // "Un client veut épargner sur 2 ans…"
  choix: SituationChoix[];
}

export interface SituationChoix {
  id: string;
  texte: string; // "Livret A"
  feedback: string; // explication affichée après sélection
  qualite: "recommande" | "acceptable" | "deconseille"; // pas de vrai/faux binaire
}

/** Progression locale de l'utilisateur sur un parcours donné. */
export interface ProgressionParcours {
  parcoursId: string;
  etapesCompletees: string[];
  statut: "non_commence" | "en_cours" | "termine";
  dateDebut?: string;
  dateFin?: string;
  recompenseDebloquee: boolean;
}

/** État de progression global, persisté (Zustand + AsyncStorage). */
export interface ProgressionGlobale {
  parcours: Record<string, ProgressionParcours>; // keyed by parcoursId
  emailCapture?: {
    email: string;
    dateCapture: string;
  };
}
