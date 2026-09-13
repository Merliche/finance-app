import {
  calculerChemin,
  couloirsDesNoeuds,
  ecarterDesBandes,
  echantillonnerChemin,
  positionnerElementsLateraux,
  progressionCumulee,
  tracerChemin,
} from "../calculerChemin";

interface Item {
  id: string;
  session: number | null;
}

const items: Item[] = [1, 1, 1, 2, 2, 2, 3, 3, 3].map((session, index) => ({ id: `e${index}`, session }));

function chemin(completees: string[]) {
  return calculerChemin({
    items,
    estComplete: (item) => completees.includes(item.id),
    session: (item) => item.session,
    largeurEcran: 390,
    yDepart: 40,
  });
}

describe("calculerChemin", () => {
  test("le premier item non complété est 'actuel', avant = valide, après = verrouille", () => {
    const { noeuds } = chemin(["e0", "e1"]);
    expect(noeuds.map((n) => n.etat)).toEqual([
      "valide",
      "valide",
      "actuel",
      "verrouille",
      "verrouille",
      "verrouille",
      "verrouille",
      "verrouille",
      "verrouille",
    ]);
  });

  test("tout complété : aucun nœud actuel", () => {
    const { noeuds } = chemin(items.map((i) => i.id));
    expect(noeuds.every((n) => n.etat === "valide")).toBe(true);
  });

  test("le nœud actuel est plus grand que les autres", () => {
    const { noeuds } = chemin(["e0"]);
    const actuel = noeuds.find((n) => n.etat === "actuel")!;
    expect(actuel.rayon).toBeGreaterThan(noeuds[0].rayon);
  });

  test("une bannière par changement de session, positionnée avant ses nœuds", () => {
    const { noeuds, bannieres } = chemin([]);
    expect(bannieres.map((b) => b.session)).toEqual([1, 2, 3]);
    for (const banniere of bannieres) {
      const premierNoeud = noeuds.find((n) => n.item.session === banniere.session)!;
      expect(banniere.y + banniere.hauteur).toBeLessThan(premierNoeud.y - premierNoeud.rayon);
    }
  });

  test("les y sont strictement croissants et les nœuds ne se chevauchent pas", () => {
    const { noeuds } = chemin(["e0", "e1", "e2", "e3"]);
    for (let i = 1; i < noeuds.length; i++) {
      expect(noeuds[i].y - noeuds[i].rayon).toBeGreaterThan(noeuds[i - 1].y + noeuds[i - 1].rayon);
    }
  });

  test("les nœuds tournent sur 3 couloirs (centre, droite, gauche)", () => {
    // 10 items : le serpentin tombe juste, aucun nœud n'a besoin d'être redressé au
    // centre (voir `couloirsDesNoeuds`), on voit donc le cycle pur dès le départ.
    const { noeuds } = calculerChemin({
      items: Array.from({ length: 10 }, (_, index) => ({ id: `e${index}`, session: 1 })),
      estComplete: () => false,
      session: () => 1,
      largeurEcran: 390,
      yDepart: 40,
    });
    expect(noeuds[0].x).toBe(195);
    expect(noeuds[1].x).toBeGreaterThan(195);
    expect(noeuds[2].x).toBeLessThan(195);
    expect(noeuds[3].x).toBe(195);
  });

  test("le départ et l'arrivée sont centrés : c'est de l'arrivée que part la fourche", () => {
    // Longueurs réelles des 4 parcours, plus quelques cas limites : aucune n'est un
    // multiple de 3 plus un, et pourtant les deux bouts doivent être au centre.
    for (const nombre of [1, 2, 3, 9, 20, 35, 37, 39]) {
      const { noeuds } = calculerChemin({
        items: Array.from({ length: nombre }, (_, index) => ({ id: `e${index}`, session: 1 })),
        estComplete: () => false,
        session: () => 1,
        largeurEcran: 390,
        yDepart: 40,
      });
      expect(noeuds[0].x).toBe(195);
      expect(noeuds[noeuds.length - 1].x).toBe(195);
    }
  });

  test("une session null ne produit pas de bannière", () => {
    const sansSession = calculerChemin({
      items: [{ id: "a", session: null }, { id: "b", session: null }],
      estComplete: () => false,
      session: (item) => item.session,
      largeurEcran: 390,
      yDepart: 40,
    });
    expect(sansSession.bannieres).toHaveLength(0);
    expect(sansSession.noeuds).toHaveLength(2);
  });
});

