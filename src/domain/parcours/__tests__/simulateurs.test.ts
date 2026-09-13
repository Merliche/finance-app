import {
  calculerCapaciteEmprunt,
  calculerCoutTotalCredit,
  calculerEpargneProgrammee,
  calculerInteretCompose,
  calculerMensualiteCredit,
  calculerPointMort,
  calculerPouvoirAchat,
  calculerRegle72,
  calculerRendementLocatif,
  formaterResultat,
  resoudreFormule,
  VARIABLES_PAR_FORMULE,
} from "../simulateurs";

describe("calculerEpargneProgrammee", () => {
  test("100 € par mois à 0 % pendant 2 ans, c'est 2 400 €", () => {
    expect(calculerEpargneProgrammee({ versement: 100, taux: 0, duree: 2 })).toBe(2400);
  });

  test("150 € par mois à 6 % pendant 25 ans", () => {
    // Valeur acquise d'une rente mensuelle : 150 × ((1 + 0,005)^300 − 1) / 0,005
    expect(calculerEpargneProgrammee({ versement: 150, taux: 6, duree: 25 })).toBeCloseTo(103949.09, 0);
  });

  test("le résultat dépasse toujours la somme des versements dès que le taux est positif", () => {
    const verse = 200 * 12 * 10;
    expect(calculerEpargneProgrammee({ versement: 200, taux: 3, duree: 10 })).toBeGreaterThan(verse);
  });
});

describe("calculerInteretCompose", () => {
  test("1000 € à 3 % sur 10 ans", () => {
    expect(calculerInteretCompose({ capital: 1000, taux: 3, duree: 10 })).toBeCloseTo(1343.92, 2);
  });

  test("un taux nul laisse le capital inchangé", () => {
    expect(calculerInteretCompose({ capital: 500, taux: 0, duree: 30 })).toBe(500);
  });

  test("un taux négatif modélise l'érosion par l'inflation", () => {
    const valeur = calculerInteretCompose({ capital: 1000, taux: -2, duree: 10 });
    expect(valeur).toBeCloseTo(817.07, 2);
    expect(valeur).toBeLessThan(1000);
  });

  test("règle des 72 : à 6 %, le capital double en ~12 ans", () => {
    expect(calculerInteretCompose({ capital: 100, taux: 6, duree: 12 })).toBeCloseTo(201.22, 1);
  });
});

describe("calculerMensualiteCredit", () => {
  test("10 000 € à 5 % sur 48 mois", () => {
    expect(calculerMensualiteCredit({ montant: 10000, taux: 5, duree: 48 })).toBeCloseTo(230.29, 2);
  });

  test("à taux nul, c'est le capital divisé par la durée (pas de division par zéro)", () => {
    expect(calculerMensualiteCredit({ montant: 1200, taux: 0, duree: 12 })).toBe(100);
  });

  test("allonger la durée baisse la mensualité mais augmente le coût total", () => {
    const courte = calculerMensualiteCredit({ montant: 18000, taux: 5, duree: 24 });
    const longue = calculerMensualiteCredit({ montant: 18000, taux: 5, duree: 96 });
    expect(longue).toBeLessThan(courte);
    expect(longue * 96).toBeGreaterThan(courte * 24);
  });
});

