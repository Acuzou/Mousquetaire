---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
  - 5
  - 6
  - 7
  - 8
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - docs/project-context.md
workflowType: architecture
project_name: Mousquetaire
user_name: Acuzou
date: '2026-05-02'
lastStep: 8
status: complete
completedAt: '2026-05-02'
---

# Document de décisions d’architecture

_Ce document est construit collaborativement, étape par étape. Les sections sont ajoutées au fil des décisions architecturales._

## Analyse du contexte projet

### Vue d’ensemble des exigences

**Exigences fonctionnelles**

Les 32 FR décrivent un produit **web multijoueur temps réel** centré sur une **salle** (création, code, pseudo, erreurs explicites), une **phase de préparation** avec **méga-deck collaboratif** borné, une **variante Mousquetaire P0** figée pour le ship, puis une **boucle de jeu** complète (tours, indice, sélections, révélations, fin de manche, indicateur de tour). Les FR couvrent aussi le **rejoin en cours de partie**, la **reconnexion sans corruption** pour les autres, un **mode solo pédagogique** complétable, des fonctions **IA optionnelles** et **transparence**, les **CGU / risques contenu** et **À propos**, le **français uniquement** et **l’absence de compte persistant**, la **matrice navigateur**, les **limites** code / taille de groupe, le scénario **départ ou déconnexion de l’hôte**, l’**association partie ↔ diagnostic** pour le support, et les **retours immédiats** sur actions à risque avec **réversibilité** possible selon règles.

**Exigences non fonctionnelles**

Les NFR fixent une latence perceptive compatible « party », des **retours utilisateur** rapides sur les actions du tour, **pas de modération automatique** du texte joueur avec **risques documentés**, **secrets hors bundle client**, traitement des données aligné sur les engagements **sans RGPD exhaustif imposé** par le PRD si hors scope, **scalabilité** compatible peu de salles et **< 20 joueurs** par room avec dégradation explicite, **accessibilité** proportionnée sur les parcours critiques (clavier, focus, tactile, `prefers-reduced-motion`), **intégrations** (hébergement, LLM) **dégradables** sans bloquer le jeu sans LLM, et **observabilité** minimale (logs / métriques) pour corréler incidents et sessions.

**Échelle et complexité**

- Domaine principal : **application web full-stack** avec **canal temps réel** et persistance **managée** (préférence projet : **Python**, **Firebase/BaaS**).
- Niveau de complexité : **élevé** au regard du **délai** et du **risque de livraison** ; complexité fonctionnelle **moyenne à élevée** (temps réel + nombreux parcours edge).
- Composants architecturaux attendus (ordre de grandeur) : **client SPA**, **API / logique métier serveur**, **couche temps réel** (ex. WebSocket), **persistance état de salle**, **service d’intégration LLM optionnel**, **pipeline déploiement** et **observabilité** légère.

### Contraintes et dépendances connues

- **Date** : build jouable **≤ 10 mai 2026** ; arbitrages **P0** stricts.
- **Stack déclarée** : backend **Python** ; **Firebase** (ou équivalent managé) pour données ; front **JavaScript** ; temps réel souvent **WebSocket** ; **LangGraph** possible pour flux IA — à cadrer sans figer prématurément l’implémentation dans cette section.
- **Décision explicite PRD** : **une source de vérité** pour l’état de salle — à trancher dans les étapes de décision (éviter deux flux concurrents sans règle de fusion).
- **Produit** : **UGC 18+** sans filtre côté produit ; implications **légales / CGU** ; pas d’exigence **App Store / Play** pour la V1 (livrable web).
- **UX** : pas de document UX séparé dans les entrées ; le PRD porte **responsive**, **mobile**, **a11y proportionnée**, **états réseau** — à refléter dans les décisions front et contrats d’événements.

### Préoccupations transverses

- **Cohérence d’état** multijoueur (tour, scores, cartes) et **reprise** après coupure.
- **Comportement hôte absent** (FR28–29) : à synchroniser produit ↔ états serveur.
- **Observabilité** et **tests** : FR30, NFR-O1, thèmes de validation (happy path vs adversité).
- **Séparation chemin nominal / IA** : aucun appel LLM requis pour valider la V1 multijoueur.

### Enrichissements — Party Mode (2026-05-02)

Synthèse des échanges (Winston — architecture, Sally — UX, John — produit, Murat — qualité / testabilité), intégrée à l’analyse :

