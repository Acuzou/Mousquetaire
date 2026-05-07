---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - docs/project-context.md
---

# Mousquetaire - Epic Breakdown

## Overview

Ce document regroupe la décomposition epics & stories pour **Mousquetaire**, à partir du PRD, de la spec UX, de l’architecture et du contexte projet. Les **user stories** et critères d’acceptation par épique figurent dans les sections **## Epic N** ci-dessous.

## Requirements Inventory

### Functional Requirements

FR1: Un **joueur** peut **créer une salle** et **obtenir un code** permettant à d’autres de rejoindre.

FR2: Un **joueur** peut **rejoindre une salle** en saisissant un **code** et un **pseudo**.

FR3: Un **joueur** peut **quitter** la salle ou la session selon les règles définies pour la **fin de partie** ou l’**abandon**.

FR4: Le **système** peut **refuser** une entrée avec **message explicite** lorsque le **code est invalide** ou que la **salle n’est pas disponible** dans les cas prévus.

FR5: Les **joueurs** peuvent **contribuer collectivement** à la constitution du **jeu de cartes** (méga-deck) dans les **limites** du périmètre V1.

FR6: Un **hôte** (ou rôle équivalent défini par les règles) peut **démarrer la partie** lorsque les **conditions minimales** sont remplies.

FR7: Les **joueurs** peuvent **jouer selon une variante Mousquetaire** correspondant à la **configuration P0** livrée en V1.

FR8: Les **joueurs** peuvent **alterner les tours** selon les **règles** de la variante (dont désignation des donneurs d’indices et des devineurs selon le modèle retenu).

FR9: Un **joueur** autorisé peut **donner un indice** conformément aux règles du tour.

FR10: Les **joueurs** concernés peuvent **sélectionner des cartes** sur la grille en réponse à l’indice.

FR11: Le **système** peut **révéler** les cartes sélectionnées et **mettre à jour** l’état visible pour **tous les participants**.

FR12: Les **joueurs** peuvent **atteindre une fin de manche** (ou **état terminal** nommé) avec **résultat lisible** pour la table.

FR13: Les **joueurs** peuvent **voir** à tout moment **qui doit agir** (indicateur de tour ou de rôle actif).

FR14: Les **joueurs** peuvent **identifier** le **résultat** d’une manche ou de la partie selon les **règles** (scores, équipe gagnante, message de fin ou équivalent défini en conception).

FR15: Un **joueur** qui **rejoint en cours de partie** peut être **informé** de son **statut** (spectateur, attente, équipe, etc.) selon ce qui est **tranché** en P0.

FR16: Les **joueurs** peuvent **continuer à jouer** lorsqu’un participant **se reconnecte** après une interruption, **sans corrompre** l’état du tour pour les autres (**dans les limites V1**).

FR17: Un **joueur seul** peut **parcourir** un mode d’**apprentissage** ou d’**entraînement** **sans** partie multijoueur obligatoire.

FR18: Un **joueur seul** peut **terminer** le **parcours pédagogique nominal** jusqu’à un **état de fin prévu**.

FR19: Un **joueur** ou l’**hôte** peut **activer** ou **désactiver** des **fonctions assistées par IA** lorsque celles-ci existent, **sans bloquer** le jeu nominal **sans** IA.

FR20: Un **joueur** peut **consulter** des **informations** sur l’**usage de l’IA** (transparence).

FR21: Un **visiteur** ou **joueur** peut **lire** les **CGU** et les **informations** sur les **risques** liés au **contenu utilisateur** (18+, absence de filtre produit).

FR22: Un **joueur** peut **consulter** la **version** du produit et les **notes** associées (écran **À propos** ou équivalent).

FR23: Les **joueurs** peuvent utiliser l’**interface** et le **contenu produit** en **français uniquement** en V1.

FR24: Les **joueurs** **ne créent pas** de **compte persistant obligatoire** pour jouer en V1.

FR25: Le **système** applique la **politique de persistance V1** : **pas de sauvegarde serveur de partie** entre sessions ; **données de session** traitées comme **volatiles** sauf **décision contraire** **documentée** (ex. stockage local navigateur pour préférences non critiques).

FR26: L’**utilisateur** est **informé** lorsque son **environnement** (navigateur, contexte) **n’entre pas** dans la **matrice** **navigateurs** **V1** (aligné **Web Application Specific Requirements**).

FR27: Le **produit** **documente et applique** les **limites** retenues pour les **codes de salle** et la **taille du groupe** (y compris l’absence de limite si tel est le choix explicite).

FR28: Le **système** peut **détecter** la **déconnexion** ou le **départ** de l’**hôte** et **appliquer** un **comportement d’état de partie** **documenté** (temporisation, fin de partie, gel, transfert de rôle — **selon décision produit** **à** **trancher**).

FR29: Les **joueurs** **reçoivent** un **retour explicite** lorsque ce **comportement** **s’applique** (message, **options** disponibles, **impossibilité** de continuer **sans** **ambiguïté**).

FR30: Le **système** permet d’**associer** une **partie** à des **événements** ou **informations de diagnostic** **suffisantes** pour **identifier** les **incohérences** d’**état multijoueur** (tour, scores, déconnexions) **dans** des **conditions** de **support** **habituelles**, **sans** imposer une **technologie** **particulière**.

FR31: Lorsqu’un **joueur** **effectue** une **action à risque** (ex. révélation de carte, validation d’indice), le **système** fournit un **retour immédiat lisible** (succès, refus ou état du jeu).

FR32: Lorsque les **règles** et le **design** le **permettent**, un **joueur** peut **annuler** ou **corriger** une **action récente** **sans** **redémarrer** la partie (**réversibilité**).

