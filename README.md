# Princess Kingdom 👑

Boîte à outils web pour un prof de lycée. Tout tourne dans le navigateur : les données (noms d'élèves mineurs) restent dans le `localStorage` de l'ordinateur du prof, avec un export/import en fichier JSON pour les sauvegardes et les changements d'ordinateur.

Outils :

- **Mes classes** : les classes et leurs élèves, partagés par tous les outils.
- **Plan de classe** : génère un plan selon les règles (élèves devant ou au fond, AESH côté allée, bavards à séparer, binômes, mixité, changer de voisins, rotation devant/fond), avec retouche par glisser-déposer, cadenas et impression en vue élèves ou vue prof.
- **Groupes de travail** : forme des groupes selon la taille voulue, les absents, les affinités et les élèves à séparer, la mixité et les niveaux, en changeant de coéquipiers d'un tirage à l'autre, avec rôles, vue projetée et impression.
- **Appréciations** : rédige l'appréciation du bulletin de chaque élève à partir de 22 critères notés de 1 à 4, avec une banque de phrases ; textes courts, modifiables, copiables ou exportés en CSV.

## Lancer

```sh
nvm use          # Node 24 (cf. .nvmrc)
npm install
npm run dev      # http://localhost:5173
npm test         # tests Vitest
npm run build    # vérification TypeScript + build statique dans dist/
npm run lint
```

## Organisation

```
src/
  App.tsx           accueil et navigation (#/<outil>)
  apps.ts           liste des outils
  shared/           commun à tous les outils : Mes classes, stockage, hasard reproductible, en-tête, styles
  apps/seating/     plan de classe ; core/ est l'algorithme, en TypeScript pur et testé
  apps/groups/      groupes de travail, sur le même modèle
  apps/appreciations/  appréciations ; core/bank/ est la banque de phrases
```

Ajouter un outil : créer `src/apps/<id>/` avec un composant exporté par défaut, l'ajouter dans `src/apps.ts`, lire les classes avec `useClasses()` (`src/shared/classes/state.ts`) et garder ses propres données avec `usePersistentState('<id>', …)` (`src/shared/storage.ts`).

## Algorithme du plan de classe

Chaque plan reçoit des points de pénalité par règle non respectée ; les poids et la grille de séparation sont dans `src/apps/seating/core/compile.ts`. Un recuit simulé (`solver.ts`) cherche le plan le moins pénalisé : 4 départs aléatoires de 200 000 échanges, puis une descente jusqu'à un optimum local. Le panneau « Règles non respectées » liste les points restants.
