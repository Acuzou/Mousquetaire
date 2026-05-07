# Story 2.3: Variante Mousquetaire P0

Status: done

## Story

As a **joueur**,
I want **jouer selon la variante Mousquetaire livree en configuration P0**,
So that **tous appliquent les memes regles au lancement V1**.

## Acceptance Criteria

1. **Given** une partie qui demarre  
   **When** le serveur initialise la manche  
   **Then** la variante P0 (roles, equipes, grille) est appliquee de facon autoritative.
2. **Given** l'UI TeamSetup / configuration  
   **When** la variante n'autorise pas certains reglages  
   **Then** ces options sont absentes ou grisees avec explication courte.

## Tasks / Subtasks

- [x] Introduire la variante P0 autoritative cote serveur.
  - [x] `variant_key = mousquetaire_p0`
  - [x] `teams_count = 2`
  - [x] `grid_size = 5`
  - [x] `black_words = 1`
- [x] Initialiser les roles P0 au demarrage de partie.
  - [x] attribution serveur de roles (`clue_giver_team_a/b`, `guesser_team_a/b`)
  - [x] exposition dans `state` et `start`.
- [x] Etendre les contrats API.
  - [x] `GET /rooms/{room_code}/state` inclut la variante + roles.
  - [x] `POST /rooms/{room_code}/start` renvoie la variante + roles initialises.
- [x] Integrer TeamSetup verrouille cote frontend.
  - [x] affichage des regles fixes P0 en lecture seule
  - [x] explication courte sur verrouillage de configuration
- [x] Ajouter/mettre a jour tests et docs.

### Review Findings

- [x] [Review][Patch] AC roles P0 incomplet: ajout `participant_roles` initialises au start [api/app/main.py]
- [x] [Review][Patch] Robustesse parsing room state: verification tableau `blocked_reasons` [web/src/lib/api.ts]
- [ ] [Review][Deferred] Controle hote au start base sur `participant_id` sans lien session cookie [api/app/main.py]

## Dev Notes

- La variante P0 est forcee cote serveur pour eviter toute divergence client.
- TeamSetup est volontairement non editable en V1 pour rendre explicite le scope.
- Les roles P0 sont une base minimale avant la boucle synchrone Epic 3.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- 2026-05-07: ajout meta variante P0 dans etat room backend.
- 2026-05-07: ajout initialisation roles P0 au demarrage.
- 2026-05-07: ajout TeamSetup verrouille en UI + tests alignes.
- 2026-05-07: revue one-shot (blind/edge/audit) et patchs appliques.

### Completion Notes List

- Variante P0 appliquee autoritativement cote serveur au demarrage.
- Parametres de variante exposes de maniere coherente entre API start/state.
- TeamSetup affiche les reglages non modifiables avec explication concise.
- Validation front/back complete et verte.

### File List

- `_bmad-output/implementation-artifacts/2-3-variante-mousquetaire-p0.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `api/app/main.py`
- `api/tests/test_health.py`
- `web/src/lib/api.ts`
- `web/src/App.tsx`
- `web/src/App.test.tsx`
- `web/src/index.css`
- `README.md`

## Change Log

- 2026-05-07: Story 2.3 implementee en one-shot et marquee `done`.