describe("couloirsDesNoeuds", () => {
  test("n'aligne jamais plus de deux nœuds, et seulement aux deux extrémités", () => {
    for (const nombre of [4, 9, 20, 35, 37, 39, 60]) {
      const couloirs = couloirsDesNoeuds(nombre);
      // Longueur de chaque série de couloirs identiques consécutifs, avec sa position.
      const series: { debut: number; longueur: number }[] = [];
      for (let i = 0; i < couloirs.length; i++) {
        const derniere = series[series.length - 1];
        if (derniere && couloirs[i] === couloirs[i - 1]) derniere.longueur += 1;
        else series.push({ debut: i, longueur: 1 });
      }
      for (const serie of series) {
        expect(serie.longueur).toBeLessThanOrEqual(2);
        // Une série de deux ne peut toucher que le tout début ou la toute fin du chemin.
        if (serie.longueur === 2) {
          expect(serie.debut === 0 || serie.debut + serie.longueur === nombre).toBe(true);
        }
      }
    }
  });

  test("les trois couloirs sont utilisés dès que le chemin est assez long", () => {
    expect(new Set(couloirsDesNoeuds(20)).size).toBe(3);
  });

  test("un chemin vide ne produit aucun couloir", () => {
    expect(couloirsDesNoeuds(0)).toEqual([]);
  });
});

describe("positionnerElementsLateraux", () => {
  const { noeuds } = chemin([]);

  test("répartit les éléments d'une session sur sa hauteur, en alternant les côtés", () => {
    const positions = positionnerElementsLateraux({
      elements: [
        { id: "a", session: 1 },
        { id: "b", session: 1 },
        { id: "c", session: 1 },
      ],
      sessionDeElement: (el) => el.session,
      noeuds,
      sessionDeNoeud: (item) => item.session,
      largeurEcran: 390,
    });
    const ysSession1 = noeuds.filter((n) => n.item.session === 1).map((n) => n.y);
    expect(positions).toHaveLength(3);
    expect(positions[0].x).toBeLessThan(195);
    expect(positions[1].x).toBeGreaterThan(195);
    expect(positions[2].x).toBeLessThan(195);
    // Répartis dans l'ordre, du haut vers le bas de la session.
    expect(positions[0].y).toBeLessThan(positions[1].y);
    expect(positions[1].y).toBeLessThan(positions[2].y);
  });

  test("aucun élément ne se pose à la hauteur exacte du premier ni du dernier nœud", () => {
    // La bannière de session se trouve juste avant son premier nœud : un élément posé à
    // cette hauteur-là paraît collé dessus. Ils occupent donc l'intérieur de la plage.
    const positions = positionnerElementsLateraux({
      elements: [
        { id: "a", session: 1 },
        { id: "b", session: 1 },
        { id: "c", session: 1 },
      ],
      sessionDeElement: (el) => el.session,
      noeuds,
      sessionDeNoeud: (item) => item.session,
      largeurEcran: 390,
    });
    const ysSession1 = noeuds.filter((n) => n.item.session === 1).map((n) => n.y);
    const premier = Math.min(...ysSession1);
    const dernier = Math.max(...ysSession1);
    for (const position of positions) {
      expect(position.y).toBeGreaterThan(premier);
      expect(position.y).toBeLessThan(dernier);
    }
  });

  test("un élément seul est centré sur la hauteur de sa session", () => {
    const [position] = positionnerElementsLateraux({
      elements: [{ id: "a", session: 2 }],
      sessionDeElement: (el) => el.session,
      noeuds,
      sessionDeNoeud: (item) => item.session,
      largeurEcran: 390,
    });
    const ys = noeuds.filter((n) => n.item.session === 2).map((n) => n.y);
    expect(position.y).toBeCloseTo((Math.min(...ys) + Math.max(...ys)) / 2);
  });

  test("ignore silencieusement une session absente du chemin", () => {
    const positions = positionnerElementsLateraux({
      elements: [{ id: "x", session: 99 }],
      sessionDeElement: (el) => el.session,
      noeuds,
      sessionDeNoeud: (item) => item.session,
      largeurEcran: 390,
    });
    expect(positions).toHaveLength(0);
  });
});

describe("tracerChemin", () => {
  test("chaîne des courbes de Bézier entre points consécutifs", () => {
    expect(tracerChemin([])).toBe("");
    expect(tracerChemin([{ x: 10, y: 20 }])).toBe("M10,20");
    expect(
      tracerChemin([
        { x: 10, y: 0 },
        { x: 50, y: 100 },
      ])
    ).toBe("M10,0 C10,50 50,50 50,100");
  });
});

