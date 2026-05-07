# Story 3.7 — Retour immédiat sur actions à risque

**Statut:** done  
**Epic:** 3  
**FR:** FR31 — **NFR:** NFR-P2 — **UX:** UX-DR7, UX-DR8  

## Objectif

Retour **immédiat et lisible** sur les actions à risque (révélation, validation d’indice, sélection, passage de tour, reprise de manche) : succès, refus ou état du jeu.

## Cartographie UX (documentée)

| Contexte | Canal principal | Canal secondaire |
|----------|----------------|------------------|
| Indice : saisie vide / locale | Inline `clue-error` | — |
| Indice : refus ou erreur serveur | Inline `clue-error` | Toast `action-risk` (lisibilité immédiate hors viewport) |
| Indice : succès | Toast de confirmation | Indice actif affiché |
| Révélation : succès | Toast + annonce existante | — |
| Révélation : refus / réseau | Toast | Inline `reveal-risk-feedback` (`role="alert"`) |
| Sélection carte : refus / réseau | Toast | Inline `selection-risk-feedback` |
| Passer le tour : refus / réseau | Toast | Inline `turn-risk-feedback` |
| Manche suivante (hôte) : refus | Toast | Inline `round-continue-feedback` |
| Action bloquée (fin de manche côté client) | Toast explicite | — |

Les erreurs HTTP sont normalisées via `ApiRequestError` (`message` + `error_code` optionnel) depuis le détail FastAPI.

## Fichiers

- `web/src/lib/apiErrors.ts`
- `web/src/lib/api.ts`
- `web/src/lib/apiErrors.test.ts`
- `web/src/App.tsx`, `web/src/App.test.tsx`, `web/src/index.css`
- `README.md`, `sprint-status.yaml`

## Revue (synthèse)

- **Edge:** doubles annonces SR — toasts `aria-live="assertive"` courte ; zones inline en `role="alert"` seulement pour erreurs persistées à l’action ; éviter doublon clue si message identique (toast = même texte que inline : acceptable pour FR31 « immédiat »).
- **Acceptance:** FR31 couvert par toast + états UI ; UX-DR7/8 par tableau ci-dessus.

## Change log

- 2026-05-07 : Story implémentée.
