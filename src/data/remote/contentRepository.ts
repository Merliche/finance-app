// Fetch du contenu des parcours depuis Supabase, avec cache local (AsyncStorage) et
// fallback sur le JSON bundlé si le réseau échoue — voir PROJECT.md §2 et §4.
//
// Stratégie réseau : la table `parcours` duplique `version` hors du jsonb `contenu`
// précisément pour permettre une requête légère (voir le commentaire de la migration
// 20260909000000) — on l'utilise ici pour éviter de retélécharger/reparser tout le
// contenu quand seule la version doit être vérifiée : on ne va chercher le `contenu`
// complet que si la version distante diffère de celle en cache (ou si le cache est vide).
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Parcours } from "../../domain/parcours/types";
import { recupererParcoursBundle } from "../content";
import { supabase } from "./supabaseClient";

const PREFIXE_CLE_CACHE = "finance-app/cache-parcours/";

async function lireCache(parcoursId: string): Promise<Parcours | undefined> {
  const brut = await AsyncStorage.getItem(PREFIXE_CLE_CACHE + parcoursId);
  if (!brut) return undefined;
  try {
    return JSON.parse(brut) as Parcours;
  } catch {
    // Cache corrompu : on l'ignore, il sera réécrit au prochain fetch réussi.
    return undefined;
  }
}

async function ecrireCache(parcoursId: string, parcours: Parcours): Promise<void> {
  await AsyncStorage.setItem(PREFIXE_CLE_CACHE + parcoursId, JSON.stringify(parcours));
}

async function recupererVersionDistante(parcoursId: string): Promise<number> {
  const { data, error } = await supabase.from("parcours").select("version").eq("id", parcoursId).single();
  if (error) throw error;
  return data.version;
}

async function recupererContenuDistant(parcoursId: string): Promise<Parcours> {
  const { data, error } = await supabase.from("parcours").select("contenu").eq("id", parcoursId).single();
  if (error) throw error;
  return data.contenu as Parcours;
}

/**
 * Récupère un parcours par id : Supabase en priorité (avec vérification légère de
 * version pour éviter un fetch complet inutile), cache local si le réseau échoue,
 * puis JSON bundlé en dernier recours. Lève une erreur seulement si les trois sources
 * échouent (parcours inconnu et hors ligne).
 */
export async function recupererParcours(parcoursId: string): Promise<Parcours> {
  const enCache = await lireCache(parcoursId);

  try {
    const versionDistante = await recupererVersionDistante(parcoursId);
    if (enCache && enCache.version === versionDistante) {
      return enCache;
    }

    const distant = await recupererContenuDistant(parcoursId);
    await ecrireCache(parcoursId, distant);
    return distant;
  } catch (erreur) {
    if (enCache) {
      return enCache;
    }

    const bundle = recupererParcoursBundle(parcoursId);
    if (bundle) {
      return bundle;
    }

    throw erreur;
  }
}
