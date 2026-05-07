---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
inputDocuments:
  - docs/project-context.md
  - _bmad-output/brainstorming/brainstorming-session-2026-05-02-125300.md
workflowType: prd
documentCounts:
  productBriefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 1
classification:
  projectType: web_app
  domain: general
  complexity: medium
  projectContext: greenfield
  tags:
    - real-time-multiplayer
    - game-like
    - party-game
  domainNote: 'Divertissement social / jeu de mots en ligne (type Codenames, sans marque).'
  deliveryRisk: high
  riskNotes: 'Fenêtre ~8 j ; UGC 18+ non modéré — risque réputationnel / légal / stores ; CGU et responsabilité utilisateur à cadrer au PRD.'
  partyModeRefinement: true
releaseMode: phased
---

# Product Requirements Document - Mousquetaire

**Auteur :** Acuzou  
**Date :** 2 mai 2026  

*Livrable V1 : application **web** (navigateur), **sans** publication **App Store / Play** requise.*

## Executive Summary

**Mousquetaire** est une application web de jeu de mots en équipes (même *feel* qu’un Codenames-like, sans utiliser la marque), en français, pensée 18+ et entre proches : le cœur de l’expérience, c’est la soirée et le texte des joueurs — pensée, bluff, rire — pas l’outil. Le produit vise un build jouable au plus tard le **10 mai 2026** (fenêtre courte, risque de livraison élevé), en privilégiant le ship et un périmètre P0 explicite. Aucun compte persistant en V1 : code de salle + pseudo ; l’identité longue est volontairement absente (dette produit assumée pour aller vite). L’IA (thèmes, copilote, analyse) est optionnelle, transparente pour les joueurs et frugale (p. ex. Mistral Small) : le chemin heureux du jeu ne dépend pas de l’IA. Contenu joueur : pas de filtre côté produit — le cadre est adulte et amical ; les implications légales, stores et réputation restent des risques à cadrer dans le PRD, pas un retour arrière implicite sur la promesse *no filter*.

**Problème adressé** : reproduire à distance ou autour d’une table l’intensité d’une party autour des mots, sans que la technique prenne la place du spectacle social — avec des règles qu’on peut « tirer » (grille, équipes, mots noirs, gages, reverse) sans tomber dans un manuel mental. **Utilisateurs cibles** : groupes d’amis ou de connaissances prêts à un ton décalé ; mode solo pédagogique en V1 pour apprendre et tester seul.

**État de succès** : une salle qui démarre vite, un reveal lisible et synchrone (la latence est un risque *fun*), des tours où la phrase d’un humain reste le payoff — l’IA n’est jamais la vedette de la table.

### What Makes This Special

- **« Confidence room »** : le fun vient de la prise de risque sociale sur les mots des autres et les siens, pas d’un scoreboard de performance seul.
- **Double couche d’humour** : humour système (copy, toasts, paramètres, gages) *vs* humour des joueurs (chat, etc.) — investir et arbitrer séparément sous contrainte de temps.
- **Règles Mousquetaire** : grille paramétrable, plusieurs équipes, plusieurs mots noirs, variantes type reverse / gages — piment sans remplacer le cœur *indices + mots*.
- **IA en cadran** : utilité claire quand activée, hors chemin critique du multijoueur pour tenir la deadline ; transparence sur l’endroit où l’IA intervient.
- **Honnêteté de version** : objectif non commercial d’une V1 honorable et de pistes V2 ; la vision exige des refus explicites si le 10 mai est en danger (scope binaire : prouve la promesse / plus tard).

## Project Classification

| Dimension | Valeur |
|-----------|--------|
| **Type** | **Application web** multijoueur **temps réel** |
| **Domaine** | **Général** — divertissement **social** / **jeu de mots** en ligne |
| **Complexité** | **Moyenne** (produit) avec **risque de livraison** **élevé** (fenêtre **~8 j**) |
| **Contexte** | **Greenfield** |
| **Tags** | `real-time-multiplayer`, `game-like`, `party-game` |
| **Risque livraison** | **Élevé** — cible **10 mai 2026** ; **UGC 18+** **non modéré** : enjeux **réputation** / **légal** / **stores** ; **CGU** et **responsabilité** **utilisateur** à **poser** **clairement** au PRD. |

## Success Criteria

### User Success

