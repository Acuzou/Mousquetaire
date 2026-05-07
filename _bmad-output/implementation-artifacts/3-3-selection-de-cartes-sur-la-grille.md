# Story 3.3: Selection de cartes sur la grille

Status: done

## Story

As a **devineur**,
I want **selectionner / deselectionner des cartes sur la grille**,
So that **l'equipe verrouille ses choix avant revelation**.

## Acceptance Criteria

1. **Given** la phase de selection ouverte  
   **When** je clique/tape une carte WordGrid  
   **Then** l'UI applique l'etat local confirme par le serveur et remonte les refus explicites.
2. **Given** WordGrid  
   **When** je suis sur mobile/clavier  
   **Then** cartes actionnables >= 44px, focus visible, attributs accessibles et `data-testid`.
3. **Given** vue mobile  
   **When** j'interagis avec grille et CTA de tour  
   **Then** la safe-area basse est respectee (`env(safe-area-inset-bottom)`).

## Tasks / Subtasks

- [x] Ajouter l'etat autoritatif de grille cote API.
  - [x] `board_cards` et `selected_card_words` dans l'etat room
  - [x] reset des selections au changement de tour
- [x] Ajouter endpoint de toggle selection.
  - [x] `POST /rooms/{room_code}/cards/toggle`
  - [x] garde-fous phase/participant/role/version/carte
  - [x] diffusion WS `card_selection_changed`
- [x] Integrer WordGrid cote UI.
  - [x] rendu cartes avec `data-testid`
  - [x] `aria-pressed` pour l'etat selectionne
  - [x] blocage d'action hors devineur actif
- [x] Ajouter styles mobile/a11y.
  - [x] zone tactile min 44px
  - [x] respect safe-area
- [x] Couvrir tests front/back et documentation contrat.

### Review Findings

- [x] [Review][Patch] selection persistait au tour suivant: reset serveur ajoute dans `advance_turn`.
- [x] [Review][Patch] evenement WS de selection non ecoute cote UI: `card_selection_changed` ajoute au filtre.
- [x] [Review][Patch] validation stricte de l'etat room cote client: `board_cards`/`selected_card_words` verifies.
- [x] [Review][Patch] synchro de grille au demarrage: `board_cards` diffuse via WebSocket snapshot/changement.
- [x] [Review][Patch] jouabilite a 2 joueurs: role `guesser` garanti pour le second joueur en P0.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- 2026-05-07: ajout endpoint autoritatif de toggle carte et diffusion WS.
- 2026-05-07: integration WordGrid accessible dans `App.tsx`.
- 2026-05-07: tests backend/frontend et ajustements de synchronisation.

### Completion Notes List

- Selection de cartes maintenant autoritative et versionnee.
- WordGrid compatible clavier + mobile (safe-area + cibles 44px).
- Synchronisation multi-clients via websocket sur les selections.

### File List

- `_bmad-output/implementation-artifacts/3-3-selection-de-cartes-sur-la-grille.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `api/app/main.py`
- `api/tests/test_health.py`
- `web/src/lib/api.ts`
- `web/src/App.tsx`
- `web/src/App.test.tsx`
- `web/src/index.css`
- `README.md`

## Change Log

- 2026-05-07: Story 3.3 implementee en one-shot et marquee `done`.
