# Story 4.2 — Rejoindre en cours avec statut clair (FR15)

Statut: **done** (2026-05-07)

## Livrables

- **API:** `POST /rooms/join` permet la jointure en `in_game` / `game_over` avec plafond salle ; reponse avec `player_status`, `room_phase`, `status_message` ; garde `spectator_action_forbidden` sur les mutations gameplay ; rotation tour et resolution hote sur participants ayant un role uniquement ; WS `participant_joined`.
- **Web:** types et parsing `joinRoom` ; etats `joinCapacity` / `joinStatusDetail` ; banniere spectateur ; desactivation actions gameplay ; resynchro poll depuis `participant_roles`.
- **Tests:** `api/tests/test_health.py` (jointure mi-partie spectateur, spectateur ne peut pas toggle carte) ; mocks join completes dans `App.test.tsx`.
- **Doc:** README section Story 4.2 ; classe `.spectator-banner` (tokens DS).
- **UI RoundResolution:** decompte du beat derive au rendu (plus de decalage ou le bouton « manche suivante » etait un bref instant actif avant le premier tick du timer).

## Notes

Les spectateurs sont identifies par absence dans `participant_roles` une fois la partie lancee.
