# Story 5.1 — Parcours d'apprentissage sans multijoueur obligatoire (FR17)

Statut: **done** (2026-05-08)

## Livrables

- **Navigation:** bascule Multijoueur / Apprentissage solo dans `App.tsx` (`multi-mode-tab`, `solo-mode-tab`).
- **Parcours:** composant `web/src/features/solo/SoloLearning.tsx` — etapes pedagogiques sans creation/rejoindre salle ; atelier grille 3x3 avec selection, bouton **Reveler la selection**, toast et hints alignes sur le multijoueur (memes classes CSS `word-grid` / `word-card`).
- **Styles:** `word-grid-solo-nine`, transition legere sur `.word-card`, encart `solo-workshop`.
- **Tests:** `SoloLearning.test.tsx`.
- **Doc:** README section Story 5.1.

## Suite

Story **5.2** livre l’etat de fin FR18 et la reprise via `sessionStorage` — voir `5-2-fin-du-parcours-pedagogique-nominal.md`.