describe("echantillonnerChemin", () => {
  const coude = [
    { x: 10, y: 0 },
    { x: 50, y: 100 },
    { x: 10, y: 200 },
  ];

  test("garde les extrémités exactes", () => {
    const points = echantillonnerChemin(coude, 6);
    expect(points[0]).toEqual({ x: 10, y: 0 });
    expect(points[points.length - 1].x).toBeCloseTo(10, 6);
    expect(points[points.length - 1].y).toBeCloseTo(200, 6);
  });

  test("produit un point de départ plus un pas par segment", () => {
    expect(echantillonnerChemin(coude, 6)).toHaveLength(1 + 2 * 6);
    expect(echantillonnerChemin([], 6)).toEqual([]);
    expect(echantillonnerChemin([{ x: 3, y: 4 }], 6)).toEqual([{ x: 3, y: 4 }]);
  });

  test("suit la courbe et non la corde", () => {
    // Au milieu du premier segment, la cubique de `tracerChemin` est à mi-chemin en
    // hauteur mais déjà décalée horizontalement : c'est ce ventre qui distingue le tracé
    // réel d'une ligne droite entre deux nœuds.
    const milieu = echantillonnerChemin([coude[0], coude[1]], 2)[1];
    expect(milieu.y).toBeCloseTo(50, 6);
    expect(milieu.x).toBeCloseTo(30, 6);
  });

  test("progresse toujours vers le bas sur un chemin descendant", () => {
    const points = echantillonnerChemin(coude, 8);
    for (let i = 1; i < points.length; i++) {
      expect(points[i].y).toBeGreaterThanOrEqual(points[i - 1].y);
    }
  });
});

describe("progressionCumulee", () => {
  test("va de 0 à 1 en croissant", () => {
    const abscisses = progressionCumulee(echantillonnerChemin(coudeSimple(), 8));
    expect(abscisses[0]).toBe(0);
    expect(abscisses[abscisses.length - 1]).toBeCloseTo(1, 10);
    for (let i = 1; i < abscisses.length; i++) {
      expect(abscisses[i]).toBeGreaterThanOrEqual(abscisses[i - 1]);
    }
  });

  test("mesure la distance, pas le rang : un segment long occupe plus de la course", () => {
    // Deux segments, le second dix fois plus long : à mi-liste on doit être bien
    // avant la moitié du trajet. Sans cela, la comète ralentirait dans les virages.
    const abscisses = progressionCumulee([
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: 0, y: 110 },
    ]);
    expect(abscisses[1]).toBeCloseTo(10 / 110, 6);
  });

  test("des points confondus ne produisent pas de division par zéro", () => {
    const abscisses = progressionCumulee([
      { x: 5, y: 5 },
      { x: 5, y: 5 },
    ]);
    expect(abscisses).toEqual([0, 1]);
  });

  test("une liste vide ne casse rien", () => {
    expect(progressionCumulee([])).toEqual([]);
  });
});

function coudeSimple() {
  return [
    { x: 10, y: 0 },
    { x: 50, y: 100 },
    { x: 10, y: 200 },
  ];
}

describe("ecarterDesBandes", () => {
  const bande = (debut: number, fin: number) => ({ debut, fin });

  test("ne bouge rien quand la place est libre", () => {
    expect(ecarterDesBandes(200, 18, [bande(400, 460)], 0, 1000)).toBe(200);
    expect(ecarterDesBandes(200, 18, [], 0, 1000)).toBe(200);
  });

  test("sort le disque de la bande, du côté le plus proche", () => {
    // Centre à 410 : le bord haut de la bande est à 10 px, le bord bas à 50 — on remonte.
    expect(ecarterDesBandes(410, 18, [bande(400, 460)], 0, 1000)).toBe(400 - 18);
    // Centre à 450 : cette fois le bord bas est plus près.
    expect(ecarterDesBandes(450, 18, [bande(400, 460)], 0, 1000)).toBe(460 + 18);
  });

  test("tient compte du rayon, pas seulement du centre", () => {
    // Le centre est hors de la bande, mais le disque mord dessus.
    expect(ecarterDesBandes(390, 18, [bande(400, 460)], 0, 1000)).toBe(382);
  });

  test("enjambe deux bandes qui se suivent au lieu de tomber dans la seconde", () => {
    // Sans construction des intervalles libres, un simple décalage vers le bas depuis la
    // première bande déposerait l'élément en plein dans la seconde.
    const y = ecarterDesBandes(410, 18, [bande(400, 460), bande(470, 530)], 0, 1000);
    expect(y).toBeLessThanOrEqual(382);
  });

  test("reste dans les bornes autorisées", () => {
    const y = ecarterDesBandes(30, 18, [bande(0, 100)], 20, 400);
    expect(y).toBeGreaterThanOrEqual(20);
    expect(y).toBeLessThanOrEqual(400);
    expect(y).toBe(118);
  });

  test("rend la position voulue si rien ne peut convenir", () => {
    // Tout l'espace est occupé : mal placé vaut mieux qu'invisible ou hors écran.
    expect(ecarterDesBandes(50, 18, [bande(-100, 500)], 0, 200)).toBe(50);
  });
});
