import { construireSemaines } from "../CalendrierActivite";

describe("construireSemaines", () => {
  // Un mercredi, pour que la semaine en cours soit à moitié entamée.
  const mercredi = new Date(2026, 8, 16);

  test("produit une colonne de sept jours par semaine demandée", () => {
    const semaines = construireSemaines(mercredi, 5);
    expect(semaines).toHaveLength(5);
    for (const colonne of semaines) expect(colonne).toHaveLength(7);
  });

  test("la dernière colonne est la semaine en cours, qui commence un lundi", () => {
    const derniere = construireSemaines(mercredi, 3).at(-1)!;
    expect(derniere[0]?.jour).toBe("2026-09-14");
  });

  test("les jours à venir sont vides plutôt que marqués inactifs", () => {
    const derniere = construireSemaines(mercredi, 3).at(-1)!;
    // Lundi, mardi, mercredi existent ; jeudi à dimanche n'ont pas encore eu lieu.
    expect(derniere.slice(0, 3).every((case_) => case_ !== null)).toBe(true);
    expect(derniere.slice(3).every((case_) => case_ === null)).toBe(true);
  });

  test("les jours passés sont tous présents et ordonnés", () => {
    const jours = construireSemaines(mercredi, 4)
      .flat()
      .filter((case_): case_ is { jour: string; futur: boolean } => case_ !== null)
      .map((case_) => case_.jour);
    expect(jours).toEqual([...jours].sort());
    expect(new Set(jours).size).toBe(jours.length);
    expect(jours.at(-1)).toBe("2026-09-16");
  });

  test("fonctionne un dimanche, où la semaine en cours est complète", () => {
    const dimanche = new Date(2026, 8, 20);
    const derniere = construireSemaines(dimanche, 2).at(-1)!;
    expect(derniere.every((case_) => case_ !== null)).toBe(true);
    expect(derniere.at(-1)?.jour).toBe("2026-09-20");
  });
});
