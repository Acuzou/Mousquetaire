# Story 1.6: Francais UI, absence de compte obligatoire et persistance V1

Status: done

## Story

As a **joueur**,
I want **une interface en francais, sans creation de compte obligatoire, avec une explication claire de ce qui est (ou n'est pas) sauvegarde**,
So that **je ne m'attends pas a une sauvegarde serveur de partie entre sessions**.

## Acceptance Criteria

1. **Given** tout parcours nominal  
   **When** j'utilise les ecrans principaux  
   **Then** les chaines produit sont en francais.
2. **Given** la politique de persistance V1  
   **When** je consulte l'information dediee  
   **Then** il est indique que les donnees de partie sont volatiles entre sessions, avec mention des exceptions locales non critiques.
3. **Given** un utilisateur  
   **When** il cree ou rejoint une salle  
   **Then** aucune creation de compte email/mot de passe n'est obligatoire.

## Tasks / Subtasks

- [x] Exposer l'information persistance V1 dans l'UI.
  - [x] Ajouter un lien footer vers une section dediee.
  - [x] Afficher le message de volatilite entre sessions.
  - [x] Afficher la mention d'exception locale non critique.
- [x] Exposer explicitement l'absence de compte obligatoire.
  - [x] Ajouter un texte clair "aucun compte requis" sur l'ecran principal.
- [x] Maintenir le parcours principal en francais.
  - [x] Verifier les libelles create/join/error et legal.
- [x] Ajouter/adapter les tests frontend.
  - [x] Verifier lien/section Persistance V1.
  - [x] Verifier texte "aucun compte requis".
  - [x] Verifier volatilite + exception locale.

### Review Findings

- [x] [Review][Patch] Eviter etat contradictoire succes+erreur lors validation join locale [web/src/App.tsx:39]
- [x] [Review][Patch] Rendre test version resilient aux environnements build [web/src/App.test.tsx:135]
- [x] [Review][Patch] Verrouiller en test la mention d'exception locale de persistance [web/src/App.test.tsx:142]

## Dev Notes

- Story source: Epic 1 / Story 1.6 dans `epics.md`.
- Implementation concentree sur l'ecran principal actuel (MVP), sans nouvelle route.
- Le flux create/join reste sans compte utilisateur obligatoire.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- 2026-05-07: Ajout section `Persistance V1` + lien footer dans `web/src/App.tsx`.
- 2026-05-07: Mises a jour tests dans `web/src/App.test.tsx`.
- 2026-05-07: Revue one-shot (blind/edge/audit) puis patchs appliques.
- 2026-05-07: Validation `lint`, `typecheck`, `test:run` OK.

### Completion Notes List

- L'UI expose clairement qu'aucun compte n'est requis pour creer/rejoindre une salle.
- La persistance V1 est explicitee: pas de sauvegarde de partie entre sessions.
- La mention d'exception locale non critique est presente et testee.
- Les chaines principales reste en francais sur le parcours nominal.

### File List

- `_bmad-output/implementation-artifacts/1-6-francais-ui-absence-de-compte-obligatoire-et-persistance-v1.md`
- `web/src/App.tsx`
- `web/src/App.test.tsx`

## Change Log

- 2026-05-07: Story 1.6 implementee en one-shot (dev, review, patchs) et marquee `done`.