**Total FRs:** 32

### NonFunctional Requirements

NFR-P1: Les mises à jour d’état de partie visibles par tous les joueurs d’une même salle sont propagées dans un délai compatible avec une interaction synchrone « party » ; calibrage **p95** interne avant le 10 mai.

NFR-P2: Les actions du tour actif (indice, sélection) produisent un retour perceptible sans attente injustifiée pour confirmer l’intention (hors latence réseau non maîtrisée).

NFR-S1: Pas de modération automatisée du texte saisi par les joueurs ; risques documentés dans les CGU.

NFR-S2: Les secrets (clés API LLM, configuration d’infrastructure) ne sont pas exposés dans le bundle client.

NFR-S3: Données nécessaires au fonctionnement traitées conformément aux engagements documentés ; pas d’exigence RGPD exhaustive imposée par ce PRD si hors scope.

NFR-SC1: Volumétrie V1 (peu de salles, moins de 20 joueurs par room) ; comportement dégradé explicite si limite.

NFR-A1: Parcours critiques utilisables au **clavier** avec **focus visible** (niveau proportionné V1).

NFR-A2: Équivalents tactiles mobile ; structure, contraste, ordre de focus, `prefers-reduced-motion` pour le non essentiel ; écarts listés ou justifiés avant prod.

NFR-I1: Services externes (hébergement, LLM) se dégradent sans bloquer le jeu nominal sans LLM.

NFR-I2: Indisponibilité service non critique → message explicite ; timeout visible en quelques secondes (à valider par test).

NFR-O1: Journaux et/ou métriques minimaux pour corréler incidents et sessions (aligné FR30).

**Total NFRs (étiquetés PRD):** 13

### Additional Requirements

Requirements techniques et transverses extraites de `architecture.md` (non nécessairement dupliquées comme FR/NFR) :

- **Starter composite :** frontend **Vite + React** (`npm create vite@latest` react-ts) ; backend **FastAPI** minimal (`pip install "fastapi[standard]"`) ; Node **20.19+** ou **22.12+** pour Vite ; Python **≥ 3.10** pour firebase-admin.
- **Source de vérité :** logique de tour et transitions **validées côté serveur** (FastAPI) ; clients non autoritatifs pour conflits tour/révélation.
- **Canal temps réel :** **WebSocket** (Starlette/FastAPI) pour événements de partie ; enveloppe `{ type, payload, version }`.
- **Persistance :** **Cloud Firestore** pour méta-salle, snapshots/checkpoints reconnexion et diagnostic ; accès **`firebase_admin`**, **`firestore_async`** aligné FastAPI async.
- **API :** REST/JSON création/rejoindre, santé ; WebSocket flux partie ; **OpenAPI** auto ; champs **`snake_case`** JSON serveur ; camelCase front uniquement via couche explicite si besoin.
- **Identité V1 :** pas de compte utilisateur classique ; **code + pseudo** ; jetons session techniques (cookie HTTP-only ou équivalent) — pas JWT « produit » du template tiers.
- **Secrets :** uniquement serveur/CI — **NFR-S2**.
- **LLM :** appels **uniquement backend** ; timeouts ; dégradation sans bloquer jeu sans LLM.
- **Front :** SPA ; Zustand et/ou TanStack Query à figer ; état optimiste **contrôlé** ; réconciliation avec révision serveur.
- **Infra :** front statique (Firebase Hosting / Cloudflare Pages / Vercel) ; API sur PaaS (Cloud Run / Railway / Render) ; enveloppe **ordre de grandeur inférieur à 100 €/mois**.
- **CI :** lint + tests back et front ; README ; arborescence stable ; première story = bootstrap + outillage reproductible (Party Mode architecture).
- **Observabilité :** logs avec **`room_id`**, **`session_id`**, **`correlation_id`** — FR30 / NFR-O1.
- **Conventions :** REST `/rooms`, `/rooms/{room_id}/join` ; Firestore collection **`rooms`** ; composants React **PascalCase** ; événements WS catalogue partagé Python + TS ; idempotence **`Idempotency-Key`** où applicable ; erreurs JSON **`detail`** ; dates ISO 8601 UTC.
- **Séquence indicative :** (1) bootstrap repo + CI ; (2) Firestore + modèle `room` minimal ; (3) REST créer/rejoindre ; (4) WebSocket + machine d’état tour ; (5) snapshots ; (6) solo / IA ensuite.
- **Réconciliation client :** comparer `version` / horodatage serveur ; deltas confirmés ou resync snapshot ; révision **monotone** par agrégat pour testabilité.
- **Option de repli :** SDK temps réel Firestore + Cloud Functions si couplage WS+Firestore menace le ship — arbitrage vertical slice.

### UX Design Requirements

Exigences actionnables extraites de `ux-design-specification.md` (pour stories avec critères de test) :

UX-DR1: Implémenter les **tokens sémantiques Tailwind** (`background`, `card`/`muted`, `primary`, `destructive`, `turn-active`/`accent`, `team-*` accents, `warning`/`legal`) — pas de couleurs brutes hors DS dans les features.

UX-DR2: Appliquer la **direction visuelle A + renfort B** : base « salon chaleureux » + contraste renforcé sur **indice**, **cartes**, **états de tour** et **erreurs**.

UX-DR3: Implémenter **TurnIndicator** + **WordGrid/WordCard** + **ClueComposer** + **SyncBanner** alimentés par un **agrégat d’état manche/tour unique** (pas de désynchronisation « à toi » vs grille verrouillée).

