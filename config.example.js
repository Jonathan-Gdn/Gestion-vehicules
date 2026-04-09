// Configuration Firebase (optionnel en v3)
// En v3, la config peut etre saisie directement dans l'app (ecran de setup).
// Ce fichier reste supporte comme alternative : copier vers config.js et renseigner vos valeurs.
// config.js est dans .gitignore et ne sera pas committe.
const FIREBASE_CONFIG = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJET.firebaseapp.com",
  projectId: "VOTRE_PROJET",
  storageBucket: "VOTRE_PROJET.firebasestorage.app",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

// Les cles API tierces sont stockees dans Firestore (document config/api_keys)
// Elles sont chargees automatiquement apres authentification
// Pour les configurer, creer le document config/api_keys dans Firestore avec :
//   { plateApiToken: "VOTRE_TOKEN_RAPIDAPI", groqApiKey: "VOTRE_CLE_GROQ" }
