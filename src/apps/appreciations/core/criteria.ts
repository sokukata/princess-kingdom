import type { Category, CriterionId, Level } from './model.ts'

export interface Criterion {
  id: CriterionId
  label: string
  category: Category
  hint: string // what is rated, shown on hovering the criterion
  levels?: [string, string, string, string] // labels of levels 1 to 4 when the default ones do not fit
}

export const categories: { id: Category; label: string }[] = [
  { id: 'results', label: 'Résultats et compétences' },
  { id: 'work', label: 'Travail' },
  { id: 'attitude', label: 'Attitude' },
]

export const defaultLevelLabels = ['Très insuffisant', 'Insuffisant', 'Satisfaisant', 'Très bien'] as const

export const criteria: Criterion[] = [
  {
    id: 'results',
    label: 'Résultats',
    category: 'results',
    hint: 'Les notes de la période, dans leur ensemble.',
  },
  {
    id: 'evolution',
    label: 'Évolution',
    category: 'results',
    hint: 'La tendance depuis la période précédente, quel que soit le niveau atteint.',
    levels: ['En baisse', 'Stable', 'En progrès', 'Nets progrès'],
  },
  {
    id: 'abilities',
    label: 'Capacités',
    category: 'results',
    hint: 'Le potentiel, ce dont l’élève est capable, même si le travail ne suit pas.',
  },
  {
    id: 'knowledge',
    label: 'Maîtrise des connaissances',
    category: 'results',
    hint: 'Les notions du cours : apprises, comprises, retenues.',
  },
  {
    id: 'reasoning',
    label: 'Réflexion et raisonnement',
    category: 'results',
    hint: 'Analyser, argumenter, mobiliser ses connaissances face à une question nouvelle.',
  },
  {
    id: 'writing',
    label: 'Expression écrite',
    category: 'results',
    hint: 'La qualité de l’écrit : rédaction, clarté, orthographe et syntaxe.',
  },
  {
    id: 'speaking',
    label: 'Expression orale',
    category: 'results',
    hint: 'La qualité de la prise de parole : clarté, vocabulaire, aisance (la fréquence est la participation).',
  },
  {
    id: 'method',
    label: 'Méthode et rigueur',
    category: 'results',
    hint: 'La façon de travailler : suivre une méthode, soigner, vérifier, être précis.',
  },
  {
    id: 'homework',
    label: 'Travail personnel',
    category: 'work',
    hint: 'Le travail fait en dehors de la classe : devoirs, leçons apprises, révisions.',
  },
  {
    id: 'involvement',
    label: 'Investissement',
    category: 'work',
    hint: 'L’implication et les efforts dans la matière, en classe comme à la maison.',
  },
  {
    id: 'assignments',
    label: 'Travaux rendus',
    category: 'work',
    hint: 'Les travaux demandés : rendus ou non, dans les délais, complets et soignés.',
  },
  {
    id: 'organisation',
    label: 'Organisation et matériel',
    category: 'work',
    hint: 'Avoir son matériel, tenir ses affaires, s’organiser dans son travail.',
  },
  {
    id: 'autonomy',
    label: 'Autonomie',
    category: 'work',
    hint: 'Travailler seul, se mettre au travail sans être relancé, chercher avant de demander.',
  },
  {
    id: 'curiosity',
    label: 'Curiosité et approfondissement',
    category: 'work',
    hint: 'L’intérêt pour la matière, les questions, l’envie d’aller au-delà du cours.',
  },
  {
    id: 'perseverance',
    label: 'Persévérance',
    category: 'work',
    hint: 'La réaction face à la difficulté : insister, recommencer, ne pas abandonner.',
  },
  {
    id: 'participation',
    label: 'Participation orale',
    category: 'attitude',
    hint: 'La fréquence et la pertinence des prises de parole en cours.',
  },
  {
    id: 'attention',
    label: 'Attention et concentration',
    category: 'attitude',
    hint: 'L’écoute en classe et la capacité à rester concentré sur la durée.',
  },
  {
    id: 'behaviour',
    label: 'Comportement (bavardages, agitation)',
    category: 'attitude',
    hint: 'L’attitude en classe : bavardages, agitation, ce qui gêne le cours.',
    levels: ['Très perturbateur', 'Bavard, agité', 'Correct', 'Exemplaire'],
  },
  {
    id: 'respect',
    label: 'Respect des autres et des règles',
    category: 'attitude',
    hint: 'Le respect des camarades, des adultes et du règlement.',
  },
  {
    id: 'groupwork',
    label: 'Travail en groupe',
    category: 'attitude',
    hint: 'La collaboration lors des travaux à plusieurs : écoute, apport, partage des tâches.',
  },
  {
    id: 'attendance',
    label: 'Assiduité',
    category: 'attitude',
    hint: 'La présence en cours : absences et leur incidence sur le suivi.',
  },
  {
    id: 'punctuality',
    label: 'Ponctualité',
    category: 'attitude',
    hint: 'L’arrivée à l’heure en cours.',
  },
]

export const levelLabel = (criterion: Criterion, level: Level) => (criterion.levels ?? defaultLevelLabels)[level - 1]
