import type { Matiere, Note, SubjectAverageResult, GeneralAverageResult } from '../types';

/**
 * Parse any grade value (e.g. "15,5", "15.5", 15.5) into a valid numeric grade or null if non-numeric/absence
 */
export function parseGradeValue(val: string | number | undefined | null): number | null {
  if (val === undefined || val === null) return null;
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }
  const cleanStr = String(val).trim().replace(',', '.');
  if (['abs', 'disp', 'ne', 'nn', 'non note', 'non-note', ''].includes(cleanStr.toLowerCase())) {
    return null;
  }
  const num = parseFloat(cleanStr);
  return isNaN(num) ? null : num;
}

/**
 * Normalizes a note to a standard /20 scale
 */
export function normalizeTo20(valeur: number, noteSur: number): number {
  if (!noteSur || noteSur <= 0) return valeur;
  return (valeur / noteSur) * 20;
}

/**
 * Calculates average for a single subject, both with and without simulated notes
 */
export function calculateSubjectAverage(
  matiere: Matiere,
  includeSimulated: boolean = true
): SubjectAverageResult {
  let totalPointsReal = 0;
  let totalCoeffReal = 0;
  let realCount = 0;

  let totalPointsSim = 0;
  let totalCoeffSim = 0;
  let simCount = 0;
  let hasSimulated = false;

  for (const note of matiere.notes) {
    if (note.nonSignificatif) continue;
    const numVal = parseGradeValue(note.valeur);
    if (numVal === null) continue; // Absent / Dispensé

    const noteSur = note.noteSur || 20;
    const coef = note.coef || 1;
    const valOn20 = normalizeTo20(numVal, noteSur);

    if (note.isSimulated) {
      hasSimulated = true;
      if (includeSimulated) {
        totalPointsSim += valOn20 * coef;
        totalCoeffSim += coef;
        simCount++;
      }
    } else {
      totalPointsReal += valOn20 * coef;
      totalCoeffReal += coef;
      realCount++;

      // Real notes also count toward simulated total
      totalPointsSim += valOn20 * coef;
      totalCoeffSim += coef;
      simCount++;
    }
  }

  const realAvg = totalCoeffReal > 0 ? totalPointsReal / totalCoeffReal : null;
  const simAvg = totalCoeffSim > 0 ? totalPointsSim / totalCoeffSim : null;

  return {
    average: includeSimulated && hasSimulated ? simAvg : realAvg,
    totalCoeff: includeSimulated && hasSimulated ? totalCoeffSim : totalCoeffReal,
    notesCount: includeSimulated && hasSimulated ? simCount : realCount,
    realAverage: realAvg,
    hasSimulated,
  };
}

/**
 * Returns French academic mention based on average /20
 */
export function getMention(average: number | null): string {
  if (average === null) return 'Aucune note';
  if (average >= 16) return 'Très Bien (Félicitations)';
  if (average >= 14) return 'Bien (Compliments)';
  if (average >= 12) return 'Assez Bien (Encouragements)';
  if (average >= 10) return 'Admis (Moyenne)';
  if (average >= 8) return 'Insuffisant (Rattrapage possible)';
  return 'En grande difficulté';
}

/**
 * Calculates overall general average across all subjects with their coefficients
 */
export function calculateGeneralAverage(
  matieres: Matiere[],
  includeSimulated: boolean = true
): GeneralAverageResult {
  let sumWeightedAverages = 0;
  let sumSubjectCoeffs = 0;
  let activeMatieresCount = 0;

  let sumWeightedReal = 0;
  let sumRealSubjectCoeffs = 0;
  let realMatieresCount = 0;

  let hasAnySimulated = false;

  let sumClassWeighted = 0;
  let sumClassCoeffs = 0;

  for (const matiere of matieres) {
    const subRes = calculateSubjectAverage(matiere, includeSimulated);
    const subCoef = matiere.coef > 0 ? matiere.coef : 1;

    if (subRes.hasSimulated) {
      hasAnySimulated = true;
    }

    if (subRes.average !== null) {
      sumWeightedAverages += subRes.average * subCoef;
      sumSubjectCoeffs += subCoef;
      activeMatieresCount++;
    }

    if (subRes.realAverage !== null) {
      sumWeightedReal += subRes.realAverage * subCoef;
      sumRealSubjectCoeffs += subCoef;
      realMatieresCount++;
    }

    if (matiere.moyenneClasse !== undefined && matiere.moyenneClasse !== null) {
      sumClassWeighted += matiere.moyenneClasse * subCoef;
      sumClassCoeffs += subCoef;
    }
  }

  const average = sumSubjectCoeffs > 0 ? sumWeightedAverages / sumSubjectCoeffs : null;
  const realAverage = sumRealSubjectCoeffs > 0 ? sumWeightedReal / sumRealSubjectCoeffs : null;
  const classAverage = sumClassCoeffs > 0 ? sumClassWeighted / sumClassCoeffs : null;

  const effectiveAvg = includeSimulated && hasAnySimulated ? average : realAverage;
  const deltaVsClass = effectiveAvg !== null && classAverage !== null ? effectiveAvg - classAverage : null;

  return {
    average: effectiveAvg,
    totalCoeff: includeSimulated && hasAnySimulated ? sumSubjectCoeffs : sumRealSubjectCoeffs,
    matieresCount: includeSimulated && hasAnySimulated ? activeMatieresCount : realMatieresCount,
    realAverage,
    hasSimulated: hasAnySimulated,
    mention: getMention(effectiveAvg),
    classAverage,
    deltaVsClass,
  };
}

