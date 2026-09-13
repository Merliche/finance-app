// Génère le petit site public de l'application : la page d'accueil, qui sert aussi
// d'adresse de support, et la politique de confidentialité.
//
// Tout est généré, rien n'est écrit à la main. Le texte de la politique vient de
// `src/constants/confidentialite.json`, celui que l'application affiche à l'écran ; le nom
// et l'adresse de contact viennent de `src/constants/identite.ts` ; et les chiffres de
// l'accueil sont comptés dans le contenu réel des parcours. Recopier l'un de ces trois
// éléments à la main, c'est se garantir qu'il sera faux dans six mois.
//
// Usage : npm run site
// Sortie : docs/index.html et docs/confidentialite.html — deux pages autonomes, sans
// script ni ressource externe, à déposer sur n'importe quel hébergement statique
// (GitHub Pages sert le dossier `docs/` tel quel).
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DOSSIER = resolve(racine, "docs");

const politique = JSON.parse(
  readFileSync(resolve(racine, "src/constants/confidentialite.json"), "utf8")
);

// Le nom et l'adresse de contact vivent dans `identite.ts` : on les y lit plutôt que de
// les redéfinir ici, pour qu'une adresse changée d'un côté ne subsiste pas de l'autre.
const identite = readFileSync(resolve(racine, "src/constants/identite.ts"), "utf8");

function lireConstante(nom) {
  const trouve = new RegExp(`export const ${nom} = "([^"]+)"`).exec(identite);
  if (!trouve) {
    throw new Error(
      `Constante ${nom} introuvable dans src/constants/identite.ts : ` +
        "le site ne peut pas être généré sans elle."
    );
  }
  return trouve[1];
}

const NOM_APP = lireConstante("NOM_APP");
const CONTACT_EMAIL = lireConstante("CONTACT_EMAIL");

/** Compte ce que contiennent réellement les parcours embarqués. */
function chiffresDuContenu() {
  const dossier = resolve(racine, "src/data/content");
  const parcours = readdirSync(dossier)
    .filter((nom) => nom.endsWith(".json") && nom !== "elementsLateraux.json")
    .map((nom) => JSON.parse(readFileSync(resolve(dossier, nom), "utf8")));

  const sessions = new Set();
  let etapes = 0;
  for (const p of parcours) {
    etapes += p.etapes.length;
    for (const etape of p.etapes) {
      const numero = /-?s(\d+)-/.exec(etape.id)?.[1];
      if (numero) sessions.add(`${p.id}-${numero}`);
    }
  }

  const lateraux = JSON.parse(readFileSync(resolve(dossier, "elementsLateraux.json"), "utf8"));
  return {
    parcours: parcours.length,
    etapes,
    sessions: sessions.size,
    outils: lateraux.filter((element) => element.type !== "badge").length,
  };
}

const chiffres = chiffresDuContenu();

