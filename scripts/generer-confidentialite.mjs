// Génère la page web de la politique de confidentialité, à partir du MÊME texte que
// l'écran de l'application (`src/constants/confidentialite.json`).
//
// Les magasins d'applications exigent une adresse publique, atteignable sans installer
// l'app, et le texte qui s'y trouve doit correspondre à celui de l'app. Générer la page
// plutôt que de la recopier est la seule façon d'en être sûr dans six mois.
//
// Usage : npm run confidentialite
// Sortie : docs/confidentialite.html — une page autonome, sans dépendance ni script,
// à déposer sur n'importe quel hébergement statique (GitHub Pages sert `docs/` tel quel).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SORTIE = resolve(racine, "docs/confidentialite.html");

const donnees = JSON.parse(readFileSync(resolve(racine, "src/constants/confidentialite.json"), "utf8"));

// Le nom et l'adresse de contact vivent dans `identite.ts` : on les y lit plutôt que de
// les redéfinir ici, pour qu'une adresse changée d'un côté ne subsiste pas de l'autre.
const identite = readFileSync(resolve(racine, "src/constants/identite.ts"), "utf8");

function lireConstante(nom) {
  const trouve = new RegExp(`export const ${nom} = "([^"]+)"`).exec(identite);
  if (!trouve) {
    throw new Error(
      `Constante ${nom} introuvable dans src/constants/identite.ts : ` +
        "la page ne peut pas être générée sans elle."
    );
  }
  return trouve[1];
}

const NOM_APP = lireConstante("NOM_APP");
const CONTACT_EMAIL = lireConstante("CONTACT_EMAIL");

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

const corps = donnees.sections
  .map((section) => {
    const paragraphes = section.paragraphes.map((p) => `      <p>${html(p)}</p>`).join("\n");
    const points = section.points
      ? "\n      <ul>\n" + section.points.map((p) => `        <li>${html(p)}</li>`).join("\n") + "\n      </ul>"
      : "";
    return `    <section>\n      <h2>${html(section.titre)}</h2>\n${paragraphes}${points}\n    </section>`;
  })
  .join("\n\n");

const page = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Politique de confidentialité — ${html(NOM_APP)}</title>
    <meta
      name="description"
      content="Ce que l'application ${html(NOM_APP)} collecte, ce qu'elle n'en fait pas, et comment exercer tes droits."
    />
    <style>
      :root {
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
      .contact {
        margin-top: 40px;
        padding: 22px;
        background: var(--surface);
        border: 1px solid var(--bordure);
        border-radius: 16px;
      }
      .contact h2 { margin-top: 0; }
      .contact a { color: var(--accent); font-weight: 600; word-break: break-all; }
      footer { margin-top: 32px; color: var(--tertiaire); font-size: 0.85rem; }
      @media (max-width: 34rem) {
        header { padding-top: 36px; }
        h1 { font-size: 1.6rem; }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <p class="surtitre">${html(NOM_APP)}</p>
        <h1>Politique de confidentialité</h1>
        <p>Ce que l'application sait de toi, et ce qu'elle n'en fait pas.</p>
      </header>

${corps}

      <section class="contact">
        <h2>Nous écrire</h2>
        <p>
          Pour toute question sur tes données, pour savoir ce que nous avons sur toi, ou pour
          demander le retrait de ton adresse :
        </p>
        <p><a href="mailto:${html(CONTACT_EMAIL)}">${html(CONTACT_EMAIL)}</a></p>
      </section>

      <footer>
        <p>Dernière mise à jour : ${dateEnFrancais(donnees.miseAJour)}.</p>
      </footer>
    </main>
  </body>
</html>
`;

mkdirSync(dirname(SORTIE), { recursive: true });
writeFileSync(SORTIE, page, "utf8");
console.log(`page écrite : docs/confidentialite.html (${page.length} caractères, ${donnees.sections.length} sections)`);