describe("calculerRegle72", () => {
  test("à 6 %, un capital double en 12 ans ; à 2 %, en 36", () => {
    expect(calculerRegle72({ taux: 6 })).toBe(12);
    expect(calculerRegle72({ taux: 2 })).toBe(36);
  });

  test("à taux nul ou négatif, jamais (infini)", () => {
    expect(calculerRegle72({ taux: 0 })).toBe(Number.POSITIVE_INFINITY);
    expect(calculerRegle72({ taux: -1 })).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("calculerPouvoirAchat", () => {
  test("1 000 € sous 2 % d'inflation pendant 10 ans valent ~820 € d'aujourd'hui", () => {
    expect(calculerPouvoirAchat({ capital: 1000, inflation: 2, duree: 10 })).toBeCloseTo(820.35, 1);
  });

  test("est l'inverse exact des intérêts composés au même taux", () => {
    const futur = calculerInteretCompose({ capital: 1000, taux: 3, duree: 7 });
    expect(calculerPouvoirAchat({ capital: futur, inflation: 3, duree: 7 })).toBeCloseTo(1000, 6);
  });
});

describe("calculerCoutTotalCredit", () => {
  test("10 000 € à 5 % sur 48 mois coûtent ~1 054 € d'intérêts", () => {
    expect(calculerCoutTotalCredit({ montant: 10000, taux: 5, duree: 48 })).toBeCloseTo(1053.97, 0);
  });

  test("à taux nul, le crédit ne coûte rien", () => {
    expect(calculerCoutTotalCredit({ montant: 1200, taux: 0, duree: 12 })).toBeCloseTo(0, 6);
  });
});

describe("calculerCapaciteEmprunt", () => {
  test("2 500 € nets, 3,5 % sur 25 ans : environ 175 000 €", () => {
    // Mensualité max 875 € ; 875 × (1 − 1,0029167^−300) / 0,0029167
    expect(calculerCapaciteEmprunt({ revenu: 2500, taux: 3.5, duree: 25 })).toBeCloseTo(174_780, -2);
  });

  test("la mensualité de la capacité calculée retombe sur 35 % du revenu", () => {
    const capacite = calculerCapaciteEmprunt({ revenu: 3000, taux: 4, duree: 20 });
    expect(calculerMensualiteCredit({ montant: capacite, taux: 4, duree: 240 })).toBeCloseTo(1050, 4);
  });

  test("à taux nul, c'est la somme des mensualités maximales", () => {
    expect(calculerCapaciteEmprunt({ revenu: 2000, taux: 0, duree: 10 })).toBe(700 * 120);
  });
});

describe("calculerRendementLocatif", () => {
  test("700 € de loyer pour 150 000 € : 5,6 % brut", () => {
    expect(calculerRendementLocatif({ loyer: 700, prix: 150000 })).toBeCloseTo(5.6, 6);
  });

  test("un prix nul ne divise pas par zéro", () => {
    expect(calculerRendementLocatif({ loyer: 700, prix: 0 })).toBe(0);
  });
});

describe("calculerPointMort", () => {
  test("10 000 € de charges fixes à 40 % de marge : 25 000 € de ventes", () => {
    expect(calculerPointMort({ chargesFixes: 10000, tauxMarge: 40 })).toBe(25000);
  });

  test("sans marge, le point mort est inatteignable", () => {
    expect(calculerPointMort({ chargesFixes: 10000, tauxMarge: 0 })).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("resoudreFormule", () => {
  test("résout chaque formule vers sa fonction de calcul", () => {
    expect(resoudreFormule("interet_compose")).toBe(calculerInteretCompose);
    expect(resoudreFormule("mensualite_credit")).toBe(calculerMensualiteCredit);
    expect(resoudreFormule("epargne_programmee")).toBe(calculerEpargneProgrammee);
    expect(resoudreFormule("regle_72")).toBe(calculerRegle72);
    expect(resoudreFormule("pouvoir_achat")).toBe(calculerPouvoirAchat);
    expect(resoudreFormule("cout_total_credit")).toBe(calculerCoutTotalCredit);
    expect(resoudreFormule("capacite_emprunt")).toBe(calculerCapaciteEmprunt);
    expect(resoudreFormule("rendement_locatif")).toBe(calculerRendementLocatif);
    expect(resoudreFormule("point_mort")).toBe(calculerPointMort);
  });

  test("chaque formule documente ses variables", () => {
    for (const formule of Object.keys(VARIABLES_PAR_FORMULE) as (keyof typeof VARIABLES_PAR_FORMULE)[]) {
      expect(VARIABLES_PAR_FORMULE[formule].length).toBeGreaterThan(0);
      expect(typeof resoudreFormule(formule)).toBe("function");
    }
  });
});

describe("formaterResultat", () => {
  test("arrondit selon la grandeur et ajoute l'unité", () => {
    expect(formaterResultat(1343.9234, "€")).toBe("1 344 €".replace(" ", " "));
    expect(formaterResultat(230.291, "€")).toBe("230,3 €");
    expect(formaterResultat(5.6, "%")).toBe("5,6 %");
  });

  test("un résultat infini s'affiche comme un tiret", () => {
    expect(formaterResultat(Number.POSITIVE_INFINITY, "ans")).toBe("—");
  });
});
