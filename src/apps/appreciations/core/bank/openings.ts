// Overall assessment, from the mean of the rated levels, results counting double.
export type Band = 'veryWeak' | 'weak' | 'average' | 'good' | 'excellent'

export function bandOf(mean: number): Band {
  if (mean < 1.75) return 'veryWeak'
  if (mean < 2.4) return 'weak'
  if (mean < 2.9) return 'average'
  if (mean < 3.5) return 'good'
  return 'excellent'
}

export const openings: Record<Band, string[]> = {
  veryWeak: ['{P} très insuffisant.', '{P} très difficile.', 'Bilan très insuffisant ce {p}.'],
  weak: ['{P} fragile.', '{P} insuffisant.', 'Bilan encore fragile ce {p}.'],
  average: ['{P} assez satisfaisant.', 'Ensemble correct ce {p}.', 'Bilan moyen ce {p}.'],
  good: ['Bon {p}.', '{P} satisfaisant dans l’ensemble.', 'Bon ensemble ce {p}.'],
  excellent: ['Excellent {p}.', 'Très bon {p}.', 'Très bon bilan ce {p}.'],
}

// Openings that do not judge, for a one-sided text whose side goes against the assessment.
export const neutralOpenings = ['Bilan du {p}.', 'Ce {p} appelle plusieurs remarques.']

// Closing sentences for the encouraging tone: they value what is done and look ahead, whatever the assessment.
export const encouragements: Record<Band, string[]> = {
  veryWeak: [
    'Les points d’appui existent : il faut s’en servir pour progresser.',
    'Avec des efforts réguliers, des progrès sont possibles.',
  ],
  weak: ['Les efforts engagés doivent être poursuivis.', 'Les bases sont là pour progresser au prochain {p}.'],
  average: ['Les progrès sont à portée, il faut persévérer.', 'Ces qualités permettront de progresser encore.'],
  good: ['C’est un bon travail, à poursuivre.', 'Il faut continuer ainsi.'],
  excellent: ['Il faut continuer ainsi.', 'C’est un travail de qualité, à poursuivre.'],
}

// Closing sentences when no criterion calls for a precise advice.
export const conclusions: Record<Band, string[]> = {
  veryWeak: [
    'Un travail sérieux et régulier est indispensable.',
    'Un changement d’attitude face au travail s’impose.',
  ],
  weak: ['Il faut fournir des efforts plus soutenus.', 'Un travail plus régulier permettrait de progresser.'],
  average: ['Il faut poursuivre les efforts.', 'Des efforts soutenus permettront de progresser.'],
  good: ['Il faut poursuivre dans cette voie.', 'C’est un bon travail, à poursuivre.', 'Il faut continuer ainsi.'],
  excellent: [
    'Il faut continuer ainsi.',
    'Il faut poursuivre dans cette voie.',
    'C’est un travail de qualité, à poursuivre.',
  ],
}
