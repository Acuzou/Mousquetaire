# Story 1.8: Limites code de salle et taille de groupe

Status: done

## Story

As a **joueur**,
I want **voir et subir de facon previsible les limites de code et de taille de groupe**,
So that **la table sait combien de joueurs sont acceptes et quel format de code est valide**.

## Acceptance Criteria

1. **Given** la politique produit sur format code et taille groupe  
   **When** je consulte l'UI ou les erreurs  
   **Then** les limites sont documentees clairement.
2. **Given** une tentative de rejoindre au-dela de la capacite  
   **When** le serveur applique la regle  
   **Then** le refus est explicite.

## Tasks / Subtasks

- [x] Definir les limites V1 dans le backend.
  - [x] Conserver format code 6 caracteres alphanumeriques.
  - [x] Ajouter capacite max salle (8 joueurs).
  - [x] Refuser explicitement les joins depassant la capacite.
- [x] Exposer les limites dans l'UI.
  - [x] Afficher regles V1 (code + capacite) sur l'ecran principal.
  - [x] Afficher message explicite si salle complete.
- [x] Ajouter la couverture tests.
  - [x] Test backend refus `room_full`.
  - [x] Test frontend message salle complete.
  - [x] Test frontend affichage des regles V1.

### Review Findings

- [x] [Review][Patch] Eviter derive des valeurs limites codées en dur via constantes partagees par couche [api/app/main.py:57]
- [x] [Review][Patch] Rendre les assertions front resilientes aux evolutions limites via constantes [web/src/App.test.tsx:1]

## Dev Notes

- Story source: Epic 1 / Story 1.8 dans `epics.md`.
- Limites V1 retenues: code de salle 6 caracteres; capacite max 8 joueurs par salle.
- Refus serveur explicite en HTTP 409 avec `error_code=room_full`.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- 2026-05-07: Ajout de `MAX_PLAYERS_PER_ROOM` et controle capacite dans `api/app/main.py`.
- 2026-05-07: Ajout test backend `room_full` dans `api/tests/test_health.py`.
- 2026-05-07: Ajout regles V1 et message capacite dans `web/src/App.tsx`.
- 2026-05-07: Ajout constantes frontend limites `web/src/lib/gameLimits.ts`.
- 2026-05-07: Mise a jour tests frontend `web/src/App.test.tsx`.
- 2026-05-07: Revue one-shot (blind/edge/audit) et patchs appliques.

### Completion Notes List

- Le backend refuse explicitement toute jointure au-dela de la capacite max.
- Les limites FR27 sont visibles dans l'UI (format code + taille max groupe).
- Les messages d'erreur et tests sont alignes avec les constantes de limites.
- Validation complete front+back (lint, typecheck, tests).

### File List

- `_bmad-output/implementation-artifacts/1-8-limites-code-de-salle-et-taille-de-groupe.md`
- `api/app/main.py`
- `api/tests/test_health.py`
- `web/src/App.tsx`
- `web/src/App.test.tsx`
- `web/src/lib/gameLimits.ts`

## Change Log

- 2026-05-07: Story 1.8 implementee en one-shot (dev, review, patchs) et marquee `done`.
