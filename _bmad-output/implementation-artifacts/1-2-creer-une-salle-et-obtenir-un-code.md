# Story 1.2: Créer une salle et obtenir un code

Status: done

## Story

As a **joueur**,
I want **créer une salle et recevoir un code de partage**,
So that **je peux inviter d'autres joueurs sans compte obligatoire**.

## Acceptance Criteria

1. **Given** l'API et le front disponibles  
   **When** je lance "créer une salle"  
   **Then** une salle est créée côté serveur avec identifiant stable et un **code** m'est affiché (**FR1**).
2. **Given** la génération de code de salle  
   **When** une salle est créée  
   **Then** le code respecte le format et les limites documentées en **FR27** / story 1.8 si déjà livrée (sinon comportement provisoire documenté).
3. **Given** une erreur serveur  
   **When** la création échoue  
   **Then** un message lisible (toast ou inline) explique l'échec sans jargon (**UX-DR7**).

## Tasks / Subtasks

- [x] Implémenter la création de salle côté API.
  - [x] Ajouter endpoint HTTP de création de salle (payload minimal, réponse typée).
  - [x] Générer un identifiant de salle stable et un code de partage.
  - [x] Retourner des erreurs explicites et cohérentes (`snake_case`) en cas d'échec.
- [x] Connecter le frontend au flux de création.
  - [x] Ajouter action UI "Créer une salle" depuis l'écran d'entrée.
  - [x] Appeler l'API de création et afficher le code reçu.
  - [x] Afficher un feedback utilisateur en cas d'erreur (sans jargon technique).
- [x] Couvrir par les tests.
  - [x] Ajouter tests backend pour succès + erreur sur endpoint de création.
  - [x] Ajouter tests frontend pour succès + erreur du flux de création.
- [x] Mettre à jour la documentation minimale.
  - [x] Documenter le contrat de création de salle (requête/réponse) dans le repo.
  - [x] Noter explicitement les limites temporaires si FR27 complet n'est pas encore livré.

### Review Findings

- [x] [Review][Patch] Restreindre la capture d'exception API à l'échec de génération de code uniquement [api/app/main.py:45]
- [x] [Review][Patch] Sérialiser l'allocation de code en mémoire pour éviter une course locale [api/app/main.py:29]
- [x] [Review][Patch] Renforcer la validation FR27 dans les tests backend [api/tests/test_health.py:15]
- [x] [Review][Patch] Prévenir le double clic pendant un create en cours [web/src/App.tsx:10]
- [x] [Review][Patch] Gérer les erreurs réseau avec message lisible et valider le payload succès [web/src/lib/api.ts:15]
- [x] [Review][Patch] Ajouter test frontend pour panne réseau [web/src/App.test.tsx:47]

## Dev Notes

- Story source: Epic 1 / Story 1.2 dans `epics.md`.
- Maintenir les conventions établies en story 1.1: API `snake_case`, séparation `features`/`components/ui`, aucune exposition de secret côté client.
- Garder la solution simple et compatible avec les stories 1.3+ (rejoindre salle, contraintes de capacité).
- Les règles avancées FR27 peuvent être provisoires à ce stade si clairement documentées.

### References

- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/implementation-artifacts/1-1-bootstrap-depot-ci-et-socle-technique.md`

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- 2026-05-07: Story 1.2 créée et démarrée.
- 2026-05-07: Implémentation API `POST /rooms`, UI bouton de création, messages d'erreur.
- 2026-05-07: Tests exécutés (`web` lint/typecheck/test, `api` ruff/pytest via venv).
- 2026-05-07: Code review multi-couches (blind/edge/auditor) puis application des patchs.

### Completion Notes List

- Endpoint `POST /rooms` ajouté avec `room_id` + `room_code` et erreur utilisateur lisible.
- UI d'entrée mise à jour avec action "Creer une salle", affichage du code, feedback d'erreur.
- Contrat API documenté dans le `README` avec limites FR27 provisoires.
- Tests backend ajoutés (succès + erreur), tests frontend ajoutés (succès + erreur HTTP + panne réseau).
- Correctifs post-review appliqués (lock allocation locale, guard anti double-submit, validation payload).

### File List

- `_bmad-output/implementation-artifacts/1-2-creer-une-salle-et-obtenir-un-code.md`
- `api/app/main.py`
- `api/tests/test_health.py`
- `web/src/App.tsx`
- `web/src/App.test.tsx`
- `web/src/lib/api.ts`
- `web/src/index.css`
- `README.md`

## Change Log

- 2026-05-07: Création de la story 1.2 et passage en `in-progress`.
- 2026-05-07: Implémentation complète de la story 1.2 (API création salle, UI, tests, documentation).
- 2026-05-07: Revue multi-couches effectuée et patchs appliqués, passage en `done`.
