# Story 3.2: Donner un indice (ClueComposer)

Status: done

## Story

As a **joueur autorise**,
I want **saisir et valider un indice conforme au tour**,
So that **les devineurs peuvent repondre dans les regles**.

## Acceptance Criteria

1. **Given** c'est mon tour donneur d'indice  
   **When** je saisis un indice et valide  
   **Then** le serveur valide longueur/caracteres et rejette sinon avec detail explicite.
2. **Given** ClueComposer  
   **When** j'utilise clavier et lecteur d'ecran  
   **Then** labels, `aria-describedby`, limite annoncee et erreurs accessibles sont presents.

## Tasks / Subtasks

- [x] Ajouter endpoint serveur de validation indice.
  - [x] `POST /rooms/{room_code}/clue`
  - [x] validations: longueur min/max, caracteres autorises
  - [x] autorisation: joueur actif + role clue_giver
- [x] Ajouter gestion d'etat indice.
  - [x] `current_clue` dans etat room
  - [x] reset de clue sur changement de tour
  - [x] diffusion websocket `clue_submitted`
- [x] Integrer ClueComposer cote UI.
  - [x] input indice + bouton valider
  - [x] support a11y (`label`, `aria-describedby`, `aria-invalid`, `role=alert`)
  - [x] annonce limite dynamique (compteur restant en `aria-live`)
- [x] Couvrir tests front/back et documenter contrat.

### Review Findings

- [x] [Review][Patch] UI ignorait `clue_submitted` WS: prise en compte du type evenement [web/src/App.tsx]
- [x] [Review][Patch] re-soumission d'indice possible sur meme tour: blocage `clue_already_submitted` [api/app/main.py]
- [x] [Review][Patch] robustesse erreur client `submitClue`: support detail array 422 [web/src/lib/api.ts]
- [x] [Review][Patch] accessibilite ClueComposer: `aria-invalid` + `aria-describedby` conditionnel + compteur `aria-live` [web/src/App.tsx]

## Dev Notes

- La regle V1 appliquee: un seul indice valide par tour.
- L'autorite serveur reste source de verite pour tour/role et conformite indice.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- 2026-05-07: ajout endpoint indice avec validations FR9.
- 2026-05-07: ajout ClueComposer accessible cote web.
- 2026-05-07: revue one-shot et patchs critiques appliques.

### Completion Notes List

- Validation d'indice autoritative cote serveur operationnelle.
- ClueComposer accessible et utilisable clavier/lecteur ecran.
- Synchronisation WS de l'indice actif via `clue_submitted`.
- Tests complets front/back verts.

### File List

- `_bmad-output/implementation-artifacts/3-2-donner-un-indice-cluecomposer.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `api/app/main.py`
- `api/tests/test_health.py`
- `web/src/lib/api.ts`
- `web/src/App.tsx`
- `web/src/App.test.tsx`
- `web/src/index.css`
- `README.md`

## Change Log

- 2026-05-07: Story 3.2 implementee en one-shot et marquee `done`.