- **Autorité et frontières :** définir qui valide les actions, les transitions d’état **atomiques**, la **réconciliation** client après désaccord réseau ; traiter le **départ de l’hôte** comme scénario produit complet (rôle, reprise, quorum), pas comme simple timeout. Préciser les **limites opérationnelles** (Firestore : écritures, listeners, coût), **idempotence** des commandes, traces **par partie**.
- **UX sans livrable UX dédié :** consigner **breakpoints / reflow** grille et HUD, **cibles tactiles** et gouttières, **états réseau** comme états applicatifs (cohérence des messages, pas d’overlays ad hoc), socle **a11y** mesurable vs nice-to-have ; **latence** comme critère d’expérience (feedback immédiat, optimisme contrôlé).
- **Priorisation et traçabilité :** chaque couche d’architecture référencée vers un besoin PRD mesurable ; arbitrages explicites **multijoueur vs solo réduit**, **exploitabilité vs profondeur fonctionnelle**, **IA dégradable / hors chemin critique**.
- **Testabilité et observabilité :** happy path + adversité dès la conception ; corrélation **partie/session** pour FR30/NFR-O1 ; **états multijoueur nommés** et observables pour tests et diagnostic.

## Évaluation des starters

### Domaine technique principal

Application **web full-stack** temps réel : SPA (Vite + React), API **FastAPI** (ASGI), persistance **Firebase**/BaaS, canal synchrone type **WebSocket** — aligné PRD et `docs/project-context.md`.

### Options analysées

- **Full Stack FastAPI Template** (tiangolo, génération via Copier / dépôt `fastapi/full-stack-fastapi-template`) : FastAPI + **PostgreSQL** + React + TypeScript + Docker + **JWT / utilisateurs** — **surdimensionné** et **désaligné** avec la V1 (**pas de compte persistant**, **Firebase** comme préférence plutôt qu’une base SQL « produit » complète).
- **Templates Cookiecutter** centrés Postgres : même limite pour un produit **Firebase-first**.
- **create-vite** (officiel, paquet npm **create-vite** en branche **9.x** au moment de la recherche web) : starter **SPA** minimal, très actif, adapté à une room et à une itération rapide.
- **Backend** : quickstart **FastAPI** documenté officiellement (`pip install "fastapi[standard]"`, CLI **`fastapi dev`** / Uvicorn) plutôt qu’un générateur monolithique incompatible avec une persistance **Firestore** et une identité **code + pseudo** sans compte.

### Starter retenu (composite)

**Frontend — Vite + React**

- **Rationale :** SPA rapide à itérer, HMR, écosystème React pour UI grille / salle ; pas de verrouillage fournisseur ; correspond aux exigences web du PRD.
- **Commande d’initialisation (exemple) :**

```bash
npm create vite@latest web -- --template react-ts
cd web
npm install
npm run dev
```

Prérequis Node : **20.19+** ou **22.12+** selon la documentation Vite (`vite.dev`). Pour du JavaScript sans TypeScript : `--template react`.

**Backend — FastAPI minimal (documentation officielle)**

- **Rationale :** Python comme préférence projet ; contrôle des intégrations **Firebase** et du **temps réel** sans imposer Postgres ni une couche auth JWT « comptes utilisateurs » pour la V1.
- **Commandes d’amorçage typiques :**

```bash
mkdir api
cd api
python -m venv .venv
.venv\Scripts\activate
pip install "fastapi[standard]"
```

Puis créer `main.py` avec une application `FastAPI()` et lancer :

```bash
fastapi dev main.py
```

(équivalent courant : `uvicorn main:app --reload`)

**Décisions déjà couvertes par ce duo**

| Zone | Front (Vite React) | Back (FastAPI) |
|------|---------------------|----------------|
| Langage | JS/TS, JSX | Python + annotations de types |
| Build | Vite | ASGI via FastAPI « standard » |
| Tests | À ajouter (Vitest courant côté React) | Pytest / httpx possibles |
| Structure | `src/`, composants React | Modules Python à structurer dans les stories |

**Note :** l’**initialisation concrète** des deux parties (monorepo ou deux dossiers) doit être la **première story d’implémentation** après sprint planning ; ce document fixe l’intention produit, pas encore la structure finale du dépôt.

### Complément — Party Mode (évaluation des starters, 2026-05-02)