- **Démarrage** : **créer** une salle, **obtenir un code**, et faire **rejoindre** au moins un autre joueur avec un **pseudo** — objectif de **friction basse** : **ordre de grandeur** visé (à affiner en test) : **≤ 3 minutes** entre « lancer la création » et **« prêt à jouer »** (premier tour possible), **sans** parcours d’onboarding long ; tolérance **mobile / réseau variable** à documenter si dérive constatée en playtest.
- **Parcours nominal multijoueur (E2E)** — séquence de référence pour le **« ship »** : **création salle** → **paramètres minimaux** (ou défauts) → **rejoindre** par code → **constitution des équipes** (ou défaut) → **tour d’indice** → **sélections** → **révélation** → **fin de manche** (ou état **équivalent** clairement nommé) avec **payoff** collectif **lisible** (carte / score / message de fin de round). Toute **config** **hors** de ce parcours en V1 doit être **listée explicitement** comme **in** ou **out** (éviter l’ambiguïté « tout est dans le MVP »).
- **Cœur expérientiel** : le **payoff** reste les **mots / tours de parole des humains** ; l’**IA** n’est **pas** requise pour **achever** une partie ; si l’**IA** est offerte, elle est **dégradable** (désactivée / indisponible) **sans** bloquer le **chemin nominal**.
- **Cadre 18+ / UGC** : alignement explicite **pas de filtre** sur le contenu saisi — le **sentiment de confiance** s’appuie sur le **cadre entre amis** + **honnêteté produit**, pas sur une promesse de **modération** implicite.
- **Solo pédagogique (V1)** : parcours **nominal** défini (ex. **règles** + **au moins une manche** ou **simulation** **complétable** **sans** blocage) ; critère **« complétable »** = l’utilisateur atteint un **état de fin** **prévu** (victoire / fin de démo / retour menu) **sans** erreur **bloquante**.

**Définition produit unique — livraison et IA (une seule règle)** : le **build du 10 mai** est **réussi** si le jeu est **jouable en multijoueur** **sans** appeler d’**LLM** sur le **chemin heureux** ; toute **fonction** **IA** est **additionnelle** et **ne conditionne** pas l’**acceptation** de la V1.

**Porte qualité *playfeel* (playtest interne / amical, V1)** — **au moins une** des deux : (1) **Sondage bref** post-manche : *« Si tu avais 10 minutes de plus, tu relancerais une manche ? »* — cible indicative : **≥ 50 %** *oui* sur un petit panel (**≥ 4** personnes) **ou** (2) **≥ 2 / 4** joueurs **décrivent un moment marquant** **sans** prompt marketing (*« ce qui m’a accroché… »*). Échec = signal **« correct mais plat »** à traiter **avant** de confondre **ship** et **succès ressenti**.

**Priorité si arbitrage dur (recommandation documentaire — à confirmer par le porteur)** : en cas de **pression deadline**, prioriser la **chaîne multijoueur E2E** ; le **solo pédago** peut être **réduit** à un **minimum** (ex. tutoriel court + **une** manche simulée) **sans** sacrifier la **cohérence** des **règles** affichées.

### Business Success

- **Date** : **build déployé et jouable** **au plus tard le 10 mai 2026** (critère **binaire**).
- **Honnêteté de version** : **limites** de la V1 **visibles** (écran « À propos », notes de version, ou équivalent) ; **V2** mentionnée comme **piste**, **sans** engagement **daté**.
- **Non commercial (V1)** : succès = **crédibilité** pour une **soirée réelle** + **documentation** des **risques** **UGC / légal** (cf. **Executive Summary**), **pas** une métrique de revenu.

### Technical Success

- **Temps réel** : **synchronisation** suffisante pour un **état de salle partagé** sur les **actions du tour** (indice, sélections, révélations) ; **pas** d’objectif « collaboration temps réel » **type** éditeur partagé.
- **Test d’acceptation « deux clients »** : **deux navigateurs** (ou machines) sur la **même salle** — enchaîner **indice → sélection(s) → révélation** ; **les deux côtés** affichent un **état cohérent** ; **optionnel** : **coupure réseau** simulée → **récupération** sans **corruption** **bloquante** du **tour** (sinon **message d’erreur** **récupérable**).
- **Exploitation** : stack **majoritairement managée** ; enveloppe **ordre de grandeur** **< ~100 €/mois** tant que le projet est ouvert.
- **IA** : **hors chemin critique** — **pannes** ou **latence** **LLM** **ne bloquent** pas la **partie** ; **frugalité** (**Mistral Small** ou équivalent) si **features** IA **livrées**.
- **Coupe en cas de dérive calendaire** : **ordre** recommandé — **(1)** fonctions **IA** et **intégrations** **non nécessaires** au **tour synchrone** ; **(2)** tout **hors boucle** **state + sync** **MVP** ; **conserver** **code + pseudo**, **modèle d’état** **minimal**, **synchro** **vérifiable**.

### Measurable Outcomes

| Domaine | Indicateur (V1) |
|--------|------------------|
| **Date** | Build jouable **≤ 10 mai 2026** |
| **E2E multijoueur** | Au moins **une session** suivant le **parcours nominal** **de bout en bout** |
| **Complétion de round** | **Majorité** des sessions de test **atteignent** une **fin de manche** **nominale** — cible indicative **≥ 70 %** des sessions **non abandonnées volontairement** (à affiner après premiers playtests) |
| **Solo** | Parcours **pédago** **complétable** selon **définition** **ci-dessus** |
| **Playfeel** | **Porte** **playtest** (voir **User Success**) **passée** ou **plan d’action** **documenté** si échec |

