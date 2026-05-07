# Story 1.9: Garde-fou design tokens et coherence DS

Status: done

## Story

As a **equipe produit**,
I want **auditer et corriger l'usage des tokens semantiques sur les ecrans Epic 1 deja livres**,
So that **l'interface reste coherente DS sans derive silencieuse**.

## Acceptance Criteria

1. **Given** les tokens DS documentes  
   **When** on audite les ecrans Epic 1 (creation/rejoindre, legal, a propos, banniere)  
   **Then** couleurs/surfaces utilisent des tokens (pas de valeurs magiques hors definition tokens).
2. **Given** des derives detectees  
   **When** on les corrige  
   **Then** les corrections/justifications sont referencees.
3. **Given** les parcours critiques rejoindre/erreurs/focus  
   **When** audit clos  
   **Then** ecarts restants explicites ou corriges.

## Tasks / Subtasks

- [x] Auditer l'usage des couleurs/surfaces sur ecrans Epic 1.
  - [x] Verifier absence de valeurs brutes hors `:root`.
  - [x] Verifier alignement des etats warning/error/focus sur tokens.
- [x] Corriger les derives detectees.
  - [x] Ajouter tokens semantiques manquants (`destructive`, `focus-ring`, `warning-surface`, `turn-active` reserve).
  - [x] Remplacer usages derives (ex focus ring non distinct).
  - [x] Aligner garde-fou longueur code sur constante produit (`ROOM_CODE_LENGTH`).
- [x] Renforcer la verification des parcours critiques.
  - [x] Ajouter assertions de focus clavier sur input+bouton du flux rejoindre.
- [x] Documenter l'audit DS.
  - [x] Mettre a jour la section tokens du `README`.
  - [x] Noter explicitement l'audit 1.9 et son perimetre.

### Review Findings

- [x] [Review][Patch] Eviter derive de longueur code en dur (`maxLength`) [web/src/App.tsx:95]
- [x] [Review][Patch] Differencier visuellement focus ring et primary [web/src/index.css:8]
- [x] [Review][Patch] Ajouter couverture focus clavier sur parcours rejoindre [web/src/App.test.tsx:205]

## Dev Notes

- Story source: Epic 1 / Story 1.9 dans `epics.md`.
- Perimetre audite: `web/src/index.css`, `web/src/App.tsx`, messages UI legal/join/about/warning.
- Aucun ecart bloquant restant detecte apres patchs.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- 2026-05-07: Audit tokens DS sur ecrans Epic 1.
- 2026-05-07: Ajout/ajustement tokens semantiques et styles focus/error/warning.
- 2026-05-07: Renfort tests focus parcours critique.
- 2026-05-07: Revue one-shot (blind/edge/audit) puis patchs.

### Completion Notes List

- Tokens semantiques etat/error/focus harmonises et documentes.
- Plus de valeur dure pour `maxLength` code salle dans le flux rejoindre.
- Focus clavier verifie sur lien, input, bouton du parcours critique.
- Audit DS 1.9 reference dans `README`.

### File List

- `_bmad-output/implementation-artifacts/1-9-garde-fou-design-tokens-et-coherence-ds.md`
- `web/src/index.css`
- `web/src/App.tsx`
- `web/src/App.test.tsx`
- `README.md`

## Change Log

- 2026-05-07: Story 1.9 implementee en one-shot (audit DS, correctifs, review, patchs) et marquee `done`.