- **Risques transverses :** deux livrables (front / API) → **CORS**, **secrets**, déploiements distincts ; temps réel à traiter explicitement (WebSocket / service managé / évolution type Django Channels si besoin ultérieur). Monorepo fortement typé (style T3) = gain de cohérence, coût de complexité si la logique métier reste en Python.
- **Première story d’implémentation :** outillage **reproductible** — `pyproject.toml` et lock npm, scripts **lint** / **test** / **dev**, **CI minimale** (lint back + front, pytest + Vitest ou équivalent), **README** et arborescence stable (`app/`, `src/`, `tests/`). Critère d’acceptation possible : branche verte = format + tests.
- **Alternative de riposte (charge calendaire) :** privilégier **client SPA + BaaS temps réel** pour réduire le code serveur maison ; garder **FastAPI** si le contrôle du backend et les intégrations IA le justifient — à trancher au **vertical slice**, pas par habitude de stack.
- **Hors périmètre V1 (garde-fou produit) :** starters full-stack incluant SSR/SSG orienté site, auth utilisateur intégrée ou couche données « produit » lourde — privilégier un socle minimal orienté **jeu temps réel** et build client.

## Décisions d’architecture centrales

### Analyse de priorité

**Décisions critiques (bloquent l’implémentation si absentes)**

- **Source de vérité du jeu multijoueur :** la **logique de tour et les transitions d’état** sont **validées côté serveur** (FastAPI). Les clients **ne font pas foi** pour résoudre un conflit de tour ou une révélation de carte.
- **Canal temps réel :** **WebSocket** (Starlette/FastAPI) comme canal principal pour les **événements de partie** à faible latence (indices, sélections, révélations, heartbeat).
- **Persistance :** **Cloud Firestore** comme magasin **managé** pour **méta-salle**, **snapshots** ou **checkpoints** de partie utiles à la **reconnexion** et au **diagnostic** (FR30), sans remplacer la résolution autoritaire du tour sur le serveur.
- **Secrets :** clés **Firebase Admin**, secrets LLM, configuration — **uniquement** côté serveur et CI ; aligné **NFR-S2** (pas d’exposition dans le bundle client).

**Décisions importantes (faconnent fortement le système)**

- **Données :** modèle **document** Firestore (ex. collection `rooms` / sous-documents `state`, `players`, horodatages). Accès serveur via **`firebase_admin`** (réf. release notes **7.4.x**, avril 2026 ; **Python ≥ 3.10**) et module **`firebase_admin.firestore_async`** pour alignement avec FastAPI async (`google-cloud-firestore` **≥ 2.21.0** selon notes de version du SDK Admin).
- **« Comptes » V1 :** **pas** de compte utilisateur classique ; identification **code de salle + pseudo** ; pas de JWT « utilisateur produit » obligatoire. Jetons de session **techniques** (cookie HTTP-only ou équivalent) à dimensionner dans les stories — pas le socle auth du template full-stack tiers.
- **API :** **REST/JSON** pour création / rejoindre salle, santé, diagnostics ; **WebSocket** pour le flux de partie ; schéma **OpenAPI** auto (FastAPI) pour contrat et tests.
- **Front :** état serveur via **fetch/WebSocket** ; état local UI (sélections optimistes **contrôlées**) ; bibliothèque d’état **légère** (ex. **Zustand** et/ou **TanStack Query** — choix à figer en implémentation).
- **Infra :** front **statique** (ex. **Firebase Hosting**, **Cloudflare Pages**, **Vercel** statique) ; API FastAPI sur **PaaS** (ex. **Cloud Run**, **Railway**, **Render**) ; enveloppe **~< 100 €/mois** à surveiller.

**Reportées / arbitrables après vertical slice**

- **Auth Firebase** pour utilisateurs finaux : **non requise** V1 si le PRD « pas de compte » reste strict ; réévaluation V2.
- **Django Channels** ou second bus d’événements : seulement si charge ou limites WS imposent une évolution.

### Architecture des données

- **SGBD :** pas de PostgreSQL obligatoire pour la V1 ; **Firestore** comme base principale alignée `project-context`.
- **Validation :** **Pydantic** côté API (natif FastAPI) pour commandes et événements ; schémas alignés sur les FR.
- **Caches :** pas d’exigence Redis V1 ; réévaluation si latence ou quotas Firestore sur mesure.

### Authentification et sécurité

- **Pas** de modération automatique du texte (décision produit / NFR-S1).
- **Transport :** **HTTPS** partout ; **WSS** en production.
- **Autorisation :** contrôle d’accès **par room** (code valide, limites taille groupe FR27) ; pas de RBAC multi-tenant complexe V1.

