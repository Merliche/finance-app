-- Voir PROJECT.md §2 et §3 : contenu des parcours hébergé sur Supabase (éditable sans
-- redeploy), capture d'email sans compte utilisateur.

-- ============================================================================
-- parcours : contenu des parcours (intro, banque, marche, entreprise)
-- ============================================================================

create table public.parcours (
  id text primary key,             -- "intro" | "banque" | "marche" | "entreprise"
  contenu jsonb not null,          -- Parcours complet (types.ts) : etapes, recompense, etc.
  version integer not null default 1, -- dupliqué depuis contenu->version : évite de parser le
                                       -- jsonb côté client juste pour vérifier le cache
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.parcours enable row level security;

-- Lecture publique : l'app (clé anon, aucun compte) doit pouvoir charger le contenu
-- des parcours sans authentification.
create policy "Lecture publique des parcours"
  on public.parcours
  for select
  to anon, authenticated
  using (true);

-- Aucune policy insert/update/delete n'est créée pour anon/authenticated : avec RLS
-- activé, l'absence de policy pour une commande donnée refuse cette commande par
-- défaut, pour tout le monde sauf le rôle postgres/service_role (qui contourne RLS).
-- C'est ce qui interdit l'écriture publique — pas une policy de refus explicite,
-- qui n'existe pas en tant que telle en Postgres RLS.

-- ============================================================================
-- email_subscribers : capture d'email pour être prévenu des sorties de livres
-- ============================================================================

create table public.email_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source_parcours_id text references public.parcours(id),
  created_at timestamptz not null default now()
);

alter table public.email_subscribers enable row level security;

-- Insertion publique : l'app doit pouvoir enregistrer un email sans compte.
create policy "Insertion publique des emails"
  on public.email_subscribers
  for insert
  to anon, authenticated
  with check (true);

-- Aucune policy select n'est créée : même mécanisme de refus par défaut que pour
-- "parcours" ci-dessus. Avec RLS activé et zéro policy SELECT pour anon/authenticated,
-- toute requête de lecture avec la clé publique renvoie 0 ligne (pas une erreur,
-- un filtrage silencieux) — la table est illisible depuis l'app quel que soit le
-- SELECT envoyé. Seul le rôle service_role (jamais exposé côté client) peut la lire.
