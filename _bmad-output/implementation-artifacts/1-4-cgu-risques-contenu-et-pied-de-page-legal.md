# Story 1.4: CGU, risques contenu et pied de page legal

Status: done

## Story

As a **visiteur ou joueur**,
I want **lire les CGU et les informations sur les risques lies au contenu utilisateur (18+, absence de filtre)**,
So that **je comprends les limites du produit avant de jouer**.

## Acceptance Criteria

1. **Given** l'application  
   **When** j'ouvre la page CGU depuis le LegalFooter  
   **Then** le texte est accessible en francais et les risques sont clairement enonces.
2. **Given** le pied de page  
   **When** je parcours au clavier  
   **Then** les liens sont focusables et annonces de facon coherente.

## Tasks / Subtasks

- [x] Ajouter un pied de page legal dans l'ecran principal.
  - [x] Ajouter lien vers section CGU.
  - [x] Ajouter lien vers section risques contenu.
- [x] Ajouter le contenu legal en francais.
  - [x] Ajouter section CGU.
  - [x] Ajouter section risques contenu (18+, absence de filtre).
- [x] Assurer l'accessibilite clavier.
  - [x] Garder les liens en elements semantiques `<a>`.
  - [x] Rendre l'etat focus visible sur liens, boutons et champs.
- [x] Couvrir par les tests frontend.
  - [x] Tester presence des liens legaux et cibles.
  - [x] Tester presence des textes CGU/risques.
  - [x] Tester focus clavier sur un lien legal.

### Review Findings

- [x] [Review][Patch] Ajouter focus visible pour les liens legaux [web/src/index.css:81]
- [x] [Review][Patch] Normaliser code/pseudo au submit de jointure pour robustesse UX [web/src/App.tsx:37]
- [x] [Review][Patch] Ajouter assertion de focus clavier dans le test legal [web/src/App.test.tsx:124]

## Dev Notes

- Story derivee de `epics.md` (Epic 1 / Story 1.4).
- Le legal footer est implemente sur l'ecran d'entree actuel (pas de route dediee a ce stade).
- Le contenu reste volontairement court et clair pour V1.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- 2026-05-07: Ajout footer legal + sections CGU/risques dans `web/src/App.tsx`.
- 2026-05-07: Ajout styles legal/footer/focus dans `web/src/index.css`.
- 2026-05-07: Ajout test legal/focus dans `web/src/App.test.tsx`.
- 2026-05-07: Revue one-shot (blind/edge/auditor) et patchs appliques.

### Completion Notes List

- Footer legal ajoute avec liens `CGU` et `Risques contenu`.
- Sections francaises explicites sur les CGU et les risques UGC (18+, sans filtre).
- Accessibilite clavier renforcee via `:focus-visible` pour liens.
- Test de focus clavier ajoute pour limiter les regressions a11y.

### File List

- `_bmad-output/implementation-artifacts/1-4-cgu-risques-contenu-et-pied-de-page-legal.md`
- `web/src/App.tsx`
- `web/src/index.css`
- `web/src/App.test.tsx`

## Change Log

- 2026-05-07: Story 1.4 implementee en one-shot (dev, review, patchs) et marquee `done`.
