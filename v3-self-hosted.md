# MonGarage v3 - Self-hosted / Multi-utilisateur

**Statut : A FAIRE**

## Contexte
Rendre l'app facilement deployable par n'importe qui avec sa propre instance Firebase, sans toucher au code.

## Architecture retenue
Option A : chaque user deploie sa propre instance Firebase (pas de multi-user sur une meme instance).

## Fonctionnalites
- Ecran de setup au premier lancement si aucune config Firebase detectee
- Formulaire : API key, Auth domain, Project ID, Storage bucket, Messaging sender ID, App ID
- Stockage de la config dans IndexedDB (plus robuste que localStorage)
- Initialisation Firebase dynamique a partir du cache
- Bouton "Reinitialiser config" dans les parametres
- Option QR code / lien de partage de la config
- Guide pas-a-pas pour creer un projet Firebase (dans l'app ou README)
- Rules Firestore par uid dynamique (plus de ALLOWED_UIDS en dur)

## Refactor associe (optionnel, a evaluer)
- Migration SDK modulaire Firebase (compat → modular) - uniquement si build system (Vite)
- Sans bundler : zero gain de perf, gros refactor (~30+ appels Firebase + scope modules)

## Prerequis
- v1 stabilisee (config.js externalisee - fait)
- v2 vehicules electriques - fait (2026-04-09)
- v2.5 features (echeances, graphes, alertes km) - fait (2026-04-09)

## Estimation
~150-180 lignes de code. Pas de changement d'architecture profond.
