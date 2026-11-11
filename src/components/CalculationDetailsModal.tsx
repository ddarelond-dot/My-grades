import { X, HelpCircle } from 'lucide-react';
import type { Matiere } from '../types';
import { calculateGeneralAverage, calculateSubjectAverage, formatGrade } from '../utils/calculator';

interface CalculationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  matieres: Matiere[];
  includeSimulated: boolean;
}

export function CalculationDetailsModal({
  isOpen,
  onClose,
  matieres,
  includeSimulated,
}: CalculationDetailsModalProps) {
  if (!isOpen) return null;

  const general = calculateGeneralAverage(matieres, includeSimulated);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#121218] rounded-3xl border border-[#262638] shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#1c1c28] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-white">
                Transparence du Calcul & Formules
              </h2>
              <div className="text-xs text-slate-400">
                Pondération exacte selon la méthode officielle
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Explanation 1 */}
          <div className="bg-[#181824] rounded-2xl p-4 border border-[#28283c]">
            <div className="text-xs font-display font-bold text-emerald-400 uppercase tracking-wider mb-1">
              1. Moyenne d une matière
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Chaque note est ramenée sur 20, puis multipliée par le coefficient de l évaluation :
            </p>
            <div className="bg-[#0e0e14] p-3 rounded-xl border border-[#262638] font-display text-xs text-center text-yellow-300 font-bold">
              Moyenne Matière = ∑ ( Note /20 × Coef Note ) ÷ ∑ ( Coef Notes )
            </div>
          </div>

          {/* Explanation 2 */}
          <div className="bg-[#181824] rounded-2xl p-4 border border-[#28283c]">
            <div className="text-xs font-display font-bold text-emerald-400 uppercase tracking-wider mb-1">
              2. Moyenne Générale
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Chaque moyenne de matière est multipliée par le coefficient de la discipline. Seules les matières ayant au moins une note valide sont prises en compte :
            </p>
            <div className="bg-[#0e0e14] p-3 rounded-xl border border-[#262638] font-display text-xs text-center text-yellow-300 font-bold">
              Moyenne Générale = ∑ ( Moyenne Matière × Coef Matière ) ÷ ∑ ( Coef Matières )
            </div>
          </div>

          {/* Table */}
          <div>
            <div className="text-xs font-display font-bold text-slate-300 mb-2">
              Détail par discipline :
            </div>
            <div className="border border-[#28283c] rounded-2xl overflow-hidden bg-[#161622]">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#1e1e2c] text-slate-400 font-display font-bold border-b border-[#2a2a3e]">
                  <tr>
                    <th className="p-3">Discipline</th>
                    <th className="p-3 text-right">Moyenne</th>
                    <th className="p-3 text-center">Coef</th>
                    <th className="p-3 text-right">Points pondérés</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222232] text-slate-200">
                  {matieres.map(m => {
                    const res = calculateSubjectAverage(m, includeSimulated);
                    if (res.average === null) return null;
                    const points = res.average * m.coef;

                    return (
                      <tr key={m.codeMatiere} className="hover:bg-[#1a1a26]">
                        <td className="p-3 font-semibold text-white">
                          {m.discipline}
                        </td>
                        <td className="p-3 text-right font-display font-bold text-emerald-400">
                          {formatGrade(res.average)} / 20
                        </td>
                        <td className="p-3 text-center font-display font-bold text-yellow-300">
                          {m.coef}
                        </td>
                        <td className="p-3 text-right font-display font-bold">
                          {formatGrade(points)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-[#1e1e2c] font-display font-bold border-t border-[#2a2a3e] text-white">
                  <tr>
                    <td className="p-3">Total & Moyenne Générale</td>
                    <td className="p-3 text-right font-extrabold text-emerald-400 text-sm">
                      {formatGrade(general.average)} / 20
                    </td>
                    <td className="p-3 text-center text-yellow-300">
                      {general.totalCoeff}
                    </td>
                    <td className="p-3 text-right">
                      {general.average !== null ? formatGrade(general.average * general.totalCoeff) : '-'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#1c1c28] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-display font-bold rounded-xl bg-white text-black hover:bg-slate-200 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