/** Échappe ce qui est inséré dans du HTML. Le texte vient de nous, mais la règle vaut toujours. */
function html(texte) {
  return texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function dateEnFrancais(iso) {
  const [annee, mois, jour] = iso.split("-").map(Number);
  return `${jour} ${MOIS[mois - 1]} ${annee}`;
}

const STYLES = `      :root {
        color-scheme: light dark;
        --fond: #f5f3ee;
        --surface: #ffffff;
        --texte: #1a1d23;
        --attenue: #676d79;
        --tertiaire: #838891;
        --bordure: #e6e3dc;
        --accent: #5b4bdb;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --fond: #15161a;
          --surface: #1e2027;
          --texte: #f1f0ed;
          --attenue: #aeb4bf;
          --tertiaire: #868d99;
          --bordure: #343843;
          --accent: #9b8dff;
        }
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 0 20px 64px;
        background: var(--fond);
        color: var(--texte);
        font: 16px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        -webkit-text-size-adjust: 100%;
      }
      main { max-width: 46rem; margin: 0 auto; }
      header { padding: 56px 0 28px; border-bottom: 1px solid var(--bordure); margin-bottom: 8px; }
      .surtitre {
        margin: 0;
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--accent);
      }
      h1 { margin: 10px 0 0; font-size: 2rem; line-height: 1.2; letter-spacing: -0.02em; }
      header p { margin: 12px 0 0; color: var(--attenue); }
      section { margin-top: 34px; }
      h2 { margin: 0 0 12px; font-size: 1.2rem; line-height: 1.3; letter-spacing: -0.01em; }
      p { margin: 0 0 12px; color: var(--attenue); }
      ul { margin: 0 0 12px; padding-left: 1.15rem; color: var(--attenue); }
      li { margin-bottom: 8px; }
      a { color: var(--accent); }
      .encart {
        margin-top: 40px;
        padding: 22px;
        background: var(--surface);
        border: 1px solid var(--bordure);
        border-radius: 16px;
      }
      .encart h2 { margin-top: 0; }
      .encart a { font-weight: 600; word-break: break-all; }
      .chiffres {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 22px 0 0;
        padding: 0;
        list-style: none;
      }
      .chiffres li {
        flex: 1 1 7rem;
        margin: 0;
        padding: 14px 12px;
        text-align: center;
        background: var(--surface);
        border: 1px solid var(--bordure);
        border-radius: 14px;
      }
      .chiffres strong { display: block; font-size: 1.5rem; color: var(--texte); }
      .chiffres span { font-size: 0.82rem; color: var(--tertiaire); }
      footer { margin-top: 32px; color: var(--tertiaire); font-size: 0.85rem; }
      @media (max-width: 34rem) {
        header { padding-top: 36px; }
        h1 { font-size: 1.6rem; }
      }`;

function gabarit({ titre, description, surtitre, h1, chapeau, corps }) {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${html(titre)}</title>
    <meta name="description" content="${html(description)}" />
    <style>
${STYLES}
    </style>
  </head>
  <body>
    <main>
      <header>
        <p class="surtitre">${html(surtitre)}</p>
        <h1>${html(h1)}</h1>
        <p>${html(chapeau)}</p>
      </header>

${corps}
    </main>
  </body>
</html>
`;
}

// --- Page d'accueil, qui sert aussi d'adresse de support ----------------------------
const accueil = gabarit({
  titre: `${NOM_APP} — comprendre son argent, pas à pas`,
  description:
    `${NOM_APP} est une application gratuite d'éducation financière en français : budget, ` +
    "intérêts, inflation, crédit, banque, marché, entreprise et vie quotidienne.",
  surtitre: NOM_APP,
  h1: "Comprendre ton argent, pas à pas.",
  chapeau:
    "Une application gratuite pour apprendre les bases de la finance personnelle, " +
    "expliquées simplement, sans jargon et sans jugement.",
  corps: `    <section>
      <h2>Ce que c'est</h2>
      <p>
        Un chemin d'apprentissage, pas un cours. Des sessions courtes qui s'enchaînent :
        le budget, les intérêts composés, l'inflation, le crédit — puis quatre voies à
        explorer, la banque, le marché, l'entreprise et la vie quotidienne.
      </p>
      <p>
        Chaque notion se manipule : simulateurs à curseurs, comparateurs, mises en
        situation et exercices chiffrés. Tous les calculs demandés se font de tête, sans
        calculatrice.
      </p>
      <ul class="chiffres">
        <li><strong>${chiffres.parcours}</strong><span>parcours</span></li>
        <li><strong>${chiffres.sessions}</strong><span>sessions</span></li>
        <li><strong>${chiffres.etapes}</strong><span>étapes</span></li>
        <li><strong>${chiffres.outils}</strong><span>outils</span></li>
      </ul>
    </section>

    <section>
      <h2>Sans compte, sans publicité</h2>
      <p>
        Rien à créer, rien à donner pour commencer. Ta progression reste sur ton téléphone
        et n'est envoyée nulle part. L'application ne contient ni publicité, ni traceur, ni
        mesure d'audience.
      </p>
      <p>
        Le détail est dans la
        <a href="confidentialite.html">politique de confidentialité</a>.
      </p>
    </section>

    <section>
      <h2>Avertissement</h2>
      <p>
        Le contenu de cette application est éducatif et généraliste. Il ne constitue en
        aucun cas un conseil en investissement, ni une recommandation personnalisée. Pour
        toute décision financière, rapproche-toi d'un professionnel qualifié.
      </p>
    </section>

    <section class="encart">
      <h2>Besoin d'aide ?</h2>
      <p>
        Une question, un contenu qui te semble faux, un problème dans l'application ? Écris
        directement, on répond :
      </p>
      <p><a href="mailto:${html(CONTACT_EMAIL)}">${html(CONTACT_EMAIL)}</a></p>
    </section>

    <footer>
      <p><a href="confidentialite.html">Politique de confidentialité</a></p>
    </footer>
`,
});

// --- Politique de confidentialité ----------------------------------------------------
const sections = politique.sections
  .map((section) => {
    const paragraphes = section.paragraphes.map((p) => `      <p>${html(p)}</p>`).join("\n");
    const points = section.points
      ? "\n      <ul>\n" + section.points.map((p) => `        <li>${html(p)}</li>`).join("\n") + "\n      </ul>"
      : "";
    return `    <section>\n      <h2>${html(section.titre)}</h2>\n${paragraphes}${points}\n    </section>`;
  })
  .join("\n\n");

const confidentialite = gabarit({
  titre: `Politique de confidentialité — ${NOM_APP}`,
  description: `Ce que l'application ${NOM_APP} collecte, ce qu'elle n'en fait pas, et comment exercer tes droits.`,
  surtitre: NOM_APP,
  h1: "Politique de confidentialité",
  chapeau: "Ce que l'application sait de toi, et ce qu'elle n'en fait pas.",
  corps: `${sections}

    <section class="encart">
      <h2>Nous écrire</h2>
      <p>
        Pour toute question sur tes données, pour savoir ce que nous avons sur toi, ou pour
        demander le retrait de ton adresse :
      </p>
      <p><a href="mailto:${html(CONTACT_EMAIL)}">${html(CONTACT_EMAIL)}</a></p>
    </section>

    <footer>
      <p>Dernière mise à jour : ${dateEnFrancais(politique.miseAJour)}.</p>
      <p><a href="index.html">Retour à l'accueil</a></p>
    </footer>
`,
});

mkdirSync(DOSSIER, { recursive: true });
writeFileSync(resolve(DOSSIER, "index.html"), accueil, "utf8");
writeFileSync(resolve(DOSSIER, "confidentialite.html"), confidentialite, "utf8");
console.log(
  `site écrit : docs/index.html (${accueil.length} caractères) et ` +
    `docs/confidentialite.html (${confidentialite.length} caractères, ${politique.sections.length} sections)`
);
console.log(
  `chiffres comptés dans le contenu : ${chiffres.parcours} parcours, ${chiffres.sessions} sessions, ` +
    `${chiffres.etapes} étapes, ${chiffres.outils} outils`
);