UX-DR4: **WordCard** : zones tactiles **≥ 44 px**, états accessibles (nom, focus visible, `aria-live` sur révélations synchrones), props testables (`revealed`, `selected`, `syncPending`, etc.) et `data-testid`.

UX-DR5: **ClueComposer** : labels, `aria-describedby`, validation clavier, limite caractères perceptible, feedback erreur/succès annoncé.

UX-DR6: **Notifications temps réel** : idempotence UI (`eventId`/version), **un canal** de toast par fait métier, dédup `(type, entityId[, opId])`, file de toasts contrôlée, `clientOpId` pour optimistic → canonique.

UX-DR7: **Charte vocale** : deux niveaux (*léger/jeu* vs *neutre/direct*) ; pas de jeu de mots sur erreurs critiques avant action de récupération.

UX-DR8: **Patterns cohérence** : hiérarchie boutons ; toast vs bannière réseau ; erreurs inline ; gouvernance « pattern hors noyau = exception documentée ».

UX-DR9: **Responsive** : mobile-first, **safe-area** `env(safe-area-inset-*)`, CTA tour en **zone pouce**, breakpoints Tailwind documentés, pas de blocage « tournez l’appareil » par défaut.

UX-DR10: **Accessibilité proportionnée V1** : cinq critères binaires Murat (clavier rejoindre, tour au clavier, erreurs annoncées, focus visible, reduced-motion) + hooks responsive optionnels (reflux 320px, zoom 200 %, cibles 44px).

UX-DR11: **RoundResolution** / beat **fin de manche** distinct de la suite technique (payoff social avant sync suivante).

UX-DR12: **MegaDeckPanel** et **TeamSetup** : lazy-load acceptable ; priorité après happy path **deux clients** si deadline.

UX-DR13: Pages **transparence IA**, **CGU**, **À propos** ; **LegalFooterBlock** ; navigation focusable.

UX-DR14: Arborescence **`components/ui`** (shadcn) vs **`components/game`** ou **`features/mousquetaire`** ; barrels **`@ds/*`** et **`@game/*`** si adoptés.

UX-DR15: Maquette référence **`ux-design-directions.html`** ; vérité implémentation = tokens dans le dépôt.

**Total UX-DR:** 15

### FR Coverage Map

| FR | Epic | Thème |
|----|------|--------|
| FR1 | Epic 1 | Créer salle + code |
| FR2 | Epic 1 | Rejoindre code + pseudo |
| FR4 | Epic 1 | Refus entrée explicite |
| FR21 | Epic 1 | CGU / risques contenu |
| FR22 | Epic 1 | Version / À propos |
| FR23 | Epic 1 | Français UI |
| FR24 | Epic 1 | Pas de compte obligatoire |
| FR25 | Epic 1 | Politique persistance V1 |
| FR26 | Epic 1 | Navigateur hors matrice |
| FR27 | Epic 1 | Limites code / taille groupe |
| FR5 | Epic 2 | Méga-deck collaboratif |
| FR6 | Epic 2 | Démarrer partie (conditions min.) |
| FR7 | Epic 2 | Variante Mousquetaire P0 |
| FR8 | Epic 3 | Alterner tours / rôles |
| FR9 | Epic 3 | Donner indice |
| FR10 | Epic 3 | Sélection cartes |
| FR11 | Epic 3 | Révéler + état partagé |
| FR12 | Epic 3 | Fin de manche |
| FR13 | Epic 3 | Indicateur de tour |
| FR14 | Epic 3 | Résultat manche / partie |
| FR31 | Epic 3 | Retour actions à risque |
| FR32 | Epic 3 | Réversibilité si prévu |
| FR3 | Epic 4 | Quitter / fin session (règles) |
| FR15 | Epic 4 | Rejoin en cours — statut |
| FR16 | Epic 4 | Reconnexion sans corruption |
| FR28 | Epic 4 | Détection départ hôte |
| FR29 | Epic 4 | Retour explicite comportement hôte |
| FR30 | Epic 4 | Diagnostic / corrélation partie |
| FR17 | Epic 5 | Mode apprentissage solo |
| FR18 | Epic 5 | Fin parcours pédagogique |
| FR19 | Epic 6 | Activer / désactiver IA |
| FR20 | Epic 6 | Transparence usage IA |

**Couverture :** 32 / 32 FR assignés.

**NFR / UX-DR :** traités de façon **transversale** dans les stories (perf, sécurité, accessibilité proportionnée, observabilité, tokens, composants métier) — répartition précise à l’étape **création des stories**.

## Epic List

### Epic 1 — Accès salon & cadre produit

Les joueurs et visiteurs peuvent **créer ou rejoindre une salle**, recevoir des **erreurs claires**, consulter **CGU**, **transparence** et **À propos**, utiliser le produit **en français** sans **compte obligatoire**, comprendre la **persistance V1**, être **avertis** si le navigateur est hors matrice, et voir les **limites** code / groupe **documentées**.

**FRs couverts :** FR1, FR2, FR4, FR21, FR22, FR23, FR24, FR25, FR26, FR27

**Notes :** socle **JoinForm**, **LegalFooter**, alignement **NFR-S2/S3**, **NFR-A** sur parcours rejoindre, **UX-DR** pages légales et tokens de base ; story **1.9** = garde-fou **tokens / DS** transversal (**UX-DR1**).

---

### Epic 2 — Prêt pour le premier indice

La table peut **co-construire le méga-deck**, **satisfaire les conditions minimales**, **lancer** la partie selon la **variante P0** figée pour le ship.

**FRs couverts :** FR5, FR6, FR7

