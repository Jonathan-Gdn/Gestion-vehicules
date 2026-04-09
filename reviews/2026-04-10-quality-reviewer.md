# Audit Qualite MonGarage v3.3 - 2026-04-10

- **Agent** : quality-reviewer (Opus)
- **Perimetre** : app.html (7910 lignes), sw.js, functions/index.js

**Total : 40 findings** (3 critiques, 21 importants, 16 recommandes)

## CRITIQUE

### [Q01] Division par zero dans renderLastFill
- **Fichier** : `app.html` ligne 6483
- **Description** : (last.cost / last.liters).toFixed(3) - si liters est 0/null/undefined = Infinity/NaN affiche.
- **Recommandation** : `const pricePerL = last.liters > 0 ? (last.cost / last.liters).toFixed(3) : '-';`
- **Statut** : [x] corrige

### [Q02] Jours calendrier : divs au lieu de boutons (accessibilite)
- **Fichier** : `app.html` - renderCalendar
- **Description** : Jours = div avec onclick. Pas focusables clavier, pas de role, pas de tabindex.
- **Recommandation** : Utiliser `<button>` avec aria-label.
- **Statut** : [ ] ouvert

### [Q03] 117 innerHTML - risque XSS par omission
- **Fichier** : `app.html` - 117 affectations .innerHTML
- **Description** : escHtml() utilise mais 117 points d'injection avec templates complexes. Une seule omission = XSS.
- **Recommandation** : textContent quand pas de HTML. Tagged template literals avec echappement par defaut.
- **Statut** : [ ] ouvert

## IMPORTANT - Maintenabilite

### [Q04] Duplication objets typeLabels (8 occurrences)
- **Fichier** : `app.html` lignes 2643, 4707, 4810, 4892, 5033, 5818, 5875, 6030
- **Recommandation** : Constantes globales (TIRE_TYPE_LABELS, WASH_TYPE_LABELS, etc.)
- **Statut** : [ ] ouvert

### [Q05] Generation SVG inline dupliquee dans ~10 fonctions
- **Recommandation** : Helper buildSvgChart() pour la structure commune.
- **Statut** : [ ] ouvert

## IMPORTANT - Performance

### [Q06] renderAllSections() rend toutes les sections (y compris invisibles)
- **Fichier** : `app.html` lignes 6169-6179
- **Recommandation** : Remplacer par renderAll(getActiveSection()) sauf au boot.
- **Statut** : [ ] ouvert

### [Q07] Aucun debounce sur les champs de recherche
- **Fichier** : `app.html` lignes 1006, 1205, 1276
- **Recommandation** : Debounce 200-300ms.
- **Statut** : [x] corrige (debounce 250ms sur les 3 inputs)

### [Q08] Tri O(n log n) pour obtenir un seul element
- **Fichier** : `app.html` lignes 6435, 6458, 6467, 6481, 5724
- **Recommandation** : Helper latest(arr, key) en O(n).
- **Statut** : [ ] ouvert

## IMPORTANT - Robustesse

### [Q09] genId() risque de collision multi-onglet
- **Fichier** : `app.html` ligne 6113
- **Recommandation** : crypto.randomUUID() ou timestamp + random.
- **Statut** : [x] corrige (crypto.randomUUID() avec fallback)

### [Q10] Sync Firestore ecrase localStorage sans merge
- **Fichier** : `app.html` lignes 1733-1739
- **Recommandation** : Timestamp local + dialogue de resolution si local > remote.
- **Statut** : [ ] ouvert

### [Q11] Import JSON sans validation de schema
- **Fichier** : `app.html` lignes 6070-6106
- **Recommandation** : Validation minimale types et structure.
- **Statut** : [ ] ouvert

### [Q12] Markers non nettoyes en cas d'erreur fetch stations
- **Fichier** : `app.html` lignes 6625-6699
- **Recommandation** : Clear markers au debut de la fonction.
- **Statut** : [x] corrige (markers cleared avant fetch)

## IMPORTANT - Accessibilite

### [Q13] Graphes SVG sans texte alternatif
- **Fichier** : `app.html` - ~10 fonctions SVG
- **Recommandation** : Ajouter role="img" aria-label + `<title>` SVG.
- **Statut** : [ ] ouvert

