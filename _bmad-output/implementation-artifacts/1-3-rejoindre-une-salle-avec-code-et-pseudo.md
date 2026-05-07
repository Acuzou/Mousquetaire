# Story 1.3: Rejoindre une salle avec code et pseudo

Status: done

## Story

As a **joueur**,
I want **rejoindre une salle en saisissant le code et mon pseudo**,
So that **j'entre dans la partie avec une identité affichable**.

## Acceptance Criteria

1. **Given** une salle existante et un code valide  
   **When** je soumets code + pseudo via **JoinForm**  
   **Then** je suis admis dans la salle avec mon **pseudo** visible dans le contexte session et une session technique conforme architecture (cookie HTTP-only ou équivalent, pas de compte produit FR24).
2. **Given** un code invalide ou une salle indisponible  
   **When** je tente de rejoindre  
   **Then** le système **refuse** avec **message explicite** sur la cause.
3. **Given** le formulaire de rejoindre  
   **When** je navigue au clavier  
   **Then** l'ordre de tabulation et le focus visible sont utilisables.

## Tasks / Subtasks

- [x] Ajouter l'API de jointure de salle.
  - [x] Créer endpoint `POST /rooms/join` (code + pseudo).
  - [x] Retourner les données de session joueur (`participant_id`, pseudo, room).
  - [x] Poser un cookie technique HTTP-only pour la session.
- [x] Implémenter le JoinForm frontend.
  - [x] Ajouter champs `code` et `pseudo` avec labels explicites.
  - [x] Soumettre la jointure et afficher le statut de connexion.
  - [x] Afficher un message d'erreur lisible en cas d'échec.
- [x] Ajouter la couverture tests.
  - [x] Backend: test succès join + test code invalide.
  - [x] Frontend: test succès join + test erreur explicite.
- [x] Mettre à jour la documentation API.
  - [x] Documenter la requête/réponse `POST /rooms/join`.
  - [x] Documenter le cookie technique de session.

### Review Findings

- [x] [Review][Patch] Ajouter vérification pseudo vide après trim [api/app/main.py:80]
- [x] [Review][Patch] Préciser focus visible clavier sur inputs/boutons [web/src/index.css:35]
- [x] [Review][Patch] Ajouter test de normalisation `room_code` en uppercase côté join [api/tests/test_health.py:54]
- [x] [Review][Patch] Activer flux cookie cross-origin (`credentials: include` + CORS credentials) [web/src/lib/api.ts:24]

## Dev Notes

- Story source: Epic 1 / Story 1.3 dans `epics.md`.
- Conventions respectées: API `snake_case`, message d'erreur lisible, session technique sans compte produit.
- Limite MVP connue: persistance en mémoire process locale (pas de stockage distribué à ce stade).

### References

- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/implementation-artifacts/1-2-creer-une-salle-et-obtenir-un-code.md`
- `README.md`

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- 2026-05-07: Implémentation API `POST /rooms/join` et cookie de session HTTP-only.
- 2026-05-07: Implémentation JoinForm frontend (code + pseudo + messages).
- 2026-05-07: Tests front/back exécutés avec succès.
- 2026-05-07: Revue one-shot (blind + edge + acceptance), patchs appliqués.

### Completion Notes List

- Jointure de salle implémentée avec validation code/pseudo et retour `participant_id`.
- Cookie de session technique HTTP-only posé sur jointure réussie.
- Compatibilité cross-origin dev activée pour persistance de cookie de session (`credentials include` + CORS credentials).
- UI accessible au clavier via labels, inputs, submit explicite.
- Erreurs utilisateur explicites pour salle invalide/indisponible.
- Contrat API documenté dans `README`.

### File List

- `_bmad-output/implementation-artifacts/1-3-rejoindre-une-salle-avec-code-et-pseudo.md`
- `api/app/main.py`
- `api/tests/test_health.py`
- `web/src/App.tsx`
- `web/src/App.test.tsx`
- `web/src/lib/api.ts`
- `web/src/index.css`
- `README.md`

## Change Log

- 2026-05-07: Création et implémentation complète de la story 1.3 en one-shot (dev + review + patchs), statut `done`.
