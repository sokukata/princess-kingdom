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
