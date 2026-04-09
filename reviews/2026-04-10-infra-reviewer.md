# Audit Infrastructure Firebase MonGarage v3.3 - 2026-04-10

- **Agent** : infra-reviewer (Opus)
- **Perimetre** : firestore.rules, firebase.json, functions/index.js, functions/package.json, sw.js

## CRITIQUE

### [I01] La rule sharedWith ne fonctionne pas pour acceptFamilyInvitation
- **Fichier** : `firestore.rules` lignes 8-9, `app.html` lignes 2054-2059
- **Description** : Le recipient fait garageRef.update({ sharedWith }) sur le doc du owner. Il n'est pas le owner et pas encore dans sharedWith. La rule devrait refuser. Bug fonctionnel + faille potentielle.
- **Recommandation** : Deplacer dans une Cloud Function ou ajouter une rule basee sur l'existence d'une invitation accepted.
- **Statut** : [x] corrige (Cloud Function onInvitationAccepted + acceptFamilyInvitation simplifie)

### [I02] Utilisateur partage peut ecraser tout le document garage (y compris sharedWith)
- **Fichier** : `firestore.rules` lignes 8-9
- **Description** : write complet pour les shared users. Peuvent modifier sharedWith, ownerEmail, supprimer le doc.
- **Recommandation** : Restreindre a update, proteger sharedWith et ownerEmail contre modification par non-owners.
- **Statut** : [x] corrige (update only + sharedWith/ownerEmail immutables pour shared users)

## IMPORTANT

### [I03] Collection shares lisible sans authentification
- **Fichier** : `firestore.rules` ligne 24
- **Description** : allow read: if true. Pas d'expiration cote rules. Token ~37 bits entropie.
- **Recommandation** : Ajouter resource.data.expiresAt > request.time. Augmenter entropie token.
- **Statut** : [x] corrige (expiresAt > request.time + token 24 bytes/32 chars)

### [I04] Pas de validation de donnees dans les rules
- **Fichier** : `firestore.rules` toutes les rules
- **Recommandation** : Validation taille, types, champs obligatoires. Limite invitations.
- **Statut** : [ ] ouvert

### [I05] Invitation update trop permissive
- **Fichier** : `firestore.rules` ligne 18
- **Description** : Destinataire peut modifier tous les champs (fromUid, toEmail, status). Peut changer fromUid pour acceder a un garage arbitraire.
- **Recommandation** : Restreindre : seul status de pending a accepted, verrouiller fromUid et toEmail.
- **Statut** : [x] corrige (status pending->accepted only, fromUid/toEmail/fromEmail immutables)

### [I06] config.js potentiellement deploye via predeploy
- **Fichier** : `firebase.json` ligne 11
- **Description** : predeploy copie config.js dans dist/. Si le fichier existe, il est deploye publiquement.
- **Recommandation** : Retirer du predeploy si setup dynamique IndexedDB est le mode principal.
- **Statut** : [x] corrige (copie conditionnelle : `[ -f config.js ] && cp config.js dist/ || true`)

### [I07] CSP autorise 'unsafe-inline' pour scripts
- **Fichier** : `firebase.json` ligne 25
- **Recommandation** : Documenter le compromis. Nonces ou strict-dynamic a terme.
- **Statut** : [ ] ouvert

### [I08] CORS ouvert sur la Cloud Function
- **Fichier** : `functions/index.js` ligne 6
- **Recommandation** : Restreindre aux origines de l'app.
- **Statut** : [x] corrige (CORS restreint *.web.app, *.firebaseapp.com, localhost:3000)

### [I09] Pas d'authentification sur la Cloud Function
- **Fichier** : `functions/index.js`
- **Description** : Pas de verification token Firebase Auth. N'importe qui peut appeler.
- **Recommandation** : Verifier Authorization header avec admin.auth().verifyIdToken().
- **Statut** : [ ] ouvert

### [I10] Pas de rate limiting Cloud Function
- **Recommandation** : maxInstances: 10 + rate limiter.
- **Statut** : [x] corrige (maxInstances: 10)

## RECOMMANDE

### [I11] config/api_keys lisible par tous les users authentifies
- **Recommandation** : Restreindre par UID ou existence du doc garage.
- **Statut** : [x] corrige (rule exists(/databases/.../garages/$(request.auth.uid)))

### [I12] Pas de cache headers differencies par type de fichier
- **Fichier** : `firebase.json`
- **Recommandation** : no-cache pour HTML, long cache pour assets statiques.
- **Statut** : [x] corrige (3 blocs : HTML no-cache, assets 86400s, sw.js no-cache)

### [I13] CSP manque object-src et worker-src explicites
- **Recommandation** : Ajouter object-src 'none'; worker-src 'self';
- **Statut** : [x] corrige (object-src 'none'; worker-src 'self' dans CSP)

### [I14] Pas de validation des coordonnees lat/lon
- **Fichier** : `functions/index.js` lignes 7-8
- **Recommandation** : Valider plages lat [-90,90] lon [-180,180].
- **Statut** : [x] corrige (validation plages + type number)

### [I15] Node.js 18 en fin de vie
- **Fichier** : `functions/package.json` ligne 4
- **Recommandation** : Migrer vers Node 20 ou 22.
- **Statut** : [x] corrige (Node 20)

### [I16] Pas de package-lock.json dans functions/
- **Recommandation** : npm install && commit lock file.
- **Statut** : [x] corrige (package-lock.json genere)

### [I17] Version cache SW figee a v3.0 (app en v3.3)
- **Fichier** : `sw.js` ligne 1
- **Recommandation** : Incrementer a mongarage-v3.3. Automatiser via predeploy.
- **Statut** : [x] corrige (mongarage-v3.3)

### [I18] skipWaiting() force l'activation immediate
- **Recommandation** : Acceptable pour mono-utilisateur. Flow "update available" pour multi-users.
- **Statut** : [ ] ouvert