**Notes :** **MegaDeckPanel**, **TeamSetup**, **RoomHeader** ; lazy-load acceptable après happy path minimal si deadline (spec UX).

---

### Epic 3 — Boucle de jeu synchrone

Les joueurs vivent la **boucle nominal** : tours, **indice**, **sélections**, **révélations** partagées, **fin de manche**, **résultats lisibles**, **indicateur de tour**, **retours** sur actions à risque et **réversibilité** si les règles P0 la prévoient.

**FRs couverts :** FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR31, FR32

**Notes :** cœur **E2E deux clients** ; **WebSocket** + état autoritatif serveur ; **TurnIndicator**, **WordGrid**, **ClueComposer**, **RoundResolution** ; **NFR-P1/P2**, plus grande partie des **UX-DR** jeu.

---

### Epic 4 — Table résiliente & diagnostic

La soirée **survit aux aléas** : **sortie / abandon** selon règles, **rejoin** en cours avec **statut** clair, **reconnexion** sans corruption pour les autres, **comportement documenté** si l’**hôte** part, **messages explicites**, **traçabilité** partie ↔ diagnostic (**support**).

**FRs couverts :** FR3, FR15, FR16, FR28, FR29, FR30

**Notes :** **SyncBanner**, réconciliation client, logs **room_id** / corrélation (**NFR-O1**) ; chemins **edge** les plus sensibles réseau.

---

### Epic 5 — Solo pédagogique

Un joueur peut **apprendre** et **terminer** un parcours **nominal** sans dépendre du multijoueur pour le **critère de complétion** solo.

**FRs couverts :** FR17, FR18

**Notes :** alignement **rituel de révélation** avec le multi (spec UX) ; priorité arbitrable si tension avec E2E (PRD).

---

### Epic 6 — IA optionnelle & transparence gameplay

Les joueurs peuvent **activer ou désactiver** les fonctions **IA** lorsqu’elles existent **sans bloquer** le jeu sans IA, et **consulter** la **transparence** sur leur usage.

**FRs couverts :** FR19, FR20

**Notes :** appels **backend uniquement** ; **NFR-I1/I2** ; hors chemin critique multijoueur nominal (règle d’acceptation V1).

---

## Epic 1: Accès salon & cadre produit

Les joueurs et visiteurs peuvent **créer ou rejoindre une salle**, recevoir des **erreurs claires**, consulter **CGU**, **transparence** et **À propos**, utiliser le produit **en français** sans **compte obligatoire**, comprendre la **persistance V1**, être **avertis** si le navigateur est hors matrice, et voir les **limites** code / groupe **documentées**.

**FRs :** FR1, FR2, FR4, FR21, FR22, FR23, FR24, FR25, FR26, FR27 — **NFR :** NFR-A1 (parcours rejoindre), NFR-S2 (secrets hors client) — **UX :** UX-DR1 (tokens + story **1.9** garde-fou DS), UX-DR13 (pages légales / footer), UX-DR14 (arborescence composants).

### Story 1.1: Bootstrap dépôt, CI et socle technique

As a **équipe produit**,
I want **un dépôt initial avec frontend Vite+React (TS), backend FastAPI, conventions snake_case API, squelette OpenAPI et pipeline CI (lint/tests)**,
So that **les stories suivantes s’appuient sur un socle reproductible aligné architecture**.

**Acceptance Criteria:**

**Given** un clone du dépôt frais
**When** on exécute les commandes documentées (README)
**Then** le front démarre en dev, l’API expose au minimum `/health` ou équivalent et la spec OpenAPI est générée ou statique
**And** la CI exécute lint + tests back/front sans erreur sur la branche principale

**Given** la configuration du client
**When** on inspecte le bundle ou les sources
**Then** aucun secret (clés API, infra) n’est présent côté client (**NFR-S2**)

**Given** le dépôt
**When** on ajoute une feature UI
**Then** les **tokens sémantiques Tailwind** de base sont disponibles et documentés pour usage futur (**UX-DR1**), sans couleurs brutes hors DS dans les nouveaux écrans exemple

---

### Story 1.2: Créer une salle et obtenir un code

As a **joueur**,
I want **créer une salle et recevoir un code de partage**,
So that **je peux inviter d’autres joueurs sans compte obligatoire**.

**Acceptance Criteria:**

**Given** l’API et le front disponibles
**When** je lance « créer une salle » (ou équivalent **JoinForm** / flux hôte)
**Then** une salle est créée côté serveur avec identifiant stable et un **code** m’est affiché (**FR1**)
**And** le code respecte le format et les limites documentées en **FR27** / story 1.8 si déjà livrée (sinon stub documenté)

**Given** une erreur serveur
**When** la création échoue
**Then** un message lisible (toast ou inline) explique l’échec sans jargon (**UX-DR7** proportionné)

---

### Story 1.3: Rejoindre une salle avec code et pseudo

As a **joueur**,
I want **rejoindre une salle en saisissant le code et mon pseudo**,
So that **j’entre dans la partie avec une identité affichable**.

**Acceptance Criteria:**

**Given** une salle existante et un code valide
**When** je soumets code + pseudo via **JoinForm**
**Then** je suis admis dans la salle avec mon **pseudo** visible dans le contexte session et une session technique conforme **architecture** (cookie HTTP-only ou équivalent, pas de « compte » produit **FR24**) (**FR2**)

**Given** un code invalide ou une salle indisponible (fermée, pleine selon règles **FR27**)
**When** je tente de rejoindre
**Then** le système **refuse** avec **message explicite** sur la cause (**FR4**)

**Given** le formulaire de rejoindre
**When** je navigue au **clavier**
**Then** l’ordre de tabulation et le **focus visible** sont utilisables (**NFR-A1**, **UX-DR10**)

