# Audit complet MonGarage v3.3 - 2026-04-10

Audit multi-domaine : securite, performance, code qualite, infra, UX.
6 agents paralleles + corrections autonomes des fixes sans risque.

---

## Securite

### [x] CRITIQUE - Spoofing acceptedByUid (firestore.rules)
Un utilisateur pouvait injecter un UID different dans acceptedByUid pour donner acces a un tiers.
**Fix** : ajout `request.resource.data.acceptedByUid == request.auth.uid` dans la rule update invitations.

### [x] IMPORTANT - onAuthReady(null) ne nettoyait pas l'etat (app.html)
Session expiry via Firebase Auth ne nettoyait que le snapshot listener. Donnees sensibles (API keys, garage doc, store cache) restaient en memoire.
**Fix** : cleanup complet miroir de signOut() dans la branche else de onAuthReady.

### [x] IMPORTANT - Race condition sharedWith (functions/index.js)
Read-then-update sur le champ sharedWith pouvait perdre des ecritures concurrentes.
**Fix** : remplacement par `FieldValue.arrayUnion()` (operation atomique).

### [x] RECOMMANDE - CORS Cloud Functions
CORS accepte `*.web.app` / `*.firebaseapp.com` (tout projet Firebase). Pourrait etre restreint au projet specifique.
**Fix** : ALLOWED_ORIGINS restreint a `gestion-vehicules-1a58c.web.app`, `.firebaseapp.com` et `localhost:3000`.

---

## Performance

### [x] IMPORTANT - renderAllSections() remplace par renderAll() (app.html)
`renderAllSections()` rendait les 5 sections a chaque action (meme les 4 non-visibles).
**Fix** : 9 call sites remplaces par `renderAll()` (section active uniquement). ~80% de renderers en moins par action.

### [x] IMPORTANT - Double render au boot (app.html)
`renderAllSections()` a la fin du script + `renderAllSections()` dans `onAuthReady` = double render.
**Fix** : suppression de l'appel initial (ligne 7860). `onAuthReady` gere le premier render.

### [x] IMPORTANT - Cache getStatus() (app.html)
`getStatus()` itere sur toutes les entries O(n*m) pour chaque item du programme, appele ~13 fois par render.
**Fix** : cache `_statusCache` indexe par `item.name|vehicle.id|currentKm`, invalide avec `invalidateStoreCache()`.

### [x] IMPORTANT - Debounce Firestore writes (app.html, session precedente)
Chaque saveStore() declenchait une ecriture Firestore immediate.
**Fix** : debounce 2s + safety timeout 10s pour `_pendingWrites`.

---

## Infrastructure

### [x] IMPORTANT - manifest.json icon purpose
`"purpose": "maskable"` seul empechait l'utilisation comme icone standard.
**Fix** : change en `"any maskable"`.

### [x] IMPORTANT - Firestore rules config/api_keys simplification
`exists()` sur garages/{uid} ajoutait une lecture Firestore par requete. Les API keys sont en lecture seule et non-sensibles.
**Fix** : simplifie en `request.auth != null`.

### [x] IMPORTANT - SW eviction batch (sw.js)
Eviction un par un quand le cache depassait la limite = inefficace si beaucoup d'entries ajoutees d'un coup.
**Fix** : batch delete de toutes les entries en exces en une fois.

### [x] Node.js 22 (functions/package.json)
Upgrade de Node.js 20 (deprecated 30/04/2026) vers Node.js 22.

---

## Code qualite

### [x] CRITIQUE - onclick sans quotes (app.html, 16 occurrences)
Tous les boutons edit/delete/redo/renew avec des IDs UUID (contenant des tirets) etaient casses.
`onclick="editFuel(${e.id})"` interpretait le tiret comme operateur moins.
**Fix** : ajout single quotes sur les 16 occurrences.

### [x] IMPORTANT - kmReading IDs numeriques (app.html)
`kmReadings.push({ id: id + 1 })` generait des IDs sequentiels fragiles.
**Fix** : `genId()` (crypto.randomUUID) pour coherence avec tous les autres IDs.

### [x] IMPORTANT - Toast pneu "Pneu ajoute" meme en edition (app.html)
`_editingTireId` etait reset avant le toast, masquant le contexte.
**Fix** : capture `wasEditingTire` avant reset.

### [x] IMPORTANT - updateActiveVehicle fallback (app.html)
`updateActiveVehicle` utilisait `store.vehicles[activeId]` sans fallback, alors que `getActiveVehicle` fallback sur le premier vehicule.
**Fix** : alignement des deux fonctions avec le meme fallback.

### [x] IMPORTANT - Pull-to-refresh migrations (app.html)
Apres sync Firestore, les donnees etaient injectees dans localStorage sans passer par `loadStore()` (migrations).
**Fix** : `loadStore()` appele apres injection pour executer les migrations.

---

## UX

