# MonGarage v3 - Self-hosted / Multi-utilisateur

**Statut : TERMINE - deploye 2026-04-09**

## Architecture
Option A : chaque user deploie sa propre instance Firebase (pas de multi-user sur une meme instance).

## Implemente
- Ecran de setup au premier lancement si aucune config Firebase detectee
- Formulaire : API key, Auth domain, Project ID, Storage bucket, Messaging sender ID, App ID
- Guide pas-a-pas integre (details/summary) pour creer un projet Firebase
- Stockage config dans IndexedDB (persistent, plus robuste que localStorage)
- Boot sequence : IndexedDB > config.js (legacy) > ecran setup
- Initialisation Firebase dynamique a partir de la config sauvegardee
- Document Firestore par user : `garages/{uid}` (plus de `garages/main` en dur)
- Plus de `ALLOWED_UIDS` : chaque user authentifie accede a son propre doc
- Firestore rules dynamiques (`request.auth.uid == userId`)
- Migration automatique `garages/main` -> `garages/{uid}` au premier login
- Bouton "Reinitialiser config" dans le menu profil
- Retrocompatibilite config.js (charge et sauvegarde en IndexedDB au premier boot)
- config.example.js mis a jour avec notes v3

## Prerequis (tous faits)
- v1 stabilisee (config.js externalisee)
- v2 vehicules electriques (2026-04-09)
- v2.5 features (echeances, graphes, alertes km) (2026-04-09)
