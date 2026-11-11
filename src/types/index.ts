export interface Note {
  id: string;
  devoir: string;
  codeMatiere: string;
  discipline: string;
  date: string;
  valeur: number | string; // 15.5 or "Abs", "Disp", "NE"
  noteSur: number; // 20, 10, 40, etc.
  coef: number; // e.g. 1, 2, 0.5
  nonSignificatif?: boolean;
  moyenneClasse?: number;
  minClasse?: number;
  maxClasse?: number;
  isSimulated?: boolean;
  source?: 'ecoledirecte' | 'manual';
}

export interface Matiere {
  codeMatiere: string;
  discipline: string;
  coef: number; // Coefficient de la matière dans la moyenne générale
  color?: string;
  professeur?: string;
  notes: Note[];
  moyenneClasse?: number;
  moyenneMin?: number;
  moyenneMax?: number;
}

export interface Periode {
  codePeriode: string;
  nom: string; // e.g. "Trimestre 1", "Trimestre 2", "Année Complète"
  matieres: Matiere[];
  cloture?: boolean;
}

export interface EcoleDirecteStudent {
  id: number;
  nom: string;
  prenom: string;
  classe: string;
  photo?: string;
}

export interface EcoleDirecteSession {
  token: string;
  account: EcoleDirecteStudent;
  allStudents?: EcoleDirecteStudent[];
  lastSync?: string;
  autoSyncEnabled?: boolean;
  autoSyncIntervalMinutes?: number;
}

export interface SubjectAverageResult {
  average: number | null; // out of 20
  totalCoeff: number;
  notesCount: number;
  realAverage: number | null; // without simulated notes
  hasSimulated: boolean;
}

export interface GeneralAverageResult {
  average: number | null; // out of 20
  totalCoeff: number;
  matieresCount: number;
  realAverage: number | null;
  hasSimulated: boolean;
  mention: string;
  classAverage: number | null;
  deltaVsClass: number | null;
}
