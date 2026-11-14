import type { CriterionBank, CriterionId } from '../model.ts'

export const workBank: Partial<Record<CriterionId, CriterionBank>> = {
  homework: {
    levels: {
      1: ['Le travail personnel est quasi inexistant.', 'Le travail à la maison fait largement défaut.'],
      2: ['Le travail personnel reste irrégulier.', 'Le travail à la maison est encore insuffisant.'],
      3: ['Le travail personnel est régulier.', 'Le travail à la maison est sérieux.'],
      4: ['Le travail personnel est sérieux et approfondi.', 'Le travail à la maison est d’une grande régularité.'],
    },
    advice: [
      'Il faut maintenant fournir un travail plus régulier à la maison.',
      'Un travail personnel régulier est indispensable pour progresser.',
    ],
  },
  involvement: {
    levels: {
      1: ['L’investissement est très insuffisant.', 'L’implication dans le travail fait défaut.'],
      2: ['L’investissement reste trop inégal.', 'L’implication manque encore de constance.'],
      3: ['L’investissement est réel.', '{Il|Elle} s’implique avec sérieux.'],
      4: ['L’investissement est exemplaire.', '{Il|Elle} s’implique pleinement dans le travail.'],
    },
    advice: ['Il faut s’investir davantage dans le travail.', 'Un engagement plus constant est attendu.'],
  },
  assignments: {
    levels: {
      1: ['De nombreux travaux ne sont pas rendus.', 'Les travaux demandés sont rarement rendus.'],
      2: ['Les travaux ne sont pas toujours rendus.', 'Plusieurs travaux ont été rendus en retard ou incomplets.'],
      3: ['Les travaux sont rendus avec sérieux.', 'Les travaux demandés sont rendus dans les délais.'],
      4: ['Les travaux rendus sont soignés et complets.', 'Les travaux rendus sont d’une grande qualité.'],
    },
    advice: [
      'Il faut rendre chaque travail demandé, dans les délais.',
      'Tous les travaux doivent être rendus à temps.',
    ],
  },
  organisation: {
    levels: {
      1: ['Le matériel est trop souvent oublié.', 'Le manque d’organisation pénalise fortement le travail.'],
      2: ['L’organisation reste à améliorer.', 'Le matériel est parfois oublié.'],
      3: ['Le travail est bien organisé.', 'Le matériel est toujours présent.'],
      4: ['L’organisation est exemplaire.', 'Le travail est remarquablement organisé.'],
    },
    advice: ['Il faut mieux s’organiser et avoir son matériel à chaque cours.'],
  },
  autonomy: {
    levels: {
      1: ['Le travail ne peut se faire sans aide.', 'L’autonomie fait encore défaut.'],
      2: ['L’autonomie reste à développer.', 'Le travail demande encore beaucoup d’accompagnement.'],
      3: ['Le travail est mené avec autonomie.', '{Il|Elle} sait travailler en autonomie.'],
      4: ['L’autonomie est remarquable.', '{Il|Elle} travaille avec une grande autonomie.'],
    },
    advice: ['Il faut gagner en autonomie face aux exercices.', 'Plus d’autonomie est attendue dans le travail.'],
  },
  curiosity: {
    levels: {
      1: ['La curiosité intellectuelle fait défaut.', 'Le travail se limite au strict minimum.'],
      2: ['Le travail manque encore d’approfondissement.', 'La curiosité reste peu sollicitée.'],
      3: ['La curiosité est appréciable.', 'Le travail témoigne d’une réelle curiosité.'],
      4: ['La curiosité intellectuelle est remarquable.', 'Les connaissances sont souvent approfondies.'],
    },
    advice: ['Il faut aller au-delà du minimum demandé.', 'Plus de curiosité enrichirait le travail.'],
  },
  perseverance: {
    levels: {
      1: ['Les difficultés entraînent trop vite un abandon.', 'La persévérance fait défaut.'],
      2: ['La persévérance reste à développer.', 'Les efforts s’arrêtent trop vite face aux difficultés.'],
      3: ['Les efforts sont soutenus face aux difficultés.', 'La persévérance est réelle.'],
      4: ['La persévérance est exemplaire.', 'Les difficultés sont abordées avec une belle ténacité.'],
    },
    advice: ['Il faut persévérer face aux difficultés.', 'Plus de ténacité face aux difficultés est attendue.'],
  },
}
