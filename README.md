# Mousquetaire - Bootstrap Story 1.1

Socle initial du projet pour Story `1.1-bootstrap-depot-ci-et-socle-technique`.

## Prérequis

- Node.js `20.19+` ou `22.12+`
- Python `>=3.10`

## Frontend (`web/`)

```powershell
cd web
npm install
npm run dev
```

## Backend (`api/`)

### PowerShell (Windows)

```powershell
python -m venv api\.venv
.\api\.venv\Scripts\python -m pip install --upgrade pip
.\api\.venv\Scripts\python -m pip install "fastapi[standard]" pytest httpx ruff
cd api
..\api\.venv\Scripts\fastapi dev app\main.py
```

### Bash / Zsh (macOS, Linux)

```bash
python3 -m venv api/.venv
./api/.venv/bin/python -m pip install --upgrade pip
./api/.venv/bin/python -m pip install "fastapi[standard]" pytest httpx ruff
cd api
../api/.venv/bin/fastapi dev app/main.py
```

## Qualité

Depuis la racine :

```powershell
npm run lint
npm run typecheck
npm run test
```

> Les scripts racine utilisent `python -m ...`. Assurez-vous d'avoir un environnement Python actif avec `ruff` et `pytest` installés (venv recommandé).

## Tokens design system (socle Story 1.1)

Tokens CSS sémantiques de base disponibles dans `web/src/index.css` :

- `--background` : fond global
- `--card` : surface des cartes/containers
- `--foreground` : texte principal
- `--muted` : texte secondaire
- `--primary` : couleur d'accent/actions
- `--border` : bordures
- `--destructive` : feedback d'erreur
- `--focus-ring` : contour de focus clavier
- `--warning-surface` : surface d'alerte non bloquante
- `--turn-active` : reserve gameplay (etat tour actif)

Règle de base: utiliser `var(--token)` dans les nouveaux écrans, sans valeurs brutes (`#...`, `rgb(...)`) hors cas exceptionnel documenté.

Audit Story 1.9 (périmètre Epic 1): styles création/rejoindre, bannière hors matrice, sections légales et à-propos alignés sur tokens sémantiques; aucune valeur magique hors définition des tokens.

## Contrat API - création de salle (Story 1.2)

- Endpoint: `POST /rooms`
- Requête: corps vide (MVP)
- Réponse `201`:
  - `room_id` (UUID string)
  - `room_code` (code alphanumérique 6 caractères)
- Réponse `500`:
  - `detail.error_code` = `room_creation_failed`
  - `detail.message` lisible côté utilisateur

Limite temporaire FR27 (MVP Story 1.2): format de code fixé à 6 caractères alphanumériques majuscules, sans ambiguïtés visuelles. Les règles avancées (capacité salle, politiques complètes) sont traitées dans les stories suivantes.
Limite technique temporaire: stockage en mémoire locale du process API (MVP). Un stockage partagé sera introduit dans les stories de persistance/reconnexion.

## Contrat API - rejoindre une salle (Story 1.3)

- Endpoint: `POST /rooms/join`
- Requête JSON:
  - `room_code` (string 6 caractères, normalisé en majuscules)
  - `pseudo` (string 2-24 caractères)
- Réponse `200`:
  - `room_id`, `room_code`, `participant_id`, `pseudo`
  - cookie technique HTTP-only `mousquetaire_session` (session de jeu, sans compte produit)
  - `session_resumed` (`boolean`): vrai lorsque la session cookie correspond encore au meme participant dans la meme salle (reprise sans doublon, voir Story 4.3)
- Réponse `404`:
  - `detail.error_code` = `room_not_found`
  - `detail.message` explicite: code invalide ou salle indisponible

Note dev cross-origin (Vite ↔ API): le client envoie `credentials: include` et l'API autorise `allow_credentials` pour permettre la persistance du cookie de session en développement.

## Contrat API - mega-deck collaboratif (Story 2.1)