### MVP — périmètre « cœur figé » (discipline deadline)

- **Multijoueur web** **temps réel** ; **code de salle + pseudo** ; **pas** de comptes persistants ni **sauvegarde** de parties **(V1)**.
- **Français uniquement** (UI + contenu produit).
- **Une configuration de variante « Mousquetaire »** **figée** pour le **ship** (ex. grille / équipes / mots noirs — **liste exacte** **P0** dans les **exigences** **fonctionnelles**) ; **autres variantes** **hors** **P0** sauf **explicitement** **rebasculées** après **preuve** du **cœur**.
- **Méga-deck** + **saisie collaborative** — **périmètre** **borné** (ex. **nombre** de mots min/max, **temps** max de préparation) pour **éviter** l’**explosion** de cas **edge** **sous** **8 j**.
- **Mode solo pédagogique** **inclus** ; **arbitrable** en **version** **réduite** si **conflit** avec **E2E** **multi**.
- **IA** : conformément à la **règle unique** **ci-dessus** ; **ordonnancement** **features** **IA** **après** **preuve** du **socle** **sans** **LLM**.
- **Cadre légal / CGU / risques** : **documentés** **dans** le **PRD** **et** **renvoi** **utilisateur** **clair** **(V1)**.

## Product Scope

### MVP - Minimum Viable Product

- Contenu **aligné** sur la section **« MVP — périmètre cœur figé »** **ci-dessus** + **Success Criteria** **globaux**.

### Growth Features (Post-MVP)

- **Chat** in-game **si** **absent** ou **réduit** en V1.
- **i18n**, **import** de **decks** **fichier**, **historique** de **parties**, **comptes** / **identité** **persistants**, **variantes** **supplémentaires**, **IA** **enrichie** (thèmes, **analyse** post-partie **étendue**).

### Vision (Future)

- **V2+** : **élargissement** **fonctionnel** **et** **possible** **révision** **posture** **modération** / **public** — **hors** **promesse** **V1** **sauf** **décision** **produit** **explicite**.
- **Identité** **URL** **/ marque** **type** **mousquetaire-en-4** ; **ambition** **qualitative** **sans** **objectif** **commercial** **imposé** **en** **V1**.

## User Journeys

Personas de référence : **Alex**, **Éléna**, **Thomas** (`docs/project-context.md`). Parcours affinés après Party Mode (fusion stress / stabilité, retard, solo pédagogique dédié).

### Éléna — Personne ne reste sur le banc avant le coup d’envoi

Éléna crée une salle, obtient un code, et veut que chacun comprenne qui fait quoi avant le lancer : rôles, ordre, pas d’exclusion implicite pendant la co-construction du méga-deck. Co-saisie des mots, défauts P0 pour ne pas noyer la table ; toasts et ton rassurants sans tutoriel interminable. Objectif émotionnel : inclusion pré-match (« personne ne se sent exclu » pendant la config).

Au premier indice → sélections → révélation, tout le monde voit le même état au même moment ; le climax social est une phrase humaine, pas l’interface. Manche terminée avec payoff lisible ; matière pour la porte playfeel (sondage post-manche, moment marquant).

*Exigences :* timing et clarté des rôles avant le démarrage ; aligné avec Success Criteria (E2E, fin de manche, playfeel).

---

### Thomas et Alex — Sous pression : latence, onglets, coupure

Fusion des besoins test / perf (Thomas) et stabilité / confiance (Alex) : un seul arc — « le jeu nous lâche-t-il au pire moment ? »

Deux navigateurs ou machines dans la même salle (critère d’acceptation deux clients). Alex veut voir la version et comprendre le cadre 18+ ; Thomas enchaîne les actions vite. Indice → sélection(s) → révélation ; indicateur de tour clair (qui doit agir, qui attend). Coupure Wi‑Fi ou onglet en arrière-plan : à la reconnexion, l’utilisateur voit où en est le tour, s’il est en lecture seule ou peut agir ; pas de clic dans le vide.

État cohérent des deux côtés après stress, ou message d’erreur récupérable sans corruption bloquante du tour pour les autres. Résolution : « on peut s’y fier pour samedi » (Thomas) et « je sais sur quoi je clique » (Alex — À propos, IA, CGU).

*Exigences :* Technical Success (synchronisation, test deux clients, récupération) ; pages de transparence lisibles sur mobile.

---

### Invité — Code erroné et reprise

Mauvais code : message court explicite (code invalide), pas d’écran muet. Bon code mais décalage : reprise réseau en cours de partie — état du tour visible ; l’invité ne désynchronise pas la table. Aucune action fantôme ; le tour reste jouable pour les autres. Rentrée dans le fil social sans gêner inutilement (aligné avec les critères de reprise edge des Success Criteria).

