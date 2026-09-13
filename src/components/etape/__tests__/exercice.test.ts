import { lireNombre, reponseCorrecte } from "../Exercice";

describe("lireNombre", () => {
  test("accepte les écritures françaises et anglaises", () => {
    expect(lireNombre("1 250,5")).toBe(1250.5);
    expect(lireNombre("1250.5")).toBe(1250.5);
    expect(lireNombre(" 42 ")).toBe(42);
  });

  test("renvoie NaN pour une saisie vide ou incomplète", () => {
    expect(Number.isNaN(lireNombre(""))).toBe(true);
    expect(Number.isNaN(lireNombre("-"))).toBe(true);
    expect(Number.isNaN(lireNombre("abc"))).toBe(true);
  });
});

describe("reponseCorrecte", () => {
  test("un nombre est accepté dans la tolérance", () => {
    const item = { id: "a", type: "nombre" as const, enonce: "", reponse: 230.29, tolerance: 1, explication: "" };
    expect(reponseCorrecte(item, 230)).toBe(true);
    expect(reponseCorrecte(item, 231.5)).toBe(false);
    expect(reponseCorrecte(item, Number.NaN)).toBe(false);
    expect(reponseCorrecte(item, true)).toBe(false);
  });

  test("vrai/faux compare strictement", () => {
    const item = { id: "b", type: "vrai_faux" as const, enonce: "", reponse: false, explication: "" };
    expect(reponseCorrecte(item, false)).toBe(true);
    expect(reponseCorrecte(item, true)).toBe(false);
  });
});
