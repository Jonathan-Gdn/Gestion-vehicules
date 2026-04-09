# Review Securite - MonGarage
- **Date** : 2026-04-09
- **Agent** : security-reviewer
- **Perimetre** : app.html, config.example.js, firebase.json, sw.js

## Verdict : OK (0 critique, 5 importants, 5 recommandes) - **MAJ 2026-04-09 : 5/5 IMPORTANT corriges, 3/5 RECOMMANDE corriges**

## Findings

### [IMPORTANT] XSS - item.name/statusText non echappe dans renderDashboard/renderSchedule
- **Fichier** : app.html:2834, app.html:2881, app.html:4105
- **Description** : `item.name` et `item.statusText` inseres via innerHTML sans `escHtml()`. Vecteur via import JSON ou reponse IA Groq.
- **Correction** : Ajouter `escHtml()` sur toutes les occurrences de `item.name` et `item.statusText` dans les templates HTML.
- **Statut** : [x] corrige - escHtml() ajoute sur renderDashboard, renderSchedule, projectionsList

### [IMPORTANT] Regles Firestore non versionnees
- **Fichier** : firebase-rules.md (documentation seule, pas de firestore.rules)
- **Description** : Les regles Firestore sont documentees dans un .md et appliquees manuellement. Pas de fichier `firestore.rules` versionne ni reference dans `firebase.json`.
- **Correction** : Creer `firestore.rules`, l'integrer dans `firebase.json`, deployer avec `firebase deploy --only firestore:rules`.
- **Statut** : [x] corrige - firestore.rules cree, reference ajoutee dans firebase.json

### [IMPORTANT] CSV Injection dans exportCSV
- **Fichier** : app.html:4518-4529
- **Description** : Champs `provider`, `notes`, `station`, `text` inseres bruts dans le CSV. Les prefixes de formules (`=`, `+`, `-`, `@`) ne sont pas neutralises.
- **Correction** : Creer `sanitizeCsvCell()` qui prefixe `'` sur les cellules commencant par `=+\-@\t\r`.
- **Statut** : [x] corrige - sanitizeCsvCell() cree et applique sur tous les champs texte du CSV

### [IMPORTANT] Secrets API tiers exposes cote client
- **Fichier** : config.js (PLATE_API_TOKEN, GROQ_API_KEY)
- **Description** : Cles API visibles dans DevTools. Risque attenue car app privee (ALLOWED_UIDS).
- **Correction** : Moyen terme - router via Firebase Cloud Function. Court terme - restrictions referer sur RapidAPI.
- **Statut** : [x] corrige - cles migrees dans Firestore (config/api_keys), protegees par rules ALLOWED_UIDS, config.js ne contient plus de secrets

### [IMPORTANT] Notifications push avec donnees non nettoyees
- **Fichier** : app.html:2804, app.html:2812
- **Description** : `item.name` utilise directement dans `new Notification()`. Risque XSS nul (pas HTML) mais donnees utilisateur non sanitisees dans une API systeme.
- **Correction** : Truncature + nettoyage basique avant passage a `new Notification()`.
- **Statut** : [x] corrige - truncature .slice(0, 80/120) sur title/body des notifications

### [RECOMMANDE] CSP unsafe-inline
- **Description** : CSP dans firebase.json autorise `unsafe-inline` pour les scripts. Necessaire car app single-file avec JS inline.
- **Statut** : [ ] ouvert (acceptable pour le contexte)

### [RECOMMANDE] SRI manquant sur CDN Firebase
- **Description** : Les scripts Firebase CDN charges sans Subresource Integrity.
- **Statut** : [x] corrige - integrity="sha384-..." + crossorigin="anonymous" sur les 3 scripts Firebase

### [RECOMMANDE] SW sans validation d'integrite
- **Description** : Le service worker ne valide pas l'integrite des assets caches.
- **Statut** : [ ] ouvert

### [RECOMMANDE] Token Drive en memoire globale
- **Description** : `googleAccessToken` en variable globale, jamais persiste (perdu a la fermeture). Acceptable.
- **Statut** : [ ] ouvert

### [RECOMMANDE] Manifest `id` absent
- **Description** : PWA identity derivee de start_url, fragile si URL change.
- **Statut** : [x] corrige - id: "/app.html" ajoute dans manifest.json

## Points conformes
- escHtml() implementation correcte et largement utilisee
- ALLOWED_UIDS double validation (client + Firestore rules)
- Headers securite OK (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- CSP connect-src whitelist stricte
- Pas d'eval()
- Google Drive scope limite (drive.file)
- Import JSON valide
- config.js gitignored
- Share view avec donnees limitees