---

### Retard — Rejoindre une partie déjà lancée

Arrivée après le début : code valide, partie en cours. Lecture seule, spectateur ou attribution d’équipe selon règles V1 : l’interface indique ce qui est possible (rejoindre au prochain round, observer, équipe imposée — à trancher en P0 sans promesse implicite). Compréhension immédiate « je suis dans la même partie que mes potes ». Réintégration sociale sans humiliation produit (pas bloqué sans explication).

*Exigences :* états d’interface pré / post coup d’envoi ; micro-copy d’inclusion (recommandation UX / Party Mode).

---

### Solo pédagogique — Apprendre sans la pression de la table

Parcours seul pour comprendre les règles et s’entraîner sans spectateurs. Parcours gradué : objectifs par étape, explications post-coup, timers non agressifs ; mini-scénarios ciblés avant de rejoindre le multijoueur. Simulation ou manche complétable jusqu’à un état de fin nominal (victoire, fin démo, menu). Sentiment « je peux rentrer dans une vraie room sans passer pour le bleu » — distinct du multijoueur sans adversaires.

*Exigences :* priorité arbitrable par rapport à l’E2E multi (Success Criteria) ; parcours nominal solo documenté en exigences fonctionnelles.

---

### Transparence, confiance et données

Avant ou après partie : comment l’IA est utilisée, quelle version, cadre UGC / 18+. Pages courtes en français, sans dark patterns ; liens CGU accessibles. Pacte clair : pas de modération implicite des mots des joueurs ; risques assumés (Executive Summary / Success Criteria). Business Success « risques documentés » tenu.

**Données (V1 minimal)** : documenter dans le PRD quelles données sont nécessaires au fonctionnement (pseudo, état de salle, messages éventuels) ; durée de rétention typique ou session sans persistance de compte ; pas d’exigence RGPD complète imposée par ce PRD si hors scope — éviter le vide total (recommandation PM / Party Mode).

### Anti-persona — hors optimisation V1

Non-cible : exigence d’automatisation totale, modération procédurale, ou finesse produit incompatible avec la deadline et le positionnement « party entre amis » — ne pas utiliser pour étendre le scope sous pression « edge case ».

---

### Journey Requirements Summary

| Zone | Capacités révélées |
|------|-------------------|
| Room / onboarding | Création de salle, code, rejoindre, pseudo ; erreurs explicites ; inclusion pré-match (rôles, timing). |
| Jeu synchrone | Indice → choix → révélation ; indicateur de tour ; deux clients + résilience réseau. |
| Retard / partie lancée | Spectateur ou rejoin mid-game ; états « qui peut quoi » documentés en P0. |
| Solo pédago | Progression graduée, feedback pédagogique, rythme sans pression sociale. |
| Edge / reprise | Code faux ; reconnexion sans corruption du tour ; cohérence sociale. |
| IA | Toggle ou changement de mode en session compréhensible ; dégradation gracieuse. |
| Confiance | À propos, version, CGU, transparence IA ; données minimales documentées. |
| Mesure | Références croisées aux critères mesurables (Success Criteria) par parcours à l’affinage fonctionnel. |

**Hors périmètre V1** : parcours consommateur d’API publique tant qu’aucune API externe n’est exposée.

## Web Application Specific Requirements

### Project-Type Overview

Mousquetaire est une **application web multijoueur** centrée sur une **salle de jeu** en quasi temps réel (indices, sélections, révélations). Le front est prévu en **JavaScript** (stack **SPA** ou équivalent orienté temps réel). Conformément au profil **`web_app`** dans `project-types.csv`, les sections **`native_features`** et **`cli_commands`** ne sont **pas** des exigences V1 (pas de CLI produit, pas d’exigence **PWA** / **notifications système** / **install** comme critère de livraison du **10 mai**).

### Technical Architecture Considerations

- **SPA vs MPA** : privilégier une **SPA** (ou un **shell SPA** pour la room) pour éviter les rechargements pleine page pendant une manche ; pages **statiques** ou **MPA** acceptables pour **CGU**, **transparence IA**, **landing** légère.
- **Temps réel** : alignement avec les **Success Criteria** — canal adapté au **jeu synchrone** (souvent **WebSocket** ou équivalent) ; pas d’objectif « collaboration temps réel » type éditeur partagé.
- **Backend** : **Python** (priorité projet) ; persistance **Firebase** / **BaaS** managé ; hébergement **PaaS**, faible charge ops.
- **Stratégie « une source de vérité » pour l’état de salle** : le livrable d’**architecture** doit trancher explicitement le **modèle dominant** (ex. **listeners Firestore** vs **connexion WebSocket** dédiée, ou **hybride** avec règles de priorité) pour éviter **deux** flux concurrents **sans** règle de fusion — le PRD **exige la décision documentée**, pas le détail d’implémentation ici.
- **Reconnexion** : les mécanismes client/serveur (identifiant de session, reprise après coupure) doivent rester **alignés** avec la persistance **Firebase** pour éviter divergences d’état (**cf.** parcours **Thomas & Alex**, **Invité**).

