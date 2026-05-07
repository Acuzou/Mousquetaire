# Story 4.4 — Detection depart / deconnexion de l'hote et retours explicites (FR28 / FR29)

Statut: **done** (2026-05-07)

## Livrables

- **API:** comptage des connexions WebSocket actives par participant (`room_participant_live_ws`) ; grace `host_absence_grace_until_ms` + transfert passif d'hote si l'hote n'a plus aucune WS ouverte jusqu'a expiration (`HOST_WS_ABSENCE_GRACE_MS`, 90 s en prod ; `<= 0` pour transfert immediat et tests synchrones Starlette).
- **WebSocket:** query optionnelle `participant_id` sur `GET .../rooms/{room_code}/events` pour rattacher la socket au joueur ; evenements `host_absence_grace_started`, `host_absence_grace_cleared`, `host_transferred_passive` avec payload aligne sur `broadcast_payload_for_room` (inclut `host_participant_id`, `host_absence_grace_until_ms`).
- **Etat HTTP:** `GET .../state` expose `host_participant_id` et `host_absence_grace_until_ms`.
- **Web:** parsing des champs dans `fetchRoomState` ; URL WS avec `participant_id` ; `isHost` resynchronise depuis le state et les payloads WS ; banniere `host-absence-banner` (`data-testid`) pendant la grace en partie ; toasts pour grace, annulation et transfert.
- **Tests:** `test_host_ws_disconnect_starts_grace_then_transfers_host`, `test_host_ws_reconnect_clears_grace` dans `api/tests/test_health.py`.

## Notes

Le transfert passif ne remplace pas la sortie volontaire (`leave`) documentee en story 4.1 ; il couvre l'absence de flux temps reel cote hote sans action « Quitter ».
