// Validation d'un parcours reçu de Supabase, avant de le laisser atteindre l'écran.
//
// Le contenu est éditable en base sans passer par une release : c'est la force de
// l'architecture (voir PROJECT.md §2) et son point de rupture. Une virgule mal placée
// dans une édition SQL, un index de bonne réponse hors bornes, et l'app planterait chez
// tous les utilisateurs à la fois, sans possibilité de correction côté client.
//
// Cette fonction vérifie exactement les invariants dont dépend le rendu. Ce qu'elle
// rejette part au repli (cache, puis JSON embarqué) — une édition ratée devient un
// non-événement au lieu d'une panne générale. Elle est volontairement indépendante des
// types TypeScript : à l'exécution, `data.contenu` n'est qu'un objet inconnu.
import type { Etape, Parcours } from "./types";
import { VARIABLES_PAR_FORMULE } from "./simulateurs";

export type ResultatValidation = { ok: true; parcours: Parcours } | { ok: false; raison: string };

const TYPES_ETAPE = ["lecon", "quiz", "exemple", "situation", "exercice", "scenario"];
const TYPES_BLOC = ["texte", "exemple_texte", "definition", "liste", "schema", "a_retenir"];
const KINDS_SCHEMA = ["courbes", "barres", "repartition", "flux"];
const QUALITES = ["recommande", "acceptable", "deconseille"];

function estObjet(valeur: unknown): valeur is Record<string, unknown> {
  return typeof valeur === "object" && valeur !== null && !Array.isArray(valeur);
}

function texteNonVide(valeur: unknown): valeur is string {
  return typeof valeur === "string" && valeur.trim().length > 0;
}

function nombreFini(valeur: unknown): valeur is number {
  return typeof valeur === "number" && Number.isFinite(valeur);
}

/** Première anomalie trouvée dans un bloc de contenu, ou `undefined` s'il est valide. */
function verifierBloc(bloc: unknown, ou: string): string | undefined {
  if (!estObjet(bloc)) return `${ou} : bloc de contenu qui n'est pas un objet`;
  const type = bloc.type;
  if (typeof type !== "string" || !TYPES_BLOC.includes(type)) return `${ou} : bloc de type inconnu « ${String(type)} »`;

  switch (type) {
    case "texte":
      return texteNonVide(bloc.texte) ? undefined : `${ou} : bloc texte vide`;
    case "exemple_texte":
      return texteNonVide(bloc.titre) && texteNonVide(bloc.texte) ? undefined : `${ou} : bloc exemple_texte incomplet`;
    case "definition":
      return texteNonVide(bloc.terme) && texteNonVide(bloc.texte) ? undefined : `${ou} : définition incomplète`;
    case "liste":
      return Array.isArray(bloc.items) && bloc.items.length > 0 && bloc.items.every(texteNonVide)
        ? undefined
        : `${ou} : liste vide ou mal formée`;
    case "a_retenir":
      return Array.isArray(bloc.points) && bloc.points.length > 0 && bloc.points.every(texteNonVide)
        ? undefined
        : `${ou} : « à retenir » vide ou mal formé`;
    case "schema":
      return verifierSchema(bloc.schema, ou);
    default:
      return `${ou} : bloc de type inconnu`;
  }
}

