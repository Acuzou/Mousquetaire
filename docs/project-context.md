---
project_name: Mousquetaire
source_sessions:
  - _bmad-output/brainstorming/brainstorming-session-2026-05-02-125300.md
date: 2026-05-02
enrichment_date: 2026-05-02
deadline_build: 2026-05-10
sections_completed:
  - vision
  - personas
  - v1_scope
  - platform
  - stack_preferences
  - game_rules
  - ai
  - content_decks
  - ux_principles
  - hosting_decision
  - moderation_age
document_output_language: French
---

# Contexte projet — Mousquetaire

_Fichier pour agents IA et BMad (PRD, architecture). Synthèse brainstorming + **affinage explicite** (2026-05-02)._

---

## 1. Vision en une phrase

**Mousquetaire** est un jeu en ligne par équipes (inspiré du type Codenames, **sans revendiquer la marque**), **web**, centré sur le **mot**, la **pensée** et la **soirée entre humains**, avec **IA transparente et optionnelle** — le cœur du jeu **ne dépend pas** de l’IA.

**Humour** et **plaisir** sont **centraux** (copy, pop-ups, paramètres) : ton **drôle**, **règles** respectées mais **tirées** pour maximiser le fun. Projet **non commercial** ; promesse de **version** honnête + **V2**.

---

## 2. Calendrier critique

- **Date cible de fin de jeu (build jouable) : au plus tard le 10 mai 2026** (~8 jours à partir du point d’affinage).
- **Priorité absolue** : **ship** stable pour cette fenêtre ; tout le reste est **négociable** ou **reportable** si conflit avec la date.

---

## 3. Personas (résumé)

| Persona | Ce qui compte |
|--------|----------------|
| **Alex** | Stabilité ; transparence ; revue post-partie ; aide IA optionnelle |
| **Éléna** | Confiance ; jeu humain d’abord ; lance pour le groupe |
| **Thomas** | Perf IA/UX ; fun de tester |

_Note : décision produit **pas de filtre** sur les mots (voir §12) peut entrer en tension avec certains personas « confiance » — assumer côté **18+** et **cadre entre amis**._

---

## 4. Périmètre V1 (aligné deadline)

**Inclus dans la V1 (intention forte)**

- **Web** multijoueur temps réel ; **code room + pseudo** ; pas de comptes persistants ; pas de sauvegarde de parties (comme brainstorm).
- **Mode solo pédagogique** : **oui, inclus dans la V1**.
- **Méga-deck** + saisie collaborative de mots ; pas d’import fichier deck en V1.
- **IA** : vision complète (thèmes, copilote, analyse) — **ordonnancement** à arbitrer sous contrainte **10 mai**.
- **Français uniquement** (UI + contenu produit V1) ; pas d’i18n obligatoire ; prévoir **clés** ou structure extensible **nice-to-have**, pas bloquant.

**Internationalisation**

- **V1 : français uniquement.**

**Traçabilité / conformité lourde**

- **Pas prioritaire** ; un peu de **traçabilité** (versionning, liens projet **Sapiens**) acceptable ; **pas** de cadre conformité poussé — **vitesse et jeu qui marche** d’abord.

---

## 5. Plateforme & stack (préférences déclarées)

| Zone | Choix / préférence |
|------|---------------------|
| **Backend** | **Python** (priorité). |
| **Orchestration agents / flux IA** | **LangGraph** si nécessaire. |
| **Frontend** | **JavaScript** (ou stack JS moderne) — ouvert. |
| **« Stack applicative »** | **Django** évoqué ; **ouverture** à une alternative **mieux adaptée** au **temps réel + jeu** (ex. FastAPI + front SPA, ou Django Channels — à trancher au PRD/architecture). |
| **Base de données** | **Firebase (managed)** — préférence explicite pour ne pas gérer les **backups** (voir §6). |
| **Temps réel** | **WebSocket** vs **SSE** : **pas d’avis fort** — choisir ce qui est **optimal** pour le jeu (souvent WebSocket pour état synchrone). |
| **Région hébergeur** | **Pas de contrainte** UE / hors UE. |

**Code** : **100 % dédié Mousquetaire** (pas de réutilisation multi-projets imposée).

---

## 6. Hébergement & exploitation (décisions — 2026-05-02)

**Orientation : services managés, minimum d’opérations**

