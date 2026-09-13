// Fetch du contenu des parcours depuis Supabase, avec cache local (AsyncStorage) et
// fallback sur le JSON bundlé si le réseau échoue — voir PROJECT.md §2 et §4.
//
// Stratégie réseau : la table `parcours` duplique `version` hors du jsonb `contenu`
// précisément pour permettre une requête légère (voir le commentaire de la migration
// 20260909000000) — on l'utilise ici pour éviter de retélécharger/reparser tout le
// contenu quand seule la version doit être vérifiée : on ne va chercher le `contenu`
// complet que si la version distante diffère de celle en cache (ou si le cache est vide).
//
// Rien de ce qui vient du réseau ou du cache n'atteint l'écran sans passer par
// `validerParcours` : le contenu est éditable en base sans release, donc une édition
// ratée doit dégrader vers le repli plutôt que faire planter l'app (voir validation.ts).
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Parcours } from "../../domain/parcours/types";
import { validerParcours } from "../../domain/parcours/validation";
import { recupererParcoursBundle } from "../content";
import { supabase } from "./supabaseClient";

const PREFIXE_CLE_CACHE = "finance-app/cache-parcours/";

// Au-delà de ce délai, on considère le réseau comme indisponible et on bascule sur le
// cache ou le bundle : un utilisateur en 3G faible ne doit pas rester bloqué sur un
// écran de chargement alors que le contenu est déjà sur son téléphone.
const DELAI_RESEAU_MS = 7000;

function avecDelai<T>(promesse: PromiseLike<T>, delaiMs: number): Promise<T> {
  return new Promise<T>((resoudre, rejeter) => {
    const minuteur = setTimeout(() => rejeter(new Error("Délai réseau dépassé")), delaiMs);
    promesse.then(
      (valeur) => {
        clearTimeout(minuteur);
        resoudre(valeur);
      },
      (erreur) => {
        clearTimeout(minuteur);
        rejeter(erreur);
      }
    );
  });
}

/** Journalisation des contenus rejetés — en dev uniquement, mais toujours explicite. */
function signalerRejet(source: string, parcoursId: string, raison: string): void {
  if (__DEV__) {
    console.warn(`[contenu] ${source} rejeté pour « ${parcoursId} » : ${raison}. Repli sur la source suivante.`);
  }
}

/**
 * Contenu en cache, s'il est présent ET valide. Un cache invalide (JSON corrompu, ou
 * écrit par une version de l'app dont le format a changé depuis) est supprimé plutôt que
 * conservé : le garder ferait échouer tous les démarrages suivants de la même façon.
 */
async function lireCache(parcoursId: string): Promise<Parcours | undefined> {
  const brut = await AsyncStorage.getItem(PREFIXE_CLE_CACHE + parcoursId);
  if (!brut) return undefined;

  let analyse: unknown;
  try {
    analyse = JSON.parse(brut);
  } catch {
    await AsyncStorage.removeItem(PREFIXE_CLE_CACHE + parcoursId).catch(() => {});
    return undefined;
  }

  const validation = validerParcours(analyse, parcoursId);
  if (!validation.ok) {
    signalerRejet("cache", parcoursId, validation.raison);
    await AsyncStorage.removeItem(PREFIXE_CLE_CACHE + parcoursId).catch(() => {});
    return undefined;
  }
  return validation.parcours;
}

async function ecrireCache(parcoursId: string, parcours: Parcours): Promise<void> {
  await AsyncStorage.setItem(PREFIXE_CLE_CACHE + parcoursId, JSON.stringify(parcours));
}

/** Efface tout le contenu mis en cache. Utilisé par l'écran de secours en cas de crash. */
export async function viderCacheContenu(): Promise<void> {
  const cles = await AsyncStorage.getAllKeys();
  const aSupprimer = cles.filter((cle) => cle.startsWith(PREFIXE_CLE_CACHE));
  if (aSupprimer.length > 0) await AsyncStorage.multiRemove(aSupprimer);
}

/**
 * Sans clés Supabase, il n'y a pas de source distante du tout. On lève comme pour une
 * panne réseau : l'appelant descend alors sur le cache puis le bundle, chemin déjà éprouvé.
 */
function clientOuEchec() {
  if (!supabase) throw new Error("Supabase non configuré : pas de source distante.");
  return supabase;
}

async function recupererVersionDistante(parcoursId: string): Promise<number> {
  const { data, error } = await avecDelai(
    clientOuEchec().from("parcours").select("version").eq("id", parcoursId).single(),
    DELAI_RESEAU_MS
  );
  if (error) throw error;
  return data.version;
}

/** Contenu distant complet, déjà validé. Lève si le réseau échoue OU si le contenu est invalide. */
async function recupererContenuDistant(parcoursId: string): Promise<Parcours> {
  const { data, error } = await avecDelai(
    clientOuEchec().from("parcours").select("contenu").eq("id", parcoursId).single(),
    DELAI_RESEAU_MS
  );
  if (error) throw error;

  const validation = validerParcours(data.contenu, parcoursId);
  if (!validation.ok) {
    signalerRejet("contenu distant", parcoursId, validation.raison);
    throw new Error(`Contenu distant invalide : ${validation.raison}`);
  }
  return validation.parcours;
}

/**
 * Entre deux sources du même parcours, garde la version la plus élevée. Le distant est
 * normalement en avance, mais l'inverse arrive : une build embarque un contenu plus
 * récent que ce qui a été publié sur Supabase (publication oubliée, ou en cours). Sans
 * cette comparaison, l'app servirait alors un contenu plus ancien que celui qu'elle
 * transporte déjà — à égalité de version, on garde la source distante/cache.
 */
function plusRecent(candidat: Parcours, parcoursId: string): Parcours {
  const bundle = recupererParcoursBundle(parcoursId);
  return bundle && bundle.version > candidat.version ? bundle : candidat;
}

/**
 * Récupère un parcours par id, en descendant les sources jusqu'à en trouver une valide :
 * Supabase (avec vérification légère de version pour éviter un fetch complet inutile),
 * puis le cache local, puis le JSON bundlé — et dans tous les cas, le bundle l'emporte
 * s'il porte une version plus récente. Lève seulement si les trois sources échouent
 * (parcours inconnu et hors ligne).
 */
export async function recupererParcours(parcoursId: string): Promise<Parcours> {
  const enCache = await lireCache(parcoursId);

  try {
    const versionDistante = await recupererVersionDistante(parcoursId);
    if (enCache && enCache.version === versionDistante) {
      return plusRecent(enCache, parcoursId);
    }

    const distant = await recupererContenuDistant(parcoursId);
    await ecrireCache(parcoursId, distant);
    return plusRecent(distant, parcoursId);
  } catch (erreur) {
    if (enCache) {
      return plusRecent(enCache, parcoursId);
    }

    const bundle = recupererParcoursBundle(parcoursId);
    if (bundle) {
      return bundle;
    }

    throw erreur;
  }
}
