---

## stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Mousquetaire — app mobile multijoueur (en ligne + présentiel), decks personnalisés et IA optionnelle (thèmes, copilote, adversaire, solo pédagogique)'
session_goals: 'Diverger sur design produit, IA/usage humain, modes de jeu, banques de mots et MVP ~2 semaines ; cerner nom, expérience potes et publication App Store « kiff » sans perfectionnisme commercial'
selected_approach: 'ai-recommended'
techniques_used: ['Question Storming', 'Role Playing', 'SCAMPER']
ideas_generated: 50
technique_execution_complete: true
session_active: false
workflow_completed: true
context_file: ''

# Brainstorming Session Results

**Facilitateur :** Acuzou
**Date :** 2 mai 2026

## Session Overview

**Topic :** Application **Mousquetaire** (nom du projet) — jeu d’équipes inspiré de Codenames, avec multijoueur **en ligne** dès le départ pour jouer à distance (France entière), tout en gardant un mode **présentiel** autour d’une table et une UX pensée aussi pour le « petit joueur ».

**Goals :**

- **Produit :** parties fluides en ligne et en présentiel ; grilles alimentées par un **tableur** déjà co-construit avec les copains, enrichi ; mélange **mots communs + références** ; **decks par thème** (jeu vidéo, film, livre, maths, etc.) avec possibilité que **l’IA propose** des thématiques **validées** par les joueurs ; **banques / groupes de banques** avec contribution utilisateur (création et proposition de mots).
- **IA (hors cœur obligatoire du jeu) :** jeu de base **sans dépendance IA** pour jouer ; IA **optionnelle** comme **adversaire**, **copilote**, et dans la **création de thèmes** ; mode **solo** pédagogique pour progresser sur la finesse des indices et la pensée « hors plateau ».
- **Langue & contenu :** français ; decks **prépa / private jokes** et decks **neutres ou mélangés**.
- **Positionnement :** inspiré de Codenames **sans revendiquer la marque** ; nom **Mousquetaire** ancré dans la story de l’indice « Mousquetaire en 4 » et la chute des évidents (canon, boulet…).
- **Succès :** le week-end réussit **par la présence des gens** ; l’app est un **plus**. Objectif dev : **une partie complète sans bug bloquant** ; idéalement **installable depuis l’App Store** (et équivalent) pour que tous puissent tester ; pas besoin de perfection — pas commercial, **pour le kiff**, avec envie de **rapprocher**, **ouvrir le débat sur l’IA** dans nos vies, et **s’amuser**.

### Context Guidance

*Aucun fichier de contexte externe ; tout le contexte vient de la conversation.*

### Session Setup

Paramètres validés avec Acuzou : contrainte temps courte avant un week-end à Limoges ; priorité à l’humain et au lien ; IA comme **réglage** (opt-in) sur création, assistance et solo — pas comme substitution au jeu d’équipe. Prochaine étape du workflow : **choix du mode de sélection des techniques** de brainstorming.

## Technique Selection

**Approche :** AI-Recommended Techniques  
**Contexte d’analyse :** Mousquetaire — multijoueur, decks, IA optionnelle, MVP court, dimension sociale et réflexive.

**Techniques recommandées :**

- **Question Storming :** cadrer le problème avant les solutions — questions ouvertes sur produit, joueurs, synchronicité, données, frontière du « jeu sans IA ».
- **Role Playing :** incarner les personas (distance, table, solo, petit joueur, IA copilote/adversaire) pour faire émerger besoins et tensions.
- **SCAMPER :** faire varier systématiquement le MVP pour prioriser ce qui tient en ~2 semaines.

**Rationale IA :** séquence fondations → empathie par rôles → mutation produit structurée ; alignée avec contrainte temps et objectif « une partie sans bug bloquant ».

## Question Storming — Volet 1 (clos pour cette étape) : en ligne / déploiement

**Convention session :** Acuzou considère comme **déjà posées** l’ensemble des questions listées ci‑dessous **et** la banque méta ci‑après (questions « pour mieux questionner »), conservées pour **Role Playing** puis **SCAMPER**.

**Intentions produit (pas encore des réponses) :** base **multijoueur en ligne** pour jouer depuis n’importe où ; **en plus**, une couche qui rend la partie **autour d’une table** plus intéressante qu’un simple « même jeu mais physiquement là » ; les **deux modes** possibles ; rejoindre via **code** ; variante **un téléphone au centre** / pilote.

