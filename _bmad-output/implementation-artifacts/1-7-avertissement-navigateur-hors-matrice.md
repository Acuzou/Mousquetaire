# Story 1.7: Avertissement navigateur hors matrice

Status: done

## Story

As a **utilisateur**,
I want **etre informe lorsque mon environnement ne correspond pas a la matrice navigateurs V1**,
So that **je comprends les risques de comportement avant de jouer**.

## Acceptance Criteria

1. **Given** un navigateur hors matrice  
   **When** je charge l'application  
   **Then** une banniere non bloquante m'informe et renvoie vers la doc.
2. **Given** la banniere hors matrice  
   **When** je choisis de continuer  
   **Then** le flux "Essayer quand meme" reste possible sans blocage.

## Tasks / Subtasks

- [x] Ajouter la detection hors matrice navigateur.
  - [x] Introduire une logique de detection UA (Chrome/Firefox/Edge/Safari V1).
  - [x] Rendre l'initialisation robuste hors contexte navigateur strict.
- [x] Ajouter un avertissement non bloquant dans l'UI.
  - [x] Afficher une banniere informative en francais.
  - [x] Ajouter un lien vers la documentation matrice V1.
  - [x] Ajouter CTA "Essayer quand meme" pour fermer la banniere.
- [x] Ajouter la couverture test.
  - [x] Simuler un UA hors matrice.
  - [x] Verifier affichage banniere + lien + fermeture.

### Review Findings

- [x] [Review][Patch] Affiner detection Safari pour eviter faux negatifs derives Chromium [web/src/lib/browserMatrix.ts:1]
- [x] [Review][Patch] Eviter acces direct a `window` pour robustesse hors navigateur [web/src/App.tsx:16]

## Dev Notes

- Story source: Epic 1 / Story 1.7 dans `epics.md`.
- Avertissement implemente sous forme de banniere non bloquante dans l'ecran principal.
- Le flux create/join reste disponible meme en environnement hors matrice.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- 2026-05-07: Ajout detection navigateur dans `web/src/lib/browserMatrix.ts`.
- 2026-05-07: Ajout banniere hors matrice + CTA "Essayer quand meme" dans `web/src/App.tsx`.
- 2026-05-07: Ajout test hors matrice dans `web/src/App.test.tsx`.
- 2026-05-07: Revue one-shot (blind/edge/audit) et patchs appliques.

### Completion Notes List

- Banniere hors matrice affichee en francais avec lien doc et continuation possible.
- Warning non bloquant: l'utilisateur peut fermer et continuer le flux normal.
- Detection UA V1 ajustee pour limiter les faux positifs/faux negatifs.
- Validation complete `lint`, `typecheck`, `test:run` sur frontend.

### File List

- `_bmad-output/implementation-artifacts/1-7-avertissement-navigateur-hors-matrice.md`
- `web/src/App.tsx`
- `web/src/App.test.tsx`
- `web/src/index.css`
- `web/src/lib/browserMatrix.ts`

## Change Log

- 2026-05-07: Story 1.7 implementee en one-shot (dev, review, patchs) et marquee `done`.
