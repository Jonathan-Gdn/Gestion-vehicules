# Review Qualite - MonGarage
- **Date** : 2026-04-09
- **Agent** : quality-reviewer
- **Perimetre** : app.html, sw.js, manifest.json, firebase.json

## Verdict : WARNING (0 critique, 9 importants, 8 recommandes) - **MAJ 2026-04-09 : 9/9 IMPORTANT corriges, 6/8 RECOMMANDE corriges**

## Findings

### [IMPORTANT] IDs Date.now() avec collision possible
- **Fichier** : app.html (saveVehicle, addKmReading, etc.)
- **Description** : Deux IDs generes avec `Date.now()` dans la meme operation peuvent collisionner. Le `.filter(d => d.id !== id)` supprime alors les mauvaises entrees.
- **Correction** : Utiliser `crypto.randomUUID()` ou `Date.now() + Math.random()`.
- **Statut** : [x] corrige - genId() (Date.now()*1000 + compteur) remplace tous les Date.now() ID

### [IMPORTANT] Tesseract worker jamais termine - fuite memoire
- **Fichier** : app.html (getTesseractWorker)
- **Description** : Le worker OCR est cree au premier usage et jamais libere. Sur mobile PWA, reste actif en memoire toute la session.
- **Correction** : Terminer le worker apres 5 min d'inactivite ou sur `beforeunload`.
- **Statut** : [x] corrige - scheduleTesseractCleanup() auto-terminate apres 5 min d'inactivite

### [IMPORTANT] Migration loadStore incomplete - washes/washCredits absents
- **Fichier** : app.html (loadStore, bloc migration)
- **Description** : Les tableaux `washes` et `washCredits` ne sont pas initialises pour les donnees pre-v1.1. Erreurs silencieuses dans renderStats/renderWash.
- **Correction** : Ajouter `if (!v.washes) v.washes = []; if (!v.washCredits) v.washCredits = [];` dans le bloc migration.
- **Statut** : [x] corrige

### [IMPORTANT] XSS dans loadShares - URL dans onclick inline
- **Fichier** : app.html (loadShares, ~ligne 1590)
- **Description** : URL de partage inseree dans `onclick="copyToClipboard('${url}')"` sans echappement. Si l'origine contient une apostrophe, le HTML est malformed.
- **Correction** : Utiliser `data-url` attribute + delegation d'evenements.
- **Statut** : [x] corrige - data-share-url/data-share-id + this.dataset

### [IMPORTANT] config.js absent du cache Service Worker
- **Fichier** : sw.js, ligne 2-7
- **Description** : `config.js` n'est pas dans le tableau `ASSETS` du SW. En offline, l'app charge app.html mais pas config.js, rendant l'app non fonctionnelle.
- **Correction** : Ajouter `'./config.js'` dans ASSETS.
- **Statut** : [x] corrige - config.js ajoute dans ASSETS du SW

### [IMPORTANT] renderCompare - cout/km sur km total au lieu de km depuis achat
- **Fichier** : app.html (renderCompare, ~ligne 4192)
- **Description** : `costPerKm` divise par `v.currentKm` (total) au lieu de km parcourus depuis l'achat. Vehicule achete a 80 000 km avec 5 000 km suivi = cout 17x trop faible.
- **Correction** : Utiliser `getKmSinceOwnership(v)?.kmDone` au lieu de `v.currentKm`.
- **Statut** : [x] corrige - utilise getKmSinceOwnership(v).kmDone avec fallback v.currentKm

### [IMPORTANT] Touch handlers - variables globales fragiles
- **Fichier** : app.html, lignes 5186-5279
- **Description** : Pull-to-refresh et swipe partagent des variables globales et deux handlers touchstart/touchend separes. Interference possible.
- **Correction** : Fusionner en un seul handler avec decision basee sur ratio dy/dx.
- **Statut** : [x] corrige - handler unifie touchStartX/Y, decision dy/dx dans touchend

### [IMPORTANT] Schedule editor - index numerique dans closure HTML
- **Fichier** : app.html (renderScheduleEditorRows, lignes 5301-5307)
- **Description** : `onchange="scheduleEditorData[${i}].name=this.value"` - si une ligne est supprimee pendant l'edition, l'index est desynchronise.
- **Correction** : Utiliser un identifiant stable ou `data-index` mis a jour a chaque re-render.
- **Statut** : [x] corrige - data-index sur row + this.closest('[data-index]').dataset.index

### [IMPORTANT] Recherche - textContent inclut les boutons
- **Fichier** : app.html (filterHistory, filterFuel, lignes 5129-5155)
- **Description** : La recherche sur `.textContent` inclut "Modifier", "Supprimer", "Refaire". Taper "supprimer" montre toutes les entrees.
- **Correction** : Cibler un element conteneur dedie aux donnees (`.entry-data`).
- **Statut** : [x] corrige - .entry-data wrapper ajoute dans renderHistory/renderFuel + filtre sur .entry-data

### [RECOMMANDE] Icone maskable manquante dans manifest.json
- **Statut** : [ ] ouvert

### [RECOMMANDE] appVersion figee a '1.0' dans exportData
- **Statut** : [ ] ouvert

### [RECOMMANDE] Graphes SVG : ~80 lignes dupliquees entre conso et prix
- **Statut** : [ ] ouvert

### [RECOMMANDE] seededRandom - diviseur LCG incorrect
- **Statut** : [ ] ouvert

### [RECOMMANDE] switchSection - querySelector avec interpolation non echappee
- **Statut** : [ ] ouvert

### [RECOMMANDE] renderNotebook dans stats mais affiche dans entretien
- **Statut** : [ ] ouvert

### [RECOMMANDE] handleImport - validation partielle des donnees
- **Statut** : [ ] ouvert

### [RECOMMANDE] manifest.json - champ id absent
- **Statut** : [ ] ouvert

## Points conformes
- Pattern updateActiveVehicle coherent
- Cache _storeCache avec invalidateStoreCache
- Lazy rendering par section (renderAll)
- Try/catch systematique dans renderAll
- Exports complets (JSON, CSV, HTML/PDF) avec BOM UTF-8
- Headers HTTP corrects dans firebase.json
- SW : nettoyage anciens caches, skipWaiting, clients.claim
- Heuristique conso full-to-full solide
- Graphes SVG inline sans dependance externe
- Feedback haptic mobile
- Swipe adaptatif par type vehicule
- Verification IA schedule avec score similarite fuzzy
- Import schedule merge/replace avec confirmation
