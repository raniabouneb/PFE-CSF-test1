export interface PendingCertRow {
  id: string;
  certification: string;
  type: string;
  date: string;
  score: string;
  result: 'failed' | 'pending';
  resultLabel: string;
  docStatus: string;
}

export interface LinkedCertCard {
  id: string;
  category: string;
  title: string;
  description: string;
  status: 'unlocked' | 'available' | 'locked';
}

export interface ReadyCertificateItem {
  id: string;
  title: string;
  description: string;
  status?: "validated" | "pending_admin" | "rejected";
  pdfPath?: string | null;
}

export const READY_CERTIFICATES: ReadyCertificateItem[] = [
  {
    id: '1',
    title: 'Docker Foundations',
    description: 'Parcours sur mesure · Edition signée par CSF',
  },
  {
    id: '2',
    title: 'Docker Foundations',
    description: 'Parcours sur mesure · Edition signée par CSF',
  },
];

export const PENDING_CERTIFICATIONS: PendingCertRow[] = [
  {
    id: '1',
    certification: 'Data Analyst Foundation',
    type: 'Liée à une reconversion',
    date: '25 oct 2024',
    score: '58%',
    result: 'failed',
    resultLabel: 'Non réussi',
    docStatus: 'Aucun certificat généré',
  },
  {
    id: '2',
    certification: 'Docker Associate',
    type: 'Liée à une reconversion',
    date: '18 sept 2024',
    score: '58%',
    result: 'failed',
    resultLabel: 'Non réussi',
    docStatus: 'Aucun certificat généré',
  },
  {
    id: '3',
    certification: 'Scrum Foundation',
    type: 'Formation ponctuelle',
    date: '03 juil 2024',
    score: '81%',
    result: 'pending',
    resultLabel: 'En validation',
    docStatus: 'Prêt après contrôle admin',
  },
];

export const LINKED_CERTIFICATIONS: LinkedCertCard[] = [
  {
    id: '1',
    category: 'Liées aux parcours',
    title: 'Data Analyst Foundation',
    description: 'Débloquée après validation du module 2.',
    status: 'unlocked',
  },
  {
    id: '2',
    category: 'Liées aux parcours',
    title: 'Certification Kubernetes Ops',
    description: 'Disponible une fois le lab « Déploiement » validé.',
    status: 'available',
  },
  {
    id: '3',
    category: 'Liées aux parcours',
    title: 'Scrum Master Professional',
    description: 'À débloquer : terminer le module Méthodes agiles.',
    status: 'locked',
  },
  {
    id: '4',
    category: 'Liées aux parcours',
    title: 'Security Essentials',
    description: 'À débloquer : compléter le parcours sensibilisation.',
    status: 'locked',
  },
];

export const LINKED_CERTIFICATIONS_SECTION_INTRO =
  'Les certifications ci-dessous sont reliées à vos formations inscrites. Le statut indique si vous pouvez passer l’examen officiel.';