**Questions soulevées par Acuzou :**

- Comment faire du **multiplayer en ligne** concrètement (architecture, stack) ?
- Y a-t-il un **coût** récurrent pour « être en ligne » (hébergement, realtime, quotas) ?
- **Android vs iOS** : déploiement (Play plus simple ?), friction **App Store / USA** — quelles **contraintes** réelles ?
- En **~2 semaines**, est-il **réaliste** de **publier** sur **App Store et Play** avec du multijoueur — ou faut-il un plan B (TestFlight, APK, PWA) ?

**Questions complémentaires (autres domaines) :**

- **Synchro & confiance :** que se passe-t-il si le **réseau** coupe en pleine partie ? Faut-il un **mode reprise** / filet de secours autour de la table ?
- **Même pièce, plusieurs téléphones :** faut-il un **hôte** de salle, un **code court**, du **Bluetooth/NFC** — ou uniquement le web sur le Wi‑Fi local ?
- **Données & comptes :** comptes **obligatoires** dès le MVP ou **anonyme + code** ? Impact sur le **store** (politique de compte, âge, contenu généré) ?
- **Coût caché :** plafond de **joueurs simultanés** / parties que tu assumes financièrement au début ?
- **Apple Review :** le jeu est-il vu comme **contenu utilisateur** (mots des joueurs) — y a-t-il besoin de **modération** ou de mentions dans l’app pour passer la review ?
- **« Expérience table plus intéressante » :** qu’est-ce qui, pour toi, la rend **non négociable** (son, regard des autres, timer visible par tous, un seul écran « plateau ») — encore en question ouverte ?

*Note de facilitation : on ne tranche pas encore ; SCAMPER et le MVP prioriseront.*

**Ajustement MVP (session ultérieure) :** recentrage **multijoueur en ligne** comme socle ; **simplicité** compte tenu du délai. **Pas de téléphone central** pour le MVP (l’idée « écran / assistant partagé » type vision maître du jeu est reportée ou abandonnée pour la V1 week-end).

### Banque méta — questions pour poser de meilleures questions (transfert phase suivante)

Conservée telle quelle pour **Role Playing** / **SCAMPER** ; considérée comme posée par Acuzou dans le cadre du Question Storming.

1. **Hypothèses cachées** — Qu’est-ce qui est tenu pour acquis (réseau, joueurs, stores) et ferait tout exploser si faux ? Quelle hypothèse est la plus chère à remettre en cause pour le week-end ?
2. **Périmètre / portes qui claquent** — Quelle feature peut être retirée sans trahir le cœur du jeu ? Qu’est-ce qui est réversible vs figé dès le jour 1 ?
3. **Échec et friction** — Où la partie « échoue » côté vécu (pas technique) ? Pire cas sans crash de l’app ?
4. **Personnes et promesse** — Promesse implicite du « téléchargez ça » ? Quelles questions poser au joueur le plus fragile du flux ?
5. **Dette et coût** — Qu’est-ce qui coûtera temps ou argent dans 3 mois si mal cadré ? Une question « clé » à poser à quelqu’un qui a déjà shipé du mobile multijoueur ?
6. **Qualité d’une question** — La question ouvre-t-elle des options / contraintes réelles, ou est-ce une recherche doc de 5 min (à mettre à part) ?

## Role Playing — persona « Éléna » (joueuse occasionnelle, sceptique IA)

**Voix :** pas développeuse ; jeux de société avec les copains de prépa ; télécharge pour **faire plaisir à Alex**, **1–2 parties** puis décision ; pas d’engagement si ça ne plaît pas.

**Besoins / barrières :**

- **Fiabilité :** pas de bug, téléphone OK **à l’ouverture**.
- **Confiance :** sécurité, **données perso** ; méfiance vis‑à‑vis de **l’IA** (usage pro léger mais sentiment que l’IA **dégrade la qualité de l’interaction humaine**).
- **Position jeu :** craint que l’IA **remplace** ce qu’elle aime dans Codenames — **équipe humaine**, **sans électronique** comme essence du jeu ; **sceptique** sur incorporer l’IA dans un jeu de société.