### Browser Matrix

| Navigateur / contexte | Cible V1 |
|----------------------|----------|
| Chrome / Edge (desktop et Android récents) | Support complet du parcours P0 |
| Firefox (récent) | Support recommandé — tests avant ship |
| Safari (desktop et iOS récents) | Support recommandé — attention WebSocket / stockage / politiques iOS |
| Navigateurs ancienne génération | Hors objectif — message « navigateur non supporté » acceptable |

**Mobile** : parcours **rejoindre par lien / code** utilisable sur **petit écran** ; la matrice **ne** vise **pas** une qualification QA **de tous les contextes salon** (cf. **Scope plateforme V1** ci-dessous).

### Responsive Design

- **Layout adaptatif** pour la **grille de jeu**, les **listes de mots**, le **chat** (si présent) et les **panneaux pré-partie** (méga-deck).
- **Breakpoints** ou comportements par **largeur** à préciser en conception (empilement des zones, chat vs grille) ; **nice-to-have documenté** : prise en compte du **clavier virtuel** (`visualViewport`), **safe areas** (encoches), passage **portrait / paysage** sans casser la grille de façon imprévisible.

### Mobile, tactile et orientation

- **Cibles tactiles** : **minimum 44×44 px** (ou équivalent zone cliquable conforme aux guides plateforme) ; **espacement minimal** entre deux actions concurrentes (cartes adjacentes, boutons proches) pour limiter les misclicks en partie.
- **Orientation** : comportement **explicite** en V1 — **les deux** orientations supportées avec réagencement **ou** **orientation recommandée** / message si une orientation dégrade l’expérience ; à trancher en design sans reporter au « feeling » dev seul.
- **Join par lien** : parcours depuis le clic jusqu’à la salle — états **code invalide**, **salle pleine** ou **session expirée** (si applicable), **navigateur non supporté**, avec **messages courts** et **récupération** claire (**cf.** User Journeys).

### Performance Targets

- **Ressenti** : reveals et changements d’état **sans blocage multi-secondes** sur parcours nominal (aligné journeys **Thomas & Alex**).
- **Indicateur vérifiable (cible de travail)** : **première vue cohérente de l’état de salle** (liste des joueurs / tour identifiable / grille visible selon l’écran) dans un ordre de grandeur **≤ 5 s** après entrée sur une **connexion mobile de référence** (ex. 4G « correcte ») — à **valider** et **ajuster** par **mesure réelle** avant le 10 mai ; ce n’est pas un SLA contractuel externe.
- **Compléments** : éviter le **jank** sur animations **pendant** les tours critiques ; comportement **onglet en arrière-plan** (throttling, pause animation non essentielle) documenté si impact sur le jeu.

### SEO Strategy

- **SEO non prioritaire** pour l’interface de room (souvent non indexable / accès par code).
- **Optionnel** : **landing** minimale (**title**, **meta description**, **lang=fr**).
- **Pas** d’exigence **SSR** pour le **jeu en room** en V1.

### Accessibility Level

- **Niveau proportionné** : structure sémantique de base, contraste lisible, **ordre de tabulation** logique sur les parcours critiques, **focus visible**.
- **Plancher V1 — parcours devant être utilisables au clavier** (liste indicative, à affiner) : **rejoindre une salle** (code + pseudo) ; **action principale de tour** du joueur actif (selon rôle) ; **messages d’erreur / état réseau** annoncés ou visibles sans piège de focus ; navigation **CGU** / **transparence** depuis le footer ou équivalent.
- **Réduction des mouvements** : respect raisonnable de **`prefers-reduced-motion`** pour animations non essentielles (confettis, transitions décoratives).
- **Pas** de certification **WCAG AAA** imposée sous la deadline ; **améliorations a11y** possibles en **V2** si public élargi.

### États d’erreur, chargement et réseau

- Préciser en conception les états **chargement initial**, **latence**, **déconnexion WebSocket**, **reconnexion** : indicateur de tour, file d’actions, message **lecture seule** si applicable — aligné **User Journeys** et **Technical Success** (pas de frustration silencieuse).

### Scope plateforme (V1)

- **V1 ≠ support universel** de tous les contextes « salon » : navigateurs **TV**, **implémentations exotiques**, **partage d’écran**, **périphériques** non standards → **hors P0** sauf **best effort** explicite ; message utilisateur du type **« utilisez un navigateur récent sur téléphone ou ordinateur »** acceptable pour borner le risque QA (**recommandation Party Mode — PM**).

### Implementation Considerations