### [Q14] Couleur comme seul indicateur (stations, pneus, alertes)
- **Recommandation** : Texte complementaire ou icones distinctives.
- **Statut** : [ ] ouvert

### [Q15] Labels implicites dans le setup form
- **Fichier** : `app.html` lignes 853-858
- **Recommandation** : Ajouter for="id" sur chaque label.
- **Statut** : [ ] ouvert

## IMPORTANT - UX

### [Q16] Perte donnees sans avertissement au retour en ligne
- **Fichier** : `app.html` lignes 1729-1742
- **Recommandation** : Toast de synchro + avertissement si modifications locales existaient.
- **Statut** : [ ] ouvert

### [Q17] Pas de confirmation/undo apres suppression
- **Recommandation** : toast('Element supprime') + undo 5 secondes idealement.
- **Statut** : [ ] ouvert

## IMPORTANT - Code mort

### [Q18] Variable usedProxy jamais lue
- **Fichier** : `app.html` ligne 6633
- **Recommandation** : Supprimer.
- **Statut** : [x] corrige (supprime)

### [Q19] importPhotoText ambigu
- **Fichier** : `app.html` lignes 7341, 7345, 7371
- **Recommandation** : Renommer ou utiliser comme vrai cache.
- **Statut** : [x] corrige (dead code supprime)

## IMPORTANT - Patterns anti

### [Q20] Tout le store dans un seul champ Firestore
- **Fichier** : `app.html` lignes 2311-2321
- **Description** : JSON.stringify(store) dans un seul champ data. Peut depasser 1 MB avec photos base64.
- **Recommandation** : Surveiller taille. Migrer vers sous-collections a terme.
- **Statut** : [ ] ouvert

### [Q21] ignoreNextSnapshot boolean fragile
- **Fichier** : `app.html` lignes 1568, 2316, 1730-1731
- **Recommandation** : Compteur _pendingWrites ou comparaison de hash.
- **Statut** : [x] corrige (_pendingWrites counter avec increment/decrement)

## IMPORTANT - Compatibilite

### [Q22] Firebase compat SDK deprecated
- **Fichier** : `app.html` lignes 15-17
- **Recommandation** : Migrer vers modular SDK (requiert build step).
- **Statut** : [ ] ouvert

## IMPORTANT - Service Worker

### [Q23] Pas de limite de taille du cache
- **Fichier** : `sw.js` lignes 39-46
- **Recommandation** : Max 50 entrees avec eviction LRU.
- **Statut** : [x] corrige (MAX_CACHE_ENTRIES = 50 avec eviction)

### [Q24] Pas de notification de mise a jour
- **Fichier** : `app.html` lignes 7817-7818, `sw.js`
- **Recommandation** : Ecouter controllerchange, afficher toast.
- **Statut** : [ ] ouvert

## IMPORTANT - Cloud Function

### [Q25] Pas de timeout HTTP sortant
- **Fichier** : `functions/index.js` lignes 21-30
- **Recommandation** : { timeout: 10000 } + gestion event timeout.
- **Statut** : [x] corrige (AbortController timeout 10s)

### [Q26] Pas de rate limiting
- **Fichier** : `functions/index.js`
- **Recommandation** : firebase-functions-rate-limiter ou maxInstances.
- **Statut** : [x] corrige (maxInstances: 10)

## RECOMMANDE

### [Q27] Pas de documentation JSDoc
### [Q28] Toutes les fonctions globales (~200)
### [Q29] Pas de virtualisation longues listes
### [Q30] Calendar rebuild complet a chaque rendu
### [Q31] 16 confirm() bloquants
### [Q32] Navigation clavier incomplete (modals, focus trap)
### [Q33] Formulaires sans nom vehicule actif
### [Q34] Pas de feedback visuel pendant OCR
### [Q35] Cloud Function nearbyStations potentiellement inutilisee
### [Q36] appVersion "2.0" obsolete (v3.3 attendu) - [x] corrige
### [Q37] ~50+ inline event handlers (onclick, oninput)
### [Q38] Magic numbers non nommes (3.5, 15000, 86400000, etc.)
### [Q39] Tesseract.js CDN sans version pinee
### [Q40] Pas de background sync pour writes offline

- **Statut** : [ ] ouvert (tous)