**Insight produit (itéré avec Alex) :** pas de **dissimulation** : expliquer franchement que certains **thèmes** peuvent être **générés par IA**, et que l’on peut **jouer contre l’IA** ou avec **IA copilote** — pas besoin d’un gros « bouton IA » partout, mais **transparence** sur ce qui l’est.

**Ce qui fait cliquer « lancer la partie » (Éléna) :** d’abord **faire plaisir au pote** et **rejoindre le groupe** ; pas fan d’IA mais **reconnaît le travail** ; **« pour le fun »** d’**essayer ensemble** — le levier est **social + reconnaissance d’effort + expérience de groupe**, pas l’attrait de la techno.

## Role Playing — persona « Alex » (hôte, dev, joueur)

**Ventrale / tonalité :** peu de « peur freeze », plutôt **curiosité** — comment ils vont réagir ; blessure possible si « c’est nul », mais **réussi** si ça crée **blagues, moqueries, discussions** ; joie du **partage** entre copains.

**Définition du succès (Alex) :** pas les compliments flatteurs, plutôt **« putain c’est intéressant, je ne pensais pas comme ça »** ; ouvrir la réflexion sur **l’essence du jeu du mot**, **la pensée**, **la place de l’IA** pour **améliorer la qualité de jeu** — pas seulement gagner une partie, mais **progresser pour les suivantes** (parallèle **joueur / développeur**).

**Transparence avant la partie :** expliquer **le projet**, la **vidéo YouTube**, le dev avec **Cursor**, **BMad**, le fait que **l’app intègre l’IA** — **ne rien cacher**, viser l’**honnêteté complète** avec le groupe.

**Scénario « on revient au carton » (10 min) :** Alex **rigole**, un peu vexé possible mais **accepte** ; idée de **deux groupes** (carton vs appli) ; **ne casse pas la soirée** — le fait d’**avoir essayé** 10 min compte déjà.

**Moquerie :** à la fois **désirée** et **redoutée** ; confort dans l’**autodérision** (ex. indice « militaire en 4 » / plateau pas adapté) — la moquerie **fait rire** et cimente le week-end.

**Ordre de ce qui compte dans le « succès débat » :** d’abord le **débat** (IA, sens, etc.), puis le **rapport au mot**, puis le **gameplay** (amélioration concrète).

**Priorité Limoges :** **livrer une app stable** > être **bon joueur** (l’entraînement vient **après**).

**YouTube :** **tout montrer**, **pas de montage** (ou minimal) ; la soirée n’est **pas** une projection de la chaîne — les potes regardent **s’ils veulent**, **plus tard** ; l’auteur pense notamment au **côté audio** de la vidéo.

**Si « l’IA casse le jeu » (type Éléna) :** réponse Alex : l’IA **transforme** plutôt qu’elle ne casse ; c’est **Mousquetaire**, pas la copie du plateau physique ; on garde **l’essence** (recherche, équipe, compétition) ; vise **l’amélioration** pour les prochaines parties **y compris au Codenames physique** — idée de **collaborativité** avec l’IA orientée **progression**, pas seulement correction ; lien avec le projet **Sapiens**.

**IA pendant la partie :** mode **« aide » optionnel** (« aide-moi » / dernier recours si galère), pas le flux par défaut.

**IA après la partie :** plutôt une **revue de partie** façon **chess.com** — coups brillants, erreurs, manqués, pistes de stratégie ; **bilan** pour **re-jouer mieux** ensuite.

**Ligne rouge :** **aucune pour l’instant** — ouvert à la critique dure, idées d’**amélioration**, **V2** l’année suivante ; pas de « petit prince » sur la vérité du feedback.

## Role Playing — persona « Thomas » (curieux IA, regard sociétal)

**Esquisse :** passionné par **l’IA**, conscient des **changements en cours** dans la société, le **travail**, le **sens** ; pour lui tester Mousquetaire c’est **à la fois drôle** et **excitant** — jusqu’où peut-on aller avec l’IA dans ce cadre ludique et social.

**Voix (itération) :** vient surtout pour le **fun** et pour **tester** la **capacité / performance** de l’outil IA — d’**autres** pourront lancer des **débats** plus hauts, mais **lui** est **centré techno** : *jusqu’où on va*, *trop d’IA ou inutile* — en restant **ludique** avant tout.

