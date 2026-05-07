# Story 3.8 — Réversibilité d'une action récente (P0)

**Statut:** done  
**Epic:** 3  
**FR:** FR32  

## Règle P0 livrée

**Retrait d'indice** (`POST /rooms/{room_code}/clue/withdraw`) :

- Uniquement **l'auteur** de l'indice (`current_clue_author_participant_id`).
- Tant que **aucune interaction devineur sur la sélection** (`clue_selection_touched == false`) **et** `selected_card_words` vide.
- Hors `round_resolution`, `game_over`, partie démarrée.
- État canonique + `turn_version` incrémenté ; WS `clue_withdrawn`.

**Non réversible en V1 :** la **révélation** — pas de bouton d'annulation ; message d'aide court sous l'action.

**Sélection :** pas de bouton « Annuler » séparé ; **re-cliquer une carte** désélectionne (comportement existant), complété par une phrase d'aide.

## Fichiers

- `api/app/main.py`, `api/tests/test_health.py`
- `web/src/lib/api.ts`, `web/src/App.tsx`, `web/src/App.test.tsx`, `web/src/index.css`
- `README.md`, `sprint-status.yaml`

## Revue

- Retrait bloqué après premier toggle devineur : évite retrait après exploration tacite de la grille.
- Auteur effacé après une révélation réussie : pas de retrait sur une manche déjà engagée par révélation.

## Change log

- 2026-05-07 : Implémentation FR32 P0.
