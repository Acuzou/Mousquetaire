# Story 3.1: Tours, roles et indicateur d'action (WebSocket + etat autoritatif)

Status: done

## Story

As a **joueur**,
I want **que les tours et roles alternent selon la variante et voir clairement qui doit agir**,
So that **personne ne joue hors tour**.

## Acceptance Criteria

1. **Given** une partie en cours et un canal WebSocket actif  
   **When** le serveur emet des evenements `{ type, payload, version }`  
   **Then** chaque client met a jour un agregat d'etat de tour unique et affiche `TurnIndicator`.
2. **Given** deux clients dans la meme salle  
   **When** le tour change  
   **Then** les deux affichent le meme joueur / role actif apres propagation.
3. **Given** un client desynchronise  
   **When** la version serveur diverge  
   **Then** un message explicite invite au resync (comportement minimal story 3.1).

## Tasks / Subtasks

- [x] Ajouter la couche tour autoritative cote serveur.
  - [x] Etat de tour dans `Room` (`turn_version`, participant/role actif).
  - [x] Initialisation de tour au demarrage de partie.
- [x] Exposer le canal WebSocket de salle.
  - [x] `ws /rooms/{room_code}/events`.
  - [x] Envelope events `{ type, payload, version }`.
  - [x] Emissions `turn_snapshot` et `turn_changed`.
- [x] Ajouter action serveur de progression de tour.
  - [x] `POST /rooms/{room_code}/turn/next`.
  - [x] garde version (`turn_version_conflict`) + message de resync.
  - [x] garde autorite (`not_your_turn`) pour eviter action hors tour.
- [x] Integrer le `TurnIndicator` cote frontend.
  - [x] agregat d'etat tour unique (`turnState`).
  - [x] connexion WebSocket sur phase `in_game`.
  - [x] affichage joueur/role/version et CTA "Passer au tour suivant".
  - [x] message explicite de desynchronisation.
- [x] Couvrir par tests backend/frontend + doc.

### Review Findings

- [x] [Review][Patch] fermeture/reconnexion WS excessive liee a `turnVersion`: retrait de cette dependance dans l'effet [web/src/App.tsx]
- [x] [Review][Patch] risque de rollback version par closure stale: ajout `turnStateRef` + comparaison monotone [web/src/App.tsx]
- [x] [Review][Patch] absence de filtrage type evenement WS: filtrage explicite `turn_snapshot/turn_changed` [web/src/App.tsx]
- [x] [Review][Patch] autorite tour serveur incomplète: refus `not_your_turn` pour appelant non actif [api/app/main.py]

## Dev Notes

- Le comportement de reconciliation 3.1 est volontairement minimal: message explicite de resync sur gap de version.
- L'enrichissement reconnection/heartbeat est reporte Epic 4.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- 2026-05-07: Ajout websocket salle + diffusion evenements tour cote API.
- 2026-05-07: Ajout endpoint `turn/next` avec version conflict et garde hors-tour.
- 2026-05-07: Ajout TurnIndicator et agregat d'etat tour unique cote UI.
- 2026-05-07: Revue one-shot + patchs critiques appliques.

### Completion Notes List

- Synchronisation tour basee sur events versionnes operationnelle.
- Alignement multi-clients valide en test websocket backend.
- UX explicite en cas de divergence de version.
- Garde serveur "ce n'est pas votre tour" active.

### File List

- `_bmad-output/implementation-artifacts/3-1-tours-roles-et-indicateur-d-action-websocket-etat-autoritatif.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `api/app/main.py`
- `api/tests/test_health.py`
- `web/src/lib/api.ts`
- `web/src/App.tsx`
- `web/src/App.test.tsx`
- `web/src/index.css`
- `README.md`

## Change Log

- 2026-05-07: Story 3.1 implementee en one-shot et marquee `done`.
