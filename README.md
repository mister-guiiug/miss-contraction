# Miss Contraction

[![Application en ligne](https://img.shields.io/badge/Application-En%20ligne-brightgreen?style=for-the-badge)](https://mister-guiiug.github.io/miss-contraction/)
[![License](https://img.shields.io/badge/Licence-MIT-blue?style=for-the-badge)](https://github.com/mister-guiiug/miss-contraction/blob/main/LICENSE)
[![Buy Me A Coffee](https://img.shields.io/badge/Soutenir-%E2%98%95-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/mister.guiiug)

> Chronomètre les contractions, suit leur fréquence et vous alerte quand il est temps d'appeler la maternité.

**[▶ Accéder à l'application](https://mister-guiiug.github.io/miss-contraction/)**

> ⚠️ **Avertissement médical** : cet outil est un aide-mémoire. Il ne remplace en aucun cas un avis médical. En cas de doute ou d'urgence, contactez immédiatement un professionnel de santé ou le 15 (SAMU).

---

## Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Comment utiliser l'application](#comment-utiliser-lapplication)
- [Installation sur votre téléphone (PWA)](#installation-sur-votre-téléphone-pwa)
- [Confidentialité](#confidentialité)
- [Licence](#licence)

---

## Fonctionnalités

### Suivi des contractions

| Fonctionnalité | Description |
|---|---|
| Chronomètre | Lance / arrête un chronomètre à chaque contraction en cours |
| Indicateur de seuil | Affichage visuel : calme, rythme soutenu, ou seuil atteint |
| Pré-alerte | Bandeau d'avertissement avant le déclenchement des notifications |
| Rappel contraction ouverte | Alerte si une contraction a été démarrée mais jamais terminée |
| Graphique des intervalles | Visualisation des derniers intervalles entre contractions |
| Chronologie | Historique des contractions avec note personnalisée par événement |
| Annulation | Annuler le dernier enregistrement dans les ~30 secondes |

### Alertes et notifications

| Fonctionnalité | Description |
|---|---|
| Seuils personnalisables | Intervalle max (min), durée min (sec), nombre de contractions consécutives |
| Notifications navigateur | Alerte dès que les seuils sont atteints |
| Report d'alerte | Snooze 30 min ou 1 h, ou annulation du report |

### Paramètres et personnalisation

| Fonctionnalité | Description |
|---|---|
| Fenêtre de statistiques | Toutes les données ou les 30 / 60 / 120 dernières minutes |
| Fiche maternité | Nom, numéro de téléphone (appel rapide) et consignes d'admission |
| Grand confort | Textes et boutons agrandis ; écran maintenu allumé pendant une contraction |
| Vibrations | Retour haptique au début et à la fin de chaque contraction |
| Commande vocale *(expérimental)* | Début / fin de contraction à la voix (activable dans les réglages) |

### Autres écrans

| Écran | Description |
|---|---|
| Tableau des contractions | Vue détaillée (heure, durée, intervalle, fréquence, notes) avec modification et suppression |
| Message maternité | Texte pré-rempli prêt à copier ou partager par SMS / WhatsApp |
| Écran maternité | Récapitulatif des infos + appel en un geste |

### Sauvegarde et export

| Fonctionnalité | Description |
|---|---|
| Export JSON | Téléchargement ou partage natif de l'historique et des réglages |
| Rappel de sauvegarde | Notification périodique pour penser à exporter avant un changement de téléphone |
| Effacement | Suppression complète de l'historique sur l'appareil (avec confirmation) |

---

## Comment utiliser l'application

1. **Ouvrez l'application** sur votre téléphone : [miss-contraction](https://mister-guiiug.github.io/miss-contraction/)
2. **Configurez votre maternité** dans les paramètres (nom, numéro, consignes).
3. **Appuyez sur « Début »** au début d'une contraction, puis **« Fin »** quand elle se termine.
4. L'application calcule automatiquement les intervalles et la durée.
5. **Une notification s'affiche** dès que les seuils configurés sont atteints.
6. **Appelez la maternité** directement depuis l'écran dédié.

---

## Installation sur votre téléphone (PWA)

Miss Contraction est une application web progressive (PWA) : elle s'installe directement sur votre écran d'accueil, sans passer par un store.

**Sur Android (Chrome) :**
1. Ouvrez le site dans Chrome.
2. Appuyez sur les trois points en haut à droite → **« Ajouter à l'écran d'accueil »**.

**Sur iPhone (Safari) :**
1. Ouvrez le site dans Safari.
2. Appuyez sur le bouton Partager → **« Sur l'écran d'accueil »**.

Une fois installée, l'application fonctionne **hors ligne** pour les fonctions de base.

---

## Confidentialité

Miss Contraction ne collecte **aucune donnée personnelle**.

| Donnée | Traitement |
|---|---|
| Historique des contractions | Stocké **uniquement sur votre appareil** (localStorage du navigateur) |
| Paramètres | Stockés **uniquement sur votre appareil** |
| Données réseau | Aucune donnée n'est envoyée à un serveur externe |

L'application ne nécessite pas de compte, pas d'inscription et pas de connexion internet une fois installée.

---

## Licence

[MIT](LICENSE) — Copyright © 2026 Guillaume GUERIN.