- Endpoint lecture: `GET /rooms/{room_code}/mega-deck`
- Endpoint ajout: `POST /rooms/{room_code}/mega-deck`
- Requête ajout JSON:
  - `word` (2-32 caractères)
- Réponse `200`:
  - `room_id`, `room_code`, `words`, `max_words`
- Réponse `409`:
  - `detail.error_code` = `word_duplicate` ou `mega_deck_limit_reached`
  - `detail.message` explicite pour correction utilisateur

## Contrat API - démarrage par l'hôte (Story 2.2)

- Endpoint état salon: `GET /rooms/{room_code}/state`
  - Réponse: `phase`, `can_start`, `blocked_reasons`
- Endpoint démarrage: `POST /rooms/{room_code}/start`
  - Requête JSON: `participant_id`
  - Réponse `200`: phase `in_game`
  - Réponse `403`: `only_host_can_start`
  - Réponse `409`: `start_conditions_not_met` + raison lisible

## Variante Mousquetaire P0 (Story 2.3)

- Variante autoritative cote serveur: `mousquetaire_p0`
- Parametres fixes exposes dans `GET /rooms/{room_code}/state` et `POST /rooms/{room_code}/start`:
  - `teams_count = 2`
  - `grid_size = 5` (grille 5x5)
  - `black_words = 1`
- Cote UI (`TeamSetup`), ces reglages sont affiches en lecture seule avec explication courte.

## Tour et synchronisation (Story 3.1)

- WebSocket salle: `GET ws://<api>/rooms/{room_code}/events`
  - Evenements: `{ type, payload, version }`
  - Types V1: `turn_snapshot`, `turn_changed`
- Changement de tour: `POST /rooms/{room_code}/turn/next`
  - Requete JSON: `participant_id`, `client_version`
  - Reponse: `turn_version`, `active_participant_id`, `active_role`
  - Conflit version (`409`): `turn_version_conflict` + message de resynchronisation

## ClueComposer (Story 3.2)

- Validation indice: `POST /rooms/{room_code}/clue`
  - Requete JSON: `participant_id`, `clue_text`
  - Contraintes serveur:
    - longueur 2 a 24 caracteres
    - caracteres autorises: lettres, espace, tiret
    - seulement le donneur d'indice actif peut valider
  - Reponse: `clue_text`, `clue_giver_participant_id`, `turn_version`
- `GET /rooms/{room_code}/state` expose `current_clue` pour afficher l'indice actif.

## WordGrid - selection de cartes (Story 3.3)

- Selection/deselection carte: `POST /rooms/{room_code}/cards/toggle`
  - Requete JSON: `participant_id`, `card_word`, `client_version`
  - Contraintes serveur:
    - partie `in_game` uniquement
    - seul le devineur actif peut agir
    - la carte doit exister dans `board_cards`
  - Reponse: `selected_card_words`, `turn_version`
- `GET /rooms/{room_code}/state` expose:
  - `board_cards`: cartes de la grille courante
  - `selected_card_words`: selections valides pour le tour
- WebSocket `ws /rooms/{room_code}/events`:
  - type d'evenement ajoute: `card_selection_changed`
  - payload inclut `selected_card_words`

## Revelation synchronisee (Story 3.4)

- Revelation de la selection: `POST /rooms/{room_code}/cards/reveal`
  - Requete JSON: `participant_id`, `client_version`
  - Contraintes serveur:
    - phase `in_game`
    - role `guesser_*` actif uniquement
    - indice actif obligatoire (`current_clue`)
    - au moins une carte selectionnee
  - Reponse: `revealed_card_words`, `revealed_now_words`, `turn_version`
- Etat expose via `GET /rooms/{room_code}/state`:
  - `revealed_card_words` (cartes deja revelees)
- WebSocket:
  - evenement `cards_revealed`
  - payload enrichi avec `revealed_card_words` pour synchro multi-clients.

## RoundResolution - fin de manche (Story 3.5)

- Etat de manche expose via `GET /rooms/{room_code}/state`:
  - `round_state` (`playing` ou `round_resolution`)
  - `round_result_message`
  - `round_resolution_started_at_ms`
  - `round_resolution_beat_ms`
  - `round_number`
  - `next_step_hint`