function verifierSchema(schema: unknown, ou: string): string | undefined {
  if (!estObjet(schema)) return `${ou} : schéma absent`;
  const kind = schema.kind;
  if (typeof kind !== "string" || !KINDS_SCHEMA.includes(kind)) return `${ou} : schéma de type inconnu « ${String(kind)} »`;

  if (kind === "courbes") {
    if (!Array.isArray(schema.axeX) || schema.axeX.length < 2) return `${ou} : schéma courbes sans axe horizontal`;
    if (!Array.isArray(schema.series) || schema.series.length === 0) return `${ou} : schéma courbes sans série`;
    for (const serie of schema.series) {
      if (!estObjet(serie) || !texteNonVide(serie.label)) return `${ou} : série sans libellé`;
      if (!Array.isArray(serie.points) || !serie.points.every(nombreFini)) return `${ou} : série « ${serie.label} » non numérique`;
      // Le tracé projette point par point : un décalage ferait sortir la courbe du repère.
      if (serie.points.length !== schema.axeX.length) {
        return `${ou} : série « ${serie.label} » a ${serie.points.length} points pour ${schema.axeX.length} étiquettes`;
      }
    }
    return undefined;
  }
  if (kind === "barres") {
    if (!Array.isArray(schema.barres) || schema.barres.length === 0) return `${ou} : schéma barres vide`;
    return schema.barres.every((barre) => estObjet(barre) && texteNonVide(barre.label) && nombreFini(barre.valeur))
      ? undefined
      : `${ou} : barre sans libellé ou sans valeur numérique`;
  }
  if (kind === "repartition") {
    if (!Array.isArray(schema.parts) || schema.parts.length === 0) return `${ou} : répartition vide`;
    if (!schema.parts.every((part) => estObjet(part) && texteNonVide(part.label) && nombreFini(part.valeur))) {
      return `${ou} : part sans libellé ou sans valeur numérique`;
    }
    // Une répartition dont tout vaut zéro ne peut pas être normalisée en pourcentages.
    return schema.parts.some((part) => (part as { valeur: number }).valeur > 0)
      ? undefined
      : `${ou} : répartition entièrement nulle`;
  }
  if (!Array.isArray(schema.etapes) || schema.etapes.length === 0) return `${ou} : flux sans étape`;
  return schema.etapes.every((etape) => estObjet(etape) && texteNonVide(etape.label))
    ? undefined
    : `${ou} : étape de flux sans libellé`;
}

function verifierSimulateur(simulateur: unknown, ou: string): string | undefined {
  if (!estObjet(simulateur)) return `${ou} : simulateur absent`;
  const formule = simulateur.formule;
  if (typeof formule !== "string" || !(formule in VARIABLES_PAR_FORMULE)) {
    return `${ou} : formule inconnue « ${String(formule)} »`;
  }
  if (!Array.isArray(simulateur.variables)) return `${ou} : simulateur sans variables`;

  const attendues = [...VARIABLES_PAR_FORMULE[formule as keyof typeof VARIABLES_PAR_FORMULE]].sort();
  const fournies = simulateur.variables
    .map((variable) => (estObjet(variable) ? variable.id : undefined))
    .filter((id): id is string => typeof id === "string")
    .sort();
  if (JSON.stringify(fournies) !== JSON.stringify(attendues)) {
    return `${ou} : variables ${fournies.join(",") || "(aucune)"} au lieu de ${attendues.join(",")}`;
  }

  for (const variable of simulateur.variables) {
    if (!estObjet(variable)) return `${ou} : variable mal formée`;
    const { id, min, max, pas, valeurParDefaut } = variable;
    if (!texteNonVide(variable.label)) return `${ou} : variable « ${String(id)} » sans libellé`;
    if (!nombreFini(min) || !nombreFini(max) || !nombreFini(pas) || !nombreFini(valeurParDefaut)) {
      return `${ou} : variable « ${String(id)} » avec une borne non numérique`;
    }
    if (min > max) return `${ou} : variable « ${String(id)} » a min > max`;
    if (pas <= 0) return `${ou} : variable « ${String(id)} » a un pas nul ou négatif`;
    if (valeurParDefaut < min || valeurParDefaut > max) {
      return `${ou} : variable « ${String(id)} » a une valeur par défaut hors bornes`;
    }
  }

  return estObjet(simulateur.resultat) && texteNonVide(simulateur.resultat.label)
    ? undefined
    : `${ou} : simulateur sans libellé de résultat`;
}