**Choix de manche :** privilégie d’abord la **manche avec option IA** (curiosité, **troll**, envie de tester) ; si ça ne plaît pas → retour **mode classique**.

**Waouh technique :** peu de **lag** ; **design** soigné, **animations**, **photos**, **références** qui font **rire** — le « waouh » = **app qui tient** + **bonheur dans la pièce**, pas gadget isolé.

**Bof :** IA **faible / résultats nuls** → déception *« outil pas drôle ni puissant »*.

**Avec Éléna (« on joue comme au plateau ») :** pas **forcer** ; banter **« viens on essaye une fois »**, propose **« une dernière avec IA puis je reviens carton avec toi »** — **conciliant**.

**Feedback spontané à Alex après partie :** *« C’est trop de la balle »* (+ rire).

**IA qui répond vite et bien :** **excitation**.

**Fin de soirée :** encore envie de **pousser les modes**, **tester les fonctionnalités**, parfois jusqu’à **hors du flux équipe** — curiosité **max**.

## SCAMPER — MVP Mousquetaire *(session en cours)*

*Appliquer SCAMPER au périmètre **livrer vite**, **multijoueur en ligne**, **stable**, **IA transparente et optionnelle**, **revue post-partie** comme axe fort.*

### S — Substitute (décisions)


| Au lieu de…                                 | On substitue par…                                                                                                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Comptes + mots de passe                     | **Code de room + pseudo jetable** — pas de création de compte ni gestion MDP ; créer un pseudo, entrer le code, rejoindre la partie.                                            |
| Apps natives iOS + Android (priorité égale) | **Jeu web** à **URL dédiée** — jouer dans le navigateur ; **serveur** en amont pour héberger le site (aligné **~2 semaines**).                                                  |
| Thèmes générés par IA dès le départ         | **V1 : thèmes importés** (ex. tableurs) ; **génération IA** annoncée dans le périmètre produit mais **après** la base import ; ensuite nouvelles façons de proposer des thèmes. |


**Important — pas substitution mais ordre de chantier :** tu gardes **à terme** : **analyse après partie**, **copilote en direct**, **génération IA** de thèmes ; ce n’est pas « l’un à la place de l’autre », c’est une **priorisation**.

**Ordre de priorité convenu :**

1. **Base de jeu sans IA** (multijoueur en ligne, rooms, pseudos, decks importés, expérience stable).
2. **Analyse après partie** (type bilan).
3. **Copilote en direct** (optionnel / dernier recours).
4. **Génération IA de thèmes** (après la base import bien rodée).

### C — Combine (décisions UX)

- **Fin de partie + analyse :** inspiration **chess.com** — **pop-up** au-dessus de la page (le **fond** reste la partie / le contexte), **résultat** d’abord ; puis bouton du type **« Voulez-vous une analyse IA ? »** — **combine** clôture de manche et **entrée** vers l’analyse **sans** quitter la navigation par overlay.
- **Accueil / room / deck :** pas deux entrées séparées « Créer une room » vs « Charger un deck » au même niveau au menu — **un flux principal** (**créer / rejoindre une room** selon formulation retenue) ; **le premier joueur qui crée la room** peut ensuite **changer de deck**, prendre un **deck existant**, **proposer de nouveaux mots** ou **créer un nouveau deck** (y compris « en live » sur un thème) **dans ce même parcours** — **combine** création de partie et gestion de deck.
- **Transparence + règles :** page **À propos** avec **règles du jeu** (re-expliciter même si « tout le monde connaît ») ; **à côté** (onglet ou page liée) **« Où intervient l’IA ? »**, **« Pourquoi l’IA ? »**, **« Comment l’utiliser ? »** — **combine** onboarding culturel et **transparence IA** en **lieu unique** (rubrique À propos / aide).

### A — Adapt (modèles d’emprunt)