- **Tests manuels** sur au moins **deux navigateurs** distincts avant ship (**Success Criteria**).
- **PWA / install / push** : hors P0 sauf décision explicite.
- **i18n** : V1 **français uniquement** ; clés de chaînes = **nice-to-have** pour V2.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**Approche** : MVP orienté **problème** et **expérience** — livrer une soirée **jouable en ligne** avec honnêteté produit (version, limites, risques UGC) **sans** que l’IA soit nécessaire au **chemin nominal** multijoueur. Le **solo pédagogique** réduit la barrière « je ne connais pas les règles » ; il reste **arbitrable** si la deadline contraint l’**E2E multijoueur**.

**Ressources** : projet **non commercial** / **side-project** — pas de taille d’équipe imposée dans ce PRD ; compétences type **full-stack web**, **temps réel**, contenu et **copy** en français.

### MVP Feature Set (Phase 1 — V1 cible 10 mai 2026)

**Parcours couverts** : hôte (Éléna), résilience réseau (Thomas & Alex), invité (erreurs / reprise), **retard / rejoin** d’une partie en cours (états P0 à trancher), **solo pédago** (réductible en cas de conflit avec l’E2E multi), transparence / confiance.

**Must-have (capacités)**

- **Salle** : création, **code de salle**, **pseudo**, rejoindre ; messages d’erreur explicites.
- **Jeu multijoueur** : boucle indice → sélection(s) → révélation jusqu’à fin de manche (ou état équivalent nommé) ; indicateur de tour / rôle actif.
- **Variante Mousquetaire** : **une configuration figée P0** (paramètres détaillés dans les FR / backlog).
- **Méga-deck collaboratif** avec périmètre borné (nombre de cartes, temps de préparation, etc.).
- **Temps réel** : état de partie partagé ; critère d’acceptation **« deux clients »** (Success Criteria).
- **Langue** : français uniquement (UI + contenu produit).
- **Comptes** : aucun compte persistant V1 ; pas de sauvegarde de partie V1 (aligné Product Scope).
- **Cadre légal / confiance** : CGU ; transparence sur l’usage de l’IA si fonctionnalités IA présentes ; risques UGC 18+ ; écran À propos / version.
- **IA** : hors chemin critique ; **acceptation V1** sans appel à un modèle de langage sur le parcours heureux multijoueur.

**Nice-to-have sur la même fenêtre si marge** : chat in-game ; fonctions IA complètes (thèmes, copilote, analyse) — ordonnancement après le socle.

### Distinction « démo » vs « soirée réelle »

Les tests ne se limitent pas au scénario **deux navigateurs** : prévoir des essais avec latence variable, reconnexion en cours de partie, changement de réseau, pour se rapprocher du job « on joue entre potes sans expliquer le bug » (Party Mode / PM).

### Décision produit explicite requise : départ ou déconnexion de l’hôte

**À trancher par le porteur** et à documenter en comportement minimal V1 : lorsque l’hôte quitte la room ou perd définitivement la connexion — transfert de rôle, fin de partie avec message clair, ou invitation à créer une nouvelle room. Objectif : ne pas laisser implicite un scope « soirée jouable » qui serait en réalité bloqué (Party Mode / PM).

### Ordonnancement technique recommandé (rappel)

Valider d’abord un **vertical slice** métier avec persistance / API (avec ou sans couche temps réel mince par-dessus) pour ne pas bloquer tout le livrable sur le seul canal live (Party Mode / architecte) — détail en architecture, aligné avec **Web Application Specific Requirements**.

### Exigence « salle de confiance » (ressenti)

Toute action à risque (révéler une carte, valider un indice, choix impactant la manche) doit produire un **retour immédiat lisible** (succès, erreur ou état du jeu) et, lorsque le design le permet, une **réversibilité** sans redémarrage de partie (Party Mode / game design).

### Post-MVP (Phase 2)

Chat renforcé (si réduit en V1), internationalisation, import de decks fichier, historique de parties, comptes / identité persistants, variantes supplémentaires, IA enrichie, accessibilité étendue, PWA / install optionnelle — aligné **Product Scope**.

### Phase 3 (expansion / vision)

V2+ : élargissement fonctionnel, possible révision de la posture modération / public, identité URL / marque durable — cf. **Product Scope — Vision**.

### Risk Mitigation Strategy

| Risque | Atténuation |
|--------|-------------|
| Technique | Source de vérité unique pour l’état de salle ; découpage vertical (persisté puis temps réel) ; couper IA et fonctions non synchrones si dérive calendaire ; matrice navigateurs bornée |
| Produit (« démo » vs soirée) | Playtests réalistes (réseau, reconnexion) ; porte playfeel (Success Criteria) |
| Hôte / room | Décision explicite documentée (voir ci-dessus) |
| Marché / réputation | Honnêteté de version ; CGU / risques UGC ; pas de promesse implicite de modération |
| Ressources / délai | Refus explicites si pression sur le 10 mai ; priorité E2E multi vs solo réduit si crise ; contextes « salon » exotiques hors P0 |

