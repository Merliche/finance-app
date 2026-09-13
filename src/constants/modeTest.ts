// MODE TEST — PROVISOIRE.
//
// Quand ce drapeau est actif, tout est accessible sans progression : toutes les voies,
// toutes les étapes (y compris "verrouillées"), tous les éléments latéraux, toutes les
// récompenses. L'affichage des états (validé / en cours / verrouillé) reste fidèle à la
// vraie progression ; seule la restriction d'accès est levée.
//
// Le `&& __DEV__` garantit qu'il ne peut JAMAIS être actif dans un build de production,
// même si quelqu'un oublie de le repasser à false.
//
// Pour revenir au comportement normal : passer ACTIVER_MODE_TEST à false.
const ACTIVER_MODE_TEST = false;

export const MODE_TEST_TOUT_ACCESSIBLE = ACTIVER_MODE_TEST && __DEV__;
