import type { CriterionBank, CriterionId } from '../model.ts'

export const resultsBank: Partial<Record<CriterionId, CriterionBank>> = {
  results: {
    levels: {
      1: ['Les résultats sont très insuffisants.', 'Les évaluations révèlent de grandes difficultés.'],
      2: [
        'Les résultats restent fragiles.',
        'Les évaluations montrent encore des lacunes.',
        'Les notes sont trop justes.',
      ],
      3: ['Les résultats sont corrects.', 'Les évaluations sont globalement réussies.', 'Les notes sont honorables.'],
      4: [
        'Les résultats sont excellents.',
        'Les évaluations sont très bien réussies.',
        '{Il|Elle} obtient de très bons résultats.',
      ],
    },
    advice: ['Il faut consolider les bases pour progresser.', 'Les notions non acquises sont à reprendre.'],
  },
  evolution: {
    levels: {
      1: ['Les résultats sont en recul ce {p}.', 'Un net fléchissement est à noter.'],
      2: ['Le niveau reste stable.', 'Les résultats sont stables par rapport au début de l’année.'],
      3: ['Des progrès sont visibles ce {p}.', 'Les résultats progressent.'],
      4: ['Les progrès sont nets ce {p}.', 'La progression est remarquable.'],
    },
    advice: [
      'Il faut se ressaisir sans attendre.',
      'Un sursaut est nécessaire dès le prochain {p}.',
      'Il faut retrouver rapidement le niveau attendu.',
    ],
  },
  abilities: {
    levels: {
      1: ['Les bases nécessaires font encore largement défaut.', 'Les difficultés sont importantes.'],
      2: ['Les capacités restent à affermir.', 'Les savoir-faire de base ne sont pas encore assurés.'],
      3: ['Les capacités sont réelles.', '{Il|Elle} dispose de bonnes capacités.'],
      4: ['Les capacités sont remarquables.', 'Les aptitudes sont excellentes.'],
    },
    advice: ['Il faut reprendre les exercices de base pour gagner en assurance.'],
  },
  knowledge: {
    levels: {
      1: ['Les connaissances ne sont pas acquises.', 'Les notions essentielles ne sont pas maîtrisées.'],
      2: ['Les connaissances restent fragiles.', 'Les notions du cours sont encore mal maîtrisées.'],
      3: ['Les connaissances sont bien acquises.', 'Les notions du cours sont maîtrisées.'],
      4: ['Les connaissances sont solides et précises.', 'Les notions du cours sont parfaitement maîtrisées.'],
    },
    advice: [
      'Il faut apprendre les leçons de façon plus approfondie.',
      'Un apprentissage régulier des leçons est indispensable.',
    ],
  },
  reasoning: {
    levels: {
      1: ['Le raisonnement manque encore de logique.', 'La réflexion reste très superficielle.'],
      2: ['La réflexion manque encore de profondeur.', 'Le raisonnement reste trop peu rigoureux.'],
      3: ['Le raisonnement est juste.', 'La réflexion est pertinente.'],
      4: ['Le raisonnement est fin et rigoureux.', 'La réflexion est d’une grande maturité.'],
    },
    advice: ['Il faut prendre le temps d’argumenter et de justifier chaque réponse.'],
  },
  writing: {
    levels: {
      1: ['L’expression écrite est très insuffisante.', 'Les écrits sont souvent confus et peu soignés.'],
      2: ['L’expression écrite manque de clarté.', 'Les écrits gagneraient à être plus soignés.'],
      3: ['L’expression écrite est claire.', 'Les écrits sont clairs et bien construits.'],
      4: ['L’expression écrite est précise et soignée.', 'Les écrits sont d’une grande qualité.'],
    },
    advice: [
      'Il faut soigner la rédaction et relire chaque copie.',
      'Une relecture attentive des copies est nécessaire.',
    ],
  },
  speaking: {
    levels: {
      1: ['L’expression orale est très hésitante.', 'La prise de parole reste très difficile.'],
      2: ['L’expression orale manque encore d’aisance.', 'La prise de parole reste hésitante.'],
      3: ['L’expression orale est claire.', 'La prise de parole est aisée.'],
      4: ['L’expression orale est remarquable.', 'La prise de parole est claire et convaincante.'],
    },
    advice: ['Il faut oser prendre la parole plus souvent.'],
  },
  method: {
    levels: {
      1: ['Le travail manque de méthode.', 'L’absence de méthode pénalise le travail.'],
      2: ['La méthode reste encore approximative.', 'Le travail manque encore de rigueur.'],
      3: ['Le travail est méthodique.', 'La méthode est bien maîtrisée.'],
      4: ['La rigueur et la méthode sont exemplaires.', 'Le travail est mené avec une grande rigueur.'],
    },
    advice: ['Il faut gagner en méthode et en rigueur.', 'Plus de rigueur permettrait de mieux réussir.'],
  },
}