### API et communication

- **Style :** REST pour actions **ponctuelles** ; WebSocket pour **flux de partie**.
- **Erreurs :** corps JSON structuré + codes HTTP/WebSocket documentés ; alignement avec **états réseau** UX (PRD).
- **LLM :** appels **uniquement** depuis le backend ; timeouts et **dégradation** sans bloquer le jeu nominal (NFR-I1).

### Architecture front

- **SPA Vite + React** ; découpage **pages / features** (room, lobby, jeu, solo).
- **Performance :** bundles découpés ; attention au **jank** sur animations de révélation (PRD).

### Infrastructure et déploiement

- **CI :** lint + tests **back et front** (cf. complément Party Mode sur la première story).
- **Observabilité :** corrélation **session / partie / room_id** dans logs (FR30, NFR-O1).
- **Scaling :** volumétrie faible V1 ; message explicite si limite (NFR-SC1).

### Impacts et enchaînement

**Séquence indicative d’implémentation :** (1) bootstrap repo + CI ; (2) connexion Firestore Admin + modèle `room` minimal ; (3) endpoint REST créer/rejoindre ; (4) WebSocket + machine d’état tour ; (5) persistance snapshots ; (6) solo / IA optionnelle ensuite.

**Dépendances croisées :** les choix **WebSocket + Firestore** conditionnent la stratégie de **reconnexion** (snapshot au reconnect vs rejeu d’événements) — à détailler dans les stories « reprise réseau ».

### Complément — Party Mode (décisions, 2026-05-02)

- **Réconciliation client :** après reconnexion ou mise à jour asynchrone (ex. listener Firestore), le client **reconcile** en comparant `version` / horodatage **serveur** ; appliquer uniquement les deltas **confirmés** ou déclencher une **resynchronisation complète** du snapshot pour éviter une divergence durable.
- **Contrat de testabilité (oracle) :** révision **monotone** par agrégat (incrémentée **uniquement** par le serveur sur mutation acceptée) ; journal ou chaîne causale (append-only / idempotence / corrélation) pour relier mutation → trace → état Firestore ; réponses API exposent la **révision courante** ; rejets explicites des mises à jour optimistes périmées.
- **Fairness « même moment » :** ordonnancement **event-driven** (pas de tick haute fréquence) ; **séquence / horodatage serveur** avant révélation ; schéma de **commitment** (soumissions puis révélation synchronisée), **fenêtre de tour** fermée par l’autorité, **broadcast** du même payload horodaté à tous les clients.
- **Alternative de simplification (charge / équipe réduite) :** si le couplage FastAPI + WebSocket + Firestore **menace** le ship, **option de repli** documentée : client avec **SDK temps réel Firestore** + **Cloud Functions** pour transitions métiers, sous réserve que les **Security Rules** et la **logique authoritative** restent **testables** et alignées FR — arbitrage au **vertical slice**, pas par défaut.

## Patterns d’implémentation et règles de cohérence

### Points de conflit identifiés

Sans règles explicites, des agents (ou développeurs) peuvent diverger sur : nommage REST vs Firestore vs JSON client ; emplacement des tests ; format des erreurs API vs messages WebSocket ; conventions des événements temps réel ; gestion des chargements et des erreurs réseau (PRD).

### Conventions de nommage

**API REST (FastAPI)**

- Ressources au **pluriel** en anglais : `/rooms`, `/rooms/{room_id}/join`.
- Paramètres de chemin en **`snake_case`** alignés Python / Pydantic : `room_id`, `player_id`.
- Corps JSON côté serveur : champs **`snake_case`**. Si le front impose **`camelCase`**, prévoir une couche de sérialisation **explicite** et unique — ne pas mélanger les deux sans règle documentée.

**Firestore**

- Collections **`rooms`** (nom à figer en implémentation) ; sous-collections / sous-documents selon les stories (`players`, événements si besoin).
- Champs scalaires **`snake_case`** pour rester alignés avec le backend.

**Code React**

- Composants **PascalCase** ; fichiers **`NomDuComposant.tsx`** (convention unique pour tout le dépôt front).

**WebSocket**

- Enveloppe commune : `{ "type": "<nom_evenement>", "payload": { ... }, "version": <int> }` (`version` alignée sur la révision / oracle).

### Organisation du projet