## Functional Requirements

*Les FR décrivent **quoi** le produit doit permettre, pas **comment** l’implémenter. Toute capacité livrée doit s’y rattacher ou faire l’objet d’un ajout explicite au contrat.*

### Salle et session

- **FR1** : Un **joueur** peut **créer une salle** et **obtenir un code** permettant à d’autres de rejoindre.
- **FR2** : Un **joueur** peut **rejoindre une salle** en saisissant un **code** et un **pseudo**.
- **FR3** : Un **joueur** peut **quitter** la salle ou la session selon les règles définies pour la **fin de partie** ou l’**abandon**.
- **FR4** : Le **système** peut **refuser** une entrée avec **message explicite** lorsque le **code est invalide** ou que la **salle n’est pas disponible** dans les cas prévus.

### Configuration et préparation de partie

- **FR5** : Les **joueurs** peuvent **contribuer collectivement** à la constitution du **jeu de cartes** (méga-deck) dans les **limites** du périmètre V1.
- **FR6** : Un **hôte** (ou rôle équivalent défini par les règles) peut **démarrer la partie** lorsque les **conditions minimales** sont remplies.
- **FR7** : Les **joueurs** peuvent **jouer selon une variante Mousquetaire** correspondant à la **configuration P0** livrée en V1.

### Déroulement multijoueur (boucle de jeu)

- **FR8** : Les **joueurs** peuvent **alterner les tours** selon les **règles** de la variante (dont désignation des donneurs d’indices et des devineurs selon le modèle retenu).
- **FR9** : Un **joueur** autorisé peut **donner un indice** conformément aux règles du tour.
- **FR10** : Les **joueurs** concernés peuvent **sélectionner des cartes** sur la grille en réponse à l’indice.
- **FR11** : Le **système** peut **révéler** les cartes sélectionnées et **mettre à jour** l’état visible pour **tous les participants**.
- **FR12** : Les **joueurs** peuvent **atteindre une fin de manche** (ou **état terminal** nommé) avec **résultat lisible** pour la table.
- **FR13** : Les **joueurs** peuvent **voir** à tout moment **qui doit agir** (indicateur de tour ou de rôle actif).

### Fin de partie et résultats

- **FR14** : Les **joueurs** peuvent **identifier** le **résultat** d’une manche ou de la partie selon les **règles** (scores, équipe gagnante, message de fin ou équivalent défini en conception).

### Cohérence sociale et reprise

- **FR15** : Un **joueur** qui **rejoint en cours de partie** peut être **informé** de son **statut** (spectateur, attente, équipe, etc.) selon ce qui est **tranché** en P0.
- **FR16** : Les **joueurs** peuvent **continuer à jouer** lorsqu’un participant **se reconnecte** après une interruption, **sans corrompre** l’état du tour pour les autres (**dans les limites V1**).

### Solo pédagogique

- **FR17** : Un **joueur seul** peut **parcourir** un mode d’**apprentissage** ou d’**entraînement** **sans** partie multijoueur obligatoire.
- **FR18** : Un **joueur seul** peut **terminer** le **parcours pédagogique nominal** jusqu’à un **état de fin prévu**.

### Intelligence artificielle (optionnelle)

- **FR19** : Un **joueur** ou l’**hôte** peut **activer** ou **désactiver** des **fonctions assistées par IA** lorsque celles-ci existent, **sans bloquer** le jeu nominal **sans** IA.
- **FR20** : Un **joueur** peut **consulter** des **informations** sur l’**usage de l’IA** (transparence).

### Confiance, cadre légal et contenu

- **FR21** : Un **visiteur** ou **joueur** peut **lire** les **CGU** et les **informations** sur les **risques** liés au **contenu utilisateur** (18+, absence de filtre produit).
- **FR22** : Un **joueur** peut **consulter** la **version** du produit et les **notes** associées (écran **À propos** ou équivalent).

### Langue et persistance (limites V1)

- **FR23** : Les **joueurs** peuvent utiliser l’**interface** et le **contenu produit** en **français uniquement** en V1.
- **FR24** : Les **joueurs** **ne créent pas** de **compte persistant obligatoire** pour jouer en V1.
- **FR25** : Le **système** applique la **politique de persistance V1** : **pas de sauvegarde serveur de partie** entre sessions ; **données de session** traitées comme **volatiles** sauf **décision contraire** **documentée** (ex. stockage local navigateur pour préférences non critiques).

### Environnement client

- **FR26** : L’**utilisateur** est **informé** lorsque son **environnement** (navigateur, contexte) **n’entre pas** dans la **matrice** **navigateurs** **V1** (aligné **Web Application Specific Requirements**).

