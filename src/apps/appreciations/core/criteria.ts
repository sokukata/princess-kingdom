import type { Category, CriterionId, Level } from './model.ts'

export interface Criterion {
  id: CriterionId
  label: string
  category: Category
  levels?: [string, string, string, string] // labels of levels 1 to 4 when the default ones do not fit
}

export const categories: { id: Category; label: string }[] = [
  { id: 'results', label: 'Résultats et compétences' },
  { id: 'work', label: 'Travail' },
  { id: 'attitude', label: 'Attitude' },
]

export const defaultLevelLabels = ['Très insuffisant', 'Insuffisant', 'Satisfaisant', 'Très bien'] as const

export const criteria: Criterion[] = [
  { id: 'results', label: 'Résultats', category: 'results' },
  {
    id: 'evolution',
    label: 'Évolution',
    category: 'results',
    levels: ['En baisse', 'Stable', 'En progrès', 'Nets progrès'],
  },
  { id: 'abilities', label: 'Capacités', category: 'results' },
  { id: 'knowledge', label: 'Maîtrise des connaissances', category: 'results' },
  { id: 'reasoning', label: 'Réflexion et raisonnement', category: 'results' },
  { id: 'writing', label: 'Expression écrite', category: 'results' },
  { id: 'speaking', label: 'Expression orale', category: 'results' },
  { id: 'method', label: 'Méthode et rigueur', category: 'results' },
  { id: 'homework', label: 'Travail personnel', category: 'work' },
  { id: 'involvement', label: 'Investissement', category: 'work' },
  { id: 'assignments', label: 'Travaux rendus', category: 'work' },
  { id: 'organisation', label: 'Organisation et matériel', category: 'work' },
  { id: 'autonomy', label: 'Autonomie', category: 'work' },
  { id: 'curiosity', label: 'Curiosité et approfondissement', category: 'work' },
  { id: 'perseverance', label: 'Persévérance', category: 'work' },
  { id: 'participation', label: 'Participation orale', category: 'attitude' },
  { id: 'attention', label: 'Attention et concentration', category: 'attitude' },
  {
    id: 'behaviour',
    label: 'Comportement (bavardages, agitation)',
    category: 'attitude',
    levels: ['Très perturbateur', 'Bavard, agité', 'Correct', 'Exemplaire'],
  },
  { id: 'respect', label: 'Respect des autres et des règles', category: 'attitude' },
  { id: 'groupwork', label: 'Travail en groupe', category: 'attitude' },
  { id: 'attendance', label: 'Assiduité', category: 'attitude' },
  { id: 'punctuality', label: 'Ponctualité', category: 'attitude' },
]

export const levelLabel = (criterion: Criterion, level: Level) => (criterion.levels ?? defaultLevelLabels)[level - 1]
