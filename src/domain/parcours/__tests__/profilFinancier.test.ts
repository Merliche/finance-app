import { formaterEffort, profilEstRenseigne, tauxHoraire, valeursDepart, variablesPersonnalisees } from "../profilFinancier";
import type { Simulateur } from "../types";

const epargne: Simulateur = {
  formule: "epargne_programmee",
  variables: [
    { id: "versement", label: "Versement", unite: "€", min: 50, max: 1000, pas: 25, valeurParDefaut: 150 },
    { id: "taux", label: "Taux", unite: "%", min: 0, max: 10, pas: 0.5, valeurParDefaut: 6 },
    { id: "duree", label: "Durée", unite: "ans", min: 1, max: 40, pas: 1, valeurParDefaut: 25 },
  ],
  resultat: { label: "Valeur", unite: "€" },
};

describe("profilEstRenseigne", () => {
  test("un profil vide ou absent ne compte pas", () => {
    expect(profilEstRenseigne(undefined)).toBe(false);
    expect(profilEstRenseigne({})).toBe(false);
    expect(profilEstRenseigne({ loyer: 700 })).toBe(true);
  });
});

describe("tauxHoraire", () => {
  test("un temps plein à 2 000 € nets vaut environ 13 € de l'heure", () => {
    expect(tauxHoraire(2000)).toBeCloseTo(13.19, 1);
  });
});

describe("formaterEffort", () => {
  test("monte l'unité à mesure que le montant grossit", () => {
    expect(formaterEffort(5, 2000)).toContain("min");
    expect(formaterEffort(300, 2000)).toContain("h de ton travail");
    expect(formaterEffort(2000, 2000)).toContain("semaine");
    expect(formaterEffort(8000, 2000)).toContain("mois de salaire");
    expect(formaterEffort(200000, 2000)).toContain("ans de salaire");
  });

  test("720 € pour quelqu'un à 2 000 € nets, c'est environ 55 h", () => {
    expect(formaterEffort(720, 2000)).toBe("55 h de ton travail");
  });

  test("rien à afficher sans revenu ou sans montant", () => {
    expect(formaterEffort(720, 0)).toBeUndefined();
    expect(formaterEffort(0, 2000)).toBeUndefined();
    expect(formaterEffort(Number.POSITIVE_INFINITY, 2000)).toBeUndefined();
  });
});

describe("valeursDepart", () => {
  test("sans profil, ce sont les valeurs d'exemple du contenu", () => {
    expect(valeursDepart(epargne, undefined)).toEqual({ versement: 150, taux: 6, duree: 25 });
  });

  test("le versement part à un dixième du revenu, arrondi au pas", () => {
    // 2 340 € nets → 234 € → arrondi au pas de 25 → 225 €.
    expect(valeursDepart(epargne, { revenuNet: 2340 }).versement).toBe(225);
  });

  test("une valeur personnalisée reste dans les bornes de la variable", () => {
    expect(valeursDepart(epargne, { revenuNet: 50000 }).versement).toBe(1000);
    expect(valeursDepart(epargne, { revenuNet: 100 }).versement).toBe(50);
  });

  test("les variables sans équivalent dans le profil ne bougent pas", () => {
    const valeurs = valeursDepart(epargne, { revenuNet: 2000, loyer: 700, epargne: 5000 });
    expect(valeurs.taux).toBe(6);
    expect(valeurs.duree).toBe(25);
  });
});

describe("variablesPersonnalisees", () => {
  test("ne liste que ce que le profil sait remplir", () => {
    expect(variablesPersonnalisees(epargne, { revenuNet: 2000 })).toEqual(["versement"]);
    expect(variablesPersonnalisees(epargne, { loyer: 700 })).toEqual([]);
    expect(variablesPersonnalisees(epargne, undefined)).toEqual([]);
  });
});
