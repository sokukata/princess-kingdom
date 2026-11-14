import type { CriterionId, Levels } from '../model.ts'

export interface Combination {
  id: string
  matches: (levels: Levels) => boolean
  covers: CriterionId[] // criteria the sentence speaks for, which then get no sentence of their own
  variants: string[]
  conclusions: string[] // the combination is the main point of the text, so its own conclusion comes first
}

const atMost = (levels: Levels, id: CriterionId, level: number) => levels[id] !== undefined && levels[id] <= level
const atLeast = (levels: Levels, id: CriterionId, level: number) => levels[id] !== undefined && levels[id] >= level
const weakWork = (l: Levels) => atMost(l, 'homework', 2) || atMost(l, 'involvement', 2)
const strongWork = (l: Levels) => atLeast(l, 'involvement', 3) || atLeast(l, 'homework', 3)

// The first matching combinations win; a criterion appears in one sentence only.
export const combinations: Combination[] = [
  {
    id: 'capableButNotWorking',
    matches: (l) => (atLeast(l, 'abilities', 3) || atLeast(l, 'reasoning', 3)) && weakWork(l),
    covers: ['abilities', 'reasoning', 'homework', 'involvement'],
    variants: [
      'Des capacités réelles, mais un travail insuffisant ne permet pas de les exploiter.',
      'Les capacités sont réelles, mais le manque de travail empêche de les exploiter.',
      'Les capacités sont là, mais le travail fourni ne permet pas de les mettre en valeur.',
    ],
    conclusions: [
      'Il faut fournir un travail à la hauteur de ces capacités.',
      'Un travail plus régulier permettrait d’en tirer profit.',
    ],
  },
  {
    id: 'progressToConfirm',
    matches: (l) => l.evolution === 4 && atMost(l, 'results', 2),
    covers: ['evolution', 'results'],
    variants: [
      'Les progrès sont nets, même si les résultats restent à consolider.',
      'Des progrès nets ce {p}, qu’il faut maintenant confirmer.',
    ],
    conclusions: ['Il faut poursuivre dans cette voie.', 'Ces efforts sont à poursuivre.'],
  },
  {
    id: 'effortsToPursue',
    matches: (l) => atMost(l, 'results', 2) && strongWork(l),
    covers: ['results', 'involvement', 'homework'],
    variants: [
      'Les résultats restent fragiles, mais les efforts fournis sont réels.',
      'Les efforts sont réels, même si les résultats ne les reflètent pas encore.',
      'Les résultats sont encore justes, malgré un investissement sérieux.',
    ],
    conclusions: ['Ces efforts doivent être poursuivis.', 'Il faut persévérer dans cette voie.'],
  },
  {
    id: 'goodButDisruptive',
    matches: (l) => atMost(l, 'behaviour', 2) && atLeast(l, 'results', 3),
    covers: ['behaviour', 'results', 'attention'],
    variants: [
      'Les résultats sont bons, mais les bavardages nuisent au travail en classe.',
      'De bons résultats, mais une attitude trop dissipée en classe.',
      'Les résultats sont satisfaisants, mais le comportement en classe doit changer.',
    ],
    conclusions: [
      'Une attitude plus calme permettrait de progresser encore.',
      'Il faut adopter une attitude plus calme en classe.',
    ],
  },
  {
    id: 'goodButDeclining',
    matches: (l) => l.evolution === 1 && atLeast(l, 'results', 3),
    covers: ['evolution', 'results'],
    variants: [
      'Les résultats restent corrects, mais sont en recul ce {p}.',
      'Un fléchissement est à noter, même si les résultats restent corrects.',
    ],
    conclusions: ['Un sursaut est attendu.', 'Il faut se ressaisir sans attendre.'],
  },
  {
    id: 'chattyAndDistracted',
    matches: (l) => atMost(l, 'behaviour', 2) && atMost(l, 'attention', 2),
    covers: ['behaviour', 'attention'],
    variants: [
      'Les bavardages et le manque de concentration nuisent au travail.',
      'L’agitation et les bavardages nuisent à la concentration.',
    ],
    conclusions: [
      'Une attitude plus calme et plus concentrée est attendue.',
      'Il faut adopter une attitude plus calme en classe.',
    ],
  },
]
