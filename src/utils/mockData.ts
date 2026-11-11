import type { Periode } from '../types';

/**
 * Empty default subjects for clean start without pre-filled notes
 * (as requested: "Au début, ne mets pas de notes, parce que justement les notes, je vais les rajouter moi")
 */
export const MOCK_PERIODES_LYCEE: Periode[] = [
  {
    codePeriode: 'A001',
    nom: 'Trimestre 1',
    matieres: [
      {
        codeMatiere: 'MATHS',
        discipline: 'Mathématiques',
        coef: 5,
        notes: [],
      },
      {
        codeMatiere: 'PHYSIQUE',
        discipline: 'Physique-Chimie',
        coef: 4,
        notes: [],
      },
      {
        codeMatiere: 'FRANCAIS',
        discipline: 'Français',
        coef: 4,
        notes: [],
      },
      {
        codeMatiere: 'HISTGEO',
        discipline: 'Histoire - Géographie',
        coef: 3,
        notes: [],
      },
      {
        codeMatiere: 'ANGLAIS',
        discipline: 'Anglais LV1',
        coef: 3,
        notes: [],
      },
      {
        codeMatiere: 'ESPAGNOL',
        discipline: 'Espagnol LV2',
        coef: 2,
        notes: [],
      },
      {
        codeMatiere: 'SVT',
        discipline: 'SVT',
        coef: 3,
        notes: [],
      },
      {
        codeMatiere: 'EPS',
        discipline: 'EPS',
        coef: 2,
        notes: [],
      },
      {
        codeMatiere: 'EMC',
        discipline: 'EMC',
        coef: 1,
        notes: [],
      },
    ],
  },
  {
    codePeriode: 'A002',
    nom: 'Trimestre 2',
    matieres: [
      { codeMatiere: 'MATHS', discipline: 'Mathématiques', coef: 5, notes: [] },
      { codeMatiere: 'PHYSIQUE', discipline: 'Physique-Chimie', coef: 4, notes: [] },
      { codeMatiere: 'FRANCAIS', discipline: 'Français', coef: 4, notes: [] },
      { codeMatiere: 'HISTGEO', discipline: 'Histoire - Géographie', coef: 3, notes: [] },
      { codeMatiere: 'ANGLAIS', discipline: 'Anglais LV1', coef: 3, notes: [] },
      { codeMatiere: 'ESPAGNOL', discipline: 'Espagnol LV2', coef: 2, notes: [] },
      { codeMatiere: 'SVT', discipline: 'SVT', coef: 3, notes: [] },
      { codeMatiere: 'EPS', discipline: 'EPS', coef: 2, notes: [] },
      { codeMatiere: 'EMC', discipline: 'EMC', coef: 1, notes: [] },
    ],
  },
  {
    codePeriode: 'A003',
    nom: 'Trimestre 3',
    matieres: [
      { codeMatiere: 'MATHS', discipline: 'Mathématiques', coef: 5, notes: [] },
      { codeMatiere: 'PHYSIQUE', discipline: 'Physique-Chimie', coef: 4, notes: [] },
      { codeMatiere: 'FRANCAIS', discipline: 'Français', coef: 4, notes: [] },
      { codeMatiere: 'HISTGEO', discipline: 'Histoire - Géographie', coef: 3, notes: [] },
      { codeMatiere: 'ANGLAIS', discipline: 'Anglais LV1', coef: 3, notes: [] },
      { codeMatiere: 'ESPAGNOL', discipline: 'Espagnol LV2', coef: 2, notes: [] },
      { codeMatiere: 'SVT', discipline: 'SVT', coef: 3, notes: [] },
      { codeMatiere: 'EPS', discipline: 'EPS', coef: 2, notes: [] },
      { codeMatiere: 'EMC', discipline: 'EMC', coef: 1, notes: [] },
    ],
  },
];
