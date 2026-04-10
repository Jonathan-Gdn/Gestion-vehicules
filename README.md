# Mon Garage v3.3

Application web personnelle de suivi d'entretien multi-vehicules. PWA installable, sync cloud, mode hors-ligne.

## Fonctionnalites

- Multi-vehicules avec profil complet (moteur, distribution, km, conso estimee)
- Vehicules thermiques, electriques et hybrides rechargeables
- Tableau de bord avec alertes entretien (OK / Bientot / En retard) + pastille nav
- Historique entretien avec cout pieces/main d'oeuvre, programme constructeur, echeances auto
- Suivi carburant : pleins, appoints, consommation full-to-full, graphes, estimation prochain plein
- Suivi charges EV : kWh, cout, SoC, station, type AC/DC, conso kWh/100km
- Suivi batterie EV : SoH %, capacite, graphe degradation, alertes
- Lavage : suivi lavages, solde badge (paye/credite), solde jetons
- Suivi pneus : marque, modele, type, dimension, usure, position, alertes
- Echeances (CT, assurance, vignette) avec notifications push et renouvellement auto
- Stats : km/an, cout de possession, depenses annuelles, comparaison multi-vehicules, depreciation Argus
- Vue calendrier mensuel avec marqueurs colores par type d'evenement
- Export/Import JSON, export PDF, export CSV, dossier de vente
- Photos factures via camera ou fichier (stockage Google Drive)
- Scanner OCR ticket pompe + carte grise (Tesseract.js WASM, 100% local)
- Quick Entry : photo rapide horodatee, completion differee
- Carnet de bord libre (notes, incidents, voyants, sinistres)
- Lookup plaque d'immatriculation : pre-remplissage automatique des infos vehicule
- Generation programme d'entretien par IA (Groq/Llama, gratuit)
- Partage famille : invitations par email, acces en ecriture partage, switch entre garages
- Carte stations + prix carburant en temps reel (API open data gouv FR, Leaflet)
- Sync temps reel entre appareils (Firebase Firestore)
- PWA installable (iPhone, Mac, Android), mode hors-ligne complet

## Setup rapide

### 1. Projet Firebase

