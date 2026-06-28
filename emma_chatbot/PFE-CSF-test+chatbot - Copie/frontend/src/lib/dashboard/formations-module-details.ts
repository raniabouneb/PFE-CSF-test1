export type CourseStatus = 'Terminé' | 'En cours' | 'À faire' | 'Soumission en attente';
export type CourseType = 'Cours' | 'Lab' | 'Test' | 'Projet';

export interface ModuleCourseItem {
  id: string;
  title: string;
  progressPercent: number;
  description: string;
  typeLabel: CourseType;
  duration: string;
  status: CourseStatus;
}

export interface ModuleDayAttendance {
  day: number;
  weekdayShort: string;
  status: 'present' | 'absent' | 'free';
}

export interface ModuleDetail {
  id: string;
  badges: string[];
  title: string;
  levelLabel: string;
  description: string;
  courses: ModuleCourseItem[];
  stats: {
    coursPercent: number;
    labsPercent: number;
    testsTotal: number;
    testsPassed: number;
    testsFailed: number;
  };
  attendanceLegend: string;
  attendanceDays: ModuleDayAttendance[];
}

const october2026Weekday = (day: number): string => {
  const d = new Date(2026, 9, day);
  return ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'][d.getDay()];
};

function buildOctoberDays(
  seed: (day: number) => 'present' | 'absent' | 'free'
): ModuleDayAttendance[] {
  return Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    return {
      day,
      weekdayShort: october2026Weekday(day),
      status: seed(day),
    };
  });
}

export const MODULE_DETAILS: Record<string, ModuleDetail> = {
  m1: {
    id: 'm1',
    badges: ['Reconversion métier', 'Module 3 sur 8 en cours'],
    title: 'Analyse prédictive & régression',
    levelLabel: 'Intermédiaire',
    description:
      'Ce module introduit les méthodes de régression, l’évaluation des modèles et les bonnes pratiques de mise en production. Vous alternez classes virtuelles, travaux guidés et mises en situation pour consolider les fondamentaux.',
    courses: [
      {
        id: 'c1',
        title: 'Régression linéaire et évaluation des modèles',
        progressPercent: 100,
        description: 'Classe virtuelle + support PDF + quiz intermédiaire',
        typeLabel: 'Cours',
        duration: '2h30',
        status: 'Terminé',
      },
      {
        id: 'c2',
        title: 'Régularisation et sélection de variables',
        progressPercent: 74,
        description: 'Notebook guidé + jeu de données fourni',
        typeLabel: 'Lab',
        duration: '3h',
        status: 'En cours',
      },
      {
        id: 'c3',
        title: 'Projet tutoré — scoring crédit',
        progressPercent: 0,
        description: 'Livrable à déposer sur la plateforme',
        typeLabel: 'Projet',
        duration: '6h',
        status: 'À faire',
      },
      {
        id: 'c4',
        title: 'Évaluation intermédiaire',
        progressPercent: 52,
        description: 'QCM + cas pratique chronométré',
        typeLabel: 'Test',
        duration: '1h15',
        status: 'Soumission en attente',
      },
    ],
    stats: {
      coursPercent: 68,
      labsPercent: 86,
      testsTotal: 4,
      testsPassed: 3,
      testsFailed: 1,
    },
    attendanceLegend: 'Vert = présent • Rouge = absent',
    attendanceDays: buildOctoberDays((day) => {
      if (day % 7 === 0 || day % 11 === 0) return 'absent';
      if (day % 5 === 0) return 'free';
      return 'present';
    }),
  },
  m2: {
    id: 'm2',
    badges: ['Reconversion métier', 'Module 2 sur 8 en cours'],
    title: 'Python & analyse exploratoire',
    levelLabel: 'Fondamental',
    description:
      'Manipulation de données avec Python (pandas, visualisations), préparation des jeux de données et premiers contrôles qualité avant modélisation.',
    courses: [
      {
        id: 'c1',
        title: 'Python pour la data : bases et environnement',
        progressPercent: 100,
        description: 'Vidéos + exercices corrigés',
        typeLabel: 'Cours',
        duration: '2h',
        status: 'Terminé',
      },
      {
        id: 'c2',
        title: 'EDA et visualisation',
        progressPercent: 45,
        description: 'Lab sur notebook Jupyter',
        typeLabel: 'Lab',
        duration: '4h',
        status: 'En cours',
      },
    ],
    stats: { coursPercent: 55, labsPercent: 45, testsTotal: 2, testsPassed: 1, testsFailed: 0 },
    attendanceLegend: 'Vert = présent • Rouge = absent',
    attendanceDays: buildOctoberDays((d) => (d % 6 === 0 ? 'absent' : 'present')),
  },
  m3: {
    id: 'm3',
    badges: ['Reconversion métier', 'Module 1 sur 8 démarré'],
    title: 'Machine Learning appliqué',
    levelLabel: 'Avancé',
    description:
      'Algorithmes supervisés, validation croisée et interprétation des métriques. Mise en œuvre sur cas réels avec focus sur la robustesse du modèle.',
    courses: [
      {
        id: 'c1',
        title: 'Arbres, forêts et boosting',
        progressPercent: 12,
        description: 'Cours + lab associé',
        typeLabel: 'Cours',
        duration: '3h',
        status: 'En cours',
      },
    ],
    stats: { coursPercent: 12, labsPercent: 0, testsTotal: 1, testsPassed: 0, testsFailed: 0 },
    attendanceLegend: 'Vert = présent • Rouge = absent',
    attendanceDays: buildOctoberDays((d) => (d % 4 === 0 ? 'free' : 'present')),
  },
  p1: {
    id: 'p1',
    badges: ['Formation ponctuelle', 'Module certifiant'],
    title: 'Fondamentaux Agile & rôles Scrum',
    levelLabel: 'Tous niveaux',
    description:
      'Comprendre les cérémonies Agile, les rôles du framework Scrum et les indicateurs de suivi d’équipe.',
    courses: [
      {
        id: 'c1',
        title: 'Introduction Agile & manifeste',
        progressPercent: 100,
        description: 'Classe virtuelle enregistrée',
        typeLabel: 'Cours',
        duration: '1h30',
        status: 'Terminé',
      },
    ],
    stats: { coursPercent: 100, labsPercent: 100, testsTotal: 1, testsPassed: 1, testsFailed: 0 },
    attendanceLegend: 'Vert = présent • Rouge = absent',
    attendanceDays: buildOctoberDays(() => 'present'),
  },
  p2: {
    id: 'p2',
    badges: ['Formation ponctuelle', 'Atelier pratique'],
    title: 'Atelier & mise en situation',
    levelLabel: 'Pratique',
    description:
      'Mise en situation sur un backlog, estimation et animation d’un sprint fictif avec debriefing.',
    courses: [
      {
        id: 'c1',
        title: 'Simulation sprint & rétrospective',
        progressPercent: 78,
        description: 'Atelier collaboratif sur Miro',
        typeLabel: 'Lab',
        duration: '5h',
        status: 'En cours',
      },
    ],
    stats: { coursPercent: 78, labsPercent: 90, testsTotal: 0, testsPassed: 0, testsFailed: 0 },
    attendanceLegend: 'Vert = présent • Rouge = absent',
    attendanceDays: buildOctoberDays((d) => (d % 9 === 0 ? 'absent' : 'present')),
  },
};

export function getModuleDetail(id: string): ModuleDetail | undefined {
  return MODULE_DETAILS[id];
}
