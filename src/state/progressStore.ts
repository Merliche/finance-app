// Store de progression — Zustand + persist (AsyncStorage), voir PROJECT.md §3.
// Toute la logique de progression vit dans src/domain/parcours/progress.ts : ce store
// ne fait que persister l'état et déléguer les calculs au moteur (ne pas dupliquer les
// règles de complétion ici).
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Parcours, ProgressionGlobale, ProgressionParcours } from "../domain/parcours/types";
import { jourLocal } from "../domain/parcours/engagement";
import type { PreferenceTheme } from "../theme/palettes";
import type { ProfilFinancier } from "../domain/parcours/profilFinancier";
import { completerEtape, type ResultatEtape } from "../domain/parcours/progress";

// Au-delà, les jours les plus anciens sont oubliés : une série se calcule depuis
// aujourd'hui, un historique plus long ne servirait à rien.
const MAX_JOURS_ACTIFS = 400;

/** Une question de quiz ratée, en attente de révision. */
export interface QuestionRatee {
  parcoursId: string;
  etapeId: string;
  /** Nombre de fois où elle a été manquée : les plus tenaces remontent en premier. */
  nbEchecs: number;
  dernierEchec: string;
}

function progressionInitiale(parcoursId: string): ProgressionParcours {
  return {
    parcoursId,
    etapesCompletees: [],
    statut: "non_commence",
    recompenseDebloquee: false,
  };
}

interface ProgressStoreState extends ProgressionGlobale {
  /** L'écran de bienvenue n'est montré qu'au tout premier lancement. */
  accueilVu: boolean;
  /** Thème choisi. « systeme » suit le réglage du téléphone, et c'est le défaut. */
  preferenceTheme: PreferenceTheme;
  /** Jours (AAAA-MM-JJ, heure locale) où au moins une étape a été validée — pour la série. */
  joursActifs: string[];
  /** Jours où le défi du jour a été relevé (réussi ou non : un seul essai par jour). */
  defisJoues: string[];
  /** Sous-ensemble de `defisJoues` : les jours où la réponse était bonne (prime d'XP). */
  defisReussis: string[];
  /** Questions manquées, par id de question — la matière de l'écran Révision. */
  questionsRatees: Record<string, QuestionRatee>;
  /** Chiffres personnels, saisis une fois, jamais envoyés nulle part. */
  profilFinancier?: ProfilFinancier;
  completerEtape: (parcours: Parcours, etapeId: string, resultat: ResultatEtape) => void;
  /** Enregistre le défi du jour comme joué ; compte aussi comme un jour actif pour la série. */
  jouerDefi: (jour: string, reussi: boolean) => void;
  /**
   * Met à jour la liste de révision après un quiz : les questions manquées y entrent,
   * celles qu'on vient de réussir en sortent. Une seule bonne réponse suffit à sortir —
   * l'objectif est d'y revenir, pas de punir.
   */
  enregistrerReponses: (
    parcoursId: string,
    etapeId: string,
    resultats: { questionId: string; correcte: boolean }[]
  ) => void;
  enregistrerProfilFinancier: (profil: ProfilFinancier) => void;
  effacerProfilFinancier: () => void;
  enregistrerEmailCapture: (email: string) => void;
  marquerAccueilVu: () => void;
  choisirTheme: (preference: PreferenceTheme) => void;
  /** Efface toute la progression (pas l'accueil vu, ni les chiffres personnels, ni le cache). */
  reinitialiser: () => void;
}