| Critère | Décision |
|--------|-----------|
| **Ops / temps** | **Le moins d’opérations possible** — contrainte date **10 mai** ; pas de self-host « artisan » si ça augmente la charge. |
| **Budget mensuel** | Pas de plafond rigide « dans le vide », mais viser un ordre **décent** ; **en dessous de ~100 €/mois** pour l’ensemble ; ok pour **services managés**. Possibilité de **couper** les services si le jeu n’est plus utilisé. |
| **Données & backups** | **Firebase managed** (ou équivalent managé) pour **ne pas** gérer les sauvegardes soi-même. |
| **Charge attendue** | **Peu de rooms**, plusieurs rooms possibles mais **faible volumétrie** ; **< 20 joueurs** par room — **OK** pour une petite enveloppe infra. |
| **Localisation données / cloud** | **Aucune contrainte** imposée par le porteur (pas de règle employeur / résidence pour ce side-project). |

**Synthèse pour l’architecture / PRD** : privilégier **PaaS / BaaS** (ex. hébergement appli + **Firebase** pour persistance) plutôt que **VPS à maintenir** ; valider le **coût** cumulé (hébergeur app + Firebase + API LLM) sous le plafond souple **~100 €/mois** tant que le projet est ouvert.

---

## 7. Règles de jeu (core + variantes Mousquetaire)

**Défaut (classique)**

- Grille **5×5** style Codenames, **deux équipes**, **un** mot noir (assassin), tours d’**indices** comme le jeu de plateau de référence.

**Variantes à prendre en charge (configuration avant partie)**

- **Taille de grille** : **paramétrable** (pas seulement 5×5).
- **Équipes** : **plus de deux** — **3 ou 4 équipes** (ou plus), **couleurs** distinctes.
- **Mots noirs** : possibilité de **plusieurs** mots noirs (**ex. 3–4**) pour **augmenter la difficulté**.

**Règles « Reverse »** (brainstorm) : gages, undo contre gage, alcool **opt-in**, thèmes tirés + vote — **inchangé** sauf ajustement au PRD.

---

## 8. Intelligence artificielle

- **Transparence** toujours (pages dédiées).
- **Trois familles** : génération / thèmes ; copilote direct ; analyse post-partie.
- **Budget** : **pas de plafond dur** à petite échelle ; priorité à la **frugalité** : **petits modèles**, faible consommation.
- **Modèle de référence** : **Mistral Small** (petit, rapide, peu gourmand) — versions précises au PRD (API self-host vs cloud).
- **Confidentialité des prompts** : envoi des **mots joueurs** vers LLM **pas une contrainte** pour le porteur ; **documenter** quand même risques **store / légal** au PRD si diffusion publique.

---

## 9. Contenu & decks

- Méga-deck interne + **saisie collaborative** avant partie (pas import fichier V1).
- Tirage thématique + aléa + seuil de confiance (détail PRD).

---

## 10. UX, ton, marque & URL

- **Public** : produit pensé **18+** (mode par défaut).
- **Alcool** : texte type **« avec modération »** possible pour la **blague** ; ton **léger & drôle** dans **toute** l’app (toasts, réglages, erreurs).
- **URL / marque** : viser un domaine du type **`mousquetaire-en-4`** / expression **« mousquetaire en quatre »** ; si pris, **suffixes** ou variantes pour **unicité**. Pas de préférence forte sur les sous-domaines.

---

## 11. Chat & social

- Chat **souhaité**, **négociable** sous deadline (inchangé).

---

## 12. Modération & contenu joueur (décision explicite)

- **Aucun filtre automatique** sur les mots saisis : **tout est autorisé** côté produit, **humour noir** inclus.
- **Implication** : distribution **store** / politiques plateformes et **responsabilité légale** à **analyser au PRD** (même si la priorité est le ship rapide). **18+** affirmé.

---

## 13. Risques (mis à jour)

- **Délai 10 mai** vs scope (IA triple, solo, variantes grille/équipes/mots noirs, reverse) → **découpage P0 impératif**.
- **UGC non filtré** + **humour extrême** : risque **rejet store** ou **signalement** — à traiter comme **risque** dans le PRD, pas comme exigence de filtre si la décision produit reste « zéro filtre ».

---

## 14. Sources

- Brainstorming : `_bmad-output/brainstorming/brainstorming-session-2026-05-02-125300.md`
- Affinage contexte : réponses porteur 2026-05-02 (chat Cursor).