/**
 * Calculates the required grade in a subject to reach a target general average
 */
export function calculateRequiredGradeForGeneralTarget(
  matieres: Matiere[],
  targetGeneralAvg: number,
  targetCodeMatiere: string,
  futureNoteCoeff: number = 1,
  futureNoteSur: number = 20
): { requiredGradeOn20: number; requiredGradeOnBase: number; feasible: boolean } | null {
  const targetMatiere = matieres.find(m => m.codeMatiere === targetCodeMatiere);
  if (!targetMatiere) return null;

  const targetMatiereCoef = targetMatiere.coef > 0 ? targetMatiere.coef : 1;

  // 1. Calculate sum of other subjects weighted average
  let sumOtherWeighted = 0;
  let sumTotalSubjectCoefs = 0;

  for (const m of matieres) {
    const mCoef = m.coef > 0 ? m.coef : 1;
    if (m.codeMatiere !== targetCodeMatiere) {
      const avgRes = calculateSubjectAverage(m, false);
      if (avgRes.average !== null) {
        sumOtherWeighted += avgRes.average * mCoef;
        sumTotalSubjectCoefs += mCoef;
      }
    }
  }

  // Include target matiere coefficient
  sumTotalSubjectCoefs += targetMatiereCoef;

  // Target general average = (sumOtherWeighted + targetMatiereAvg * targetMatiereCoef) / sumTotalSubjectCoefs
  // => targetMatiereAvg * targetMatiereCoef = targetGeneralAvg * sumTotalSubjectCoefs - sumOtherWeighted
  // => targetMatiereAvg = (targetGeneralAvg * sumTotalSubjectCoefs - sumOtherWeighted) / targetMatiereCoef
  const targetSubjectAvg = (targetGeneralAvg * sumTotalSubjectCoefs - sumOtherWeighted) / targetMatiereCoef;

  // Now calculate what grade on this subject produces targetSubjectAvg:
  // targetSubjectAvg = (currentPoints + gradeOn20 * futureNoteCoeff) / (currentCoeff + futureNoteCoeff)
  // => gradeOn20 * futureNoteCoeff = targetSubjectAvg * (currentCoeff + futureNoteCoeff) - currentPoints
  // => gradeOn20 = [targetSubjectAvg * (currentCoeff + futureNoteCoeff) - currentPoints] / futureNoteCoeff
  let currentPoints = 0;
  let currentCoeff = 0;

  for (const n of targetMatiere.notes) {
    if (n.nonSignificatif) continue;
    const val = parseGradeValue(n.valeur);
    if (val === null) continue;
    const val20 = normalizeTo20(val, n.noteSur || 20);
    const c = n.coef || 1;
    currentPoints += val20 * c;
    currentCoeff += c;
  }

  const newTotalCoeff = currentCoeff + futureNoteCoeff;
  const requiredGradeOn20 = (targetSubjectAvg * newTotalCoeff - currentPoints) / futureNoteCoeff;
  const requiredGradeOnBase = (requiredGradeOn20 / 20) * futureNoteSur;

  return {
    requiredGradeOn20: Math.round(requiredGradeOn20 * 100) / 100,
    requiredGradeOnBase: Math.round(requiredGradeOnBase * 100) / 100,
    feasible: requiredGradeOn20 >= 0 && requiredGradeOn20 <= 20,
  };
}

/**
 * Format a number to French decimal representation (e.g. "14,35")
 */
export function formatGrade(num: number | null | undefined, digits: number = 2): string {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return num.toFixed(digits).replace('.', ',');
}
