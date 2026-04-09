# Mon Garage

Application web personnelle de suivi d'entretien multi-vehicules. PWA installable, sync cloud, mode hors-ligne.

## Fonctionnalites

- Multi-vehicules avec profil complet (moteur, distribution, km, conso estimee)
- Tableau de bord avec alertes entretien (OK / Bientot / En retard)
- Historique entretien avec cout pieces/main d'oeuvre, programme constructeur
- Suivi carburant : pleins, appoints, consommation full-to-full, graphes
- Lavage : suivi lavages, solde badge (paye/credite), solde jetons
- Echeances (CT, assurance, vignette) avec notifications push
- Stats : km/an, cout de possession, depenses annuelles, comparaison multi-vehicules
- Export/Import JSON, export PDF, export CSV
- Photos factures via camera ou fichier (stockage Google Drive)
- Scanner OCR ticket pompe (Tesseract.js)
- Carnet de bord libre (notes, incidents, voyants, sinistres)
- Lookup plaque d'immatriculation : pre-remplissage automatique des infos vehicule
- Generation programme d'entretien par IA (Groq, gratuit)
- Sync temps reel entre appareils (Firebase Firestore)
- PWA installable (iPhone, Mac, Android), mode hors-ligne

## Prerequis

### 1. Projet Firebase

1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Creer un nouveau projet (ou utiliser un existant)
3. Activer les services suivants :

#### Authentication
- Dans **Build > Authentication > Sign-in method**
- Activer le fournisseur **Google**
- Renseigner l'email d'assistance du projet

#### Firestore Database
- Dans **Build > Firestore Database**
- Creer une base de donnees (mode production)
- Regles de securite recommandees :
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

#### Firebase Hosting (optionnel, pour deploiement)
- Dans **Build > Hosting**, initialiser l'hebergement
- Deployer avec `firebase deploy` depuis ce dossier

### 2. Google Cloud Console - API Drive

L'app stocke les photos de factures sur Google Drive. Il faut activer l'API :

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Selectionner le meme projet que Firebase (ils partagent le meme projet GCP)
3. Dans **APIs & Services > Library**, chercher et activer :
   - **Google Drive API**
4. Dans **APIs & Services > Credentials**, verifier que le client OAuth Web existe (cree automatiquement par Firebase Auth)

> Note : seul le scope `drive.file` est utilise - l'app n'accede qu'aux fichiers qu'elle a crees (dossier "Mon Garage - Factures").

### 3. API Plaque d'immatriculation (optionnel)

Permet de pre-remplir les infos vehicule depuis une plaque FR.

1. Creer un compte sur [api-plaque-immatriculation.com](https://api-plaque-immatriculation.com)
2. Recuperer votre token API
3. Le renseigner dans `config.js` (variable `PLATE_API_TOKEN`)

> Sans cette cle, le champ plaque est simplement masque. La saisie manuelle reste disponible.

### 4. Groq - Programme entretien IA (optionnel)

Genere automatiquement un programme d'entretien constructeur adapte au vehicule via IA.

1. Creer un compte sur [console.groq.com](https://console.groq.com) (gratuit)
2. Generer une cle API dans **API Keys**
3. La renseigner dans `config.js` (variable `GROQ_API_KEY`)

> Le modele utilise est Llama 3.3 70B (gratuit, rapide). Le free tier Groq couvre largement un usage personnel. Sans cette cle, le bouton "Generer avec l'IA" est simplement masque.

### 5. Configuration locale

```bash
# Copier le template de configuration
cp config.example.js config.js
```

Editer `config.js` avec les valeurs de votre projet Firebase (disponibles dans **Project Settings > General > Your apps > Web app**) :

```javascript
const FIREBASE_CONFIG = {
  apiKey: "votre-api-key",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet",
  storageBucket: "votre-projet.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const ALLOWED_UIDS = ['votre-uid-firebase'];

// Optionnel - API plaque immatriculation
const PLATE_API_TOKEN = '';

// Optionnel - Groq IA (programme entretien)
const GROQ_API_KEY = '';
```

Pour trouver votre UID Firebase : connectez-vous une premiere fois (l'app affichera un message de refus avec votre UID dans la console du navigateur), puis ajoutez-le dans `ALLOWED_UIDS`.

> `config.js` est dans le `.gitignore` et ne sera pas committe.

## Lancement local

```bash
# Un serveur HTTP est necessaire (Firebase Auth ne fonctionne pas en file://)
python3 -m http.server 3000

# Ouvrir http://localhost:3000/app.html
```

## Deploiement Firebase Hosting

```bash
# Installer Firebase CLI si besoin
npm install -g firebase-tools

# Se connecter
firebase login

# Deployer
firebase deploy
```

## Installation mobile (PWA)

1. Ouvrir l'URL dans Safari (iPhone) ou Chrome (Android)
2. Partager > "Sur l'ecran d'accueil"
3. L'app s'installe comme une application native

## Fichiers

| Fichier | Role |
|---|---|
| `app.html` | Application complete (HTML + CSS + JS) |
| `config.js` | Configuration Firebase + UIDs autorises (**gitignored**) |
| `config.example.js` | Template de configuration a copier |
| `manifest.json` | Manifest PWA |
| `sw.js` | Service Worker (cache offline) |
| `firebase.json` | Configuration Firebase Hosting + headers CSP |
| `icon-180.png` | Icone PWA 180x180 |
| `icon-512.png` | Icone PWA 512x512 |

## Stack technique

- Single-file HTML/CSS/JS (`app.html`) - pas de build, pas de framework
- Firebase Auth (Google Sign-In) + Firestore (sync cloud temps reel)
- Google Drive API (stockage photos factures)
- Tesseract.js WASM (OCR tickets, execution locale)
- Service Worker (cache offline, network-first)
- localStorage (donnees locales, backup si hors-ligne)

## Securite

- Authentification Google obligatoire
- Whitelist d'UIDs autorises (`ALLOWED_UIDS` dans `config.js`)
- Regles Firestore : chaque utilisateur n'accede qu'a ses propres donnees
- Google Drive : scope `drive.file` (acces uniquement aux fichiers crees par l'app)
- Headers CSP configures dans `firebase.json`
- Credentials externalises hors du code source