function verifierEtape(etape: unknown, ou: string): string | undefined {
  if (!estObjet(etape)) return `${ou} : étape qui n'est pas un objet`;
  if (!texteNonVide(etape.id)) return `${ou} : étape sans identifiant`;
  const id = `${ou}/${etape.id}`;
  if (!texteNonVide(etape.titre)) return `${id} : étape sans titre`;
  if (!nombreFini(etape.ordre)) return `${id} : ordre non numérique`;
  if (typeof etape.type !== "string" || !TYPES_ETAPE.includes(etape.type)) {
    return `${id} : type d'étape inconnu « ${String(etape.type)} »`;
  }
  if (!Array.isArray(etape.contenu)) return `${id} : contenu absent`;
  for (const bloc of etape.contenu) {
    const anomalie = verifierBloc(bloc, id);
    if (anomalie) return anomalie;
  }

  switch (etape.type) {
    case "quiz": {
      const quiz = etape.quiz;
      if (!estObjet(quiz) || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
        return `${id} : quiz sans question`;
      }
      if (!nombreFini(quiz.seuilReussite)) return `${id} : seuil de réussite non numérique`;
      for (const question of quiz.questions) {
        if (!estObjet(question) || !texteNonVide(question.id) || !texteNonVide(question.question)) {
          return `${id} : question mal formée`;
        }
        if (!Array.isArray(question.choix) || question.choix.length < 2 || !question.choix.every(texteNonVide)) {
          return `${id}/${question.id} : moins de deux choix`;
        }
        // Hors bornes, l'écran de correction ne désignerait aucune bonne réponse.
        if (
          !nombreFini(question.bonneReponseIndex) ||
          question.bonneReponseIndex < 0 ||
          question.bonneReponseIndex >= question.choix.length
        ) {
          return `${id}/${question.id} : index de bonne réponse hors bornes`;
        }
      }
      return undefined;
    }

    case "exemple":
      return verifierSimulateur(etape.simulateur, id);

    case "situation": {
      const situation = etape.situation;
      if (!estObjet(situation) || !texteNonVide(situation.contexte)) return `${id} : situation sans contexte`;
      if (!Array.isArray(situation.choix) || situation.choix.length === 0) return `${id} : situation sans choix`;
      for (const choix of situation.choix) {
        if (!estObjet(choix) || !texteNonVide(choix.id) || !texteNonVide(choix.texte) || !texteNonVide(choix.feedback)) {
          return `${id} : choix de situation incomplet`;
        }
        if (typeof choix.qualite !== "string" || !QUALITES.includes(choix.qualite)) {
          return `${id}/${choix.id} : qualité inconnue « ${String(choix.qualite)} »`;
        }
      }
      return undefined;
    }

    case "exercice": {
      const exercice = etape.exercice;
      if (!estObjet(exercice) || !Array.isArray(exercice.items) || exercice.items.length === 0) {
        return `${id} : exercice sans item`;
      }
      if (!nombreFini(exercice.seuilReussite)) return `${id} : seuil d'exercice non numérique`;
      for (const item of exercice.items) {
        if (!estObjet(item) || !texteNonVide(item.id) || !texteNonVide(item.enonce) || !texteNonVide(item.explication)) {
          return `${id} : item d'exercice incomplet`;
        }
        if (item.type === "nombre") {
          if (!nombreFini(item.reponse)) return `${id}/${item.id} : réponse non numérique`;
          if (!nombreFini(item.tolerance) || item.tolerance < 0) return `${id}/${item.id} : tolérance invalide`;
        } else if (item.type === "vrai_faux") {
          if (typeof item.reponse !== "boolean") return `${id}/${item.id} : réponse vrai/faux non booléenne`;
        } else {
          return `${id}/${item.id} : type d'item inconnu « ${String(item.type)} »`;
        }
      }
      return undefined;
    }

    case "scenario": {
      const scenario = etape.scenario;
      if (!estObjet(scenario) || !texteNonVide(scenario.intro)) return `${id} : scénario sans mise en place`;
      if (!Array.isArray(scenario.decisions) || scenario.decisions.length === 0) return `${id} : scénario sans décision`;
      for (const decision of scenario.decisions) {
        if (!estObjet(decision) || !texteNonVide(decision.id) || !texteNonVide(decision.situation)) {
          return `${id} : décision mal formée`;
        }
        if (!Array.isArray(decision.options) || decision.options.length < 2) {
          return `${id}/${decision.id} : moins de deux options`;
        }
        for (const option of decision.options) {
          if (!estObjet(option) || !texteNonVide(option.id) || !texteNonVide(option.texte) || !texteNonVide(option.consequence)) {
            return `${id}/${decision.id} : option incomplète`;
          }
          if (!nombreFini(option.points)) return `${id}/${decision.id}/${option.id} : points non numériques`;
        }
      }
      if (!Array.isArray(scenario.bilans) || scenario.bilans.length === 0) return `${id} : scénario sans bilan`;
      for (const bilan of scenario.bilans) {
        if (!estObjet(bilan) || !nombreFini(bilan.seuil) || !texteNonVide(bilan.titre) || !texteNonVide(bilan.texte)) {
          return `${id} : bilan de scénario incomplet`;
        }
      }
      // Sans bilan de repli, un parcours catastrophique n'afficherait aucune conclusion.
      return scenario.bilans.some((bilan) => (bilan as { seuil: number }).seuil <= 0)
        ? undefined
        : `${id} : scénario sans bilan de repli (seuil 0)`;
    }

    default:
      return undefined;
  }
}

