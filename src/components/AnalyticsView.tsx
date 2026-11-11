import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import type { Matiere, GeneralAverageResult } from '../types';
import { calculateSubjectAverage, formatGrade } from '../utils/calculator';

interface AnalyticsViewProps {
  matieres: Matiere[];
  generalResult: GeneralAverageResult;
  includeSimulated: boolean;
}

export function AnalyticsView({
  matieres,
  generalResult,
  includeSimulated,
}: AnalyticsViewProps) {
  // Compute comparison stats
  const subjectComparisons = matieres
    .map(m => {
      const res = calculateSubjectAverage(m, includeSimulated);
      if (res.average === null) return null;
      const classAvg = m.moyenneClasse ?? null;
      const delta = classAvg !== null ? res.average - classAvg : null;

      return {
        code: m.codeMatiere,
        name: m.discipline,
        coef: m.coef,
        studentAvg: res.average,
        classAvg,
        delta,
        min: m.moyenneMin ?? null,
        max: m.moyenneMax ?? null,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // Distribution of grades
  const distribution = {
    tresBien: 0, // >= 16
    bien: 0, // 14 to 15.99
    assezBien: 0, // 12 to 13.99
    moyen: 0, // 10 to 11.99
    insuffisant: 0, // < 10
  };

  let totalGrades = 0;

  for (const m of matieres) {
    for (const n of m.notes) {
      if (n.nonSignificatif) continue;
      if (!includeSimulated && n.isSimulated) continue;
      if (typeof n.valeur === 'number') {
        const on20 = (n.valeur / (n.noteSur || 20)) * 20;
        totalGrades++;
        if (on20 >= 16) distribution.tresBien++;
        else if (on20 >= 14) distribution.bien++;
        else if (on20 >= 12) distribution.assezBien++;
        else if (on20 >= 10) distribution.moyen++;
        else distribution.insuffisant++;
      }
    }
  }

  const avg = generalResult.average;
  const targets = [
    { label: 'Mention Très Bien', target: 16.0 },
    { label: 'Mention Bien', target: 14.0 },
    { label: 'Mention Assez Bien', target: 12.0 },
    { label: 'Admis', target: 10.0 },
  ];

  return (
    <div className="space-y-6">
      {/* Target Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {targets.map(t => {
          const reached = avg !== null && avg >= t.target;
          const diff = avg !== null ? avg - t.target : null;

          return (
            <div
              key={t.label}
              className={`p-5 rounded-2xl border transition-all ${
                reached
                  ? 'bg-emerald-950/30 border-emerald-500/40'
                  : 'bg-[#121218] border-[#232332]'
              }`}
            >
              <div className="text-xs font-display font-bold text-slate-400">
                {t.label}
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-display font-black text-white">
                  {formatGrade(t.target, 0)}/20
                </span>
                {diff !== null ? (
                  <span
                    className={`text-xs font-display font-bold ${
                      reached ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {reached ? `Atteint (+${formatGrade(diff)})` : `À ${formatGrade(Math.abs(diff))} pts`}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 font-display">En attente</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Subject Comparison Chart */}
      <div className="bg-[#121218] rounded-3xl border border-[#232332] p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between pb-5 border-b border-[#1c1c28]">
          <div>
            <h2 className="text-base font-display font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Comparaison avec la moyenne de classe</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Écart de vos notes par rapport à la classe
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-400" />
              <span className="text-slate-300">Votre note</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-yellow-400" />
              <span className="text-slate-300">Classe</span>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {subjectComparisons.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              Aucune moyenne enregistrée pour le moment.
            </div>
          ) : (
            subjectComparisons.map(item => {
              const studentPct = Math.min(100, (item.studentAvg / 20) * 100);
              const classPct = item.classAvg !== null ? Math.min(100, (item.classAvg / 20) * 100) : null;

              return (
                <div key={item.code} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{item.name}</span>
                      <span className="text-yellow-400 text-[11px] font-display font-bold">(Coef {item.coef})</span>
                    </div>
                    <div className="flex items-center gap-3 font-display">
                      <span className="font-bold text-emerald-400">
                        {formatGrade(item.studentAvg)}/20
                      </span>
                      {item.classAvg !== null && (
                        <span className="text-slate-400 text-[11px]">
                          classe : {formatGrade(item.classAvg)}
                        </span>
                      )}
                      {item.delta !== null && (
                        <span
                          className={`font-extrabold text-[11px] flex items-center ${
                            item.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {item.delta >= 0 ? '+' : ''}{formatGrade(item.delta)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress bars */}
                  <div className="relative h-3 w-full bg-[#1c1c28] rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-300"
                      style={{ width: `${studentPct}%` }}
                    />
                    {classPct !== null && (
                      <div
                        className="absolute top-0 bottom-0 w-1.5 bg-yellow-400 z-10 rounded-full"
                        style={{ left: `${classPct}%` }}
                        title={`Classe: ${item.classAvg}/20`}
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Grade distribution */}
      <div className="bg-[#121218] rounded-3xl border border-[#232332] p-6 sm:p-8 shadow-xl">
        <h2 className="text-base font-display font-bold text-white mb-1">
          Répartition de vos notes
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Total : {totalGrades} note(s) comptabilisée(s)
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="bg-[#171722] p-4 rounded-2xl border border-[#242436] text-center">
            <div className="text-3xl font-display font-black text-emerald-400">
              {distribution.tresBien}
            </div>
            <div className="text-[11px] font-display font-bold text-slate-200 mt-1">
              ≥ 16 / 20
            </div>
            <div className="text-[10px] text-slate-500">Excellent</div>
          </div>

          <div className="bg-[#171722] p-4 rounded-2xl border border-[#242436] text-center">
            <div className="text-3xl font-display font-black text-emerald-300">
              {distribution.bien}
            </div>
            <div className="text-[11px] font-display font-bold text-slate-200 mt-1">
              14 - 16 / 20
            </div>
            <div className="text-[10px] text-slate-500">Bien</div>
          </div>

          <div className="bg-[#171722] p-4 rounded-2xl border border-[#242436] text-center">
            <div className="text-3xl font-display font-black text-yellow-300">
              {distribution.assezBien}
            </div>
            <div className="text-[11px] font-display font-bold text-slate-200 mt-1">
              12 - 14 / 20
            </div>
            <div className="text-[10px] text-slate-500">Assez bien</div>
          </div>

          <div className="bg-[#171722] p-4 rounded-2xl border border-[#242436] text-center">
            <div className="text-3xl font-display font-black text-yellow-400">
              {distribution.moyen}
            </div>
            <div className="text-[11px] font-display font-bold text-slate-200 mt-1">
              10 - 12 / 20
            </div>
            <div className="text-[10px] text-slate-500">Moyen</div>
          </div>

          <div className="bg-[#171722] p-4 rounded-2xl border border-[#242436] text-center col-span-2 sm:col-span-1">
            <div className="text-3xl font-display font-black text-rose-400">
              {distribution.insuffisant}
            </div>
            <div className="text-[11px] font-display font-bold text-slate-200 mt-1">
              &lt; 10 / 20
            </div>
            <div className="text-[10px] text-slate-500">À retravailler</div>
          </div>
        </div>
      </div>
    </div>
  );
}