- **Tests front :** privilégier **co-localisation** `*.test.ts(x)` à côté du module ; alternative acceptable mais exclusive : dossier `__tests__/` par feature.
- **Tests API :** dossier **`tests/`** à la racine du package Python, miroir des modules ou par feature selon pytest.
- **Features :** dossiers par domaine (`room`, `game`, `solo`, `legal`) plutôt qu’un plat `components/` uniquement.
- **Config :** **`web/.env.example`** et **`api/.env.example`** (sans secrets réels).

### Formats

**REST**

- Succès : **corps métier direct** (pas de double enveloppe `{ data }` sauf décision contraire explicite) + codes HTTP standards.

**Erreurs HTTP**

- Corps aligné sur les erreurs FastAPI / **`{ "detail": ... }`** ; codes **4xx** validation / client, **5xx** serveur ; jamais de secrets en réponse.

**Dates**

- **ISO 8601** UTC dans les JSON (`string`).

**WebSocket**

- Liste maîtresse des **`type`** dans un module partagé (`shared/events` ou équivalent `api/app/events/catalog.py` + miroir TS).

### Communication et état

- **Idempotence :** en-tête ou champ **`Idempotency-Key`** pour actions sensibles (rejoindre, validation de coup) lorsque applicable.
- **React :** mises à jour **immuables** du state ; pas de mutation directe du snapshot serveur.
- **Logs structurés :** champs **`room_id`**, **`session_id`**, **`correlation_id`** lorsque disponibles (FR30).

### Processus

- **Chargement :** conventions **`isLoading`** / **`status: idle | loading | success | error`** sur les features critiques.
- **Erreurs utilisateur :** messages **courts en français** (PRD) ; distinction erreur affichée vs log technique.
- **Retry :** backoff ; pas de boucle infinie sur reconnexion WS.

### Obligations pour les agents IA

- Respecter les conventions **API / Firestore / événements**.
- Ne pas introduire **PostgreSQL** ni **JWT utilisateur « produit »** sans décision explicite.
- **Secrets** uniquement variables d’environnement serveur / CI — jamais dans le dépôt ni le bundle front.

### Vérification

- PR : **lint + tests** ; revue des changements de contrat **OpenAPI** et du catalogue d’événements WS.

### Exemples

- **Bon usage :** une mutation REST renvoie la **révision** courante ; le client compare avant fusion UI.
- **Anti-patterns :** deux dialectes JSON sans mapping ; logique de tour uniquement client ; listener Firestore traité comme vérité métier sans réconciliation.

### Complément — Party Mode (patterns, 2026-05-02)

- **Contrats machine-vérifiables :** au minimum une **source unique** pour les types qui traversent les couches — **OpenAPI** versionné + **types / client générés**, **ou** paquet partagé `shared/`, **ou** **registre d’événements WebSocket** versionné avec schémas ; les évolutions de champs passent par le même mécanisme (pas de DTO dupliqués sans contrôle).
- **Événements WebSocket :** **catalogue versionné** + **tests de contrat en CI** (schémas JSON ou AsyncAPI) ; **un seul style de nommage** pour les `type` (ex. tout en `dot.lower` ou tout en `PascalCase`, jamais les deux).
- **Erreurs et payloads :** **schéma d’erreur canonique** partagé (`code`, `message`, `details`, `request_id` ou équivalent figé dans le repo) ; adaptation des erreurs FastAPI vers ce canon ; **réutilisation du même objet d’erreur** dans l’enveloppe WS ; règle explicite pour les succès REST (direct vs enveloppe `data`/`meta`) pour éviter plusieurs « dialectes » implicites.
- **Copy et toasts UI :** **catalogue de messages** en français pour tout texte utilisateur ; **un composant toast** et une **grille de variants** ; pas de chaînes EN dans l’UI ; erreurs brutes réservées aux logs — PR hors catalogue à rejeter ou à faire valider.

## Structure du projet et frontières

### Résumé cartographie PRD → composants

| Catégorie / thème | Emplacement principal |
|-------------------|------------------------|
| Auth anonyme / session | `api/app/auth/`, `web/src/features/session/` |
| Salons / lobby | `api/app/rooms/`, `web/src/features/room/` |
| Jeu multijoueur / tours | `api/app/game/`, `web/src/features/game/` |
| Persistance / état serveur | `api/app/persistence/`, modèles alignés `api/app/models/` |
| Solo / IA optionnelle | `api/app/solo/` (ou `ai/`), `web/src/features/solo/` |
| Légal / CGU / mineurs | `web/src/features/legal/`, contenus `web/public/` ou `web/src/content/` |
| Observabilité / corrélation | `api/app/middleware/`, configuration logging `api/app/config.py` |

