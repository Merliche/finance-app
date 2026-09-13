import { recupererParcoursBundle } from "../../content";

// Ce que ce fichier surveille : une build livrée SANS les variables EXPO_PUBLIC_SUPABASE_*.
//
// C'est le cas par défaut sur EAS — `.env` est gitignoré, donc absent de l'archive envoyée
// au serveur de build — et la faute ne se voit nulle part : ni tsc, ni les tests, ni
// expo-doctor. Elle n'apparaît qu'au lancement sur l'appareil.
//
// L'app est faite pour se passer du réseau : le contenu descend Supabase → cache → bundle,
// et les parcours voyagent dans le binaire. Une clé manquante doit donc dégrader vers le
// repli, comme une coupure réseau, et surtout pas empêcher le démarrage.

const CLES = ["EXPO_PUBLIC_SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_ANON_KEY"] as const;

describe("build sans clés Supabase", () => {
  const valeursInitiales = CLES.map((cle) => process.env[cle]);

  beforeEach(() => {
    jest.resetModules();
    // Il faut vider `process.env` EN PLACE, sans le remplacer : babel-preset-expo réécrit
    // `process.env.EXPO_PUBLIC_*` en un accès à `expo/virtual/env`, dont le module retient
    // une référence vers l'objet `process.env` d'origine. Lui en substituer un autre
    // laisserait le client lire les anciennes valeurs.
    for (const cle of CLES) delete process.env[cle];
  });

  afterAll(() => {
    CLES.forEach((cle, index) => {
      const valeur = valeursInitiales[index];
      if (valeur === undefined) delete process.env[cle];
      else process.env[cle] = valeur;
    });
  });

  /** Charge le vrai client, sans le double inerte de jest.setup.js. */
  function chargerClient() {
    let module: typeof import("../supabaseClient") | undefined;
    jest.isolateModules(() => {
      jest.unmock("../supabaseClient");
      module = jest.requireActual("../supabaseClient");
    });
    return module!;
  }

  test("importer le client ne lève pas — c'est ce qui bloquait le démarrage", () => {
    expect(() => chargerClient()).not.toThrow();
  });

  test("le client vaut null, et le drapeau le dit", () => {
    const { supabase, supabaseConfigure } = chargerClient();
    expect(supabaseConfigure).toBe(false);
    expect(supabase).toBeNull();
  });

  test("le contenu embarqué reste servi : c'est lui, le repli", () => {
    // Sans cette garantie, dégrader en douceur ne servirait à rien : l'app démarrerait
    // pour afficher un parcours vide.
    for (const id of ["intro", "banque", "marche", "entreprise", "quotidien"]) {
      const parcours = recupererParcoursBundle(id);
      expect(`${id} : ${parcours?.etapes.length ?? 0} étapes`).not.toBe(`${id} : 0 étapes`);
    }
  });

  test("l'inscription email répond une erreur au lieu de planter l'écran", async () => {
    // L'écran de récompense fait `await inscrireEmail(...)` sans try/catch : une exception
    // ici deviendrait un rejet non capturé au moment où l'utilisateur valide son email.
    let inscrire!: typeof import("../emailRepository").inscrireEmail;
    jest.isolateModules(() => {
      jest.doMock("../supabaseClient", () => ({ supabase: null, supabaseConfigure: false }));
      inscrire = jest.requireActual("../emailRepository").inscrireEmail;
    });

    await expect(inscrire("test@exemple.fr", "banque")).resolves.toEqual({
      statut: "erreur",
      message: expect.any(String),
    });
  });
});
