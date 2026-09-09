// Capture d'email — voir PROJECT.md §2. Insertion publique uniquement (RLS, voir la
// migration 20260909000000) : pas de lecture possible depuis le client, donc pas de
// vérification préalable d'existence — on tente l'insert et on interprète l'erreur.
import { supabase } from "./supabaseClient";

const CODE_ERREUR_DOUBLON = "23505"; // violation de contrainte unique Postgres

export type ResultatInscriptionEmail =
  | { statut: "ok" }
  | { statut: "deja_inscrit" }
  | { statut: "erreur"; message: string };

/**
 * Enregistre un email dans `email_subscribers`. `sourceParcoursId` trace le parcours
 * à l'origine de la capture (ex: écran reward d'une voie), optionnel.
 */
export async function inscrireEmail(
  email: string,
  sourceParcoursId?: string
): Promise<ResultatInscriptionEmail> {
  const { error } = await supabase
    .from("email_subscribers")
    .insert({ email, source_parcours_id: sourceParcoursId ?? null });

  if (!error) {
    return { statut: "ok" };
  }

  if (error.code === CODE_ERREUR_DOUBLON) {
    return { statut: "deja_inscrit" };
  }

  return { statut: "erreur", message: error.message };
}
