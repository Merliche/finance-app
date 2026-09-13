// Retours haptiques légers. Chaque appel est protégé : sur le web ou sur un appareil
// sans moteur haptique, expo-haptics peut rejeter — on ne veut jamais qu'un vibreur
// absent fasse échouer une action de l'utilisateur.
import * as Haptics from "expo-haptics";

export function haptiqueLegere(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function haptiqueSucces(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function haptiqueErreur(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}
