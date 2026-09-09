import { useEffect } from "react";

import type { Parcours } from "../domain/parcours/types";
import { useContentStore } from "../state/contentStore";

type EtatParcours =
  | { statut: "chargement" }
  | { statut: "charge"; parcours: Parcours }
  | { statut: "erreur"; message: string };

/** Déclenche le chargement d'un parcours (content store) et expose son état courant. */
export function useParcours(parcoursId: string): EtatParcours {
  const etat = useContentStore((state) => state.parcoursParId[parcoursId]);
  const chargerParcours = useContentStore((state) => state.chargerParcours);

  useEffect(() => {
    chargerParcours(parcoursId);
  }, [parcoursId, chargerParcours]);

  if (!etat || etat.statut === "chargement") {
    return { statut: "chargement" };
  }
  if (etat.statut === "charge" && etat.parcours) {
    return { statut: "charge", parcours: etat.parcours };
  }
  return { statut: "erreur", message: etat.message ?? "Erreur inconnue" };
}
