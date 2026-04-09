# Mon Garage

Application web personnelle de suivi d'entretien vehicules.

## Fonctionnalites

- Multi-vehicules avec programme d'entretien personnalisable
- Historique des interventions (date, km, operations, cout, prestataire)
- Suivi carburant avec graphiques de consommation
- Photos d'interventions (camera ou fichier)
- Releves kilometriques avec statistiques (km/an, km/mois)
- Tableau de bord avec alertes (OK / Bientot / En retard)
- Recherche et filtres dans l'historique
- Export / Import JSON
- Sync temps reel entre appareils (Firebase)
- Login Google (authentification)
- PWA installable (iPhone, Mac, Android)
- Mode hors-ligne avec cache

## Stack

- Single-file HTML/CSS/JS (`app.html`)
- Firebase (Auth + Firestore + Storage)
- Service Worker (cache offline)
- GitHub Pages

## Installation mobile

1. Ouvrir l'URL dans Safari (iPhone) ou Chrome (Android)
2. Partager > "Sur l'ecran d'accueil"
3. L'app s'installe comme une application native

## Fichiers

| Fichier | Role |
|---|---|
| `app.html` | Application complete (HTML + CSS + JS) |
| `manifest.json` | Manifest PWA |
| `sw.js` | Service Worker (cache offline) |
| `icon-180.png` | Icone PWA 180x180 |
| `icon-512.png` | Icone PWA 512x512 |

## Securite

- Acces restreint par authentification Google
- Regles Firestore/Storage cote serveur
- Whitelist d'utilisateurs autorises