- **Arrivée & tempo :** s’inspirer des **jeux .io** — interface **immédiate** : **code de room + pseudo** et c’est parti, sans friction inutile.
- **Analyse de partie (post manche) :** calquer l’esprit **chess.com** élargi — au clic sur **analyse** : **échelle** bons / mauvais « coups », pistes **comment s’améliorer**, **logs de tours**, possibilité de **rejouer mentalement** la partie / naviguer dans les tours, voire **« qu’est-ce qu’on aurait pu faire à la place ? »**
- **Decks « officiels » dans l’app :** format **CSV** (simple, versionnable).
- **Import utilisateur (vision plus large) :** privilégier **CSV** ; en plus possibilité **Google Sheets** ou **fichier Excel (.xlsx)** — flux du type **connexion drive / dépôt du fichier**. À la validation : si **pas assez de mots**, complément possible avec IA plus tard ; si **assez de mots**, **go partie**. — **Report post‑V1 :** pour **Limoges**, l’**import fichier** est **coupé** (voir **E — Eliminate**) ; remplacé par **saisie collaborative de mots** avant partie.

### M — Modify (décisions — ce qu’on assouplit / ce qu’on exige)

- **Visuel :** **illustration** et **typographie** importantes — viser un jeu **beau** et une **UX** équilibrée. **Animations** = **moins prioritaires** (OK sans pour MVP) ; **petit plus** en fin si possible (victoire/défaite, photos, etc.). **Identité** : **simple**, une base unique ; palette / couleurs affinées **après**.
- **Social in-app :** **chat** souhaité (ex. Paris / Grenoble) pour discuter **pendant** la partie distante. **Pas** de profil sauvegardé, **pas** de parties sauvegardées.
- **Multijoueur :** ne **pas** plafonner arbitrairement le **nombre de joueurs** côté intention produit — s’**adapter** ; hôte qui **place** équipes / rôles ; **rejoins** en cours par **code** ; **mode spectateur** (observer, **chat** possible, **pas** de décisions de jeu) avec retour possible **joueur** ; mention « **pompe à route** » (à clarifier en spec : file d’attente / ordre de tour ?).
- **Contenu / decks :** viser un **preload massif** (mots **type base** + **références**) + **randomisation** pour des parties **différentes** ; **deux logiques** proposées : (A) **full aléatoire** large = beaucoup de mots, moins relus, mélange ; (B) **decks par thème** = choix explicite des joueurs — **les deux** à l’agenda.
- **Post-partie :** **texte + résumé** + idéalement **replay visuel** (reconstitution des **tours** / **état des cartes** pour **revivre** la manche) ; garder l’esprit **progression / amélioration**.
- **Promesse :** viser une app **propre, quasi aboutie** pour la démo, **tout en** annoncer clairement que c’est **une version** et en invitant des **pistes pour V2** l’année suivante.

### P — Put to other uses

**Décision :** le **code** de **Mousquetaire** reste **dédié** au projet — **pas** de réutilisation volontaire dans d’**autres** produits ; les autres side-projects feront **autre code**. Le SCAMPER **P** (réemployer les briques ailleurs) est volontairement **minimal / hors périmètre** — **focus unique : l’application Mousquetaire**.

### E — Eliminate (V1 / Limoges)

- **Mode spectateur :** **hors V1** — priorité : **tout le monde joue** ; spectateur → **V2** ou plus tard.
- **Import de fichier** (CSV / Sheets / Drive / xlsx en tant que **flux d’import fichier**) : **éliminé pour la V1** pour réduire la surface technique.
- **À la place :** chaque **joueur** peut **saisir / proposer des mots** avant le début ; quand **tout le monde est prêt** → lancement de partie (pas d’import de deck « en entier » en V1).
- **Plafond joueurs :** **plafond technique** (ex. **20**) — peut être **affiché** en ligne ; marge pour monter **après** ; intérêt notamment **charge serveur** / **« petits joueurs »** (UX claire même avec limite).
- **Contenu V1 :** partir sur un **gros deck** **soigné**, **ancré** sur le jeu de base + **concaténation** des autres mots utiles ; **plusieurs thèmes** sélectionnables ; depuis le **méga-deck** préchargé, **tirer** des mots **liés au(x) thème(s)** choisi(s) avec **un peu d’aléa** pour varier les parties ; possible **seuil de confiance** / scoring de pertinence thématique selon le mot (à préciser en spec).

**Ajustement social :** **chat** — **négociable** pour la V1 ; si manque de temps, **on coupe** sans drama ; **nice-to-have** pour une version plus aboutie, pas le cœur du risque week-end.

**Ajustement IA (choix explicite « tout garder » au niveau intention) :** **ne pas éliminer** les trois axes — **génération de thème**, **copilote en direct**, **analyse post-partie** — intention d’aller **dans le fond** du dispositif IA (ordonnancement d’implémentation encore à arbitrer en chantier, mais **pas** une coupe fonctionnelle « philosophique » par Eliminate).

