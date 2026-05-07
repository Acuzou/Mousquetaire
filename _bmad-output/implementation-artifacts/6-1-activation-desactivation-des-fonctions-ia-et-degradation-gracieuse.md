# Story 6.1 — Activation / désactivation des fonctions IA et dégradation gracieuse

**Statut:** fait  
**Date:** 2026-05-07  

## Objectifs (rappel)

- Bascule IA persistée pour la **session** (`sessionStorage`), opt-in **désactivé** par défaut ; jeu sans IA inchangé.
- Si IA non configurée ou API injoignable : message clair, **pas de blocage** du jeu.
- **NFR-S2 :** aucune clé API dans le bundle client ; secret serveur uniquement (`MOUSQUETAIRE_AI_API_KEY`).

## Réalisations

| Zone | Détail |
|------|--------|
| API | `GET /ai/assist/status`, `POST /ai/assist/ping` dans `api/app/main.py` ; lecture env serveur ; réponses JSON sans fuite de secret. |
| Logs | `GET /ai/assist/status` exclu du journal `http_request` support (sonde fréquente). |
| Web | Préférences `web/src/lib/aiAssistPrefs.ts`, client `fetchAiAssistStatus` / `fetchAiAssistPing` dans `web/src/lib/api.ts`, UI dans `web/src/App.tsx` (**pas** de fetch au montage — uniquement sur clic). |
| Tests | `api/tests/test_ai_assist.py` (pytest). |
| Docs | `README.md`, `api/.env.example`, `web/.env.example`. |

## Notes pour la suite (Epic 6)

- Story **6.2** transparence usage IA pourra réutiliser les mêmes endpoints et enrichir les messages.
