# MonGarage v3 - Self-hosted / Multi-utilisateur

## Contexte
Rendre l'app facilement deployable par n'importe qui avec sa propre instance Firebase, sans toucher au code.

## Fonctionnalites
- Ecran de setup au premier lancement si aucune config Firebase detectee
- Formulaire : API key, Auth domain, Project ID, Storage bucket, Messaging sender ID, App ID
- Stockage de la config dans IndexedDB (plus robuste que localStorage)
- Initialisation Firebase dynamique a partir du cache
- Bouton "Reinitialiser config" dans les parametres
- Option QR code / lien de partage de la config
- Guide pas-a-pas pour creer un projet Firebase (dans l'app ou README)

## Prerequis
- v1 stabilisee (config.js externalisee - fait)
- v2 vehicules electriques terminee

## Priorite
v3 - apres v2 (support electrique)