### Contrôle d’accès léger à la salle (documenté)

- **FR27** : Le **produit** **documente et applique** les **limites** retenues pour les **codes de salle** et la **taille du groupe** (y compris l’absence de limite si tel est le choix explicite).

### Déconnexion ou départ de l’hôte (scindé)

- **FR28** : Le **système** peut **détecter** la **déconnexion** ou le **départ** de l’**hôte** et **appliquer** un **comportement d’état de partie** **documenté** (temporisation, fin de partie, gel, transfert de rôle — **selon décision produit** **à** **trancher**).
- **FR29** : Les **joueurs** **reçoivent** un **retour explicite** lorsque ce **comportement** **s’applique** (message, **options** disponibles, **impossibilité** de continuer **sans** **ambiguïté**).

### Observabilité et diagnostic (produit)

- **FR30** : Le **système** permet d’**associer** une **partie** à des **événements** ou **informations de diagnostic** **suffisantes** pour **identifier** les **incohérences** d’**état multijoueur** (tour, scores, déconnexions) **dans** des **conditions** de **support** **habituelles**, **sans** imposer une **technologie** **particulière**.

### Actions à risque et retour utilisateur (« salle de confiance »)

- **FR31** : Lorsqu’un **joueur** **effectue** une **action à risque** (ex. révélation de carte, validation d’indice), le **système** fournit un **retour immédiat lisible** (succès, refus ou état du jeu).
- **FR32** : Lorsque les **règles** et le **design** le **permettent**, un **joueur** peut **annuler** ou **corriger** une **action récente** **sans** **redémarrer** la partie (**réversibilité**).

### Thèmes transverses de validation (tests)

*Complément au contrat — stratégie de preuve (Party Mode / QA) :*

1. **Observabilité et oracles** : pour les FR à **risque** (temps réel, reconnexion, hôte, IA), définir **données de test**, **résultat attendu** ou **bornes acceptables**, et **traces** permettant de conclure **pass** / **fail**.
2. **Comportement sous adversité** : regrouper les scénarios **limites** (entrées invalides, pannes, charge légère) en **batterie** **distincte** du **seul** **happy path**.

## Non-Functional Requirements

### Performance

- **NFR-P1** : Les mises à jour d’état de partie visibles par tous les joueurs d’une même salle sont propagées dans un délai compatible avec une interaction synchrone « party ». Objectif de mesure interne (**non** SLA externe) : calibrer en playtest une **cible p95** entre action critique et reflet partagé de l’état sur un réseau de référence (ex. 4G correcte / fibre) ; ajuster avant le **10 mai**.
- **NFR-P2** : Les actions du tour actif (indice, sélection) produisent un retour perceptible sans attente injustifiée pour confirmer l’intention (hors latence réseau non maîtrisée par le produit).

### Security & données

- **NFR-S1** : Pas de modération automatisée du texte saisi par les joueurs (décision produit) ; les risques (UGC 18+, absence de filtre) sont documentés dans les CGU / pages associées — sans promesse implicite de filtrage.
- **NFR-S2** : Les secrets (clés API LLM, configuration d’infrastructure) ne sont pas exposés dans le bundle client livré au navigateur.
- **NFR-S3** : Les données nécessaires au fonctionnement sont traitées conformément aux engagements documentés ; pas d’exigence RGPD exhaustive imposée par ce PRD si hors scope — cf. User Journeys et Success Criteria.

### Scalabilité

- **NFR-SC1** : Le système supporte la volumétrie visée pour V1 (peu de salles simultanées, moins de 20 joueurs par room — project-context) ; en cas de limite atteinte, comportement dégradé explicite (message plutôt qu’échec opaque).

### Accessibility

- **NFR-A1** : Les parcours identifiés comme critiques (rejoindre une salle, action de tour, erreurs réseau, accès CGU / transparence) restent utilisables au clavier avec focus visible (niveau proportionné V1).
- **NFR-A2** : Ces parcours et leurs équivalents tactiles sur mobile respectent le plancher d’accessibilité décrit dans **Web Application Specific Requirements** (structure, contraste, ordre de focus, `prefers-reduced-motion` pour le non essentiel) ; tout écart est listé ou justifié avant mise en production.

### Integration

- **NFR-I1** : Les appels à des services externes (hébergement managé, API LLM éventuelle) se dégradent sans bloquer le jeu nominal sans LLM (aligné règle d’acceptation V1).
- **NFR-I2** : En cas d’indisponibilité d’un service externe non critique, l’utilisateur reçoit un message explicite ; objectif indicatif : retour visible dans l’ordre de quelques secondes après timeout ou échec configuré — à valider par test.

### Observabilité (exploitation)

- **NFR-O1** : Le déploiement produit des journaux et/ou métriques structurés minimaux permettant de corréler incidents et sessions de jeu (aligné **FR30**), sans imposer une stack d’observabilité particulière.
