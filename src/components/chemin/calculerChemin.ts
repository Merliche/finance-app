// Calcul pur (aucun JSX, aucun effet) de la mise en page d'un chemin façon Duolingo :
// position de chaque étape (nœud) sur une piste sinueuse à 3 couloirs, et bannières de
// session insérées entre les groupes. Réutilisable par n'importe quel écran affichant
// une liste d'étapes ordonnées (map globale, futur sommaire par voie une fois son
// contenu disponible) — ne pas dupliquer cette logique dans un composant d'écran.
export type EtatNoeud = "valide" | "actuel" | "verrouille";

export interface NoeudPositionne<T> {
  item: T;
  x: number;
  y: number;
  rayon: number;
  etat: EtatNoeud;
}

export interface BanniereSessionPositionnee {
  y: number;
  hauteur: number;
  session: number;
}

const RAYON_NORMAL = 30;
const RAYON_ACTUEL = 38;
const ESPACE_ENTRE_NOEUDS = 44;
const HAUTEUR_BANNIERE = 64;
const ESPACE_AVANT_BANNIERE = 28;
const ESPACE_APRES_BANNIERE = 28;

/**
 * Place les items d'une liste ordonnée le long d'un chemin sinueux à 3 couloirs
 * (centre, droite, gauche, en boucle), en insérant une bannière chaque fois que
 * `session(item)` change de valeur (une valeur `null` ne produit pas de bannière).
 * L'état de chaque nœud (valide/actuel/verrouille) dérive de `estComplete` : le premier
 * item non complété est "actuel", tout ce qui précède est "valide", tout ce qui suit
 * est "verrouille".
 *
 * Les deux extrémités sont centrées : le premier nœud est la base du tronc (c'est ce
 * qu'on voit en ouvrant l'app), le dernier est le point d'où partent la fourche vers les
 * quatre voies (map) ou le trait vers la récompense (voie) — une fourche qui démarre sur
 * le côté casse la symétrie de l'arbre. Comme le nombre d'étapes n'est presque jamais un
 * multiple de 3 plus un, on ne peut pas centrer les deux bouts en gardant l'alternance
 * partout : les un ou deux derniers nœuds restent alors au centre, et le chemin se
 * redresse en ligne droite juste avant de se séparer. C'est précisément l'allure d'un
 * tronc sous ses branches (voir `couloirsDesNoeuds`).
 */
export function calculerChemin<T>(params: {
  items: T[];
  estComplete: (item: T) => boolean;
  session: (item: T) => number | null;
  largeurEcran: number;
  yDepart: number;
}): { noeuds: NoeudPositionne<T>[]; bannieres: BanniereSessionPositionnee[]; yFin: number } {
  const { items, estComplete, session, largeurEcran, yDepart } = params;

  const centre = largeurEcran / 2;
  const decalage = Math.min(largeurEcran * 0.22, 90);
  const couloirs = [centre, centre + decalage, centre - decalage];

  const couloirParNoeud = couloirsDesNoeuds(items.length, couloirs.length);

  let indexActuel = items.findIndex((item) => !estComplete(item));
  if (indexActuel === -1) indexActuel = items.length;

  const noeuds: NoeudPositionne<T>[] = [];
  const bannieres: BanniereSessionPositionnee[] = [];
  let y = yDepart;
  let sessionCourante: number | null | undefined = undefined;

  items.forEach((item, index) => {
    const sessionItem = session(item);

    if (sessionItem !== sessionCourante) {
      if (index !== 0) y += ESPACE_AVANT_BANNIERE;
      if (sessionItem !== null) {
        bannieres.push({ y, hauteur: HAUTEUR_BANNIERE, session: sessionItem });
        y += HAUTEUR_BANNIERE + ESPACE_APRES_BANNIERE;
      }
      sessionCourante = sessionItem;
    } else if (index !== 0) {
      y += ESPACE_ENTRE_NOEUDS;
    }

    const etat: EtatNoeud = index < indexActuel ? "valide" : index === indexActuel ? "actuel" : "verrouille";
    const rayon = etat === "actuel" ? RAYON_ACTUEL : RAYON_NORMAL;
    const centreY = y + rayon;

    noeuds.push({ item, x: couloirs[couloirParNoeud[index]], y: centreY, rayon, etat });
    y = centreY + rayon;
  });

  return { noeuds, bannieres, yFin: y };
}

