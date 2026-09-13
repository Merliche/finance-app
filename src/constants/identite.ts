// Identité de l'application, en un seul endroit.
//
// Ces valeurs se retrouvent dans la fiche du magasin, dans la politique de confidentialité
// et dans `app.json`. Les regrouper évite qu'une adresse de contact change dans l'écran
// mais pas dans le texte légal, ou que le nom affiché diverge de celui de la fiche.
//
// L'identifiant de paquet, lui, ne vit que dans `app.json` : il est figé dès la première
// soumission à l'App Store et ne doit plus jamais bouger. Il est volontairement générique
// (`com.merliche.finance`) et non calqué sur le nom affiché : celui-ci peut encore changer,
// l'identifiant non.

/** Nom affiché sous l'icône et dans les magasins. */
export const NOM_APP = "Finance de Poche";

/**
 * Adresse de contact publiée dans la politique de confidentialité et dans la fiche du
 * magasin. C'est l'adresse à laquelle arrivent les demandes d'accès et d'effacement.
 */
export const CONTACT_EMAIL = "leshyni31@gmail.com";

// L'adresse web publique de la politique de confidentialité ne figure pas ici : elle se
// renseigne directement dans App Store Connect et Google Play, et l'application n'en a
// pas besoin puisqu'elle affiche son propre écran « Confidentialité ». Y mettre une
// adresse inventée serait pire que de ne rien mettre.
