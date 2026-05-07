# Story 5.2 — Fin du parcours pedagogique nominal (FR18)

Statut: **done** (2026-05-08)

## Livrables

- **Etat de fin:** section `solo-completion-panel` avec titre « Parcours nominal termine », message de felicitations, liste recap (roles / atelier / rappel serveur multijoueur), CTA **Retour au mode multijoueur**, action **Recommencer le parcours**.
- **Transition:** depuis l’atelier grille, bouton **Terminer le parcours nominal** (remplace l’ancienne « Etape suivante » placeholder 5.2).
- **Abandon / reprise V1:** cle `sessionStorage` `mousquetaire_solo_v1` (`step`, `completedNominal`) ; panneau **Reprendre** / **Recommencer depuis le debut** si progression incomplete detectee au montage ; paragraphe d’aide sur la memoire session et perte a la fermeture d’onglet.
- **Completion reviste:** si parcours deja termine dans la session, reouverture solo affiche directement l’ecran de fin avec mention adaptee.
- **Tests:** scenarios nominal, resume, restart depuis resume et depuis completion.

## Limites V1

Pas de persistance cross-appareil ni compte ; pas de scoring pedagogique serveur.
