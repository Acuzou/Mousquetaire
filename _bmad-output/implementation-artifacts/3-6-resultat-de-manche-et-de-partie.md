# Story 3.6 — Résultat de manche et de partie

**Statut:** done  
**Epic:** 3 — Boucle de jeu temps réel  
**FR couvert:** FR14  

## Contexte

Les joueurs doivent identifier le résultat d’une manche ou de la partie (scores, équipe gagnante, message de fin), lisible et aligné sur l’état serveur (FR14), avec contraste suffisant sur les scores (UX-DR2).

## Acceptance criteria (rappel)

1. **Given** une manche ou partie terminée **When** l’écran de résultat s’affiche **Then** scores, équipe / issue et message de fin sont lisibles et cohérents avec le serveur.  
2. **Given** direction visuelle A+B **When** consultation des résultats **Then** contraste suffisant sur les éléments critiques (scores, équipe active).

## Implémentation V1 P0

- **Scores:** points par équipe = nombre de cartes révélées au tour du devineur actif (`guesser_team_a` / `guesser_team_b`).
- **Fin de partie:** dès qu’une équipe atteint `GAME_SCORE_TARGET` (exposé en API comme `game_score_target`), la phase passe à `game_over`.
- **Issue:** `winning_team_key` (`team_a` | `team_b` | `tie`) et `game_end_message` dans l’état salle et les réponses de révélation.
- **Transition:** si la partie continue après une manche, le flux RoundResolution (3.5) reste inchangé ; si la partie se termine sur une révélation, pas de beat « manche suivante » — état `game_over` immédiat.
- **Temps réel:** événement WebSocket `game_finished` avec payload aligné sur `broadcast_room_event`.

## Review (synthèse)

| Couche | Observation | Action |
|--------|-------------|--------|
| Blind Hunter | `participant_id` non lié cookie (dette connue) | Inchangé |
| Edge Case Hunter | Égalité au seuil | `tie` |
| Acceptance | FR14 via champs dédiés + panneau UI | Fait |

## Fichiers touchés

- `api/app/main.py`
- `api/tests/test_health.py`
- `web/src/lib/api.ts`
- `web/src/App.tsx`, `web/src/App.test.tsx`
- `web/src/index.css`
- `README.md`
- `sprint-status.yaml`

## Debug / notes

- Tests backend : `monkeypatch` sur `GAME_SCORE_TARGET` pour fin de partie rapide.
- Les mocks `fetch` des tests ajoutent les champs score obligatoires pour `fetchRoomState`.

## Change log

- 2026-05-07 : Implémentation FR14 (scores, vainqueur, message, phase `game_over`, WS `game_finished`).
