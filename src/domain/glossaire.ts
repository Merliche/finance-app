// Glossaire global : les 97 définitions dispersées dans les leçons et les 76 entrées des
// glossaires de session, rassemblées en un index alphabétique unique. Rien n'est écrit
// spécialement pour cet écran — tout le contenu existe déjà, il était simplement
// introuvable autrement qu'en relisant la leçon où le terme apparaissait.
import type { ElementLateral } from "./elementsLateraux/types";
import type { Parcours } from "./parcours/types";
import { sessionDeEtape } from "../constants/sessions";

export interface EntreeGlossaire {
  terme: string;
  definition: string;
  parcoursId: string;
  session: number;
}

export interface GroupeGlossaire {
  lettre: string;
  entrees: EntreeGlossaire[];
}

/** Sans accents ni casse : sert au tri, au regroupement par initiale et à la recherche. */
export function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Initiale de regroupement : la première lettre, ou « # » pour tout ce qui commence autrement. */
function initiale(terme: string): string {
  const premier = normaliser(terme).replace(/[^a-z0-9]/g, "").charAt(0);
  return premier >= "a" && premier <= "z" ? premier.toUpperCase() : "#";
}

/**
 * Toutes les entrées, dédoublonnées par terme. Un même mot (« BFR », « Franchise ») est
 * défini dans plusieurs voies : on garde la définition la plus longue, qui est presque
 * toujours la plus complète, et donc la plus utile hors de son contexte d'origine.
 */
export function construireGlossaire(parcours: Parcours[], elements: ElementLateral[]): EntreeGlossaire[] {
  const parTerme = new Map<string, EntreeGlossaire>();

  const ajouter = (entree: EntreeGlossaire) => {
    const cle = normaliser(entree.terme);
    const existante = parTerme.get(cle);
    if (!existante || entree.definition.length > existante.definition.length) parTerme.set(cle, entree);
  };

  for (const p of parcours) {
    for (const etape of p.etapes) {
      const session = sessionDeEtape(etape);
      if (session === null) continue;
      for (const bloc of etape.contenu) {
        if (bloc.type === "definition") {
          ajouter({ terme: bloc.terme, definition: bloc.texte, parcoursId: p.id, session });
        }
      }
    }
  }

  for (const element of elements) {
    if (element.type !== "glossaire") continue;
    for (const entree of element.entrees) {
      ajouter({ terme: entree.terme, definition: entree.definition, parcoursId: element.parcoursId, session: element.session });
    }
  }

  return [...parTerme.values()].sort((a, b) => normaliser(a.terme).localeCompare(normaliser(b.terme), "fr"));
}

/** Filtre sur le terme ET la définition : chercher « TAEG » doit aussi trouver « TAEG » cité ailleurs. */
export function filtrerGlossaire(entrees: EntreeGlossaire[], recherche: string): EntreeGlossaire[] {
  const termes = normaliser(recherche).split(/\s+/).filter(Boolean);
  if (termes.length === 0) return entrees;
  return entrees.filter((entree) => {
    const corpus = normaliser(`${entree.terme} ${entree.definition}`);
    return termes.every((terme) => corpus.includes(terme));
  });
}

/** Regroupe par initiale, en conservant l'ordre alphabétique des entrées. */
export function grouperParInitiale(entrees: EntreeGlossaire[]): GroupeGlossaire[] {
  const groupes: GroupeGlossaire[] = [];
  for (const entree of entrees) {
    const lettre = initiale(entree.terme);
    const dernier = groupes[groupes.length - 1];
    if (dernier && dernier.lettre === lettre) dernier.entrees.push(entree);
    else groupes.push({ lettre, entrees: [entree] });
  }
  return groupes;
}
