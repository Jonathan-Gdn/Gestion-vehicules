# Audit Securite MonGarage v3.3 - 2026-04-10

- **Agent** : security-reviewer (Opus)
- **Perimetre** : app.html, firebase.json, firestore.rules, sw.js, functions/index.js

## CRITIQUE

### [S01] Privilege escalation via sharedWith[] dans Firestore rules
- **Fichier** : `firestore.rules` lignes 8-9
- **Description** : Un utilisateur partage (present dans sharedWith[]) a un acces write complet sur le document garages/{userId}. Il peut modifier sharedWith[] pour ajouter d'autres utilisateurs, se retirer, ou retirer le proprietaire. Escalade de privileges.
- **Recommandation** : Restreindre a update uniquement, proteger sharedWith et ownerEmail :
  ```
  allow update: if request.auth != null
    && request.auth.uid in resource.data.sharedWith
    && request.resource.data.sharedWith == resource.data.sharedWith
    && request.resource.data.ownerEmail == resource.data.ownerEmail;
  ```
- **Statut** : [x] corrige (firestore.rules : update only + sharedWith/ownerEmail immutables)

### [S02] acceptFamilyInvitation() : flow d'ecriture casse ou dangereux
- **Fichier** : `app.html` lignes 2054-2059
- **Description** : Le code tente garageRef.update({ sharedWith: currentShared }) sur garages/{fromUid}. L'utilisateur n'est pas proprietaire et pas encore dans sharedWith[]. Selon les rules, cette ecriture devrait etre refusee. Bug fonctionnel ou faille.
- **Recommandation** : Deplacer l'acceptation dans une Cloud Function privilegiee qui verifie l'invitation et ajoute l'UID dans sharedWith.
- **Statut** : [x] corrige (Cloud Function onInvitationAccepted + acceptFamilyInvitation simplifie)

### [S03] Cles API tierces lisibles par tout utilisateur authentifie
- **Fichier** : `firestore.rules` lignes 30-31, `app.html` ligne 1683
- **Description** : config/api_keys lisible par tout utilisateur authentifie (meme un compte Google random). Les cles API Groq et RapidAPI sont exposees.
- **Recommandation** : Deplacer les appels API tierces dans des Cloud Functions. Alternative minimale : restreindre la lecture par UID.
- **Statut** : [x] corrige partiellement (Firestore rule config/api_keys restreint aux users avec garage. Proxying complet hors scope)

## IMPORTANT

### [S04] Pas de Subresource Integrity (SRI) sur les scripts CDN
- **Fichier** : `app.html` lignes 15-17 (Firebase SDK), ligne 4069 (Tesseract.js), lignes 6556/6561 (Leaflet)
- **Description** : 5 ressources CDN externes sans attribut integrity. CDN compromis = code malveillant avec acces total.
- **Recommandation** : Ajouter integrity="sha384-..." et crossorigin="anonymous" sur chaque script/link CDN.
- **Statut** : [x] corrige partiellement (SRI ajoute sur Leaflet. Firebase SDK/Tesseract.js : versions dynamiques, SRI non applicable)

### [S05] CSP utilise 'unsafe-inline' pour script-src et style-src
- **Fichier** : `firebase.json` ligne 25
- **Description** : Reduit la protection XSS. Compromis comprehensible pour single-file app.
- **Recommandation** : Documenter le compromis. Envisager nonces ou strict-dynamic a terme.
- **Statut** : [ ] accepte (compromis single-file app sans build step)

### [S06] Cloud Function CORS ouvert a toutes les origines
- **Fichier** : `functions/index.js` ligne 6
- **Description** : cors: true autorise n'importe quel domaine. Risque d'abus comme proxy gratuit.
- **Recommandation** : Restreindre aux origines de l'app.
- **Statut** : [x] corrige (CORS restreint aux domaines *.web.app, *.firebaseapp.com, localhost:3000)

### [S07] Aucune validation de donnees dans les Firestore rules
- **Fichier** : `firestore.rules` lignes 4-9
- **Description** : Pas de limite de taille, pas de verification de types, pas de restriction sur les champs.
- **Recommandation** : Ajouter hasOnly() et size() sur request.resource.data.
- **Statut** : [ ] ouvert

### [S08] Cles API exposees cote client dans les requetes HTTP
- **Fichier** : `app.html` lignes 3680 (RapidAPI), 3776/7447 (Groq)
- **Description** : Cles visibles dans les DevTools de tout utilisateur authentifie.
- **Recommandation** : Proxifier via Cloud Functions.
- **Statut** : [ ] ouvert

### [S09] Documents shares/ lisibles sans authentification ni expiration cote rules
- **Fichier** : `firestore.rules` ligne 24
- **Description** : allow read: if true. Pas de verification d'expiration cote rules (uniquement client). Token de ~37 bits d'entropie.
- **Recommandation** : Ajouter resource.data.expiresAt > request.time dans les rules. Augmenter entropie token.
- **Statut** : [x] corrige (expiresAt > request.time dans rules + token 24 bytes/32 chars)

## RECOMMANDE

### [S10] localStorage stocke les donnees en clair
- **Description** : Toutes les donnees vehicule en clair. Risque acceptable pour projet perso si XSS robuste.
- **Statut** : [ ] ouvert

### [S11] Pas de limite de taille fichier pour les photos
- **Fichier** : `app.html` ligne 3971
- **Recommandation** : Validation taille (max 20 Mo) et type (image/*) avant traitement.
- **Statut** : [ ] ouvert

### [S12] Validation d'import incomplete
- **Fichier** : `app.html` lignes 6070-6104
- **Recommandation** : Valider valeurs : longueur, plages, format dates.
- **Statut** : [ ] ouvert

### [S13] Service Worker cache sans validation Content-Type
- **Fichier** : `sw.js` lignes 40-43
- **Recommandation** : Limiter cache aux requetes same-origin.
- **Statut** : [x] corrige (same-origin check + skip CDN/API domains + cache eviction 50 entries)

### [S14] Pas de rate limiting sur les appels API cote client
- **Fichier** : `app.html` lignes 3680, 3776
- **Recommandation** : Flag "en cours" + desactivation bouton.
- **Statut** : [ ] ouvert

## Points positifs
- escHtml/escAttr : utilisation systematique dans tous les templates innerHTML
- sanitizeCsvCell : protection CSV injection
- genId() : collision-safe
- generateToken : crypto.getRandomValues
- Headers securite : HSTS, X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy
- OCR 100% local (Tesseract.js)
- Photos redimensionnees client-side avant stockage