/**
 * Indice de couloir de chaque nœud, du départ à l'arrivée. Le chemin alterne
 * centre → droite → gauche, et doit commencer ET finir au centre (voir `calculerChemin`).
 *
 * Le serpentin ne peut satisfaire les deux bouts que si `(nombre - 1)` est un multiple du
 * nombre de couloirs. Sinon, il reste 1 ou 2 nœuds à « redresser » au centre : on les
 * répartit entre les deux extrémités, la fin d'abord. Chaque bout garde ainsi au plus
 * deux nœuds alignés — un court segment droit, qui se lit comme le tronc sous les
 * branches plutôt que comme une erreur de tracé.
 */
export function couloirsDesNoeuds(nombre: number, nombreCouloirs = 3): number[] {
  if (nombre <= 0) return [];
  const redresses = (nombre - 1) % nombreCouloirs;
  const versLaFin = Math.ceil(redresses / 2);
  const versLeDebut = redresses - versLaFin;

  return Array.from({ length: nombre }, (_, index) =>
    index < versLeDebut || index >= nombre - versLaFin ? 0 : (index - versLeDebut) % nombreCouloirs
  );
}

export const RAYON_ELEMENT_LATERAL = 18;
const MARGE_BORD_ELEMENT_LATERAL = 34;

export interface ElementLateralPositionne<T> {
  item: T;
  x: number;
  y: number;
  rayon: number;
}

/**
 * Place des éléments "bonus" (calculateurs, comparateurs, etc.) dans les marges de
 * chaque côté du chemin principal, à la hauteur de la session à laquelle ils sont
 * rattachés — plusieurs éléments d'une même session se répartissent sur toute sa
 * hauteur (alternance gauche/droite) plutôt que de s'empiler au même endroit. Une
 * session absente de `noeuds` (id inconnu) est silencieusement ignorée : ça ne peut
 * arriver qu'avec un contenu mal renseigné, pas dans l'usage normal.
 */
export function positionnerElementsLateraux<TElement, TNoeud>(params: {
  elements: TElement[];
  sessionDeElement: (item: TElement) => number;
  noeuds: { y: number; item: TNoeud }[];
  sessionDeNoeud: (item: TNoeud) => number | null;
  largeurEcran: number;
}): ElementLateralPositionne<TElement>[] {
  const { elements, sessionDeElement, noeuds, sessionDeNoeud, largeurEcran } = params;

  const plageParSession = new Map<number, { min: number; max: number }>();
  for (const noeud of noeuds) {
    const s = sessionDeNoeud(noeud.item);
    if (s === null) continue;
    const plage = plageParSession.get(s);
    if (!plage) plageParSession.set(s, { min: noeud.y, max: noeud.y });
    else {
      plage.min = Math.min(plage.min, noeud.y);
      plage.max = Math.max(plage.max, noeud.y);
    }
  }

  const parSession = new Map<number, TElement[]>();
  for (const element of elements) {
    const s = sessionDeElement(element);
    const groupe = parSession.get(s);
    if (groupe) groupe.push(element);
    else parSession.set(s, [element]);
  }

  const xGauche = MARGE_BORD_ELEMENT_LATERAL;
  const xDroite = largeurEcran - MARGE_BORD_ELEMENT_LATERAL;

  const resultat: ElementLateralPositionne<TElement>[] = [];
  for (const [session, items] of parSession) {
    const plage = plageParSession.get(session);
    if (!plage) continue;
    items.forEach((item, index) => {
      // Les éléments occupent l'INTÉRIEUR de la plage, jamais ses bornes : à la borne
      // basse, un élément se retrouve à la hauteur du premier nœud de la session, donc
      // juste à côté de sa bannière — c'est là qu'il paraissait « posé sur la session ».
      const fraction = (index + 0.5) / items.length;
      const hauteurPlage = plage.max - plage.min;
      const y =
        hauteurPlage > 0
          ? plage.min + hauteurPlage * fraction
          : // Session d'un seul nœud : la plage est ponctuelle, on échelonne à la main
            // plutôt que d'empiler tous les éléments au même endroit.
            plage.min + (index - (items.length - 1) / 2) * (RAYON_ELEMENT_LATERAL * 2 + 14);
      const x = index % 2 === 0 ? xGauche : xDroite;
      resultat.push({ item, x, y, rayon: RAYON_ELEMENT_LATERAL });
    });
  }

  return resultat;
}

/** Construit un `d` de `<Path>` SVG reliant des centres de nœuds par des courbes en S. */
export function tracerChemin(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const precedent = points[i - 1];
    const courant = points[i];
    const milieu = (precedent.y + courant.y) / 2;
    d += ` C${precedent.x},${milieu} ${courant.x},${milieu} ${courant.x},${courant.y}`;
  }
  return d;
}

