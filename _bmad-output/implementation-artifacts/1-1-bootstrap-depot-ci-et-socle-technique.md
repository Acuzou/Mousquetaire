# Story 1.1: Bootstrap dépôt, CI et socle technique

Status: done

## Story

As a équipe produit,
I want un dépôt initial avec frontend Vite+React (TS), backend FastAPI, conventions snake_case API, squelette OpenAPI et pipeline CI (lint/tests),
so that les stories suivantes s'appuient sur un socle reproductible aligné architecture.

## Acceptance Criteria

1. **Given** un clone du dépôt frais  
   **When** on exécute les commandes documentées (README)  
   **Then** le front démarre en dev, l'API expose au minimum `/health` ou équivalent et la spec OpenAPI est générée ou statique.
2. **Given** la CI de la branche principale  
   **When** les jobs s'exécutent  
   **Then** lint + tests back/front passent sans erreur.
3. **Given** la configuration du client  
   **When** on inspecte le bundle ou les sources  
   **Then** aucun secret (clés API, infra) n'est présent côté client.
4. **Given** le dépôt  
   **When** on ajoute une feature UI  
   **Then** les tokens sémantiques Tailwind de base sont disponibles et documentés pour usage futur, sans couleurs brutes hors DS.

## Tasks / Subtasks

- [x] Initialiser le monorepo minimal (`web/`, `api/`, `.github/workflows/`, `docs/`).
  - [x] Créer le frontend via `npm create vite@latest web -- --template react-ts`.
  - [x] Créer le backend FastAPI avec environnement virtuel Python.
  - [x] Ajouter `web/.env.example` et `api/.env.example`.
- [x] Mettre en place le backend minimal.
  - [x] Créer `api/app/main.py` avec application FastAPI.
  - [x] Ajouter endpoint de santé (`/health`).
  - [x] Vérifier exécution en dev (`fastapi dev main.py` ou `uvicorn main:app --reload`).
- [x] Mettre en place le frontend minimal.
  - [x] Vérifier `npm run dev`.
  - [x] Créer l'ossature `src/features`, `src/components/ui`, `src/lib`.
  - [x] Préparer la base des tokens sémantiques Tailwind.
- [x] Mettre en place la qualité.
  - [x] Ajouter scripts lint/test/typecheck.
  - [x] Créer `.github/workflows/ci.yml` pour lint+tests front/back.
  - [x] Vérifier qu'aucun secret n'est commité.
- [x] Documenter le bootstrap.
  - [x] Mettre à jour `README.md` avec prérequis et commandes.
  - [x] Lister ce qui est hors scope de cette story.

### Review Findings

- [x] [Review][Patch] Scripts racine non portables (chemins venv Windows) [package.json:6]
- [x] [Review][Patch] README backend dépendant de PowerShell, sans alternative POSIX [README.md:21]
- [x] [Review][Patch] CI web n'exécute pas le build de production [ .github/workflows/ci.yml:20 ]
- [x] [Review][Patch] Tokens sémantiques non documentés [README.md:1]
- [x] [Review][Patch] Couleur brute utilisée hors token design system [web/src/index.css:17]

## Dev Notes

- Story source: Epic 1 / Story 1.1 dans `epics.md`.
- Cette story est explicitement la **première story d'implémentation**.
- Starter retenu: Vite + React côté front, FastAPI côté backend.
- Prérequis Node côté Vite: `20.19+` ou `22.12+`.
- Commande de dev FastAPI recommandée: `fastapi dev main.py`.
- Arborescence cible inclut `.github/workflows/ci.yml`, `web/.env.example`, `api/.env.example`.
- Secrets: jamais côté client ni dans le dépôt.
- Conventions: API JSON serveur en `snake_case`, séparation `components/ui` vs `features/*`.
- CI attendue: lint + tests back/front dès cette story.
- Git intelligence: non disponible (workspace non détecté comme dépôt git).

### Project Structure Notes

- Respecter la structure cible décrite dans `architecture.md` (racine `web/`, `api/`, `docs/`, `e2e/`).
- Préparer `web/src/generated/` comme zone réservée OpenAPI client (non éditée à la main).
- Conserver une base légère: pas de PostgreSQL ni auth utilisateur lourde dans ce bootstrap.

### References

- `\_bmad-output/planning-artifacts/epics.md`
- `\_bmad-output/planning-artifacts/architecture.md`
- `\_bmad-output/planning-artifacts/prd.md`
- `\_bmad-output/planning-artifacts/ux-design-specification.md`
- `docs/project-context.md`

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- create-story execution timestamp: 2026-05-07T16:59:58+02:00
- npm create vite, npm install, npm run lint/typecheck/test:run/build (web)
- python venv + pip install fastapi[standard]/pytest/httpx/ruff (api)
- python -m ruff check api
- python -m pytest api/tests
- npm run lint/test/typecheck (root)

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Endpoint `/health` implémenté et validé par test backend.
- Frontend bootstrap simplifié avec tokens CSS sémantiques de base.
- CI GitHub Actions ajoutée avec jobs web et api.
- Scripts qualité root (`lint`, `typecheck`, `test`) opérationnels.
- AC vérifiés par exécution lint/tests/build.

### File List

- `_bmad-output/implementation-artifacts/1-1-bootstrap-depot-ci-et-socle-technique.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `.editorconfig`
- `.gitignore`
- `.github/workflows/ci.yml`
- `README.md`
- `package.json`
- `api/.env.example`
- `api/pyproject.toml`
- `api/app/__init__.py`
- `api/app/main.py`
- `api/tests/test_health.py`
- `web/.env.example`
- `web/index.html`
- `web/package.json`
- `web/src/App.test.tsx`
- `web/src/App.tsx`
- `web/src/components/ui/.gitkeep`
- `web/src/features/.gitkeep`
- `web/src/generated/.gitkeep`
- `web/src/index.css`
- `web/src/lib/api.ts`
- `web/src/lib/errors.ts`
- `web/src/lib/ws.ts`
- `web/src/test/setup.ts`
- `web/tsconfig.app.json`
- `web/vite.config.ts`
- `web/src/App.css` (deleted)
- `web/src/assets/hero.png` (deleted)
- `web/src/assets/react.svg` (deleted)
- `web/src/assets/vite.svg` (deleted)
- `web/public/icons.svg` (deleted)

## Change Log

- 2026-05-07: Implémentation complète story 1.1 (bootstrap monorepo, backend FastAPI, frontend Vite+React, tests, CI, documentation) et passage en `review`.