- Fin de manche:
  - declenchee serveur apres revelation validee (`POST /rooms/{room_code}/cards/reveal`)
  - WS envoie `round_resolution_started` (etat partage pour tous).
- Transition manche suivante:
  - `POST /rooms/{room_code}/round/continue` (hote uniquement, apres beat)
  - nettoie etat de manche et relance une manche coherente avec le flux FR14.

## Resultat manche / partie FR14 (Story 3.6)

- **Scores P0:** points par equipe = nombre de cartes revelees sur les tours du devineur `guesser_team_a` / `guesser_team_b`.
- **Objectif:** `game_score_target` (valeur serveur, constante `GAME_SCORE_TARGET`, typiquement 8 points).
- **Fin de partie:** des qu'une equipe atteint l'objectif, `phase` passe a `game_over` (sans beat RoundResolution supplementaire).
- `GET /rooms/{room_code}/state` expose:
  - `team_a_score`, `team_b_score`, `game_score_target`
  - `winning_team_key` (`team_a` | `team_b` | `tie` | `null` tant que la partie continue)
  - `game_end_message` (synthese lisible quand `phase === game_over`)
- `POST /rooms/{room_code}/cards/reveal` renvoie les memes champs apres revelation (dont `phase` mis a jour si partie terminee).
- Actions de jeu (`turn/next`, `clue`, `cards/toggle`, `cards/reveal`, `round/continue`) repondent `409` + `error_code: game_over` si la partie est terminee.
- WebSocket: evenement `game_finished` apres une revelation qui clot la partie (payload aligne sur les diffusions habituelles, avec scores).

## Retour actions a risque — FR31 (Story 3.7)

- **API:** les erreurs HTTP renvoient un corps `{ detail: { error_code, message } }` parse cote client en `ApiRequestError` (`web/src/lib/apiErrors.ts`).
- **UI:** pour revelation, selection grille, passage de tour, indice et reprise de manche — **toast** (`aria-live="assertive"`) + zone **inline** contextualisee (`role="alert"`) en cas de refus ou d’erreur reseau, conformement UX-DR7 / UX-DR8 documentes dans le fichier story 3.7.
- **Blocages client** (ex. fin de manche): message toast immediat sans attendre le serveur quand l’action est impossible localement.

## Reversibilite indice P0 — FR32 (Story 3.8)

- **Retrait:** `POST /rooms/{room_code}/clue/withdraw`
  - Requete JSON: `participant_id`, `client_version` (optionnel, aligne sur `turn_version` comme les autres actions).
  - **Autorise** uniquement si: partie `in_game`, hors `round_resolution`, indice actif, demandeur = auteur (`current_clue_author_participant_id`), aucune interaction devineur sur la grille depuis l’indice (`clue_selection_touched == false`), `selected_card_words` vide.
  - Reponse `200`: `turn_version` incremente (comme les autres mutations).
  - Erreurs courantes: `403` `clue_withdraw_wrong_player`, `409` `clue_nothing_to_withdraw`, `409` `clue_withdraw_blocked`, `409` `turn_version_conflict`.
- **Etat:** `GET .../state` expose `current_clue_author_participant_id` et `clue_withdraw_allowed` pour l’UI (bouton conditionnel).
- **WebSocket:** evenement `clue_withdrawn` avec snapshot habituel (indice efface cote serveur).
- **Non reversible V1:** la revelation reste definitive — pas d’endpoint d’annulation.

## Quitter la salle / session — FR3 (Story 4.1)

