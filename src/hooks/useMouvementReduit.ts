import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Vrai quand l'utilisateur a demandé de réduire les animations dans les réglages système
 * (iOS : Réduire les animations, Android : Supprimer les animations).
 *
 * Toutes les animations *décoratives* de l'app s'y réfèrent : taches du fond, poussière,
 * comète du chemin, battements. Les animations *informatives* — une barre qui se remplit,
 * une bonne réponse qui se colore — restent, parce qu'elles portent du sens ; elles sont
 * simplement courtes. C'est la distinction que font les réglages d'accessibilité, pas un
 * interrupteur général.
 *
 * Le réglage peut changer pendant que l'app tourne : on s'abonne plutôt que de le lire
 * une fois au montage.
 */
export function useMouvementReduit(): boolean {
  const [reduit, setReduit] = useState(false);

  useEffect(() => {
    let vivant = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((valeur) => {
        if (vivant) setReduit(valeur);
      })
      .catch(() => {});
    const abonnement = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduit);
    return () => {
      vivant = false;
      abonnement.remove();
    };
  }, []);

  return reduit;
}
