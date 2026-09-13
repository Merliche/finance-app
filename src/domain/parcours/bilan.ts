// « Ce que tu sais maintenant » : le résumé de cours reconstruit à partir des blocs
// « À retenir » des étapes déjà validées. Rien n'est écrit spécialement pour cet écran —
// le contenu existe déjà dans les leçons, il est simplement rassemblé.
import type { Etape, Parcours, ProgressionParcours } from "./types";
import { sessionDeEtape } from "../../constants/sessions";

export interface SessionBilan {
  numero: number;
  points: string[];
  /** Termes définis dans les leçons de la session, pour le mini-glossaire du bilan. */
  termes: string[];
}

export interface ParcoursBilan {
  parcoursId: string;
  titre: string;
  nbEtapesValidees: number;
  nbEtapesTotal: number;
  sessions: SessionBilan[];
}

function pointsDe(etape: Etape): string[] {
  return etape.contenu.flatMap((bloc) => (bloc.type === "a_retenir" ? bloc.points : []));
}

function termesDe(etape: Etape): string[] {
  return etape.contenu.flatMap((bloc) => (bloc.type === "definition" ? [bloc.terme] : []));
}

/**
 * Bilan d'un parcours : les points à retenir et les termes définis, groupés par session,
 * en ne retenant que ce qui provient d'étapes réellement validées. Une session dont
 * aucune étape n'est faite n'apparaît pas — le bilan ne promet jamais un savoir qu'on
 * n'a pas encore traversé.
 */
export function bilanDuParcours(parcours: Parcours, progression: ProgressionParcours | undefined): ParcoursBilan {
  const validees = new Set(progression?.etapesCompletees ?? []);
  const parSession = new Map<number, SessionBilan>();

  for (const etape of parcours.etapes.slice().sort((a, b) => a.ordre - b.ordre)) {
    if (!validees.has(etape.id)) continue;
    const numero = sessionDeEtape(etape);
    if (numero === null) continue;

    const session = parSession.get(numero) ?? { numero, points: [], termes: [] };
    session.points.push(...pointsDe(etape));
    session.termes.push(...termesDe(etape));
    parSession.set(numero, session);
  }

  return {
    parcoursId: parcours.id,
    titre: parcours.titre,
    nbEtapesValidees: parcours.etapes.filter((etape) => validees.has(etape.id)).length,
    nbEtapesTotal: parcours.etapes.length,
    sessions: [...parSession.values()]
      .filter((session) => session.points.length > 0 || session.termes.length > 0)
      .sort((a, b) => a.numero - b.numero),
  };
}

/** Nombre total de points retenus, tous parcours confondus — le chiffre d'en-tête du bilan. */
export function compterPoints(bilans: ParcoursBilan[]): number {
  return bilans.reduce((total, bilan) => total + bilan.sessions.reduce((n, session) => n + session.points.length, 0), 0);
}

/** Idem pour les termes définis, dédoublonnés : un même mot revient dans plusieurs voies. */
export function compterTermes(bilans: ParcoursBilan[]): number {
  const termes = new Set<string>();
  for (const bilan of bilans) {
    for (const session of bilan.sessions) {
      for (const terme of session.termes) termes.add(terme.toLocaleLowerCase("fr"));
    }
  }
  return termes.size;
}
