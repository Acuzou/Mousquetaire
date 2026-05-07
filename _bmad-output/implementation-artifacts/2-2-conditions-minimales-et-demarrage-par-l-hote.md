# Story 2.2: Conditions minimales et demarrage par l'hote

Status: done

## Story

As a **hote**,
I want **demarrer la partie lorsque les conditions minimales sont remplies**,
So that **on ne lance pas une partie incomplete par erreur**.

## Acceptance Criteria

1. **Given** les conditions minimales P0  
   **When** elles ne sont pas remplies  
   **Then** l'action demarrer est desactivee ou refusee avec raison lisible.
2. **Given** les conditions remplies  
   **When** l'hote confirme le demarrage  
   **Then** la partie passe en etat `in_game` cote serveur et les clients affichent un header aligne.

## Tasks / Subtasks

- [x] Ajouter le modele d'etat salon cote API.
  - [x] Ajout `phase` (`pre_game`/`in_game`) dans `Room`.
  - [x] Ajout `host_participant_id` derive du premier joueur qui rejoint.
- [x] Exposer les endpoints de pilotage.
  - [x] `GET /rooms/{room_code}/state` avec `can_start` et `blocked_reasons`.
  - [x] `POST /rooms/{room_code}/start` reserve a l'hote.
- [x] Implementer les conditions minimales P0.
  - [x] Min 2 joueurs.
  - [x] Mega-deck complet (25 mots).
  - [x] Refus explicites (`start_conditions_not_met`, `only_host_can_start`).
- [x] Verrouiller les actions incompatibles apres demarrage.
  - [x] Join refuse si partie deja demarree.
  - [x] Ajout mega-deck refuse apres demarrage.
- [x] Integrer l'UI RoomHeader + demarrage hote.
  - [x] Affichage de phase `pre-partie` / `en jeu`.
  - [x] Bouton demarrage hote desactive avec raisons lisibles.
  - [x] Polling court de l'etat salon pour alignement inter-clients.
- [x] Couvrir par les tests front/back et mettre a jour la documentation.

### Review Findings

- [x] [Review][Patch] Alignement multi-clients du header apres demarrage: ajout polling `GET /state` [web/src/App.tsx]
- [x] [Review][Patch] Verrouillage des transitions invalides apres `in_game` (join/mega-deck) [api/app/main.py]
- [ ] [Review][Deferred] Autorisation start basee sur `participant_id` non lie au cookie session (risque d'usurpation) [api/app/main.py]

## Dev Notes

- Le role hote est attribue au premier participant de la salle.
- Les raisons de blocage sont calculees cote serveur (source de verite) puis affichees en UI.
- L'alignement multi-client est assure en V1 via polling; WebSocket viendra en Epic 3.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- 2026-05-07: Ajout endpoints `state`/`start` et logique conditions minimales.
- 2026-05-07: Ajout RoomHeader + bouton hote + raisons de blocage dans l'app web.
- 2026-05-07: Ajout polling et verrouillage apres demarrage suivant review one-shot.

### Completion Notes List

- Demarrage impossible tant que les preconditions P0 ne sont pas reunies.
- Demarrage reserve a l'hote avec message explicite si refus.
- Passage en `in_game` persiste cote serveur et visible en header client.
- Tests API/Front valident nominal + cas limites principaux.

### File List

- `_bmad-output/implementation-artifacts/2-2-conditions-minimales-et-demarrage-par-l-hote.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `api/app/main.py`
- `api/tests/test_health.py`
- `web/src/lib/api.ts`
- `web/src/App.tsx`
- `web/src/App.test.tsx`
- `web/src/index.css`
- `README.md`

## Change Log

- 2026-05-07: Story 2.2 implementee en one-shot et marquee `done`.