export const useProgressStore = create<ProgressStoreState>()(
  persist(
    (set) => ({
      parcours: {},
      emailCapture: undefined,
      accueilVu: false,
      preferenceTheme: "systeme",
      joursActifs: [],
      defisJoues: [],
      defisReussis: [],
      questionsRatees: {},
      profilFinancier: undefined,

      jouerDefi: (jour, reussi) => {
        set((state) => {
          if (state.defisJoues.includes(jour)) return state;
          return {
            defisJoues: [...state.defisJoues, jour].slice(-MAX_JOURS_ACTIFS),
            defisReussis: reussi ? [...state.defisReussis, jour].slice(-MAX_JOURS_ACTIFS) : state.defisReussis,
            joursActifs: state.joursActifs.includes(jour) ? state.joursActifs : [...state.joursActifs, jour].slice(-MAX_JOURS_ACTIFS),
          };
        });
      },

      enregistrerReponses: (parcoursId, etapeId, resultats) => {
        set((state) => {
          const questionsRatees = { ...state.questionsRatees };
          let change = false;
          const maintenant = new Date().toISOString();

          for (const { questionId, correcte } of resultats) {
            if (correcte) {
              if (questionsRatees[questionId]) {
                delete questionsRatees[questionId];
                change = true;
              }
            } else {
              const precedent = questionsRatees[questionId];
              questionsRatees[questionId] = {
                parcoursId,
                etapeId,
                nbEchecs: (precedent?.nbEchecs ?? 0) + 1,
                dernierEchec: maintenant,
              };
              change = true;
            }
          }

          return change ? { questionsRatees } : state;
        });
      },

      enregistrerProfilFinancier: (profil) => {
        set({ profilFinancier: { ...profil, dateMaj: new Date().toISOString() } });
      },

      effacerProfilFinancier: () => set({ profilFinancier: undefined }),

      completerEtape: (parcours, etapeId, resultat) => {
        set((state) => {
          const progressionActuelle = state.parcours[parcours.id] ?? progressionInitiale(parcours.id);
          const progressionMiseAJour = completerEtape(
            parcours,
            progressionActuelle,
            etapeId,
            resultat,
            new Date().toISOString()
          );
          if (progressionMiseAJour === progressionActuelle) return state;

          const aujourdhui = jourLocal(new Date());
          const joursActifs = state.joursActifs.includes(aujourdhui)
            ? state.joursActifs
            : [...state.joursActifs, aujourdhui].slice(-MAX_JOURS_ACTIFS);

          return { parcours: { ...state.parcours, [parcours.id]: progressionMiseAJour }, joursActifs };
        });
      },

      enregistrerEmailCapture: (email) => {
        set({ emailCapture: { email, dateCapture: new Date().toISOString() } });
      },

      marquerAccueilVu: () => set({ accueilVu: true }),

      choisirTheme: (preference) => set({ preferenceTheme: preference }),

      reinitialiser: () =>
        set({
          parcours: {},
          emailCapture: undefined,
          joursActifs: [],
          defisJoues: [],
          defisReussis: [],
          questionsRatees: {},
        }),
    }),
    {
      name: "finance-app/progression",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        parcours: state.parcours,
        emailCapture: state.emailCapture,
        accueilVu: state.accueilVu,
        preferenceTheme: state.preferenceTheme,
        joursActifs: state.joursActifs,
        defisJoues: state.defisJoues,
        defisReussis: state.defisReussis,
        questionsRatees: state.questionsRatees,
        profilFinancier: state.profilFinancier,
      }),
      // Les champs ajoutés après coup sont absents des stores persistés plus anciens : on
      // les complète ici pour ne jamais lire `undefined.includes` ni itérer sur `undefined`.
      merge: (persiste, courant) => {
        const enregistre = (persiste ?? {}) as Partial<ProgressStoreState>;
        return {
          ...courant,
          ...enregistre,
          joursActifs: enregistre.joursActifs ?? [],
          defisJoues: enregistre.defisJoues ?? [],
          defisReussis: enregistre.defisReussis ?? [],
          questionsRatees: enregistre.questionsRatees ?? {},
          preferenceTheme: enregistre.preferenceTheme ?? "systeme",
        };
      },
    }
  )
);

/** Progression d'un parcours, ou son état "non commencé" par défaut s'il n'y a rien en store. */
export function obtenirProgressionParcours(parcoursId: string): ProgressionParcours {
  return useProgressStore.getState().parcours[parcoursId] ?? progressionInitiale(parcoursId);
}

/**
 * true une fois que le store a fini de relire AsyncStorage. Nécessaire pour éviter de
 * router l'utilisateur sur la base d'un état encore vide (avant réhydratation) — voir
 * app/index.tsx.
 */
export function useProgressionHydratee(): boolean {
  const [hydratee, setHydratee] = useState(useProgressStore.persist.hasHydrated());

  useEffect(() => {
    setHydratee(useProgressStore.persist.hasHydrated());
    return useProgressStore.persist.onFinishHydration(() => setHydratee(true));
  }, []);

  return hydratee;
}
