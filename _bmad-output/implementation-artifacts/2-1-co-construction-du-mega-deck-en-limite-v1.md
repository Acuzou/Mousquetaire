# Story 2.1: Co-construction du mega-deck en limite V1

Status: done

## Story

As a **joueur autour de la table**,
I want **contribuer a la constitution collective du mega-deck dans les limites V1**,
So that **la grille finale reflete nos decks avant le premier indice**.

## Acceptance Criteria

1. **Given** une salle en pre-partie  
   **When** les joueurs ajoutent des contributions  
   **Then** l'etat du mega-deck est visible pour la table et persiste serveur pour la session.
2. **Given** les limites V1 (doublons, taille max)  
   **When** une contribution depasse la limite  
   **Then** un refus explicite guide la correction.
3. **Given** la charge UX  
   **When** le bundle est analyse  
   **Then** un lazy-load du panel est optionnel si documente.

## Tasks / Subtasks

- [x] Ajouter les endpoints API mega-deck.
  - [x] `GET /rooms/{room_code}/mega-deck` pour recuperer l'etat courant.
  - [x] `POST /rooms/{room_code}/mega-deck` pour ajouter un mot.
  - [x] Persister le mega-deck au niveau session room.
- [x] Appliquer les limites V1 cote serveur.
  - [x] Refuser les doublons (`word_duplicate`).
  - [x] Refuser quand la limite est atteinte (`mega_deck_limit_reached`).
  - [x] Retourner des messages explicites pour correction utilisateur.
- [x] Integrer le panel mega-deck cote frontend.
  - [x] Ajout d'un panel collaboratif avec input + liste des mots.
  - [x] Chargement de l'etat mega-deck apres creation/jointure de salle.
  - [x] Affichage des erreurs explicites (doublon/limite).
- [x] Ajouter et mettre a jour les tests.
  - [x] Tests backend: ajout succes, doublon, limite, lecture etat.
  - [x] Tests frontend: ajout succes, erreur limite, affichage progression.
- [x] Documenter le contrat mega-deck dans le README.

### Review Findings

- [x] [Review][Patch] Charger l'etat mega-deck via endpoint de lecture pour visibilite multi-client [web/src/App.tsx:75]
- [x] [Review][Patch] Corriger la validation payload `max_words` (eviter check falsy) [web/src/lib/api.ts:126]
- [x] [Review][Patch] Ajouter test API de lecture mega-deck [api/tests/test_health.py:160]

## Dev Notes

- Story source: Epic 2 / Story 2.1 dans `epics.md`.
- Limites V1 implémentées: 25 mots max par room, mots uniques (insensible a la casse).
- Lazy-load du panel non implemente a ce stade, option documentee (non bloquante AC).

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- 2026-05-07: Ajout endpoints mega-deck API (`GET`/`POST`) dans `api/app/main.py`.
- 2026-05-07: Ajout tests backend mega-deck dans `api/tests/test_health.py`.
- 2026-05-07: Integration panel mega-deck dans `web/src/App.tsx` + styles.
- 2026-05-07: Ajout/MAJ clients API mega-deck dans `web/src/lib/api.ts`.
- 2026-05-07: Ajout tests frontend mega-deck dans `web/src/App.test.tsx`.
- 2026-05-07: Revue one-shot (blind/edge/audit) puis patchs appliques.

### Completion Notes List

- Le mega-deck est persiste en session serveur et lisible via endpoint dedie.
- Les contributions depassant les limites V1 sont refusees explicitement.
- Le panel frontend affiche l'etat du mega-deck et relaie les erreurs de contribution.
- Les tests front/back couvrent les cas nominaux et limites principales.

### File List

- `_bmad-output/implementation-artifacts/2-1-co-construction-du-mega-deck-en-limite-v1.md`
- `api/app/main.py`
- `api/tests/test_health.py`
- `web/src/App.tsx`
- `web/src/index.css`
- `web/src/lib/api.ts`
- `web/src/App.test.tsx`
- `README.md`

## Change Log

- 2026-05-07: Story 2.1 implementee en one-shot (dev, review, patchs) et marquee `done`.
