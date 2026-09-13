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