export interface PointChemin {
  x: number;
  y: number;
}

/**
 * Échantillonne le chemin tracé par `tracerChemin` : la suite des points par lesquels il
 * passe réellement, courbes comprises. Sert à faire voyager quelque chose *le long* du
 * tracé (la comète qui remonte la partie parcourue) plutôt qu'à vol d'oiseau d'un nœud à
 * l'autre — sans cette fonction, la lumière couperait à travers les virages.
 *
 * On réévalue ici la même cubique que `tracerChemin` écrit dans son `d` : les deux
 * fonctions doivent rester d'accord, c'est ce que vérifient leurs tests communs.
 */
export function echantillonnerChemin(points: PointChemin[], parSegment = 8): PointChemin[] {
  if (points.length === 0) return [];
  if (points.length === 1) return [{ ...points[0] }];

  const pas = Math.max(1, Math.floor(parSegment));
  const echantillons: PointChemin[] = [{ ...points[0] }];

  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p3 = points[i];
    const milieu = (p0.y + p3.y) / 2;
    const p1 = { x: p0.x, y: milieu };
    const p2 = { x: p3.x, y: milieu };

    for (let k = 1; k <= pas; k++) {
      const t = k / pas;
      const u = 1 - t;
      echantillons.push({
        x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
        y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
      });
    }
  }

  return echantillons;
}

/**
 * Abscisses curvilignes normalisées (0 au départ, 1 à l'arrivée) des points fournis.
 * C'est ce qui permet d'animer un déplacement à vitesse constante : en interpolant
 * simplement sur l'indice, un objet accélérerait dans les segments courts.
 */
export function progressionCumulee(points: PointChemin[]): number[] {
  if (points.length === 0) return [];
  const distances = [0];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    distances.push(total);
  }
  if (total === 0) return points.map((_, index) => (points.length === 1 ? 0 : index / (points.length - 1)));
  return distances.map((d) => d / total);
}

export interface BandeOccupee {
  debut: number;
  fin: number;
}

/**
 * Décale `y` pour qu'un disque de rayon `rayon` centré dessus ne chevauche aucune des
 * bandes occupées, en restant entre `min` et `max`. Sert à écarter les éléments latéraux
 * des bannières de session et de la bulle « À suivre », qui occupent toute la largeur ou
 * tout un côté et que rien ne doit recouvrir.
 *
 * On construit les intervalles réellement libres puis on prend le point libre le plus
 * proche du `y` voulu : un simple « pousse vers le bas si ça touche » déplace l'élément
 * dans la bande suivante dès que deux obstacles se suivent, et peut le sortir de l'écran.
 * Si aucune position ne convient, on rend `y` tel quel — mal placé vaut mieux qu'absent.
 */
export function ecarterDesBandes(
  y: number,
  rayon: number,
  bandes: BandeOccupee[],
  min: number,
  max: number
): number {
  if (min >= max) return y;

  const interdits = bandes
    .map((bande) => ({ debut: bande.debut - rayon, fin: bande.fin + rayon }))
    .filter((bande) => bande.fin > min && bande.debut < max && bande.fin > bande.debut)
    .sort((a, b) => a.debut - b.debut);

  if (interdits.length === 0) return Math.min(Math.max(y, min), max);

  const fusionnes: BandeOccupee[] = [];
  for (const bande of interdits) {
    const dernier = fusionnes[fusionnes.length - 1];
    if (dernier && bande.debut <= dernier.fin) dernier.fin = Math.max(dernier.fin, bande.fin);
    else fusionnes.push({ ...bande });
  }

  const libres: BandeOccupee[] = [];
  let curseur = min;
  for (const bande of fusionnes) {
    if (bande.debut > curseur) libres.push({ debut: curseur, fin: Math.min(bande.debut, max) });
    curseur = Math.max(curseur, bande.fin);
    if (curseur >= max) break;
  }
  if (curseur < max) libres.push({ debut: curseur, fin: max });

  const utilisables = libres.filter((libre) => libre.fin >= libre.debut);
  if (utilisables.length === 0) return y;

  let meilleur = y;
  let distanceMin = Infinity;
  for (const libre of utilisables) {
    const candidat = Math.min(Math.max(y, libre.debut), libre.fin);
    const distance = Math.abs(candidat - y);
    if (distance < distanceMin) {
      distanceMin = distance;
      meilleur = candidat;
    }
  }
  return meilleur;
}
