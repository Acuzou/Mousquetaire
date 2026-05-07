# Mousquetaire - Bootstrap Story 1.1

Socle initial du projet pour Story `1.1-bootstrap-depot-ci-et-socle-technique`.

## Prérequis

- Node.js `20.19+` ou `22.12+`
- Python `>=3.10`

## Frontend (`web/`)

```powershell
cd web
npm install
npm run dev
```

## Backend (`api/`)

### PowerShell (Windows)

```powershell
python -m venv api\.venv
.\api\.venv\Scripts\python -m pip install --upgrade pip
.\api\.venv\Scripts\python -m pip install "fastapi[standard]" pytest httpx ruff
cd api
..\api\.venv\Scripts\fastapi dev app\main.py
```

### Bash / Zsh (macOS, Linux)

```bash
python3 -m venv api/.venv
./api/.venv/bin/python -m pip install --upgrade pip
./api/.venv/bin/python -m pip install "fastapi[standard]" pytest httpx ruff
cd api
../api/.venv/bin/fastapi dev app/main.py
```

## Qualité

Depuis la racine :

```powershell
npm run lint
npm run typecheck
npm run test
```

> Les scripts racine utilisent `python -m ...`. Assurez-vous d'avoir un environnement Python actif avec `ruff` et `pytest` installés (venv recommandé).

## Tokens design system (socle Story 1.1)

Tokens CSS sémantiques de base disponibles dans `web/src/index.css` :

- `--background` : fond global
- `--card` : surface des cartes/containers
- `--foreground` : texte principal
- `--muted` : texte secondaire
- `--primary` : couleur d'accent/actions
- `--border` : bordures
- `--destructive` : feedback d'erreur
- `--focus-ring` : contour de focus clavier
- `--warning-surface` : surface d'alerte non bloquante
- `--turn-active` : reserve gameplay (etat tour actif)

Règle de base: utiliser `var(--token)` dans les nouveaux écrans, sans valeurs brutes (`#...`, `rgb(...)`) hors cas exceptionnel documenté.

Audit Story 1.9 (périmètre Epic 1): styles création/rejoindre, bannière hors matrice, sections légales et à-propos alignés sur tokens sémantiques; aucune valeur magique hors définition des tokens.

## Contrat API - création de salle (Story 1.2)

- Endpoint: `POST /rooms`
- Requête: corps vide (MVP)
- Réponse `201`:
  - `room_id` (UUID string)
  - `room_code` (code alphanumérique 6 caractères)
- Réponse `500`:
  - `detail.error_code` = `room_creation_failed`
  - `detail.message` lisible côté utilisateur

Limite temporaire FR27 (MVP Story 1.2): format de code fixé à 6 caractères alphanumériques majuscules, sans ambiguïtés visuelles. Les règles avancées (capacité salle, politiques complètes) sont traitées dans les stories suivantes.
Limite technique temporaire: stockage en mémoire locale du process API (MVP). Un stockage partagé sera introduit dans les stories de persistance/reconnexion.

## Contrat API - rejoindre une salle (Story 1.3)

- Endpoint: `POST /rooms/join`
- Requête JSON:
  - `room_code` (string 6 caractères, normalisé en majuscules)
  - `pseudo` (string 2-24 caractères)
- Réponse `200`:
  - `room_id`, `room_code`, `participant_id`, `pseudo`
  - cookie technique HTTP-only `mousquetaire_session` (session de jeu, sans compte produit)
- Réponse `404`:
  - `detail.error_code` = `room_not_found`
  - `detail.message` explicite: code invalide ou salle indisponible

Note dev cross-origin (Vite ↔ API): le client envoie `credentials: include` et l'API autorise `allow_credentials` pour permettre la persistance du cookie de session en développement.

## Contrat API - mega-deck collaboratif (Story 2.1)

- Endpoint lecture: `GET /rooms/{room_code}/mega-deck`
- Endpoint ajout: `POST /rooms/{room_code}/mega-deck`
- Requête ajout JSON:
  - `word` (2-32 caractères)
- Réponse `200`:
  - `room_id`, `room_code`, `words`, `max_words`
- Réponse `409`:
  - `detail.error_code` = `word_duplicate` ou `mega_deck_limit_reached`
  - `detail.message` explicite pour correction utilisateur

## Hors scope de cette story

- Logique métier room / game
- WebSocket gameplay
- Persistance Firestore
- Authentification produit
