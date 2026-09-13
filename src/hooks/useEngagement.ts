import type { Engagement } from "../components/chemin/EnteteParcours";
import { calculerSerie, calculerXp, jourLocal, niveauDepuisXp } from "../domain/parcours/engagement";
import { useProgressStore } from "../state/progressStore";

/** Série de jours et niveau d'XP dérivés de la progression persistée, tous parcours confondus. */
export function useEngagement(): Engagement {
  const parcours = useProgressStore((state) => state.parcours);
  const joursActifs = useProgressStore((state) => state.joursActifs);
  const nbDefisReussis = useProgressStore((state) => state.defisReussis.length);

  const { niveau, xpDansNiveau, xpPourSuivant } = niveauDepuisXp(calculerXp(parcours, nbDefisReussis));
  return { serie: calculerSerie(joursActifs, jourLocal(new Date())), niveau, xpDansNiveau, xpPourSuivant };
}