- **Sortie volontaire:** `POST /rooms/{room_code}/leave`
  - Requete JSON: `participant_id`.
  - Effets P0:
    - Retrait du joueur de la liste des participants ; les autres voient la mise a jour via `GET .../state`, polling et WebSocket.
    - Si l’**hote** quitte et qu’il reste des joueurs, le **premier participant restant** (ordre de presence dans la salle) devient hote.
    - En **partie** (`in_game`): si le joueur actif part, le tour passe au **prochain** joueur encore present dans l’ordre cyclique d’origine ; selections grille liees au tour sont reinitialisees quand l’actif part ou quand l’**auteur de l’indice** part (indice retire).
    - Si apres depart il reste **moins de** `MIN_PLAYERS_TO_START` (2) joueurs en cours de partie, la salle repasse en **`pre_game`** et l’etat de manche/grille/scores est **remis au lobby** (mega-deck conserve).
    - Si **personne** ne reste: salle vide, phase **`pre_game`**, etat jeu remise a zero (mega-deck conserve).
  - Reponse `200`: `phase`, `turn_version`, `participants_remaining`.
  - Erreurs: `403` `participant_not_in_room`, `404` `room_not_found`.
- **Etat:** `GET .../state` expose `participants`: liste `{ participant_id, pseudo }` (vue table legere pour le salon).
- **WebSocket:** evenement `participant_left` avec le meme snapshot habituel (inclut `participants`).
- **Hors story 4.1 — voir Epic 4:** rejoindre une partie en cours (4.2), reprise session cookie (4.3), absence hote sur le flux temps reel (4.4).

## Rejoindre en cours — spectateur P0 (Story 4.2)

- **Jointure:** `POST /rooms/join` accepte une arrivee tant que la capacite salle le permet, y compris si `phase` est `in_game` ou `game_over` (aucun refus du type `room_already_started` pour une partie deja demarree).
- **Reponse `200` enrichie** avec:
  - `player_status`: `lobby` \| `player` \| `spectator`
  - `room_phase`: phase serveur (`pre_game`, `in_game`, `game_over`)
  - `status_message`: libelle utilisateur (FR)
- **Regle:** un participant qui arrive **apres** le demarrage sans entree dans `participant_roles` est **spectateur**. Les endpoints de jeu (`turn/next`, `clue`, `clue/withdraw`, `cards/toggle`, `cards/reveal`, `round/continue`) repondent `403` avec `error_code: spectator_action_forbidden` pour un spectateur.
- **WebSocket:** evenement `participant_joined` lors de cette arrivee (`turn_version` incremente).
- **Client:** banniere spectateur (`data-testid="spectator-banner"`), actions de jeu desactivees ; mega-deck / panneau lobby masques hors `pre_game` pour un arrivant en cours de partie.

## Reconnexion et resynchronisation — FR16 (Story 4.3)

- **Reprise de session (API MVP memoire):** si `POST /rooms/join` est appele avec le cookie `mousquetaire_session` encore associe cote serveur au meme `participant_id`, dans la **meme** salle et avec le **meme** `pseudo`, la jointure **ne cree pas** de nouveau participant, **n’incremente pas** `turn_version` et **ne diffuse pas** `participant_joined`. La reponse indique `session_resumed: true`.
- **Snapshot:** `GET /rooms/{room_code}/state` et le polling client restent la source autoritaire pour rattraper l’etat apres coupure ; une evolution prevue (Firestore / checkpoints, cf. architecture) pourra enrichir ce flux sans invalider cette convention MVP.
- **Sortie:** `POST /rooms/{room_code}/leave` invalide la liaison cookie ↔ participant pour ce joueur (nouvelle arrivee avec le meme pseudo = nouveau `participant_id` tant que la salle existe).
- **Client temps reel:** reconnexion WebSocket avec backoff borne (`<= 24` tentatives puis mode degrade), toast lors du retablissement du flux, bannière **SyncBanner** (`data-testid="sync-banner"`) pour l’etat reseau / resynchro au-dessus de l’indicateur de tour sans le masquer.
- **Effet pour les autres:** la reprise d’un joueur ne modifie pas le tour ni les actions deja validees pour le reste de la table (pas de `participant_joined` ni bump de version sur simple resume).

## Deconnexion flux temps reel de l'hote — FR28 / FR29 (Story 4.4)

