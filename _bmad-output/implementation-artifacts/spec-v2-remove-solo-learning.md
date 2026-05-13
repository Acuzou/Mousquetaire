---
title: 'V2 — Retrait complet du mode apprentissage solo'
type: 'feature'
created: '2026-05-13'
status: 'done'
baseline_commit: 'b4dab54f6c2bb62e40621ffae88125b360019184'
context:
  - docs/project-context.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le parcours « apprentissage solo » n’apporte plus de valeur produit pour la V2 ; il alourdit la coque applicative (onglet, état, tests, styles) sans être nécessaire au multijoueur.

**Approach:** Retirer entièrement l’UI, l’état et le code associés au solo pédagogique dans le client web, en conservant le comportement multijoueur inchangé. Aucune refonte documentaire PRD/epics dans cette livraison (décision produit locale sur le dépôt).

## Boundaries & Constraints

**Always:** Ne pas modifier la logique temps réel / salles / jeu multijoueur au-delà du strict nécessaire pour retirer les points d’entrée solo. Conserver accessibilité et cohérence visuelle du shell restant (une zone principale sans onglet solo).

**Ask First:** Toute demande ultérieure de réintroduire un tutoriel ou un mode hors salle (nouvelle story).

**Never:** Ne pas supprimer ou renommer des endpoints API ou des contrats multijoueur sous prétexte du solo. Ne pas réécrire le PRD, les epics BMAD ou `project-context.md` dans cette tâche (hors mentions UI évidentes dans README ou copy in-app si bloquant pour les tests).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Ouverture app | Utilisateur sur la page d’accueil / shell | Aucun onglet ni mode « Apprentissage solo » ; pas de composant solo monté | N/A |
| Textes légaux / notes de version | Scroll ou sections existantes | Plus de formulation impliquant un mode solo actif côté produit si les tests l’exigent ; formulations neutres « multijoueur » acceptables | N/A |
| Suite de tests | `npm test` dans `web/` | Tous les tests verts ; tests dédiés solo supprimés avec le module | Corriger assertions résiduelles |

</frozen-after-approval>

## Code Map

- `web/src/App.tsx` — import `SoloLearning`, type `AppShell`, onglet solo, rendu conditionnel solo.
- `web/src/features/solo/SoloLearning.tsx` — implémentation à supprimer.
- `web/src/features/solo/SoloLearning.test.tsx` — tests du module à supprimer.
- `web/src/App.test.tsx` — attentes texte et scénario « solo-mode-tab » / `solo-learning`.
- `web/src/index.css` — blocs de styles `.solo-*` et `.word-grid-solo-nine` devenus morts.
- `README.md` — mentions éventuelles du solo MVP (aligner si les tests ou la doc de build y font référence).

## Tasks & Acceptance

**Execution:**

- [x] `web/src/App.tsx` — Retirer l’import, le type/état `solo`, l’onglet « Apprentissage solo » et le rendu `SoloLearning` ; simplifier le shell pour ne présenter que le flux multijoueur (sans branche solo).
- [x] `web/src/features/solo/SoloLearning.tsx` — Supprimer le fichier (et le dossier `solo/` s’il est vide).
- [x] `web/src/features/solo/SoloLearning.test.tsx` — Supprimer le fichier.
- [x] `web/src/App.test.tsx` — Mettre à jour les chaînes et scénarios pour refléter l’absence de mode solo.
- [x] `web/src/index.css` — Supprimer les règles CSS réservées au solo devenues inutilisées.
- [x] `README.md` — Ajuster les mentions du solo si elles cassent la cohérence ou des scripts de doc (minimal).

**Acceptance Criteria:**

- Given l’application web compilée, when l’utilisateur parcourt le shell principal, then aucun contrôle ne propose le mode apprentissage solo et aucun `data-testid` solo n’est requis pour le parcours nominal.
- Given la suite de tests front, when on exécute les tests du package `web`, then tous passent sans référence au module solo supprimé.
- Given le dépôt, when on recherche `SoloLearning` ou `solo-mode-tab` dans `web/src`, then aucune occurrence fonctionnelle ne subsiste (sauf faux positifs documentaires hors périmètre explicitement laissés).

## Spec Change Log

## Design Notes

Le multijoueur reste le seul mode ; pas de route dédiée `/solo` aujourd’hui : la suppression est un repli d’UI et de bundle sans migration de données (clé `sessionStorage` solo abandonnée côté client).

## Verification

**Commands:**

- `cd web && npm test` — expected: tous les tests verts, zéro référence aux tests supprimés sans erreur de collecte.
- `cd web && npm run build` — expected: build TypeScript + Vite sans erreur.

**Manual checks (if no CLI):**

- Ouvrir l’app en local : confirmer absence d’onglet solo et absence d’erreur console au chargement.

## Suggested Review Order

**Shell applicatif**

- Flux multijoueur seul : fragment racine sans onglets ni `SoloLearning`.
  [`App.tsx:1121`](../../web/src/App.tsx#L1121)

**Copy légale et « À propos »**

- Transparence IA : formulation alignée multijoueur sans mention du solo.
  [`App.tsx:1666`](../../web/src/App.tsx#L1666)

- Notes de version MVP sans solo.
  [`App.tsx:1695`](../../web/src/App.tsx#L1695)

**Tests**

- Assertions pied de page / à propos cohérentes avec le nouveau texte.
  [`App.test.tsx:491`](../../web/src/App.test.tsx#L491)

**Styles**

- Suppression des blocs solo et du switch de mode ; grille multijoueur inchangée.
  [`index.css:425`](../../web/src/index.css#L425)

**Documentation dépôt**

- Section README remplacée par l’état V2 (FR17–18 retirés côté client).
  [`README.md:296`](../../README.md#L296)
