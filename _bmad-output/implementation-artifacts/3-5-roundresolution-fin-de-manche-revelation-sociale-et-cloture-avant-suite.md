# Story 3.5: RoundResolution - fin de manche, revelation sociale et cloture avant suite

Status: done

## Story

As a **joueur a la table**,
I want **voir un etat de fin de manche partage avant toute transition**,
So that **le payoff social reste le climax et pas une transition technique**.

## Acceptance Criteria

1. **Given** les conditions P0 de fin de manche  
   **When** elles sont atteintes  
   **Then** un etat `RoundResolution` explicite est visible avec un beat avant transition.
2. **Given** plusieurs clients connectes  
   **When** la manche se termine  
   **Then** tous voient le meme message de cloture synchronise (sans etats incompatibles).
3. **Given** la variante P0  
   **When** la manche se termine  
   **Then** le flux vers manche suivante est coherent avec FR14 (story 3.6).

## Tasks / Subtasks

- [x] Ajouter l'etat `RoundResolution` cote API.
  - [x] champs room/state de resolution de manche
  - [x] beat serveur (`ROUND_RESOLUTION_BEAT_MS`)
- [x] Declencher la resolution de manche.
  - [x] sur `cards/reveal` quand condition P0 atteinte
  - [x] diffusion WS `round_resolution_started`
- [x] Bloquer actions gameplay pendant le beat.
  - [x] guard `round_resolution_active` sur actions sensibles
- [x] Ajouter transition vers manche suivante.
  - [x] endpoint `POST /rooms/{room_code}/round/continue` (hote)
  - [x] diffusion WS `round_resolution_cleared`
- [x] Integrer RoundResolution cote UI.
  - [x] panneau de fin de manche + countdown beat
  - [x] CTA hote "Lancer la manche suivante"
  - [x] etat synchronise via polling + websocket
- [x] Tests + docs + statuts.

### Review Findings

- [x] [Review][Patch] dedoublonnage evenement etat par salle/version conserve pour eviter ecarts inter-clients.
- [x] [Review][Patch] reveal/toggle refusés pendant `round_resolution_active`.
- [x] [Review][Patch] CTA de transition aligne sur beat serveur et role hote.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- 2026-05-07: ajout modeles RoundResolution et guards serveur.
- 2026-05-07: ajout endpoint `round/continue` + sync websocket.
- 2026-05-07: integration panneau UI + countdown + tests verts.

### Completion Notes List

- RoundResolution est maintenant un etat explicite, synchronise et partage.
- Le beat de fin de manche est respecte avant transition manuelle.
- Transition vers manche suivante prepare le terrain FR14 (story 3.6).

### File List

- `_bmad-output/implementation-artifacts/3-5-roundresolution-fin-de-manche-revelation-sociale-et-cloture-avant-suite.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `api/app/main.py`
- `api/tests/test_health.py`
- `web/src/App.tsx`
- `web/src/App.test.tsx`
- `web/src/lib/api.ts`
- `web/src/index.css`
- `README.md`

## Change Log

- 2026-05-07: Story 3.5 implementee en one-shot et marquee `done`.
