// La fiche de synthèse remise à la fin d'une voie : tout ce que la voie a enseigné,
// rassemblé en un document qu'on relit en dix minutes.
//
// Rien n'est écrit spécialement pour elle. Les points clés viennent des blocs « À
// retenir » qui ferment chaque leçon, le vocabulaire des définitions, et les réflexes des
// mises en situation — le choix recommandé devient un geste à faire, le choix déconseillé
// un piège à éviter. C'est la contrepartie d'un contenu structuré : une récompense qui se
// fabrique toute seule, et qui suit le contenu quand il change.
import type { Etape, Parcours } from "./types";
import { sessionDeEtape } from "../../constants/sessions";

export interface DefinitionFiche {
  terme: string;
  texte: string;
}

export interface SectionFiche {
  session: number;
  /** Titre de la session, fourni par l'appelant (c'est de la présentation, pas du contenu). */
  titre?: string;
  points: string[];
  definitions: DefinitionFiche[];
}

export interface ConseilFiche {
  session: number;
  /** La situation, en une phrase : le contexte de la mise en situation. */
  contexte: string;
  /** Le geste lui-même : le choix recommandé, ou celui à éviter. */
  geste: string;
  /** Pourquoi : le retour écrit pour ce choix. */
  raison: string;
}

export interface FicheSynthese {
  parcoursId: string;
  titre: string;
  nbSessions: number;
  nbPoints: number;
  nbDefinitions: number;
  sections: SectionFiche[];
  /** Les bons gestes, tirés des choix recommandés des mises en situation. */
  reflexes: ConseilFiche[];
  /** Les erreurs, tirées des choix déconseillés. */
  pieges: ConseilFiche[];
  chiffresVerifiesLe?: string;
}

/** Sans accents ni casse : deux définitions du même terme ne doivent pas coexister. */
function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

function pointsDe(etape: Etape): string[] {
  return etape.contenu.flatMap((bloc) => (bloc.type === "a_retenir" ? bloc.points : []));
}

function definitionsDe(etape: Etape): DefinitionFiche[] {
  return etape.contenu.flatMap((bloc) =>
    bloc.type === "definition" ? [{ terme: bloc.terme, texte: bloc.texte }] : []
  );
}

/**
 * Construit la fiche d'un parcours entier. Contrairement au bilan, elle ne dépend pas de
 * la progression : on ne l'obtient qu'en ayant terminé la voie, donc tout a été traversé.
 *
 * `titreSession` est injecté plutôt qu'importé : les libellés de session sont de la
 * présentation, et ce module doit rester testable sans eux.
 */
export function construireFiche(
  parcours: Parcours,
  titreSession?: (session: number) => string | undefined
): FicheSynthese {
  const parSession = new Map<number, SectionFiche>();
  const reflexes: ConseilFiche[] = [];
  const pieges: ConseilFiche[] = [];
  /** Termes déjà définis, PAR SESSION : voir le commentaire sur la déduplication. */
  const termesVus = new Map<number, Map<string, DefinitionFiche>>();

  for (const etape of parcours.etapes.slice().sort((a, b) => a.ordre - b.ordre)) {
    const session = sessionDeEtape(etape);
    if (session === null) continue;

    const section = parSession.get(session) ?? {
      session,
      titre: titreSession?.(session),
      points: [],
      definitions: [],
    };

    section.points.push(...pointsDe(etape));

    // La déduplication se fait À L'INTÉRIEUR d'une session, jamais sur toute la fiche.
    // Un même mot peut être redéfini dans une session plus loin, et c'est alors une autre
    // notion : « cotisations sociales » désigne un prélèvement sur salaire dans la session
    // sur la fiche de paie, et un prélèvement sur chiffre d'affaires dans celle sur les
    // indépendants. Garder « la plus longue » ferait apparaître la seconde sous le titre
    // de la première, à contresens.
    const dejaVus = termesVus.get(session) ?? new Map<string, DefinitionFiche>();
    for (const definition of definitionsDe(etape)) {
      const cle = normaliser(definition.terme);
      const connue = dejaVus.get(cle);
      if (connue) {
        // Seule la définition est remplacée, jamais l'intitulé : le terme est un titre, et
        // il doit garder la forme sous laquelle le lecteur l'a vu la première fois.
        if (definition.texte.length > connue.texte.length) connue.texte = definition.texte;
        continue;
      }
      const retenue = { ...definition };
      dejaVus.set(cle, retenue);
      section.definitions.push(retenue);
    }
    termesVus.set(session, dejaVus);

    if (etape.type === "situation") {
      for (const choix of etape.situation.choix) {
        const conseil: ConseilFiche = {
          session,
          contexte: etape.titre,
          geste: choix.texte,
          raison: choix.feedback,
        };
        if (choix.qualite === "recommande") reflexes.push(conseil);
        if (choix.qualite === "deconseille") pieges.push(conseil);
      }
    }

    parSession.set(session, section);
  }

  const sections = [...parSession.values()]
    .filter((section) => section.points.length > 0 || section.definitions.length > 0)
    .sort((a, b) => a.session - b.session);

  return {
    parcoursId: parcours.id,
    titre: parcours.titre,
    nbSessions: sections.length,
    nbPoints: sections.reduce((total, section) => total + section.points.length, 0),
    nbDefinitions: sections.reduce((total, section) => total + section.definitions.length, 0),
    sections,
    reflexes,
    pieges,
    chiffresVerifiesLe: parcours.chiffresVerifiesLe,
  };
}

/**
 * La fiche en texte brut, pour la partager ou se l'envoyer. Le partage système n'accepte
 * que du texte : autant qu'il soit lisible tel quel dans une note ou un mail, plutôt
 * qu'un résumé appauvri qui obligerait à rouvrir l'application.
 */
export function ficheEnTexte(fiche: FicheSynthese): string {
  const lignes: string[] = [`FICHE DE SYNTHÈSE — ${fiche.titre.toLocaleUpperCase("fr")}`, ""];
  lignes.push(`${fiche.nbPoints} points clés · ${fiche.nbDefinitions} termes · ${fiche.nbSessions} sessions`, "");

  for (const section of fiche.sections) {
    lignes.push(`── Session ${section.session}${section.titre ? ` · ${section.titre}` : ""}`);
    for (const point of section.points) lignes.push(`• ${point}`);
    for (const definition of section.definitions) lignes.push(`  ${definition.terme} : ${definition.texte}`);
    lignes.push("");
  }

  if (fiche.reflexes.length > 0) {
    lignes.push("── Les bons réflexes");
    for (const reflexe of fiche.reflexes) lignes.push(`• ${reflexe.geste}`);
    lignes.push("");
  }

  if (fiche.pieges.length > 0) {
    lignes.push("── Les pièges à éviter");
    for (const piege of fiche.pieges) lignes.push(`• ${piege.geste}`);
    lignes.push("");
  }

  if (fiche.chiffresVerifiesLe) {
    lignes.push(`Chiffres vérifiés le ${fiche.chiffresVerifiesLe}.`);
  }
  lignes.push("Contenu éducatif — ne constitue pas un conseil en investissement.");

  return lignes.join("\n");
}
