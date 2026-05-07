# Story 4.3 — Reconnexion et resynchronisation sans corruption du tour (FR16)

Statut: **done** (2026-05-07)

## Livrables

- **API:** tables memoire `session_by_token` / `session_token_by_participant` ; `POST /rooms/join` reprend la session si cookie + salle + pseudo + participant encore presents (pas d’append, pas de bump `turn_version`, pas de WS `participant_joined`) ; reponse `session_resumed` ; `leave` appelle `unregister_participant_session`.
- **Web:** type et parsing `session_resumed` ; toast reprise de session ; WebSocket avec reconnexion backoff + plafond de tentatives, toasts et bannière `sync-banner` (UX-DR3).
- **Tests:** `test_join_resume_with_same_cookie_keeps_participant_and_turn_version`, `test_leave_clears_session_next_join_same_pseudo_is_new_participant` ; `reset_storage()` nettoie aussi sessions et sockets.

## Limites MVP

Pas de Firestore ; la verite terrain reste `GET .../state` + WS. Cookie session ne remplace pas un compte produit.