---

### Story 1.4: CGU, risques contenu et pied de page légal

As a **visiteur ou joueur**,
I want **lire les CGU et les informations sur les risques liés au contenu utilisateur (18+, absence de filtre)**,
So that **je comprends les limites du produit avant de jouer**.

**Acceptance Criteria:**

**Given** l’application
**When** j’ouvre la page **CGU** depuis le **LegalFooter** (ou route dédiée)
**Then** le texte **FR21** est accessible en **français** (**FR23**) et les risques sont clairement énoncés (**NFR-S1** documenté)

**Given** le pied de page
**When** je parcours au clavier
**Then** les liens sont **focusables** et annoncés de façon cohérente (**UX-DR13**)

---

### Story 1.5: À propos — version et notes

As a **joueur**,
I want **consulter la version du produit et les notes associées**,
So that **je sais quel build j’utilise (support, debug léger)**.

**Acceptance Criteria:**

**Given** l’écran **À propos** (ou équivalent)
**When** je l’ouvre
**Then** la **version** affichée correspond à une source unique (ex. `package.json` / build) (**FR22**)
**And** des **notes** succinctes ou lien vers changelog peuvent être présents sans promesse hors scope

---

### Story 1.6: Français UI, absence de compte obligatoire et persistance V1

As a **joueur**,
I want **une interface en français, sans création de compte obligatoire, avec une explication claire de ce qui est (ou n’est pas) sauvegardé**,
So that **je ne m’attends pas à une sauvegarde serveur de partie entre sessions**.

**Acceptance Criteria:**

**Given** tout parcours nominal **FR23**
**When** j’utilise les écrans principaux
**Then** les chaînes produit sont en **français** (libellés, erreurs courantes)

**Given** la politique **FR25**
**When** je consulte l’info persistance (écran ou modal dédié / lien depuis paramètres salon)
**Then** il est indiqué qu’**il n’y a pas de sauvegarde serveur de partie entre sessions** et que les données de session sont **volatiles**, avec mention des exceptions documentées (ex. préférences locales non critiques)

**Given** un utilisateur
**When** il rejoint ou crée une salle
**Then** aucune étape **obligatoire** de création de compte email/mot de passe n’est imposée (**FR24**)

---

### Story 1.7: Avertissement navigateur hors matrice

As a **utilisateur**,
I want **être informé lorsque mon environnement ne correspond pas à la matrice navigateurs V1**,
So that **je comprends les risques de comportement avant de jouer**.

**Acceptance Criteria:**

**Given** un navigateur ou contexte **non** listé dans la matrice PRD / WASR
**When** je charge l’app
**Then** une **bannière ou modal non bloquant** m’informe du hors-matrice et renvoie vers la doc (**FR26**)
**And** le flux « essayer quand même » reste possible si le produit le prévoit (pas de blocage arbitraire sans décision produit)

---

### Story 1.8: Limites code de salle et taille de groupe

As a **joueur**,
I want **voir et subir de façon prévisible les limites de code et de taille de groupe**,
So that **la table sait combien de joueurs sont acceptés et quel format de code est valide**.

**Acceptance Criteria:**

**Given** la politique produit tranchée pour **longueur/format du code** et **nombre max de joueurs** (ou absence de plafond explicite)
**When** je consulte l’aide ou les messages de validation
**Then** ces limites sont **documentées** dans l’UI ou les erreurs (**FR27**)

**Given** une tentative de rejoindre au-delà de la capacité
**When** le serveur applique la règle
**Then** le refus est **explicite** (**FR4**, **NFR-SC1** dégradation contrôlée)

---

### Story 1.9: Garde-fou design tokens et cohérence DS

As a **équipe produit**,
I want **auditer et corriger l’usage des tokens sémantiques sur les écrans déjà livrés du périmètre salon / légal**,
So that **l’interface ne diverge pas silencieusement entre features et reste alignée UX-DR1 / UX-DR2**.

**Acceptance Criteria:**

**Given** la liste des **tokens** documentés (Tailwind sémantique : `background`, `card`, `primary`, `destructive`, `turn-active`, équipes, etc.)
**When** on passe en revue les composants et pages **Epic 1** (création/rejoindre, CGU, À propos, bannières)
**Then** les couleurs et surfaces utilisent ces **tokens** — pas de valeurs magiques hors DS sauf **exception listée et justifiée**

**Given** une dérive détectée (couleur brute, contraste insuffisant)
**When** on traite le ticket d’audit
**Then** la correction ou l’exception est **référencée** (README DS, commentaire limité, ou issue) pour éviter la régression

**Given** les parcours **critiques** (rejoindre, erreurs, focus)
**When** l’audit est clos pour la slice courante
**Then** les écarts restants par rapport à la spec UX sont **explicitement listés** ou **corrigés** avant statut « terminé » (**UX-DR10** proportionné sur focus / états)

---

## Epic 2: Prêt pour le premier indice

La table peut **co-construire le méga-deck**, **satisfaire les conditions minimales**, **lancer** la partie selon la **variante P0** figée pour le ship.

**FRs :** FR5, FR6, FR7 — **UX :** UX-DR12 (**MegaDeckPanel**, **TeamSetup** lazy-load acceptable), UX-DR3 (agrégat d’état — préparation côté lobby).

### Story 2.1: Co-construction du méga-deck en limite V1

As a **joueur autour de la table**,
I want **contribuer à la constitution collective du jeu de cartes (méga-deck) dans les limites V1**,
So that **la grille finale reflète nos decks avant le premier indice**.

