# Princess Kingdom 👑

Boîte à outils web pour un prof de lycée, habillée d'or et de roses (clins d'œil à Miquella, Zelda et Drag Race). Tout tourne dans le navigateur : les données (noms d'élèves mineurs) restent dans le `localStorage` de l'ordinateur du prof, avec un export/import en fichier JSON pour les sauvegardes et les changements d'ordinateur.

Outils :

- **Mes classes** : les classes et leurs élèves, partagés par tous les outils.
- **Plan de classe** : génère un plan selon les règles (élèves devant, bavards à séparer, binômes, mixité, changer de voisins, rotation devant/fond), avec retouche par glisser-déposer, cadenas et impression en vue élèves ou vue prof.

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
  shared/           commun à tous les outils : Mes classes, stockage, en-tête, styles
  apps/seating/     plan de classe ; core/ est l'algorithme, en TypeScript pur et testé
```

Ajouter un outil : créer `src/apps/<id>/` avec un composant exporté par défaut, l'ajouter dans `src/apps.ts`, lire les classes avec `useClasses()` (`src/shared/classes/state.ts`) et garder ses propres données avec `usePersistentState('<id>', …)` (`src/shared/storage.ts`).

## Algorithme du plan de classe

Chaque plan reçoit des points de pénalité par règle non respectée ; les poids et la grille de séparation sont dans `src/apps/seating/core/compile.ts`. Un recuit simulé (`solver.ts`) cherche le plan le moins pénalisé : 4 départs aléatoires de 200 000 échanges, puis une descente jusqu'à un optimum local. Le panneau « Règles non respectées » liste les points restants.
