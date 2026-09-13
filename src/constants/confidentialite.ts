// La politique de confidentialité de l'application.
//
// Le texte lui-même vit dans `confidentialite.json`, et ce module ne fait que le typer.
// Cette séparation a une raison précise : le même texte doit apparaître à l'identique dans
// l'écran « Confidentialité » ET sur la page web publique que réclament les magasins
// d'applications. Recopier un texte juridique à deux endroits le fait diverger en quelques
// mois, et c'est exactement le genre d'incohérence qu'un examen relève.
//
// La page web se régénère depuis ce même JSON avec `npm run confidentialite`. Un test
// vérifie que la page publiée correspond toujours au texte de l'application.
//
// Chaque affirmation décrit ce que le code fait vraiment. Si la collecte change, c'est ce
// fichier qu'il faut corriger en premier.
import donnees from "./confidentialite.json";

export interface SectionConfidentialite {
  titre: string;
  paragraphes: string[];
  /** Liste à puces, quand l'énumération est plus claire qu'un paragraphe. */
  points?: string[];
}

/** Date de dernière mise à jour, affichée en bas de la politique. */
export const CONFIDENTIALITE_MAJ: string = donnees.miseAJour;

export const CONFIDENTIALITE: SectionConfidentialite[] = donnees.sections;