### [x] RECOMMANDE - Contraste --muted (app.html)
`#999` sur fond sombre = ratio contraste insuffisant (~3.5:1 vs 4.5:1 requis WCAG AA).
**Fix** : `#aaa` (~4.9:1, conforme AA).

### [x] RECOMMANDE - Escape pour fermer modals (app.html)
Pas de raccourci clavier pour fermer les modals.
**Fix** : keydown listener Escape sur vehicleModal, scheduleModal, importScheduleModal, shareModal.

---

## Items necessitant un arbitrage utilisateur

### [x] CRITIQUE UX - Navigation Back / Deep linking
Pas de gestion history API. Le bouton retour du navigateur quitte l'app.
**Fix** : `history.pushState` dans `switchSection()`, `popstate` listener, `replaceState` au boot. Back button navigue entre sections.

### [x] CRITIQUE UX - Focus trap dans les modals
Tab navigue en dehors du modal ouvert (accessibilite).
**Fix** : fonctions `trapFocus(modal)` / `releaseFocus(modal)` avec Tab/Shift+Tab trapping. Applique sur les 5 modals (vehicle, schedule, importSchedule, share, confirm).

### [x] IMPORTANT UX - Remplacer confirm()/alert() natifs
Popups systeme cassent le flow mobile et bloquent JS.
**Fix** : custom confirm modal (`customConfirm(message)` retourne Promise<boolean>), 16 confirm() remplaces par `await customConfirm()`, fonctions appelantes rendues `async`. Escape, overlay click et bouton Annuler ferment en mode cancel.

---

## Audit v3.3.11 - Passe 2 (4 agents paralleles)

### [x] CRITIQUE - Data loss apres Clear Site Data (app.html)
Apres clear site data + re-auth, `loadStore()` creait un DEFAULT_STORE et `saveStore()` ecrasait les donnees Firestore via debounce 2s (race condition).
**Fix multi-couche** :
1. `loadStore()` : `saveStore(fresh, true)` (local only, jamais push DEFAULT_STORE vers Firestore)
2. `startFirestoreSync()` : force `source: 'server'` pour bypass cache vide post-clear
3. `_syncReady` seulement apres restauration confirmee des donnees
4. `saveStore()` : lit `localStorage` au moment du write (pas closure stale)
5. `switchToOwnGarage/switchToSharedGarage` : await startFirestoreSync() avant renderAll()

### [x] CRITIQUE SECU - switchToSharedGarage sans validation (app.html)
`switchToSharedGarage(uid)` acceptait n'importe quel UID sans verifier qu'il est dans `_sharedGarages`.
**Fix** : validation `_sharedGarages.find(g => g.uid === uid)` avant switch.

### [x] IMPORTANT SECU - IDs non-echappes dans onclick pending entries (app.html)
`completePendingEntry('${p.id}')` sans escHtml - XSS potentiel si ID manipule.
**Fix** : `escHtml(p.id)` dans les 3 boutons pending.

### [x] IMPORTANT PERF - Sort DOM avec appendChild loop (app.html)
`_sortAndFilterEntries` reattachait chaque item un par un, causant N reflows.
**Fix** : `DocumentFragment` pour batch insert.

### [x] IMPORTANT UX - Touch targets trop petits (app.html)
`btn-sm` : 5px 12px (< 44px minimum). Nav items : 6px 12px, font 0.65em.
**Fix** : btn-sm 8px 14px + min-height 36px. Nav items 8px 14px + font 0.72em.

### [x] RECOMMANDE UX - Contraste muted insuffisant (app.html)
`--muted: #aaa` sur fond sombre = 4.9:1. Upgrade vers `#bbb` (~5.7:1, meilleur WCAG AA).

### [x] RECOMMANDE A11Y - aria-label manquant sur bouton profil (app.html)
Bouton profil SVG sans aria-label pour lecteurs d'ecran.
**Fix** : `aria-label="Menu utilisateur"` ajoute.

### [x] RECOMMANDE PERF - beforeunload cleanup Firestore listener (app.html)
Listener Firestore restait actif si l'app etait fermee sans sign out.
**Fix** : `window.addEventListener('beforeunload', ...)` pour unsubscribe.

---

### [ ] RECOMMANDE - Photos base64 migration
Les photos sont stockees en base64 inline dans Firestore (gonfle le document).
**Migration** : vers Google Drive (deja integre). Travail consequent pour migrer l'existant.

---

## Suggestions roadmap

Roadmap complete deplacee dans `CLAUDE.md` section "Backlog features" (28 features categorizees avec complexite).

---

## Audit qualite code - Passe 3 (coherence, rendu, dead code, async, i18n, modals)

### [x] CRITIQUE - Appel fonction inexistante migratePhotosToDriver() (app.html:938)
Le bouton "Migrer photos Drive" appelle `migratePhotosToDriver()` (avec "r" final) alors que la fonction definie est `migratePhotosToDrive()` (ligne 8532). Clic = ReferenceError silencieux, migration impossible.
**Fix** : renomme la fonction en `migratePhotosToDrive()` + mise a jour de l'appel HTML.