/**
 * Valide un parcours brut. En cas d'anomalie, retourne la PREMIÈRE rencontrée : c'est ce
 * qui sera journalisé, donc il faut qu'elle désigne précisément l'étape fautive.
 */
export function validerParcours(valeur: unknown, parcoursIdAttendu?: string): ResultatValidation {
  if (!estObjet(valeur)) return { ok: false, raison: "le contenu n'est pas un objet" };
  if (!texteNonVide(valeur.id)) return { ok: false, raison: "parcours sans identifiant" };
  if (parcoursIdAttendu !== undefined && valeur.id !== parcoursIdAttendu) {
    return { ok: false, raison: `identifiant « ${valeur.id} » au lieu de « ${parcoursIdAttendu} »` };
  }
  if (!texteNonVide(valeur.titre)) return { ok: false, raison: `${valeur.id} : parcours sans titre` };
  if (!nombreFini(valeur.version)) return { ok: false, raison: `${valeur.id} : version non numérique` };
  if (valeur.type !== "intro" && valeur.type !== "voie") {
    return { ok: false, raison: `${valeur.id} : type « ${String(valeur.type)} » inattendu` };
  }
  if (!Array.isArray(valeur.etapes) || valeur.etapes.length === 0) {
    return { ok: false, raison: `${valeur.id} : aucune étape` };
  }

  const identifiants = new Set<string>();
  for (const etape of valeur.etapes) {
    const anomalie = verifierEtape(etape, String(valeur.id));
    if (anomalie) return { ok: false, raison: anomalie };
    const id = (etape as { id: string }).id;
    // Les ids servent de clés de rendu et de progression : un doublon ferait diverger les deux.
    if (identifiants.has(id)) return { ok: false, raison: `${valeur.id} : identifiant d'étape dupliqué « ${id} »` };
    identifiants.add(id);
  }

  if (valeur.sources !== undefined) {
    if (!Array.isArray(valeur.sources)) return { ok: false, raison: `${valeur.id} : sources mal formées` };
    for (const source of valeur.sources) {
      if (!estObjet(source) || !texteNonVide(source.libelle) || !texteNonVide(source.url)) {
        return { ok: false, raison: `${valeur.id} : source incomplète` };
      }
      // Une source non http ouvrirait un lien inerte, ou pire.
      if (!source.url.startsWith("https://")) return { ok: false, raison: `${valeur.id} : source « ${source.libelle} » sans URL https` };
    }
  }

  // Une récompense partielle mènerait à un écran de récompense vide en fin de parcours.
  // Le livre partenaire est facultatif — la récompense d'une voie est sa fiche de
  // synthèse, fabriquée à partir du contenu. Mais un livre à moitié renseigné mènerait à
  // un écran avec un titre et pas de lien, ou un code sans rien à en faire.
  if (valeur.recompense !== undefined) {
    const recompense = valeur.recompense;
    if (!estObjet(recompense) || !estObjet(recompense.livre)) {
      return { ok: false, raison: "recompense : livre manquant ou mal formé" };
    }
    if (!texteNonVide(recompense.livre.titre) || !texteNonVide(recompense.livre.urlAmazon) || !texteNonVide(recompense.code)) {
      return { ok: false, raison: "recompense : titre, urlAmazon et code sont tous requis" };
    }
    if (!String(recompense.livre.urlAmazon).startsWith("https://")) {
      return { ok: false, raison: "recompense : l'URL du livre doit être en https" };
    }
  }

  return { ok: true, parcours: valeur as unknown as Parcours };
}

/** Version booléenne, pour les endroits où la raison n'est pas exploitée. */
export function estParcoursValide(valeur: unknown, parcoursIdAttendu?: string): valeur is Parcours {
  return validerParcours(valeur, parcoursIdAttendu).ok;
}

/** Types d'étape reconnus par l'app — exporté pour les tests et les scripts de contenu. */
export const TYPES_ETAPE_CONNUS: readonly Etape["type"][] = TYPES_ETAPE as Etape["type"][];