**Acceptance Criteria:**

**Given** une salle en phase **pré-partie**
**When** les joueurs ajoutent / valident des contributions selon règles P0
**Then** l’état du **méga-deck** est visible pour la table (**FR5**) et persisté côté serveur pour la session (**architecture**)

**Given** les limites V1 (nombre de cartes, doublons, etc. selon PRD)
**When** une contribution dépasse la limite
**Then** un **refus explicite** guide la correction (messages inline ou toast, **UX-DR8**)

**Given** la charge UX (**UX-DR12**)
**When** le bundle est analysé
**Then** le **MegaDeckPanel** peut être **lazy-load** après le happy path minimal si documenté

---

### Story 2.2: Conditions minimales et démarrage par l’hôte

As a **hôte**,
I want **démarrer la partie lorsque les conditions minimales sont remplies**,
So that **on ne lance pas une partie incomplète par erreur**.

**Acceptance Criteria:**

**Given** les conditions minimales P0 (nombre de joueurs, méga-deck prêt, équipes si requis)
**When** elles ne sont pas remplies
**Then** l’action **démarrer** est désactivée ou refusée avec **raison lisible** (**FR6**)

**Given** les conditions remplies
**When** l’hôte confirme le démarrage
**Then** la partie passe à l’état **en jeu** côté serveur (**source de vérité**) et tous les clients **RoomHeader** / header salon sont alignés

---

### Story 2.3: Variante Mousquetaire P0

As a **joueur**,
I want **jouer selon la variante Mousquetaire livrée en configuration P0**,
So that **tous appliquent les mêmes règles au lancement V1**.

**Acceptance Criteria:**

**Given** une partie qui démarre
**When** le serveur initialise la manche
**Then** la **variante P0** (rôles, nombre d’équipes, paramètres grille fixés V1) est appliquée de façon **autoritative** (**FR7**)

**Given** l’UI **TeamSetup** / configuration
**When** la variante n’autorise pas certains réglages
**Then** ces options sont absentes ou grisées avec **explication courte**

---

## Epic 3: Boucle de jeu synchrone

Les joueurs vivent la **boucle nominale** : tours, **indice**, **sélections**, **révélations** partagées, **fin de manche**, **résultats lisibles**, **indicateur de tour**, **retours** sur actions à risque et **réversibilité** si les règles P0 la prévoient.

**FRs :** FR8–FR14, FR31, FR32 — **NFR :** NFR-P1, NFR-P2 — **UX :** UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR6, UX-DR8, UX-DR11, UX-DR15.

### Story 3.1: Tours, rôles et indicateur d’action (WebSocket + état autoritatif)

As a **joueur**,
I want **que les tours et rôles alternent selon la variante et voir clairement qui doit agir**,
So that **personne ne joue hors tour**.

**Acceptance Criteria:**

**Given** une partie en cours et un canal **WebSocket** actif
**When** le serveur émet des événements `{ type, payload, version }`
**Then** chaque client met à jour un **agrégat d’état manche/tour unique** (**UX-DR3**) et affiche **TurnIndicator** (**FR8**, **FR13**)

**Given** deux clients dans la même salle
**When** le tour change
**Then** les deux affichent le **même** joueur / rôle actif après propagation (**NFR-P1** calibrage interne p95)

**Given** un client désynchronisé
**When** la **version** serveur diverge
**Then** une **réconciliation** ou message explicite invite au resync (lien **Epic 4** sans bloquer cette story : comportement minimal défini ici)

---

### Story 3.2: Donner un indice (ClueComposer)

As a **joueur autorisé**,
I want **saisir et valider un indice conforme au tour**,
So that **les devineurs peuvent répondre dans les règles**.

**Acceptance Criteria:**

**Given** c’est mon tour **donneur d’indice** (selon P0)
**When** je saisis un indice et valide
**Then** le serveur **valide** la conformité (longueur, caractères interdits, etc.) et rejette sinon avec **détail** (**FR9**)

**Given** **ClueComposer**
**When** j’utilise le clavier et lecteurs d’écran
**Then** labels, **aria-describedby**, limite de caractères annoncée et erreurs accessibles (**UX-DR5**, **UX-DR10**)

---

### Story 3.3: Sélection de cartes sur la grille

As a **devineur** (ou rôle P0 équivalent),
I want **sélectionner des cartes sur la grille en réponse à l’indice**,
So that **notre équipe verrouille ses choix avant révélation**.

**Acceptance Criteria:**

**Given** la phase de sélection ouverte par le serveur
**When** je sélectionne / désélectionne des **WordCard**
**Then** l’UI reflète l’état local et le serveur confirme ou refuse selon règles du tour (**FR10**)

**Given** **WordGrid** / cartes
**When** je suis sur mobile ou clavier
**Then** zones tactiles **≥ 44 px**, focus visible, états accessibles (**UX-DR4**), **data-testid** pour tests automatisés

**Given** une vue mobile (**UX-DR9**)
**When** j’interagis avec la grille et les CTA de tour
**Then** **safe-area** `env(safe-area-inset-*)` est respectée et les actions critiques restent dans une **zone pouce** raisonnable sans imposer « tournez l’appareil » par défaut

---

### Story 3.4: Révélation synchronisée et état partagé

As a **joueur à la table**,
I want **voir les cartes révélées et l’état à jour pour tous**,
So that **la révélation est un moment social synchronisé**.

**Acceptance Criteria:**

**Given** une sélection validée par les règles
**When** le serveur applique la révélation
**Then** tous les clients reçoivent la mise à jour et la grille affiche les cartes dans l’état **révélé** (**FR11**)

