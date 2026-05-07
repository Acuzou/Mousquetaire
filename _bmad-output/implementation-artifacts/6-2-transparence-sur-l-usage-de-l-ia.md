# Story 6.2 — Transparence sur l’usage de l’IA

**Statut:** fait  
**Date:** 2026-05-07  

## Critères d’acceptation

| AC | Réalisation |
|----|-------------|
| Page / section transparence IA consultable depuis le jeu ou le footer | Section `#transparence-ia`, lien **Transparence IA** dans le footer + **En savoir plus** dans le panneau Assist IA (`aria-label` dédié). |
| Contenu : périmètre, limitations, traitement (V1, FR20, UX-DR13) | Quatre blocs : Perimetre, Traitement, Limitations, note sur les retours diagnostic. |
| Indicateur discret quand un retour « suggestion » / canal IA | Pastille **Assist IA** + note `role="note"` au-dessus du message serveur après statut/ping (`data-testid="ai-assist-origin-note"`). Pas de suggestion dans la grille en V1 — indicateur limité au canal assist documenté. |

## Fichiers touchés

- `web/src/App.tsx` — section transparence, footer, lien contextuel, indicateur d’origine.
- `web/src/index.css` — `.inline-legal-link`, `.ai-origin-indicator`, `.ai-origin-chip`, `flex-wrap` footer.
- `web/src/App.test.tsx` — assertions lien footer et heading transparence.
- `README.md` — section Story 6.2.

## Epic 6

Après 6.1 + 6.2 : epic **IA optionnelle & transparence gameplay** couvert pour le périmètre MVP décrit dans les epics.