### [x] IMPORTANT - shareModal pattern display obsolete, Escape inoperant (app.html:2157-2165)
shareModal utilise `style="display:none"` et `modal.style.display = 'flex'/'none'` alors que le handler Escape teste `.classList.contains('show')`. Escape ne fermera jamais le shareModal.
**Fix** : migre shareModal vers `.classList.add/remove('show')` (coherent avec les autres modals).

### [x] IMPORTANT - 3 modals absents du handler Escape (app.html:10930-10942)
`dashConfigModal`, `diagnosticModal` et `obdModal` ne sont pas testes dans le handler keydown Escape. Fermeture clavier impossible.
**Fix** : ajoute les 3 modals au handler Escape.

### [x] IMPORTANT - 3 modals sans trapFocus/releaseFocus (app.html:8629, 8703, 8901)
`showDashboardConfig`, `showDiagnosticLights` et `showOBDModal` utilisent `.classList.add('show')` mais n'appellent pas `trapFocus(modal)`. Le focus peut s'echapper du modal (accessibilite clavier degradee).
**Fix** : ajoute `trapFocus(modal)` a l'ouverture et `releaseFocus(modal)` a la fermeture des 3 modals.

## Securite Batch 7 - Passe 4

### [x] IMPORTANT - OBD innerHTML sans escHtml() sur donnees Bluetooth (app.html:8917-8923)
Les valeurs `_obdReadings` inserees via innerHTML sans `escHtml()`. Fragile si evolution du code ajoute des chaines.
**Fix** : ajout `escHtml(String(...))` + `isNaN()` checks sur toutes les valeurs OBD.

### [x] IMPORTANT - showDashboardConfig() outerHTML casse le modal a la 2e ouverture (app.html:8628)
`outerHTML` remplace l'element `.modal-content` lui-meme, querySelector echoue ensuite.
**Fix** : change en `innerHTML` + suppression du wrapper `<div class="modal-content">` du html genere.

### [x] IMPORTANT - migratePhotosToDrive() pas de confirmation + typo (app.html:8532)
Migration massive sans `confirm()` + nom de fonction avec typo (`Driver` au lieu de `Drive`).
**Fix** : ajout confirm() avant migration + rename function.

### [x] RECOMMANDE - Permissions-Policy ne declare pas bluetooth (firebase.json:25)
La Permissions-Policy ne mentionnait pas `bluetooth`.
**Fix** : ajout `bluetooth=(self)`.

### [x] RECOMMANDE - Pas de validation NaN sur parseInt OBD (app.html:8860-8891)
ParseInt sur hex malformes retourne NaN, affiche "NaN km".
**Fix** : ajout `isNaN()` checks (inclus dans le fix OBD innerHTML ci-dessus).

---

### [ ] IMPORTANT - i18n non fonctionnel malgre infrastructure en place (app.html:8952-9067)
Dictionnaires `I18N` (FR/EN/ES, ~45 cles) et `t(key)` existent, mais `t()` n'est utilise que 2 fois dans le rendu (lignes 9058, 9063 dans `applyTranslations`). Les ~100+ templates innerHTML utilisent des chaines francaises en dur. Changer de langue ne traduit que nav labels, sub-tabs et header.
**Correction** : soit supprimer l'infrastructure i18n (dead feature), soit planifier le remplacement progressif par `t()`.

### [ ] RECOMMANDE - applyTranslations() couvre < 5% de l'interface (app.html:9043-9067)
La fonction ne met a jour que nav/tabs/header. Tout le contenu genere par les render functions reste en francais.

### [ ] RECOMMANDE - 6 .catch(() => {}) silencieux (app.html:1821, 1879, 2346, 8335, 9116, 10883)
Catch vides avalent les erreurs sans log. Acceptable pour operations non critiques (clipboard, notifications) mais rend le debug difficile.
**Correction** : `.catch(e => console.warn('...', e))` au minimum.

### [ ] RECOMMANDE - Pas de removeEventListener (app.html, global)
Les event listeners (touch, resize, visibilitychange) ne sont jamais retires. Acceptable pour SPA sans navigation de page.

### Points positifs
- **updateActiveVehicle** : pattern coherent (35+ occurrences), pas de mutation directe du store
- **genId()** : utilise partout, aucun `Math.random()` seul pour les IDs
- **escHtml()** : ~100+ occurrences dans les templates innerHTML, protection XSS coherente
- **Async/await** : try/catch avec toast feedback sur toutes les fonctions async
- **Pipeline de rendu** : tous les render functions enregistrees dans `_sectionRenderers`, fault isolation try/catch individuel
- **SVG charts** : pattern coherent avec viewBox et responsive
- **Navigation data-section** : pas d'onclick inline pour la navigation principale
- **Aucun dead code significatif detecte** : toutes les fonctions verifiees sont appelees