**Given** les notifications temps réel (**UX-DR6**)
**When** des événements dupliqués ou retardés arrivent
**Then** l’UI **dédoublonne** par `(type, entityId[, opId])` / version et maintient une file de toasts contrôlée

**Given** **`aria-live`**
**When** une révélation synchrone a lieu
**Then** l’annonce respecte **UX-DR4** sans spam redondant

---

### Story 3.5: RoundResolution — fin de manche, révélation sociale et clôture avant suite

As a **joueur à la table**,
I want **vivre une fin de manche où le résultat est visible et partagé par tous au même instant, avant toute transition suivante**,
So that **le payoff social (RoundResolution) reste le climax du round, pas une transition technique en arrière-plan**.

**Acceptance Criteria:**

**Given** les conditions de fin de manche P0
**When** elles sont atteintes
**Then** l’état **RoundResolution** affiche clairement l’issue (**FR12**) avec un **beat** distinct avant la transition suivante (**UX-DR11**)

**Given** tous les clients connectés dans la salle
**When** la manche se termine
**Then** **chaque joueur voit le même résultat de manche** (issue lisible) **sans désynchronisation** du message de clôture — la story n’est pas « terminée » tant qu’un client peut afficher un état de résultat incompatible avec l’état serveur

**Given** la variante
**When** une manche peut se terminer sans partie terminée
**Then** le flux « manche suivante » ou « fin de partie » est cohérent avec **FR14** (story 3.6)

---

### Story 3.6: Résultat de manche et de partie

As a **joueur**,
I want **identifier scores, équipe gagnante ou message de fin selon les règles**,
So that **la table sait qui a gagné la manche ou la partie**.

**Acceptance Criteria:**

**Given** une manche ou partie terminée
**When** l’écran de résultat s’affiche
**Then** les informations **FR14** (scores, équipe, message de fin) sont **lisibles** et cohérentes avec l’état serveur

**Given** **direction visuelle A+B** (**UX-DR2**)
**When** je consulte les résultats
**Then** contraste suffisant sur les éléments critiques (scores, équipe active)

---

### Story 3.7: Retour immédiat sur actions à risque

As a **joueur**,
I want **un retour lisible immédiat quand je fais une action à risque (révélation, validation d’indice, etc.)**,
So that **je sais si mon intention est acceptée ou refusée sans ambiguïté**.

**Acceptance Criteria:**

**Given** une action classée « à risque » par le PRD
**When** je la déclenche
**Then** le système renvoie **succès**, **refus** ou **état du jeu** de façon **immédiate et lisible** (**FR31**, **NFR-P2**)

**Given** une erreur utilisateur vs erreur serveur
**When** le refus survient
**Then** le ton suit **UX-DR7** / **UX-DR8** (toast vs inline documenté)

---

### Story 3.8: Réversibilité d’une action récente (si P0)

As a **joueur**,
I want **annuler ou corriger une action récente sans redémarrer la partie lorsque les règles et le design le permettent**,
So that **une erreur de clic ne ruine pas la manche**.

**Acceptance Criteria:**

**Given** les règles P0 **autorisent** la réversibilité (fenêtre temps ou nombre d’étapes)
**When** je demande annulation / correction dans cette fenêtre
**Then** le serveur applique ou refuse avec état canonique et tous les clients convergent (**FR32**)

**Given** les règles **n’autorisent pas** la réversibilité
**When** je cherche une action « annuler »
**Then** elle **n’est pas proposée** ou est explicitement désactivée avec **raison courte**

---

## Epic 4: Table résiliente & diagnostic

La soirée **survit aux aléas** : **sortie / abandon** selon règles, **rejoin** en cours avec **statut** clair, **reconnexion** sans corruption pour les autres, **comportement documenté** si l’**hôte** part, **messages explicites**, **traçabilité** partie ↔ diagnostic (**support**).

**FRs :** FR3, FR15, FR16, FR28, FR29, FR30 — **NFR :** NFR-O1 — **UX :** UX-DR3 (SyncBanner), UX-DR6 (file toasts réseau).

### Story 4.1: Quitter la salle ou la session selon les règles de fin

As a **joueur**,
I want **quitter la salle ou la session selon les règles de fin de partie ou d’abandon**,
So that **je ne bloque pas la table au-delà du comportement prévu**.

**Acceptance Criteria:**

**Given** une partie ou salon en cours
**When** je choisis quitter / abandonner (selon libellés UX)
**Then** le serveur applique la transition documentée (spectateur, fin de tour, etc.) (**FR3**)

**Given** un joueur part en cours de manche
**When** les autres continuent
**Then** l’état du tour reste **valide** pour les joueurs restants (**cohérence** avec **FR16** pour reconnexion — pas de corruption pour les autres)

---

### Story 4.2: Rejoindre en cours avec statut clair

As a **joueur qui arrive tard**,
I want **savoir si je suis spectateur, en attente ou actif dans une équipe**,
So that **je comprends ce que je peux faire**.

**Acceptance Criteria:**

**Given** une partie déjà démarrée
**When** je rejoins avec un code valide
**Then** mon **statut** (spectateur, attente, équipe, etc.) est affiché selon **décision P0** (**FR15**)

**Given** le statut spectateur
**When** j’essaie une action de jeu interdite
**Then** le refus est **explicite** (pas de silence ou erreur générique)

---

### Story 4.3: Reconnexion et resynchronisation sans corruption du tour

As a **joueur**,
I want **me reconnecter après une coupure sans casser le tour pour les autres**,
So that **la soirée continue**.

**Acceptance Criteria:**