### Arborescence complète du dépôt

```
mousquetaire/
├── README.md
├── .gitignore
├── .editorconfig
├── .github/
│   └── workflows/
│       └── ci.yml
├── docs/
│   └── project-context.md
├── contracts/                    # optionnel — schémas WS / fragments contrat versionnés
├── e2e/                          # Playwright / Cypress — smoke, critical, etc.
├── web/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── index.html
│   ├── .env.example
│   ├── public/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── vite-env.d.ts
│   │   ├── features/
│   │   │   ├── session/
│   │   │   ├── room/
│   │   │   ├── game/
│   │   │   ├── solo/
│   │   │   └── legal/
│   │   ├── components/
│   │   │   └── ui/
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── ws.ts
│   │   │   └── errors.ts
│   │   ├── generated/            # client OpenAPI généré — non édité à la main
│   │   ├── hooks/
│   │   ├── styles/
│   │   └── assets/
│   └── vitest.config.ts
├── api/
│   ├── pyproject.toml
│   ├── README.md
│   ├── .env.example
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── dependencies.py
│   │   ├── middleware/
│   │   ├── auth/
│   │   ├── rooms/
│   │   ├── game/
│   │   ├── persistence/
│   │   ├── solo/
│   │   └── ws/
│   └── tests/
│       ├── conftest.py
│       ├── unit/
│       ├── integration/
│       ├── contract/
│       │   ├── openapi/          # conformité schéma REST
│       │   └── ws/               # séquences / messages WS
│       ├── fixtures/
│       └── factories/
└── packages/
    └── contracts/                # alternative à contracts/ racine — types partagés sans logique métier
```

### Frontières architecturales

- **API REST :** point d’entrée `api/app/main.py` ; préfixe `/api/v1/` si adopté dans les stories ; pas de logique métier « tour » dans les routes sans passer par `game/`.
- **WebSocket :** handlers dans `api/app/ws/` ; pas de persistance durable hors `game/` + `persistence/`.
- **Données :** accès Firestore **uniquement** depuis l’API (`persistence/` + services) ; le client ne reçoit que REST, WS et snapshots validés.
- **Front :** `features/*` pour le métier ; `components/ui` pour le réutilisable ; temps réel via `lib/ws.ts` et hooks ; pas d’autorité métier côté navigateur.
- **Imports monorepo :** pas d’import `web` → `api` ; secrets Firebase / Admin uniquement dans `api` et CI.

### Cartographie exigences → chemins

- **Sessions et salons** → `api/app/rooms/`, `api/app/auth/`, `web/src/features/session/`, `web/src/features/room/`.
- **Jeu synchrone / tours** → `api/app/game/`, `api/app/ws/`, `web/src/features/game/`.
- **Persistance / reprise** → `api/app/persistence/`, tests dans `api/tests/integration/` et contrats.
- **Solo / IA** → `api/app/solo/`, `web/src/features/solo/`.
- **Légal / CGU** → `web/src/features/legal/` (+ statiques si besoin).
- **Observabilité (FR30, NFR)** → `api/app/middleware/`, champs structurés via `config.py` et variables d’environnement.

### Points d’intégration

- **Interne :** React → REST via `lib/api.ts` ; WebSocket via `lib/ws.ts` ; types alignés OpenAPI ou paquet `packages/contracts`.
- **Externe :** Firebase Admin depuis `persistence/` uniquement ; pas d’accès Firestore client en stack nominale.
- **Flux :** client REST (salon, actions idempotentes) → WS (tour / broadcast) → persistance Firestore → réconciliation client (snapshot + révision).

### Organisation des fichiers

- **Configuration :** `.github/workflows/ci.yml` ; `web/.env.example`, `api/.env.example` ; pas de secrets dans le dépôt.
- **Sources :** découpage **feature** côté front ; modules **domaine** côté API.
- **Tests :** `api/tests/` avec `unit/`, `integration/`, `contract/` ; front — unitaires co-localisés (`*.test.ts(x)`) ; e2e dans `e2e/`.
- **Assets :** `web/public/`, `web/src/assets/`.

### Workflow développement, build et déploiement

