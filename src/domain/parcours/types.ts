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
  /**
   * Supplément de fin de voie, quand un livre partenaire existe. La récompense elle-même
   * n'est PAS ici : c'est la fiche de synthèse, fabriquée à partir du contenu de la voie
   * (voir `domain/parcours/fiche.ts`). Toute voie terminée en donne une, sans rien à
   * renseigner. Ce champ n'existe que pour ajouter un livre plus tard, sans prix ni
   * incitation à l'achat.
   */
  recompense?: {
    livre: { titre: string; urlAmazon: string; imageUrl?: string };
    /** Code de réduction associé au livre. Sans livre, il n'a pas d'objet. */
    code: string;
  };
  /**
   * Date (AAAA-MM-JJ) à laquelle les montants, taux et barèmes du parcours ont été
   * vérifiés. Le contenu cite des centaines de chiffres réglementaires (plafonds de
   * livrets, barème de l'impôt, taux de remboursement) qui périment : une app de finance
   * qui affiche un barème d'il y a trois ans sans le dire trompe son lecteur.
   */
  chiffresVerifiesLe?: string;
  /** Sources officielles permettant de vérifier ces chiffres, affichées dans « À propos ». */
  sources?: SourceParcours[];
  version: number; // invalide le cache local à chaque édition de contenu
}

export interface SourceParcours {
  libelle: string;
  url: string;
}

/** Étape d'un parcours — union discriminée par `type`. */
export type Etape = EtapeLecon | EtapeQuiz | EtapeExemple | EtapeSituation | EtapeExercice | EtapeScenario;

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

export interface EtapeExercice extends EtapeBase {
  type: "exercice";
  exercice: Exercice;
}

export interface EtapeScenario extends EtapeBase {
  type: "scenario";
  scenario: Scenario;
}

/** Bloc de contenu générique utilisé dans `EtapeBase.contenu`. */
// Il n'y a volontairement pas de bloc « image » : l'app n'embarque aucune illustration,
// et un bloc pointant vers une URL distante casserait la lecture hors ligne. Les schémas
// (bloc `schema`) jouent ce rôle, en mieux : ils sont vectoriels, animés et thémés.
export type ContenuBloc =
  | { type: "texte"; texte: string }
  | { type: "exemple_texte"; titre: string; texte: string }
  | { type: "definition"; terme: string; texte: string }
  | { type: "liste"; titre?: string; items: string[] } // étapes numérotées, 2 à 6 items
  | { type: "schema"; schema: Schema } // schéma animé (voir ci-dessous)
  | { type: "a_retenir"; points: string[] }; // récapitulatif de fin de leçon, 2 à 4 points

/**
 * Schéma animé inséré dans une leçon — décrit en données, dessiné par le code
 * (src/components/schema). Les couleurs ne sont jamais dans le contenu : chaque série
 * porte un rôle (`principal`, `secondaire`, `attenue`) résolu par le thème du parcours.
 */
export type Schema =
  | {
      kind: "courbes";
      titre?: string;
      legende?: string;
      /** Étiquettes de l'axe horizontal (une par point ; les séries doivent avoir la même longueur). */
      axeX: string[];
      unite?: string;
      series: { label: string; role?: RoleSerie; points: number[] }[];
    }
  | {
      kind: "barres";
      titre?: string;
      legende?: string;
      unite?: string;
      barres: { label: string; valeur: number; role?: RoleSerie }[];
    }
  | {
      kind: "repartition";
      titre?: string;
      legende?: string;
      /** Parts d'un tout (valeurs relatives : le code normalise à 100 %). */
      parts: { label: string; valeur: number }[];
    }
  | {
      kind: "flux";
      titre?: string;
      legende?: string;
      /** Enchaînement de cases reliées par des flèches, révélées une à une. */
      etapes: { label: string; detail?: string }[];
    };

export type RoleSerie = "principal" | "secondaire" | "attenue";

/** Exercice : une suite de petits problèmes à résoudre (étape `exercice`). */
export interface Exercice {
  items: ExerciceItem[];
  seuilReussite: number; // score minimal en % pour valider
}

/**
 * Étude de cas narrative : plusieurs décisions qui s'enchaînent sur la vie d'une même
 * personne. Contrairement à une `situation`, isolée, chaque choix est suivi de sa
 * conséquence et l'histoire continue — c'est ce qui permet de faire sentir qu'une
 * décision financière en prépare une autre.
 */
export interface Scenario {
  /** Mise en place, avant la première décision. */
  intro: string;
  decisions: ScenarioDecision[];
  /**
   * Bilans possibles, du meilleur au moins bon. Le premier dont le `seuil` (en % des
   * points possibles) est atteint est affiché ; le dernier doit donc avoir un seuil de 0.
   */
  bilans: { seuil: number; titre: string; texte: string }[];
}

export interface ScenarioDecision {
  id: string;
  /** Où en est l'histoire au moment de choisir. */
  situation: string;
  options: ScenarioOption[];
}

export interface ScenarioOption {
  id: string;
  texte: string;
  /** Ce qui arrive ensuite — c'est là que se trouve l'enseignement. */
  consequence: string;
  /** 0, 1 ou 2 : il n'y a pas de bonne réponse unique, seulement des choix plus ou moins coûteux. */
  points: number;
}

export type ExerciceItem =
  | {
      id: string;
      type: "nombre";
      enonce: string;
      reponse: number;
      /** Écart absolu accepté autour de la réponse (arrondis, approximations mentales). */
      tolerance: number;
      unite?: string;
      indice?: string;
      explication: string;
    }
  | {
      id: string;
      type: "vrai_faux";
      enonce: string;
      reponse: boolean;
      explication: string;
    };

export interface QuizQuestion {
  id: string;
  question: string;
  choix: string[];
  bonneReponseIndex: number;
}

/** Formules disponibles — chacune documente ses variables dans src/domain/parcours/simulateurs/. */
export type FormuleSimulateur =
  | "interet_compose"
  | "mensualite_credit"
  | "epargne_programmee"
  | "regle_72"
  | "pouvoir_achat"
  | "cout_total_credit"
  | "capacite_emprunt"
  | "rendement_locatif"
  | "point_mort"
  | "salaire_net"
  | "reste_a_vivre";

/** Exemple chiffré interactif (étape `exemple`). */
export interface Simulateur {
  formule: FormuleSimulateur; // clé résolue par le moteur de calcul (code, pas JSON)
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
  /** Dernière étape validée dans ce parcours — sert à savoir où reprendre au lancement. */
  derniereActivite?: string;
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
