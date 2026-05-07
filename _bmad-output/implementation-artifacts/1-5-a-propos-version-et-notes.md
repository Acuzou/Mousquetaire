# Story 1.5: A propos - version et notes

Status: done

## Story

As a **joueur**,
I want **consulter la version du produit et les notes associees**,
So that **je sais quel build j'utilise (support, debug leger)**.

## Acceptance Criteria

1. **Given** l'ecran A propos (ou equivalent)  
   **When** je l'ouvre  
   **Then** la version affichee correspond a une source unique (build/package).
2. **Given** l'ecran A propos  
   **When** je le consulte  
   **Then** des notes succinctes sont visibles sans promesse hors scope.

## Tasks / Subtasks

- [x] Ajouter l'acces a la section A propos.
  - [x] Ajouter lien `A propos` dans le footer legal.
  - [x] Ajouter ancre/section cible A propos.
- [x] Afficher la version depuis une source unique.
  - [x] Injecter la version via config build (`vite.config.ts` -> `__APP_VERSION__`).
  - [x] Afficher la version dans l'UI A propos.
- [x] Ajouter des notes de version courtes.
  - [x] Afficher une phrase de notes MVP, sans promesse hors scope.
- [x] Couvrir par les tests frontend.
  - [x] Verifier lien et contenu A propos.
  - [x] Verifier affichage de la version build.

### Review Findings

- [x] [Review][Patch] Supprimer fallback env ambigu et lier version a `web/package.json` [web/vite.config.ts:5]
- [x] [Review][Patch] Ajouter assertion test sur la valeur de version affichee [web/src/App.test.tsx:134]

## Dev Notes

- Story source: Epic 1 / Story 1.5 dans `epics.md`.
- "A propos" est implemente comme section ancree dans l'ecran principal (equivalent valide pour MVP).
- Source unique de version: `web/package.json` lu au build Vite.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- 2026-05-07: Ajout lien et section A propos dans `web/src/App.tsx`.
- 2026-05-07: Injection `__APP_VERSION__` depuis `web/package.json` dans `web/vite.config.ts`.
- 2026-05-07: Tests frontend executes (lint/typecheck/test).
- 2026-05-07: Revue one-shot (blind/edge/audit) puis patchs.

### Completion Notes List

- La section A propos affiche la version du build (`__APP_VERSION__`) et des notes succinctes.
- La version est injectee depuis une source unique (`web/package.json`) via Vite.
- Les tests couvrent la presence du lien A propos et l'affichage de la version.

### File List

- `_bmad-output/implementation-artifacts/1-5-a-propos-version-et-notes.md`
- `web/src/App.tsx`
- `web/src/App.test.tsx`
- `web/vite.config.ts`
- `web/src/globals.d.ts`

## Change Log

- 2026-05-07: Story 1.5 implementee en one-shot (dev, review, patchs) et marquee `done`.
