import { useMemo } from "react";

import { MODE_TEST_TOUT_ACCESSIBLE } from "../constants/modeTest";
import { sessionDeEtape, sessionsAtteintes } from "../constants/sessions";
import { VOIES } from "../constants/voies";
import { recupererParcoursBundle } from "../data/content";
import { jourLocal } from "../domain/parcours/engagement";
import { tirerDefiDuJour, type DefiDuJour } from "../domain/parcours/defi";
import type { Parcours } from "../domain/parcours/types";
import { useProgressStore } from "../state/progressStore";

const PARCOURS_IDS = ["intro", ...VOIES.map((v) => v.id)];

/**
 * Le défi du jour et son état : tiré parmi les quiz des sessions déjà atteintes (contenu
 * bundlé — le défi n'a pas besoin d'être à jour à la seconde), joué ou non aujourd'hui.
 */
export function useDefiDuJour(): {
  jour: string;
  defi: DefiDuJour | undefined;
  dejaJoue: boolean;
  dejaReussi: boolean;
  jouer: (reussi: boolean) => void;
} {
  const progression = useProgressStore((state) => state.parcours);
  const defisJoues = useProgressStore((state) => state.defisJoues);
  const defisReussis = useProgressStore((state) => state.defisReussis);
  const questionsRatees = useProgressStore((state) => state.questionsRatees);
  const jouerDefi = useProgressStore((state) => state.jouerDefi);
  const jour = jourLocal(new Date());

  const defi = useMemo(() => {
    const parcours = PARCOURS_IDS.map(recupererParcoursBundle).filter((p): p is Parcours => p !== undefined);
    const atteintes = new Map(parcours.map((p) => [p.id, sessionsAtteintes(p.etapes, progression[p.id]?.etapesCompletees ?? [])]));
    return tirerDefiDuJour(
      jour,
      parcours,
      (parcoursId, etapeId) => {
        if (MODE_TEST_TOUT_ACCESSIBLE) return true;
        const etape = parcours.find((p) => p.id === parcoursId)?.etapes.find((e) => e.id === etapeId);
        const session = etape ? sessionDeEtape(etape) : null;
        // On ne pose que des questions déjà validées : le défi révise, il n'enseigne pas.
        return session !== null && (atteintes.get(parcoursId)?.has(session) ?? false) && (progression[parcoursId]?.etapesCompletees ?? []).includes(etapeId);
      },
      new Set(Object.keys(questionsRatees))
    );
  }, [jour, progression, questionsRatees]);

  return {
    jour,
    defi,
    dejaJoue: defisJoues.includes(jour),
    dejaReussi: defisReussis.includes(jour),
    jouer: (reussi) => jouerDefi(jour, reussi),
  };
}
