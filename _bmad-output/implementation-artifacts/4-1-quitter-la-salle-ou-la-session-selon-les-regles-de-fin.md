# Story 4.1 — Quitter la salle ou la session selon les regles de fin

## Objectif (FR3)

Permettre une **sortie volontaire** avec transition serveur documentee, sans corrompre le tour pour les autres lorsque la partie peut continuer.

## Regles P0 livrees

| Situation | Comportement |
|-----------|--------------|
| Pre-partie | Retrait de la liste ; transfert d’**hote** au premier joueur restant (ordre de liste participants). |
| Partie en cours, >= 2 joueurs restants | Retrait ; tour passe au **suivant** dans l’ordre cyclique d’origine si le partant etait actif ; roles conserves pour les survivants ; si auteur d’indice part → indice retire + selections grille videes ; si actif part → selections grille videes. |
| Partie en cours, reste 1 joueur | Retour **`pre_game`**, etat de grille/manche/scores reinitialise (mega-deck conserve). |
| Plus aucun joueur | Salle vide, **`pre_game`**, meme reset ; mega-deck conserve. |

## API

- `POST /rooms/{room_code}/leave` — corps `{ participant_id }`.
- `GET .../state` — champ `participants: [{ participant_id, pseudo }]`.
- WebSocket — `participant_left` + payload habituel (inclut `participants`).

## Fichiers touches

- `api/app/main.py` — endpoint leave, helpers, diffusion unifiee `broadcast_payload_for_room`.
- `web/src/lib/api.ts` — `leaveRoom`, type `participants` dans l’etat.
- `web/src/App.tsx` — bouton « Quitter la salle », gestion WS `participant_left`.
- `api/tests/test_health.py` — tests leave / host / tour / seuil joueurs.
- `README.md` — contrat Story 4.1.

## Hors scope (stories suivantes Epic 4)

Rejoindre en cours, reconnexion passive, detection deconnexion hote sans action utilisateur, correlation diagnostic.
