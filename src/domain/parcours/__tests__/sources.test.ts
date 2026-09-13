import { formaterMoisAnnee, sourcesUniques, verificationLaPlusAncienne } from "../sources";
import type { Parcours } from "../types";

function parcours(id: string, chiffresVerifiesLe?: string, sources?: Parcours["sources"]): Parcours {
  return { id, titre: id, description: "", ordre: 1, type: "voie", version: 1, etapes: [], chiffresVerifiesLe, sources };
}

describe("formaterMoisAnnee", () => {
  test("rend le mois en toutes lettres", () => {
    expect(formaterMoisAnnee("2026-09-12")).toBe("septembre 2026");
    expect(formaterMoisAnnee("2026-01-01")).toBe("janvier 2026");
    expect(formaterMoisAnnee("2025-12-31")).toBe("décembre 2025");
  });

  test("refuse une date mal formée plutôt que d'inventer un mois", () => {
    expect(formaterMoisAnnee("12/09/2026")).toBeUndefined();
    expect(formaterMoisAnnee("2026-13-01")).toBeUndefined();
    expect(formaterMoisAnnee("")).toBeUndefined();
  });
});

describe("verificationLaPlusAncienne", () => {
  test("retient la plus ancienne : c'est elle qui dit l'âge réel de l'information", () => {
    expect(
      verificationLaPlusAncienne([parcours("a", "2026-09-12"), parcours("b", "2024-03-01"), parcours("c", "2025-06-30")])
    ).toBe("2024-03-01");
  });

  test("ignore les parcours sans date", () => {
    expect(verificationLaPlusAncienne([parcours("a"), parcours("b", "2026-09-12")])).toBe("2026-09-12");
  });

  test("rien à annoncer si aucune date", () => {
    expect(verificationLaPlusAncienne([parcours("a")])).toBeUndefined();
  });
});

describe("sourcesUniques", () => {
  test("dédoublonne par URL et trie par libellé", () => {
    const sources = sourcesUniques([
      parcours("a", undefined, [
        { libelle: "Service-public.fr", url: "https://www.service-public.fr" },
        { libelle: "AMF", url: "https://www.amf-france.org" },
      ]),
      parcours("b", undefined, [{ libelle: "Service-public.fr", url: "https://www.service-public.fr" }]),
    ]);
    expect(sources.map((s) => s.libelle)).toEqual(["AMF", "Service-public.fr"]);
  });

  test("un parcours sans source ne casse rien", () => {
    expect(sourcesUniques([parcours("a")])).toEqual([]);
  });
});