**Given** une interruption réseau puis retour
**When** je rouvre la session (même pseudo / jeton selon **architecture**)
**Then** je récupère un **snapshot** ou deltas jusqu’à la **version** courante (**FR16**, **architecture** snapshots Firestore)

**Given** **SyncBanner** (**UX-DR3**)
**When** je suis en reconnexion ou lag
**Then** une bannière indique l’état réseau / resync sans masquer **TurnIndicator** de façon contradictoire

**Given** les autres joueurs
**When** je me reconnecte
**Then** **leur** tour en cours et actions validées ne sont **pas invalidées** (**FR16**)

---

### Story 4.4: Détection départ / déconnexion de l’hôte et retours explicites

As a **joueur à la table**,
I want **que le système réagisse de façon documentée si l’hôte disparaît et que je voie clairement mes options**,
So that **personne ne reste bloqué dans un état ambigu**.

**Acceptance Criteria:**

**Given** le comportement P0 tranché (**temporisation, fin de partie, gel, transfert de rôle** — **FR28**)
**When** l’hôte se déconnecte ou quitte
**Then** ce comportement est **appliqué côté serveur** et propagé à tous (**FR28**)

**Given** ce scénario
**When** il se produit
**Then** chaque joueur reçoit un **message explicite** et les **options** disponibles ou l’**impossibilité** de continuer sont claires (**FR29**)

---

### Story 4.5: Diagnostic et corrélation pour le support

As a **exploitant / support**,
I want **relier logs et événements de partie pour diagnostiquer incohérences d’état**,
So that **je peux aider une table sans technologie imposée au client**.

**Acceptance Criteria:**

**Given** une session de jeu
**When** un incident est investigué
**Then** les journaux côté serveur permettent de corréler **room_id**, **session_id**, **correlation_id** (**FR30**, **NFR-O1**, **architecture**)

**Given** une incohérence signalée (tour, scores)
**When** on trace la session
**Then** les informations sont **suffisantes** pour identifier la séquence d’événements **sans** imposer une techno particulière au rapport utilisateur (**FR30**)

---

## Epic 5: Solo pédagogique

Un joueur peut **apprendre** et **terminer** un parcours **nominal** sans dépendre du multijoueur pour le **critère de complétion** solo.

**FRs :** FR17, FR18 — **UX :** alignement rituel de révélation avec le multi (spec UX).

### Story 5.1: Parcours d’apprentissage sans multijoueur obligatoire

As a **joueur seul**,
I want **parcourir un mode apprentissage ou entraînement sans rejoindre une partie multijoueur**,
So that **j’apprends les règles à mon rythme**.

**Acceptance Criteria:**

**Given** le menu ou route **solo**
**When** je lance le parcours
**Then** je peux progresser dans des étapes pédagogiques **sans** code de salle (**FR17**)

**Given** les interactions de grille / indices
**When** ils existent dans le solo
**Then** le **rituel de révélation** reste **aligné** sur le multi (cohérence UX, animations proportionnées **UX-DR10**)

---

### Story 5.2: Fin du parcours pédagogique nominal

As a **joueur seul**,
I want **atteindre une fin de parcours prévue**,
So that **je sais avoir complété l’entraînement nominal V1**.

**Acceptance Criteria:**

**Given** la fin du parcours **nominal**
**When** je termine la dernière étape
**Then** un **état de fin** clair s’affiche ( félicitations, récap, lien retour menu ) (**FR18**)

**Given** une erreur ou abandon
**When** je quitte avant la fin
**Then** je peux **reprendre** ou **recommencer** selon ce que la V1 définit (documenté dans l’UI)

---

## Epic 6: IA optionnelle & transparence gameplay

Les joueurs peuvent **activer ou désactiver** les fonctions **IA** lorsqu’elles existent **sans bloquer** le jeu sans IA, et **consulter** la **transparence** sur leur usage.

**FRs :** FR19, FR20 — **NFR :** NFR-I1, NFR-I2 — **UX :** UX-DR13 (page transparence), secrets **NFR-S2**.

### Story 6.1: Activation / désactivation des fonctions IA et dégradation gracieuse

As a **joueur ou hôte**,
I want **activer ou désactiver les fonctions IA lorsqu’elles existent, sans empêcher le jeu sans IA**,
So that **la table choisit si l’IA assiste sans dépendance obligatoire**.

**Acceptance Criteria:**

**Given** des fonctionnalités IA disponibles côté backend uniquement (**architecture**)
**When** je bascule l’option IA (portée hôte ou joueur selon PRD)
**Then** l’état est persisté pour la session et **le jeu nominal sans IA reste jouable** (**FR19**)

**Given** indisponibilité du fournisseur LLM ou timeout (**NFR-I1**, **NFR-I2**)
**When** une fonction IA est demandée
**Then** le jeu **ne bloque** pas : message explicite, retry ou désactivation temporaire **visible en quelques secondes**

**Given** les secrets
**When** on inspecte le client
**Then** aucune clé API n’est exposée (**NFR-S2**)

---

### Story 6.2: Transparence sur l’usage de l’IA

As a **joueur**,
I want **consulter des informations claires sur l’usage de l’IA dans le jeu**,
So that **je comprends quand et comment l’IA intervient**.

**Acceptance Criteria:**

**Given** la page **transparence IA** (route dédiée ou section)
**When** je la consulte depuis le jeu ou le footer
**Then** le contenu décrit **périmètre, limitations et traitement** au niveau attendu V1 (**FR20**, **UX-DR13**)

**Given** le jeu avec IA activée
**When** une suggestion IA apparaît
**Then** un **indicateur discret** peut signaler l’origine IA si prévu par la spec (sans sur-promesse)