1. Creer un projet sur [Firebase Console](https://console.firebase.google.com/)
2. Activer **Authentication** (fournisseur Google)
3. Creer une base **Firestore Database** (mode production)
4. Les regles Firestore sont versionnees dans `firestore.rules` (deployees automatiquement)

### 2. Configuration Firebase

**Option A - Setup in-app (recommande)** : au premier lancement, l'app demande les parametres Firebase. La config est stockee en IndexedDB.

**Option B - Fichier config.js (legacy)** :
```bash
cp config.example.js config.js
# Editer config.js avec les valeurs du projet Firebase
```

### 3. Cloud Functions (optionnel, requiert plan Blaze)

Les Cloud Functions gerent :
- **onInvitationAccepted** : trigger Firestore pour le partage famille (ajoute l'UID dans sharedWith)
- **nearbyStations** : proxy CORS pour l'API prix carburant (fallback - l'app appelle aussi l'API directement)

```bash
cd functions && npm install && cd ..
firebase deploy --only functions
```

Le plan Blaze est pay-as-you-go avec un free tier genereux (2M invocations/mois gratuites). Pour un usage personnel, le cout est de 0 EUR/mois.

**Sans plan Blaze** : l'app fonctionne normalement sauf le partage famille (les invitations ne seront pas traitees). Deployer avec :
```bash
firebase deploy --only firestore:rules,hosting
```

### 4. Google Drive API (photos)

1. Dans [Google Cloud Console](https://console.cloud.google.com/) (meme projet que Firebase)
2. Activer **Google Drive API** dans APIs & Services > Library
3. Le client OAuth est cree automatiquement par Firebase Auth

> Seul le scope `drive.file` est utilise - l'app n'accede qu'aux fichiers qu'elle a crees.

### 5. API optionnelles

Les cles API sont stockees dans Firestore (`config/api_keys`), configurables via `setup-api-keys.html` ou directement dans la console Firestore.

| API | Usage | Gratuit |
|-----|-------|---------|
| [api-plaque-immatriculation.com](https://api-plaque-immatriculation.com) | Pre-remplissage vehicule depuis plaque FR | Freemium |
| [Groq](https://console.groq.com) (Llama 3.3 70B) | Generation programme entretien IA | Oui |

> Sans ces cles, les boutons correspondants sont simplement masques. La saisie manuelle reste disponible.

## Dev local

```bash
python3 -m http.server 3000
# Ouvrir http://localhost:3000/app.html
```

> `file://` ne fonctionne pas (Firebase Auth requiert http/https).

## Deploiement

```bash
npm install -g firebase-tools
firebase login
firebase deploy              # Hosting + Rules + Functions (Blaze)
firebase deploy --only firestore:rules,hosting   # Sans Functions (Spark)
```

## Installation mobile (PWA)

1. Ouvrir l'URL dans Safari (iPhone) ou Chrome (Android)
2. Partager > "Sur l'ecran d'accueil"
3. L'app s'installe comme une application native

## Fichiers

| Fichier | Role |
|---------|------|
| `app.html` | Application complete single-file (HTML + CSS + JS, ~7900 lignes) |
| `config.js` | Config Firebase legacy (**gitignored**, optionnel - setup in-app disponible) |
| `config.example.js` | Template de configuration legacy |
| `firebase.json` | Config Firebase Hosting + headers CSP + cache |
| `firestore.rules` | Regles Firestore versionnees (garages, invitations, shares, config) |
| `sw.js` | Service Worker (cache offline, network-first, eviction LRU) |
| `manifest.json` | Manifest PWA (maskable icon, id stable) |
| `setup-api-keys.html` | Page utilitaire pour configurer les cles API |
| `functions/index.js` | Cloud Functions (europe-west1) |
| `functions/package.json` | Dependances Cloud Functions |
| `reviews/` | Rapports d'audit securite, qualite, infrastructure |

## Stack technique

- Single-file PWA (`app.html`) - pas de build, pas de framework
- Firebase Auth (Google Sign-In) + Firestore (sync cloud temps reel)
- Cloud Functions v2 (firebase-functions/v2) - region europe-west1
- Google Drive API (stockage photos factures, scope drive.file)
- Tesseract.js WASM (OCR tickets + carte grise, execution 100% locale)
- Leaflet.js (carte stations carburant, lazy-loaded)
- Service Worker (cache offline, network-first, max 50 entrees)
- localStorage (donnees locales, backup si hors-ligne)

## Securite

- Authentification Google obligatoire
- Firestore rules granulaires : owner full access, shared users read + update restreint (sharedWith/ownerEmail immutables)
- Invitations : create par owner, accept par destinataire (status pending->accepted uniquement, champs verrouilles)
- Partages lecture : token 24 bytes + expiration server-side dans les rules
- Cles API : restreintes aux users avec garage existant
- Cloud Functions : CORS restreint (*.web.app, *.firebaseapp.com, localhost), maxInstances: 10
- Headers : HSTS, X-Content-Type-Options, X-Frame-Options DENY, CSP, Referrer-Policy, Permissions-Policy
- Cache : HTML no-cache, assets 86400s, sw.js no-cache
- SRI sur Leaflet CDN, escHtml/escAttr sur tous les templates innerHTML
- OCR 100% local, photos redimensionnees client-side

## Changelog

- **v3.3** : partage famille en ecriture (invitations, sharedWith, Cloud Function), carte stations prix carburant (Leaflet, API open data)
- **v3.2** : estimation depreciation Argus, scan carte grise OCR, quick entry photo rapide
- **v3.1** : suivi pneus, vue calendrier, tri/filtres avances, donut couts, graphe conso dashboard
- **v3.0** : self-hosted, setup Firebase dynamique, garages/{uid}, support EV/hybride, audits securite+qualite
