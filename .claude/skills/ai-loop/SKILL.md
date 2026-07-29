---
name: ai-loop
description: Cycle de développement borné Spec → Build → Review pour construire une feature depuis zéro. À charger quand on veut un cahier des charges écrit AVANT le code, puis une boucle build/vérification avec budget d'itérations et points d'approbation explicites. PAS pour du réglage fin sur du code existant ni du refactoring ouvert.
---

# AI-Loop — cycle Spec → Build → Review borné

Structure un cycle de développement en trois phases distinctes — planification
(Spec), implémentation (Build), validation (Review) — pour construire une
modification de code cadrée en gardant les exigences, les garde-fous et les
conditions d'arrêt explicites.

## Quand l'utiliser

- Une feature à construire depuis zéro, ou fortement modifiée, dont tu veux
  gérer tout le cycle de vie dans un périmètre clairement borné.
- Un composant, module ou feature isolé, à périmètre et contraintes définissables.
- Une passe de développement complète, mais avec des critères de succès clairs,
  un chemin de vérification réaliste, et aucune décision de sécurité ou de
  produit encore en suspens.

**Quand NE PAS l'utiliser** : réglage de paramètres existants, refactoring
architectural ouvert, ou tâche dont on ne sait pas encore dire ce que « fini »
signifie. Dans ces cas la cérémonie du spec ralentit sans rien apporter.

## Avant de commencer

Définir, et l'annoncer :

- Le nombre maximum d'itérations Build → Review.
- Les commandes de vérification ou contrôles manuels qui comptent comme preuve.
- Les actions qui exigent une approbation explicite : commandes destructrices,
  changements en production, écritures vers un service externe, ou pivot
  architectural large.

## Phase 1 — Spec (planification)

1. Interroger l'utilisateur sur la feature voulue. **Une question ciblée à la
   fois**, jusqu'à comprendre l'objectif, les exigences indispensables, les
   contraintes, et ce que « fini » veut dire.
2. **Ne pas commencer à coder à ce stade.**
3. Quand l'information est suffisante, écrire une spécification claire et
   détaillée dans `specs/<nom-feature>.md`.
4. La spec doit contenir :
   - l'objectif ;
   - les exigences exactes ;
   - les cas limites à traiter ;
   - une définition de « fini » concrète, vérifiable par un tiers ;
   - le budget d'itérations, les commandes de vérification, les points
     d'approbation.

## Phase 2 — Build (implémentation)

1. Relire `specs/<nom-feature>.md`.
2. Construire exactement ce qu'elle décrit.
3. **N'ajouter aucune feature**, ne refactorer aucun code non concerné,
   n'inventer aucune exigence absente de la spec.
4. Lister les exigences de la spec effectivement couvertes, pour que la revue
   puisse les contrôler.

## Phase 3 — Review (vérification)

1. Comparer l'implémentation à `specs/<nom-feature>.md`, **exigence par
   exigence**.
2. Lister chaque manque, bug ou oubli, en nommant l'item de spec qu'il viole.
3. Si quelque chose échoue et que le budget d'itérations n'est pas épuisé :
   écrire les corrections précises et **retourner en phase Build**.
4. S'arrêter et demander un avis humain quand la correction suivante
   modifierait la spec, dépasserait le budget, exigerait une opération risquée,
   ou dépendrait d'une décision produit absente de la spec.
5. Ne valider et conclure que lorsque **toutes** les exigences sont satisfaites
   et que les preuves de vérification annoncées sont passées.

## Bonnes pratiques

- ✅ Poser les questions une par une en phase Spec.
- ✅ Documenter les cas limites dans la spec **avant** d'écrire du code.
- ✅ S'en tenir strictement à la spec approuvée en phase Build.
- ✅ Borner la boucle par un petit budget d'itérations, et dire précisément ce
  qui reste si le budget est épuisé.
- ✅ Demander une approbation explicite avant toute action destructrice, en
  production, avec identifiants, ou visible de l'extérieur.
- ❌ Ne pas implémenter d'extras ni de refactorings non spécifiés.
- ❌ Ne pas sauter la phase Review, ni la valider sans contrôler chaque exigence.
- ❌ Ne pas réessayer indéfiniment la même correction sans preuve nouvelle ou
  approche différente.

## Limites

- Exige assez de contexte fourni en phase Spec.
- Adapté aux features isolées à frontières nettes, pas au refactoring
  architectural ouvert.
- La revue repose sur l'auto-évaluation de l'agent contre une spec qu'il a
  lui-même écrite : une relecture humaine reste recommandée sur les parties
  critiques.
- Ne remplace pas l'approbation humaine sur ce qui touche à la sécurité, au
  destructif, à la production, à la conformité, ou à ce qui est visible de
  l'extérieur.
- Doit s'arrêter plutôt que continuer si les exigences se contredisent, si les
  tests ne peuvent pas tourner, ou si la vérification dépend d'identifiants ou
  de systèmes indisponibles.

## Sécurité

- Prudence en exécutant le code produit en phase Build ; préférer un
  environnement isolé.
- Ne pas exécuter de commande shell fournie telle quelle sans en vérifier
  l'innocuité.
- Aucun secret, clé ou identifiant en dur, ni dans le code ni dans la spec.
- Traiter les déploiements, migrations de données, flux de paiement, changements
  d'identifiants et écritures externes comme soumis à approbation.

## Pièges courants

- **Système trop gros d'un coup** → spec boursouflée et implémentation
  incomplète. Garder le périmètre petit et modulaire ; découper un gros système
  en plusieurs boucles indépendantes.
- **Spec vague** → la phase Build s'appuie sur des suppositions. Passer plus de
  temps en phase Spec à cerner les exigences.

## Notes d'intégration à ce projet

- Les specs vont dans `specs/<nom-feature>.md` à la racine du dépôt (dossier à
  créer au premier usage ; il n'existe pas encore).
- Les vérifications qui font preuve ici : `npm run build` (`tsc -b && vite build`)
  et `npm run lint` (oxlint, zéro warning attendu) depuis `frontend/`. Pour tout
  ce qui touche la 3D, ajouter une validation navigateur — le build qui passe ne
  dit rien du rendu.
- Les règles de `CLAUDE.md` (un fichier = une responsabilité, props typées,
  zéro style inline, Three.js en 4 couches) s'appliquent en phase Build et font
  partie des critères de la phase Review.

Source : définition communautaire, adaptée au dépôt (2026-07-29).
