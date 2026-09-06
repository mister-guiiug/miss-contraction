/**
 * L'ancre de la section « Sauvegarde » des réglages.
 *
 * DANS SON PROPRE MODULE parce que deux mondes la désignent : l'écran des
 * réglages qui la porte, et le bandeau de rappel de l'accueil qui y renvoie.
 * Importer `SettingsView` depuis `Banners` ferait entrer les sept cents
 * lignes de l'écran des réglages dans le morceau de l'accueil, pour une
 * chaîne de caractères.
 */
export const BACKUP_SECTION_ID = 'settings-section-sauvegarde';