### R — Reverse (signature Mousquetaire — règles « inversées » retenues)

- **Mot tabou / « assassin » (grille) :** ne **pas** seulement « finir la partie en claquant la porte » — favoriser un **mini-jeu de rattrapage** : **action / vérité / gage** (ou équivalent) pour remettre de la **dynamique** de soirée, avec possibilité de **système de points** / pénalités **rattrapables** par les gages.
- **Côté « faire deviner » (équipe des indices) :** si l’équipe **se trompe** de façon lourde (ex. **révéler le mot noir / tabou** — équivalent *assassin*), proposer la possibilité d’un **gage** (action, vérité, **jeu d’alcool** en **option** pour les soirées) plutôt qu’un arrêt sec, pour **relancer** l’énergie autour de la table.
- **Côté devineurs (mauvaise carte / erreur) :** si **on se trompe**, option **« annuler un coup » / revenir une étape** **si** le groupe accepte de **payer** un **gage** (même logique : **sévérité** ajustable, **jeux d’alcool** en **opt-in**). **Alternative** : **accepter l’erreur** et **enchaîner** sans gage — le joueur / la table choisit.
- **Contexte soirée :** jeu souvent joué **le soir** — proposer le **mode sans alcool** (gage « classique ») **ou** **avec** possibilités liées à l’**alcool** **uniquement si** la table l’**active** (responsabilité, consentement, ton **adulte**). Objectif : **plus de dynamisme** et de **souplesse** qu’un échec binaire, **sans** imposer l’alcool.
- **Thèmes :** mode où des **thèmes** sont **proposés** (y compris **aléatoirement**), puis **validation collective** par les joueurs — **on valide ou non** le thème — avant ou pendant la construction de la manche.

## Idea Organization and Prioritization

**Bilan de session (estimation) :** ~**45** concepts / décisions documentés ; techniques : **Question Storming**, **Role Playing** (Éléna, Alex, Thomas), **SCAMPER** complet (S → R).

### Regroupement par thèmes

**Thème 1 — Plateforme & accès**

- **Focus :** livrer vite un **jeu web** **multijoueur en ligne** (esprit **.io**) : **code room + pseudo jetable**, **sans comptes** ni MDP ; **hébergement** serveur pour URL unique.
- **Idées / décisions :** abandon du **téléphone central** pour la V1 ; **plafond joueurs** **20** (affichable), évolutif ; intention « pas de limite arbitraire » **assumée** côté produit avec **garde-fou** technique.
- **Fil conducteur :** **stabilité** et **une partie complète** avant tout « superflu ».

**Thème 2 — Contenu des decks & mots**

- **Focus :** **méga-deck** interne **soigné** (base + références concaténées) ; tirage **multi-thèmes** avec **aléa** et **seuil de confiance** / similarité thématique ; **saisie collaborative** de mots par joueurs **avant** lancement (remplace **import fichier** en V1).
- **Pattern :** **variété** des parties sans multiplier les systèmes — **un** gros réservoir + **filtres** / votes / hasard contrôlé.

**Thème 3 — IA : transparence, trois volets, rythme**

- **Focus :** **ne pas cacher** l’IA ; pages **À propos** + **où / pourquoi / comment** ; intention **pleine** sur **génération de thèmes**, **copilote en direct**, **analyse post-partie** — avec ordre d’**implémentation** à **trancher en chantier** (tension avec **délai** : voir priorités).
- **Personas :** Éléna (confiance, humain d’abord) ; Thomas (perf, fun de tester) ; Alex (transparence, revue **chess.com**, aide **optionnelle** en jeu, **bilan** après).

**Thème 4 — Expérience sociale & règles signature**

- **Focus :** **chat** = **négociable** si manque de temps ; **pas de spectateur** en V1 ; **pas** de profils ni **parties** sauvegardées (V1).
- **Reverse (identité Mousquetaire) :** **tabou / mot noir** → **rattrapage** par **gages** (action, vérité, **option** alcool) côté **équipe qui indice** et côté **devineurs** ; possibilité de **revenir d’un coup** contre **gage** ou **accepter** l’erreur et continuer ; **thèmes** proposés (hasard possible) + **validation** groupe ; soirée = **dynamisme** et **paramétrage** alcool **opt-in**.

