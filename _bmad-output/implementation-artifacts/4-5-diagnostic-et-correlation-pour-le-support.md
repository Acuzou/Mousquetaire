# Story 4.5 — Diagnostic et correlation pour le support (FR30)

Statut: **done** (2026-05-07)

## Livrables

- **Journal `mousquetaire.support` (INFO):** middleware HTTP avec **`X-Correlation-ID`** entrant (sinon UUID ; max 128 caracteres) renvoye sur chaque reponse ; **`session_fp`** = 16 premiers caracteres hex du SHA-256 du cookie session (pas le jeton en clair).
- **Filtrage bruit:** pas de ligne `http_request` pour les GET frequents `/health`, `.../state`, `.../mega-deck`.
- **Lifecycle partie:** `room_created`, `participant_join` + **`diagnostic_ref`** dans les corps JSON de `POST /rooms` et `POST /rooms/join` ; `participant_leave` ; `websocket_open` / `websocket_close` avec **`correlation_id`** query ; `ws_broadcast` pour evenements cles multijoueur (jointures, departs, transferts hote passifs, fin partie / resolution manche).
- **Web:** `apiFetch` avec **`X-Correlation-ID`** par requete ; WS avec **`correlation_id`** ; UI reference diagnostic (`support-diagnostic-ref`).
- **Tests:** UUID `diagnostic_ref` creation / jointure ; echo et remplacement correlation ID HTTP.

## Limites MVP

Pas d'export trace distribue ni stockage long terme ; correlation = grep logs applicatifs et rapprochement `room_id` / `diagnostic_ref` / `correlation_id` / `session_fp`.
