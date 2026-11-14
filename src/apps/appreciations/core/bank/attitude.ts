import type { CriterionBank, CriterionId } from '../model.ts'

export const attitudeBank: Partial<Record<CriterionId, CriterionBank>> = {
  participation: {
    levels: {
      1: ['La participation orale est inexistante.', 'Aucune participation orale n’est à noter.'],
      2: ['La participation orale reste trop rare.', '{Il|Elle} participe encore trop peu à l’oral.'],
      3: ['La participation orale est régulière.', '{Il|Elle} participe volontiers.'],
      4: ['La participation orale est riche et pertinente.', '{Il|Elle} participe volontiers et avec pertinence.'],
    },
    advice: ['Il faut participer davantage à l’oral.', 'Une participation plus active est attendue.'],
  },
  attention: {
    levels: {
      1: ['L’attention en classe fait défaut.', 'Le manque de concentration est très pénalisant.'],
      2: ['L’attention reste trop fluctuante.', 'La concentration est encore irrégulière.'],
      3: ['L’attention en classe est soutenue.', '{Il|Elle} est {attentif|attentive} en classe.'],
      4: ['L’attention en classe est constante.', '{Il|Elle} fait preuve d’une concentration remarquable.'],
    },
    advice: ['Il faut gagner en concentration en classe.', 'Une meilleure concentration en classe est indispensable.'],
  },
  behaviour: {
    levels: {
      1: [
        'Le comportement perturbe le cours.',
        'Les bavardages et l’agitation gênent le travail de la classe.',
      ],
      2: ['Les bavardages sont trop fréquents.', 'Le comportement manque encore de maîtrise.'],
      3: ['Le comportement en classe est correct.', 'L’attitude en classe est adaptée.'],
      4: ['Le comportement en classe est exemplaire.', 'L’attitude en classe est irréprochable.'],
    },
    advice: [
      'Il faut adopter une attitude plus calme en classe.',
      'Les bavardages doivent cesser pour permettre de progresser.',
    ],
  },
  respect: {
    levels: {
      1: ['Le respect des règles fait défaut.', 'Les règles de la classe ne sont pas respectées.'],
      2: ['Le respect des règles reste à améliorer.', 'Les règles de la classe sont parfois oubliées.'],
      3: ['Les règles de la classe sont respectées.', 'L’attitude envers les autres est respectueuse.'],
      4: ['L’attitude est très respectueuse des autres et des règles.', 'Le respect des autres est exemplaire.'],
    },
    advice: ['Il faut respecter les règles de la classe.', 'Le respect des règles et des autres est attendu.'],
  },
  groupwork: {
    levels: {
      1: ['Le travail en groupe pose de réelles difficultés.', 'La collaboration avec les autres est difficile.'],
      2: ['Le travail en groupe reste à améliorer.', 'L’implication dans les travaux de groupe est inégale.'],
      3: ['Le travail en groupe est constructif.', 'La collaboration avec les autres est efficace.'],
      4: ['Le travail en groupe est très constructif.', '{Il|Elle} sait fédérer et aider les autres.'],
    },
    advice: ['Il faut s’impliquer davantage dans le travail collectif.'],
  },
  attendance: {
    levels: {
      1: [
        'Les absences sont très nombreuses et pénalisantes.',
        'Les absences répétées compromettent les apprentissages.',
      ],
      2: ['Les absences sont trop nombreuses.', 'Des absences ont gêné la continuité des apprentissages.'],
      3: ['L’assiduité est satisfaisante.', 'La présence en cours est régulière.'],
      4: ['L’assiduité est irréprochable.', 'La présence en cours est exemplaire.'],
    },
    advice: [
      'Il faut être présent en cours avec régularité.',
      'Une présence régulière en cours est indispensable.',
    ],
  },
  punctuality: {
    levels: {
      1: ['Les retards sont très fréquents.', 'Les retards répétés ne sont pas acceptables.'],
      2: ['Les retards sont trop nombreux.', 'Des retards sont à déplorer.'],
      3: ['La ponctualité est satisfaisante.', 'Les cours commencent à l’heure.'],
      4: ['La ponctualité est irréprochable.', 'La ponctualité est exemplaire.'],
    },
    advice: ['Il faut arriver à l’heure en cours.', 'Une meilleure ponctualité est attendue.'],
  },
}
