# Story 3.4: Revelation synchronisee et etat partage

Status: done

## Story

As a **joueur a la table**,
I want **voir les cartes revelees et l'etat mis a jour pour tous**,
So that **la revelation reste un moment social synchronise**.

## Acceptance Criteria

1. **Given** une selection validee  
   **When** le serveur applique la revelation  
   **Then** tous les clients recoivent l'etat et la grille affiche les cartes revelees.
2. **Given** des evenements temps reel dupliques/retardes  
   **When** ils arrivent cote UI  
   **Then** l'UI dedoublonne par type/version et limite la pile de notifications.
3. **Given** une annonce `aria-live`  
   **When** la revelation est appliquee  
   **Then** l'annonce est lisible sans repetition excessive.

## Tasks / Subtasks

- [x] Ajouter l'etat de revelation cote serveur.
  - [x] `revealed_card_words` dans `Room` + `RoomStateResponse`
- [x] Ajouter endpoint de revelation autoritative.
  - [x] `POST /rooms/{room_code}/cards/reveal`
  - [x] validations role/phase/version/selection/indice
  - [x] diffusion WS `cards_revealed`
- [x] Integrer la revelation cote UI.
  - [x] bouton `Reveler la selection`
  - [x] rendu visuel cartes revelees
  - [x] annonce `aria-live` dedoublonnee
- [x] Ajouter dedoublonnage d'evenements temps reel.
  - [x] filtre `(type, version)` cote websocket client
  - [x] file de toasts bornee (max 3)
- [x] Couvrir tests back/front + contrat README.

### Review Findings

- [x] [Review][Patch] les evenements dupliques pouvaient dupliquer les notifications: dedoublonnage `(type, version)` ajoute.
- [x] [Review][Patch] etat grille incomplet sur WS: `revealed_card_words` diffuse dans snapshot + evenements.
- [x] [Review][Patch] annonce a11y potentiellement repetitive: garde `lastLiveRevealVersionRef` ajoutee.
- [x] [Review][Patch] reveal no-op et carte deja revelee maintenant refuses cote API (`no_new_cards_to_reveal`, `card_already_revealed`).
- [x] [Review][Patch] bouton de revelation aligne sur les preconditions serveur (indice actif requis).

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- 2026-05-07: endpoint reveal + diffusion `cards_revealed`.
- 2026-05-07: integration UI cartes revelees + aria-live + toasts limites.
- 2026-05-07: tests backend/frontend completes.

### Completion Notes List

- Revelation des selections maintenant server-authoritative et synchronisee temps reel.
- Cartes revelees partagees sur tous les clients via polling + websocket.
- Dedoublonnage d'evenements et anti-spam d'annonce accessibles en place.

### File List

- `_bmad-output/implementation-artifacts/3-4-revelation-synchronisee-et-etat-partage.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `api/app/main.py`
- `api/tests/test_health.py`
- `web/src/App.tsx`
- `web/src/App.test.tsx`
- `web/src/lib/api.ts`
- `web/src/index.css`
- `README.md`

## Change Log

- 2026-05-07: Story 3.4 implementee en one-shot et marquee `done`.