**Thème 5 — Narratif projet & livraison**

- **Focus :** **YouTube** transparent (dont audio), **Cursor**, **BMad** ; promesse **« version »** + **V2** ; code **100 %** dédié **Mousquetaire** (pas de réutilisation librairie multi-projets).

### Priorisation (alignée objectifs Limoges)


| Critère         | Lecture                                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Impact**      | Expérience **humaine** + **partie qui va au bout** sans friction                                                                                       |
| **Faisabilité** | **Web + temps réel + méga-deck + IA triple** = charge **très** haute en **2 semaines** → **tranches** de release ou **scope** séquentiel indispensable |
| **Innovation**  | **Reverse** tabou + **validation** thèmes ; **analyse** post-partie enrichie                                                                           |
| **Alignement**  | Cohérent avec Alex (**stabilité > perf perso**) et avec **éliminations** E                                                                             |


**Top 3 à fort impact (post-brainstorming) :**

1. **Boucle multijoueur web stable** (room, rôles, fin de manche) — *sans quoi rien d’autre ne compte.*
2. **Méga-deck + sélection thèmes / aléa / seuil** — *cœur « Mousquetaire » vs clone.*
3. **Analyse post-partie + transparence IA** — *différenciation et promesse « chess.com du mot ».*

**Quick wins (relativement) :** page **À propos** + **IA** ; flux **créer/rejoindre** room **sans** import fichier ; **pop-up** fin de partie **→** opt-in analyse.

**Concepts « breakthrough » :** rattrapage **tabou** + **gages** bilatéraux (indices / devineurs) + **undo** conditionnel ; **thèmes** tirés + **vote** ; **triplet** IA assumé avec **honnêteté** produit.

*Tension explicite :* intention **IA complète** + **reverse** + **UX exigeante** + **2 semaines** → **arbitrage sprint** (jalons semaine par semaine) à faire hors brainstorming.

### Action planning (prochaines étapes concrètes)

**Immédiat (cette semaine)**

1. **Traduire** ce document en **backlog** : *P0* = boucle jeu web ; *P1* = deck + saisie mots ; *P2* = analyse + IA ; *P3* = règles **Reverse** + **moteur de gages** (opt-in alcool, undo contre gage) + chat.
2. **Choisir stack** temps réel + hébergeur (aligné coût / simplicité).
3. **Spécifier** format interne du **méga-deck** + règles de **tirage** thématique (seuil de confiance = définition math / UX).

**Ressources / risques**

- **Temps** : principale contrainte ; **couper** chat ou reporter une **branche IA** si nécessaire **sans** nier l’intention long terme.
- **Données** : mots joueurs = possible **UGC** pour stores — **mention** dans politique / À propos (suite Question Storming).

**Indicateurs de succès (Limoges)**

- **Une partie** jouée **bout en bout** sans **bug bloquant**.
- Au moins un moment **« c’est intéressant »** (débat / mot / IA) pour Alex ; Thomas peut **tester** une brique IA ; Éléna **ne se sent pas piégée**.

## Session Summary and Insights

**Réalisations principales**

- Passage **divergent → convergent** : du **nuage de questions** aux **décisions SCAMPER** et **personas** ancrés.
- **Vision produit** clarifiée : **web**, **pas de compte**, **méga-deck + saisie**, **IA** transparente et **ambitieuse**, **règles** propres à Mousquetaire.
- **Mise à jour finale (post-organisation) :** mécanique **gages** détaillée (mot noir, devineurs, **undo** contre gage, **alcool** **opt-in** / soirée) intégrée en **R — Reverse** et **Thème 4**.

**Apprentissages**

- Le **succès** du week-end reste **relationnel** ; l’app est **amplificateur** si **stable** et **honnête**.
- **Éléna** et **Thomas** tirent le produit en **tensions productives** (confiance vs perf).

**Workflow brainstorming :** session **finalisée** — `stepsCompleted: [1, 2, 3, 4]`, `workflow_completed: true` (voir frontmatter). **Suite recommandée BMad :** nouvelle fenêtre de contexte → **Create PRD** (`bmad-create-prd`) ou **Quick Dev** selon urgence, en attachant ce fichier comme entrée.