- **Développement :** deux processus — `npm run dev` dans `web/`, `fastapi dev` (ou uvicorn) dans `api/` ; CORS pour l’origine Vite.
- **Build :** `npm run build` → `web/dist/` ; API empaquetée séparément (image ou service Python).
- **Déploiement :** artefacts distincts (statique + API) ; variables par environnement ; secrets hors repo.
- **Racine :** scripts ou tâches **`lint`**, **`typecheck`**, **`test`** couvrant `web` et `api` pour la CI monorepo.

### Complément — Party Mode (structure, 2026-05-02)

- **Contrats :** couche **`contracts/`** ou **`packages/contracts`** (schémas / types uniquement, pas de logique métier) ; versioning des événements WS (`session.*`, `game.*`, …).
- **Monorepo :** scripts racine **lint / typecheck / test** ; **interdiction** des imports `web` → `api` ; secrets réservés à `api` et CI.
- **Alias :** Vite (`@/`, `@features/…`) ; imports Python absolus depuis `app/`.
- **OpenAPI :** sortie client vers **`web/src/generated/`** (ou `web/src/api/generated`) — **non édité à la main** ; scripts `openapi:generate` documentés ; pré-commit / CONTRIBUTING pour protéger les dossiers générés.
- **Tests backend :** `api/tests/unit/`, `integration/`, `contract/openapi/` ; **`api/tests/contract/ws/`** pour les séquences WebSocket ; `conftest.py` + **`fixtures/`** + **`factories/`** si volumineux ; `.env.test` gitignored documenté.
- **E2E :** **`e2e/`** à la racine, séparé de pytest et Vitest ; sous-dossiers optionnels (smoke, critical) selon la stratégie CI.
- **UX transverse :** **`components/ui`** + **`lib/api.ts`** / **`lib/ws.ts`** comme socle commun aux features (toasts, copy FR, états chargement).

## Résultats de la validation d’architecture

### Validation de cohérence

**Compatibilité des décisions :** la pile React (TypeScript) + FastAPI + Firestore Admin + WebSocket est cohérente ; Python ≥ 3.10 et client Firebase Admin alignés avec les références de version évoquées ; absence de JWT « produit » V1 compatible avec session anonyme et mécanismes à préciser dans les stories.

**Cohérence des patterns :** conventions REST, WebSocket et Firestore alignées ; schéma d’erreur canonique et enveloppe WebSocket prévus ; structure `web` / `api` / `contracts` cohérente avec l’interdiction d’imports croisés et la génération OpenAPI vers `web/src/generated/`.

**Alignement structure / décisions :** les dossiers `game/`, `ws/`, `persistence/`, `features/*` matérialisent l’autorité serveur et la séparation UI / métier ; les emplacements `contract/openapi` et `contract/ws` reflètent l’exigence de contrats vérifiables.

### Validation de couverture des exigences

**Couverture fonctionnelle :** sessions et salons → `auth/`, `rooms/`, features session et room ; jeu multijoueur et tours → `game/`, `ws/`, feature game ; persistance et reprise → `persistence/` et patterns de réconciliation ; solo / IA → `solo/` ; légal / CGU → `features/legal/` ; interface et textes FR → patterns et compléments Party (catalogue de messages, toasts).

**NFR :** cadre légal / mineurs / confidentialité portés par le PRD et renforcés par les frontières API et les contenus `legal/` ; observabilité via middleware et corrélation ; volumétrie V1 modeste avec message explicite en cas de limite (aligné PRD).

### Prêt pour l’implémentation (agents IA)

**Décisions :** décisions centrales et références de version documentées ; option de repli Firestore + Functions identifiée.

**Structure :** arborescence nominative ; points d’intégration internes et externes décrits.

**Patterns :** zones de conflit nommées ; exemples bon usage / anti-patterns ; obligations pour les agents IA listées.

### Analyse des écarts

**Critiques :** aucun écart structurel identifié qui empêcherait de démarrer un premier vertical slice.

**Importants :** verrouiller au bootstrap les **versions exactes** dans `package.json` / `pyproject.toml` (lockfiles) ; formaliser le **premier artefact** de catalogue d’événements WebSocket (Python + miroir TypeScript) dans `contracts/` ou équivalent dès le premier flux temps réel ; définir en CI une **définition du « vert » merge** (jobs obligatoires) et des **contrats exécutables** (lint OpenAPI, tests de contrat bloquants) — voir complément Party.

