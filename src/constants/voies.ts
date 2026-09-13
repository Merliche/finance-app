// Registre statique des voies débloquées après l'intro (voir PROJECT.md §1).
// Sert de fallback d'affichage tant que leur contenu n'est pas encore chargé/seedé
// dans Supabase — la vraie source de vérité reste le Parcours récupéré via
// contentRepository (titre, description, etc.).
//
// L'ordre est celui de la fourche, de gauche à droite sur la carte.
export const VOIES = [
  { id: "banque", labelParDefaut: "Banque" },
  { id: "marche", labelParDefaut: "Marché" },
  { id: "entreprise", labelParDefaut: "Entreprise" },
  { id: "quotidien", labelParDefaut: "Quotidien" },
] as const;
