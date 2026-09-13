import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Text } from "react-native";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

import Confidentialite from "../confidentialite";
import donnees from "../../src/constants/confidentialite.json";
import { CONTACT_EMAIL, NOM_APP } from "../../src/constants/identite";

// Le même texte doit exister à deux endroits : l'écran de l'application et la page web
// publique que réclament les magasins. Il n'est écrit qu'une fois
// (`src/constants/confidentialite.json`), la page se génère depuis ce fichier, et ce test
// garantit que la page publiée n'a pas pris de retard sur le texte de l'app.
//
// Sans lui, corriger la politique dans l'app sans relancer `npm run confidentialite`
// laisserait en ligne une version périmée — c'est-à-dire une politique fausse.

const PAGE = readFileSync(resolve(__dirname, "../../docs/confidentialite.html"), "utf8");
const ACCUEIL = readFileSync(resolve(__dirname, "../../docs/index.html"), "utf8");

function textesRendus(arbre: ReactTestRenderer): string {
  return arbre.root
    .findAllByType(Text)
    .map((noeud) =>
      [noeud.props.children]
        .flat(Infinity)
        .filter((enfant) => typeof enfant === "string" || typeof enfant === "number")
        .join("")
    )
    .join(" ");
}

/** Le texte brut de la page, entités HTML remises en clair. */
const PAGE_EN_TEXTE = PAGE.replace(/<[^>]*>/g, " ")
  .replace(/&quot;/g, '"')
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/\s+/g, " ");

describe("page web de la politique", () => {
  test("porte le nom de l'application et l'adresse de contact", () => {
    expect(PAGE).toContain(NOM_APP);
    expect(PAGE).toContain(`mailto:${CONTACT_EMAIL}`);
  });

  test("reprend chaque section du texte de l'application", () => {
    for (const section of donnees.sections) {
      expect(PAGE_EN_TEXTE).toContain(section.titre);
    }
  });

  test("reprend chaque paragraphe et chaque point, mot pour mot", () => {
    // C'est l'invariant qui compte : une phrase corrigée dans l'app et pas régénérée sur
    // le web rendrait la politique publiée inexacte.
    for (const section of donnees.sections) {
      for (const texte of [...section.paragraphes, ...(section.points ?? [])]) {
        expect(PAGE_EN_TEXTE).toContain(texte.replace(/\s+/g, " "));
      }
    }
  });

  test("annonce la même date de mise à jour", () => {
    const [annee, mois, jour] = donnees.miseAJour.split("-").map(Number);
    const mois_fr = [
      "janvier", "février", "mars", "avril", "mai", "juin",
      "juillet", "août", "septembre", "octobre", "novembre", "décembre",
    ][mois - 1];
    expect(PAGE_EN_TEXTE).toContain(`${jour} ${mois_fr} ${annee}`);
  });

  test("est une page autonome : aucune ressource externe à charger", () => {
    // Une politique qui dépend d'un CDN devient illisible le jour où il tombe, et fait
    // fuiter l'adresse IP de ses lecteurs vers un tiers.
    expect(PAGE).not.toMatch(/<script/i);
    expect(PAGE).not.toMatch(/src="https?:/i);
    expect(PAGE).not.toMatch(/href="https?:/i);
    expect(PAGE).not.toMatch(/@import/i);
  });
});

describe("écran Confidentialité de l'application", () => {
  test("affiche le même texte que la page", () => {
    let arbre!: ReactTestRenderer;
    act(() => {
      arbre = create(<Confidentialite />);
    });
    const affiche = textesRendus(arbre).replace(/\s+/g, " ");
    for (const section of donnees.sections) {
      expect(affiche).toContain(section.titre);
      expect(affiche).toContain(section.paragraphes[0].replace(/\s+/g, " "));
    }
    expect(affiche).toContain(CONTACT_EMAIL);
    act(() => arbre.unmount());
  });
});

describe("page d'accueil publique", () => {
  // Cette page sert d'adresse de support dans App Store Connect : elle doit donc
  // toujours porter un moyen de contact et un lien vers la politique.
  test("porte le nom de l'application et un contact cliquable", () => {
    expect(ACCUEIL).toContain(NOM_APP);
    expect(ACCUEIL).toContain(`mailto:${CONTACT_EMAIL}`);
  });

  test("renvoie vers la politique de confidentialité", () => {
    expect(ACCUEIL).toContain('href="confidentialite.html"');
  });

  test("porte l'avertissement sur le conseil en investissement", () => {
    // Le même avertissement que dans l'application : une app de finance qui l'oublie
    // sur sa page publique se met en porte-à-faux.
    expect(ACCUEIL).toContain("ne constitue en");
    expect(ACCUEIL).toContain("conseil en investissement");
  });

  test("annonce des chiffres comptés dans le contenu réel", () => {
    // Écrits à la main, ils seraient faux à la prochaine session ajoutée.
    const parcours = ["intro", "banque", "marche", "entreprise", "quotidien"].map(
      (id) => require(`../../src/data/content/${id}.json`) as { etapes: unknown[] }
    );
    const etapes = parcours.reduce((total, p) => total + p.etapes.length, 0);
    expect(ACCUEIL).toContain(`<strong>${etapes}</strong>`);
    expect(ACCUEIL).toContain(`<strong>${parcours.length}</strong>`);
  });

  test("est une page autonome : aucune ressource externe à charger", () => {
    expect(ACCUEIL).not.toMatch(/<script/i);
    expect(ACCUEIL).not.toMatch(/src="https?:/i);
    expect(ACCUEIL).not.toMatch(/href="https?:/i);
  });
});
