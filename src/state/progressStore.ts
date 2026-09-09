// Store de progression — Zustand + persist (AsyncStorage), voir PROJECT.md §3.
// Toute la logique de progression vit dans src/domain/parcours/progress.ts : ce store
// ne fait que persister l'état et déléguer les calculs au moteur (ne pas dupliquer les
// règles de complétion ici).
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Parcours, ProgressionGlobale, ProgressionParcours } from "../domain/parcours/types";
import { completerEtape, type ResultatEtape } from "../domain/parcours/progress";

function progressionInitiale(parcoursId: string): ProgressionParcours {
  return {
    parcoursId,
    etapesCompletees: [],
    statut: "non_commence",
    recompenseDebloquee: false,
  };
}

interface ProgressStoreState extends ProgressionGlobale {
  completerEtape: (parcours: Parcours, etapeId: string, resultat: ResultatEtape) => void;
  enregistrerEmailCapture: (email: string) => void;
}

export const useProgressStore = create<ProgressStoreState>()(
  persist(
    (set) => ({
      parcours: {},
      emailCapture: undefined,

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
          return { parcours: { ...state.parcours, [parcours.id]: progressionMiseAJour } };
        });
      },

      enregistrerEmailCapture: (email) => {
        set({ emailCapture: { email, dateCapture: new Date().toISOString() } });
      },
    }),
    {
      name: "finance-app/progression",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ parcours: state.parcours, emailCapture: state.emailCapture }),
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
