// Registre statique des 3 voies débloquées après l'intro (voir PROJECT.md §1).
// Sert de fallback d'affichage tant que leur contenu n'est pas encore chargé/seedé
// dans Supabase — la vraie source de vérité reste le Parcours récupéré via
// contentRepository (titre, description, etc.).
export const VOIES = [
  { id: "banque", labelParDefaut: "Banque" },
  { id: "marche", labelParDefaut: "Marché" },
  { id: "entreprise", labelParDefaut: "Entreprise" },
] as const;