- **Detection:** le serveur suit les sockets ouvertes par participant sur `GET .../rooms/{room_code}/events?participant_id=...`. Quand l'hote n'a plus aucune connexion WS ouverte en partie, une fenetre de grace commence (`host_absence_grace_until_ms` dans `GET .../state`).
- **Transfert:** si l'hote ne rouvre pas de WS avant la fin de la grace, le premier participant restant eligible devient hote (aligne sur la politique de transfert existante) ; `host_absence_grace_until_ms` repasse a `null`.
- **Evenements WS:** `host_absence_grace_started`, `host_absence_grace_cleared` (reconnexion hote avec annulation), `host_transferred_passive` — payload habituel avec snapshot complet.
- **Client:** banniere `host-absence-banner` en `in_game` pendant la grace + toasts explicites ; `isHost` mis a jour depuis le polling et les messages WS.

## Diagnostic et correlation support — FR30 (Story 4.5)

- **Correlation HTTP:** chaque reponse API inclut l'en-tete **`X-Correlation-ID`** (reprenant celui du client s'il est fourni et valide, sinon UUID serveur). Limite longueur **128** caracteres pour eviter le bruit ; les requetes frequentes **GET** `/health`, `.../state` et `.../mega-deck` ne generent pas de ligne `http_request` dans le journal **support** pour limiter le volume (l'en-tete est toujours renvoye).
- **Session dans les logs:** empreinte **`session_fp`** = prefixe SHA-256 du cookie `mousquetaire_session` (pas le jeton brut), journalisee avec les requetes HTTP non-poll.
- **Reference utilisateur:** `POST /rooms` et `POST /rooms/join` renvoient **`diagnostic_ref`** (UUID) aussi ecrit dans les logs (`room_created`, `participant_join`) — la table peut communiquer cette valeur au support pour correlation avec les fichiers journaux.
- **Socket temps reel:** `GET .../events` accepte **`correlation_id`** en query ; ouverture / fermeture journalisees (`websocket_open`, `websocket_close`) avec **`room_id`**, code salle et participant rattache.
- **Sequences partie:** les diffusions WS cote diagnostic incluent une ligne **`ws_broadcast`** pour les evenements sensibles (`participant_joined`, `participant_left`, transferts hote passifs, fin de partie / resolution de manche, etc.) avec `room_id`, `room_code`, `turn_version`, nombre d'abonnes.
- **Client web:** en-tete **`X-Correlation-ID`** envoye sur chaque appel REST (`web/src/lib/api.ts`) ; WebSocket avec **`correlation_id`** ; affichage optionnel de la reference diagnostic (`data-testid="support-diagnostic-ref"`).

## Apprentissage solo — FR17 (Story 5.1)

- **Acces:** depuis l’UI principale, onglets **Multijoueur** / **Apprentissage solo** (`data-testid="solo-mode-tab"`).
- **Parcours:** etapes textuelles hors code de salle, puis **atelier grille** local (`web/src/features/solo/SoloLearning.tsx`) avec les memes classes **`word-grid`**, **`word-card`**, selection / **Reveler la selection**, toast et mentions d’irreversibilite — alignes sur le multijoueur (UX-DR10).
- **Backend:** aucune API obligatoire pour ce mode en V1 ; la progression est entierement cote client.

## Fin du parcours pedagogique nominal — FR18 (Story 5.2)

- **Ecran de fin:** panneau **`solo-completion-panel`** (`data-testid`) avec titre, felicitations, **liste recap** et bouton **Retour au mode multijoueur**.
- **Parcours nominal:** bouton **Terminer le parcours nominal** depuis l’atelier grille pour afficher cet ecran (sans dependre du multijoueur pour la completion).
- **Reprise / abandon:** progression sauvegardee dans **`sessionStorage`** (`mousquetaire_solo_v1`) pour la session d’onglet — panneau **Reprendre** / **Recommencer depuis le debut** si progression incomplete ; texte d’aide sur les limites (fermeture onglet efface la memoire). Apres completion, **Recommencer le parcours** remet le flux au debut.

## Hors scope de cette story

- Logique métier room / game
- WebSocket gameplay
- Persistance Firestore
- Authentification produit