**Souhaits :** stratégie de test courte dans `docs/` si l’équipe s’agrandit ; AsyncAPI si le catalogue WebSocket devient volumineux.

### Points de validation traités

Aucun conflit majeur entre les sections du document ; les compléments Party renforcent contrats, CI, produit et premier slice sans contredire les décisions initiales.

### Liste de contrôle — exhaustivité

**Analyse des exigences**

- [x] Contexte projet analysé
- [x] Échelle et complexité appréciées
- [x] Contraintes techniques identifiées
- [x] Préoccupations transverses cartographiées

**Décisions d’architecture**

- [x] Décisions critiques documentées (avec références de version là où nécessaire)
- [x] Pile technique spécifiée
- [x] Schémas d’intégration définis (REST, WebSocket, Firestore)
- [x] Performance et volumétrie V1 prises en compte

**Patterns d’implémentation**

- [x] Conventions de nommage
- [x] Patterns de structure (fichiers, tests, generated)
- [x] Patterns de communication (REST, WebSocket, réconciliation)
- [x] Patterns de processus (chargement, erreurs, retry)

**Structure du projet**

- [x] Arborescence définie
- [x] Frontières composant / service
- [x] Points d’intégration cartographiés
- [x] Correspondance exigences ↔ chemins

### Évaluation du niveau de préparation

**Statut global :** PRÊT POUR L’IMPLÉMENTATION — sous réserve que les **artefacts exécutables** listés dans le **Complément — Party Mode (validation)** soient planifiés dès le premier incrément (catalogue WebSocket versionné, critères CI, contrat Firestore minimal pour le salon). Tant que ces éléments ne sont pas livrés en repo ou en stories prêtes à coder, traiter le niveau comme **prêt avec écarts mineurs** plutôt que comme une architecture « close » sur le temps réel et la donnée.

**Niveau de confiance :** élevé pour la direction technique ; moyen à élevé pour l’exécution sans dérive si la gouvernance de périmètre (produit) et la CI (qualité) suivent le complément.

**Forces principales :** autorité serveur claire ; séparation des tests HTTP et WebSocket ; structure monorepo exploitable ; alignement PRD → dossiers explicite.

**Pistes d’amélioration ultérieure :** AsyncAPI complet ; politique de versions semver pour l’API ; durcissement e2e et charge si montée en audience.

### Passage à l’implémentation

**Directives pour les agents IA :** respecter ce document pour les choix techniques ; appliquer les patterns ; ne pas introduire PostgreSQL ni JWT produit sans décision ; secrets uniquement variables d’environnement et CI.

**Première priorité d’implémentation :** initialiser le monorepo (`npm create vite@latest` pour `web/`, bootstrap FastAPI pour `api/`), configurer la CI racine (lint, typecheck, tests), puis premier flux « créer / rejoindre salon » avec persistance `room` minimale Firestore — conformément à la séquence indiquée dans les décisions centrales. Compléter par **contrat Firestore minimal** (collections, champs, index, règles d’écriture), **règles de membership de salon** testables, et **parité** variables d’environnement / commandes entre local et CI (voir complément Party).

### Complément — Party Mode (validation, 2026-05-02)

- **Statut nuancé :** le verdict **PRÊT POUR L’IMPLÉMENTATION** suppose que le **catalogue WebSocket** et les **contrats** soient **figés dans les artefacts** (repo ou stories applicables) dès le premier flux temps réel ; en parallèle d’implémentation de messages sans schéma versionné, utiliser **PRÊT AVEC ÉCARTS MINEURS** jusqu’à publication du schéma et des critères CI associés.
- **Qualité exécutable :** tracer dans les stories ou la CI — **définition du « vert » merge** (jobs obligatoires vs optionnels) ; **matrice risque → type de test** pour les flux critiques (auth, erreurs, idempotence, reconnexion WebSocket) ; **politique flaky** (smoke e2e, quarantaine, retry borné).
- **Produit :** tout incrément hors corridor PRD (mineurs, données personnelles, monétisation, social, modération) = **point d’arrêt** produit / architecture avant élargissement du code.
- **Premier slice :** avant passage à l’échelle — **contrat Firestore minimal** (chemins de collections, champs obligatoires, besoins d’**index**, qui écrit quoi) ; **règles de membership du salon** testables (identité, `room_id`, qui est « dans la room ») ; **`.env.example`** et **parité des commandes** local / CI documentées pour éviter « vert CI » vs « rouge local ».
