// Store de contenu — cache en mémoire des parcours chargés, pour éviter un refetch à
// chaque écran (sommaire, étape) pendant la navigation au sein d'un même parcours.
// Le vrai travail de fetch/cache/fallback est dans contentRepository.ts ; ce store ne
// fait qu'exposer un état de chargement par parcoursId au-dessus de ce repository.
import { create } from "zustand";

import type { Parcours } from "../domain/parcours/types";
import { recupererParcours } from "../data/remote/contentRepository";

interface EtatParcours {
  statut: "chargement" | "charge" | "erreur";
  parcours?: Parcours;
  message?: string;
}

interface ContentStoreState {
  parcoursParId: Record<string, EtatParcours>;
  chargerParcours: (parcoursId: string) => Promise<void>;
}

export const useContentStore = create<ContentStoreState>()((set, get) => ({
  parcoursParId: {},

  chargerParcours: async (parcoursId) => {
    const etatActuel = get().parcoursParId[parcoursId];
    if (etatActuel?.statut === "chargement" || etatActuel?.statut === "charge") {
      return;
    }

    set((state) => ({
      parcoursParId: { ...state.parcoursParId, [parcoursId]: { statut: "chargement" } },
    }));

    try {
      const parcours = await recupererParcours(parcoursId);
      set((state) => ({
        parcoursParId: { ...state.parcoursParId, [parcoursId]: { statut: "charge", parcours } },
      }));
    } catch (erreur) {
      const message = erreur instanceof Error ? erreur.message : String(erreur);
      set((state) => ({
        parcoursParId: { ...state.parcoursParId, [parcoursId]: { statut: "erreur", message } },
      }));
    }
  },
}));

/** Recharge un parcours même s'il est déjà en cache mémoire (ex: pull-to-refresh). */
export function invaliderParcours(parcoursId: string): void {
  useContentStore.setState((state) => {
    const { [parcoursId]: _retire, ...reste } = state.parcoursParId;
    return { parcoursParId: reste };
  });
}
