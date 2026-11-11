import { useState, useMemo } from 'react';
import { X, Sparkles, Target, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Matiere, Note } from '../types';
import {
  calculateGeneralAverage,
  calculateSubjectAverage,
  calculateRequiredGradeForGeneralTarget,
  formatGrade,
} from '../utils/calculator';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  matieres: Matiere[];
  defaultCodeMatiere?: string;
  onAddSimulatedNote: (note: Partial<Note> & { codeMatiere: string }) => void;
  onClearAllSimulatedNotes: () => void;
  simulatedNotesCount: number;
}

export function SimulatorModal({
  isOpen,
  onClose,
  matieres,
  defaultCodeMatiere,
  onAddSimulatedNote,
  onClearAllSimulatedNotes,
  simulatedNotesCount,
}: SimulatorModalProps) {
  const [activeTab, setActiveTab] = useState<'simulate' | 'target'>('simulate');

  // Simulation Form State
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>(
    defaultCodeMatiere || (matieres[0]?.codeMatiere ?? '')
  );
  const [simTitle, setSimTitle] = useState('Prochain Devoir');
  const [simGradeVal, setSimGradeVal] = useState<number>(16);
  const [simNoteSur, setSimNoteSur] = useState<number>(20);
  const [simCoef, setSimCoef] = useState<number>(2);

  // Target Calculator State
  const [targetGenAverage, setTargetGenAverage] = useState<number>(14.0);
  const [targetSubjectCode, setTargetSubjectCode] = useState<string>(
    defaultCodeMatiere || (matieres[0]?.codeMatiere ?? '')
  );
  const [targetNoteCoef, setTargetNoteCoef] = useState<number>(2);
  const [targetNoteSur, setTargetNoteSur] = useState<number>(20);

  // Current general average without this prospective simulation
  const currentGeneral = useMemo(() => calculateGeneralAverage(matieres, true), [matieres]);

  // Projected subject and general average
  const projection = useMemo(() => {
    const targetMatiere = matieres.find(m => m.codeMatiere === selectedSubjectCode);
    if (!targetMatiere) return null;

    const currentSubResult = calculateSubjectAverage(targetMatiere, true);

    const prospectiveNote: Note = {
      id: 'temp_prospective',
      devoir: simTitle,
      codeMatiere: selectedSubjectCode,
      discipline: targetMatiere.discipline,
      date: new Date().toISOString().split('T')[0],
      valeur: simGradeVal,
      noteSur: simNoteSur,
      coef: simCoef,
      isSimulated: true,
    };

    const simulatedMatieres = matieres.map(m => {
      if (m.codeMatiere === selectedSubjectCode) {
        return {
          ...m,
          notes: [...m.notes, prospectiveNote],
        };
      }
      return m;
    });

    const newSubMatiere = simulatedMatieres.find(m => m.codeMatiere === selectedSubjectCode)!;
    const newSubResult = calculateSubjectAverage(newSubMatiere, true);
    const newGeneral = calculateGeneralAverage(simulatedMatieres, true);

    return {
      currentSubjectAvg: currentSubResult.average,
      newSubjectAvg: newSubResult.average,
      currentGeneralAvg: currentGeneral.average,
      newGeneralAvg: newGeneral.average,
      diffGeneral: newGeneral.average !== null && currentGeneral.average !== null
        ? newGeneral.average - currentGeneral.average
        : null,
      diffSubject: newSubResult.average !== null && currentSubResult.average !== null
        ? newSubResult.average - currentSubResult.average
        : null,
    };
  }, [matieres, selectedSubjectCode, simGradeVal, simNoteSur, simCoef, simTitle, currentGeneral]);

  // Target calculation result
  const targetResult = useMemo(() => {
    return calculateRequiredGradeForGeneralTarget(
      matieres,
      targetGenAverage,
      targetSubjectCode,
      targetNoteCoef,
      targetNoteSur
    );
  }, [matieres, targetGenAverage, targetSubjectCode, targetNoteCoef, targetNoteSur]);

  if (!isOpen) return null;

  const handleApplySimulation = () => {
    const targetMatiere = matieres.find(m => m.codeMatiere === selectedSubjectCode);
    if (!targetMatiere) return;

    onAddSimulatedNote({
      codeMatiere: selectedSubjectCode,
      discipline: targetMatiere.discipline,
      devoir: simTitle || 'Devoir simulé',
      valeur: simGradeVal,
      noteSur: simNoteSur,
      coef: simCoef,
      date: new Date().toISOString().split('T')[0],
      isSimulated: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#121218] rounded-3xl border border-[#262638] shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#1c1c28] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-white">
                Simulateur de Notes & Objectifs
              </h2>
              <div className="text-xs text-slate-400">
                Visualisez l impact immédiat sur votre moyenne
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

        {/* Tab switcher */}
        <div className="px-6 pt-5 pb-2">
          <div className="flex items-center gap-1.5 p-1 bg-[#0a0a0e] rounded-xl border border-[#222230]">
            <button
              onClick={() => setActiveTab('simulate')}
              className={`flex-1 py-2 text-xs font-display font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'simulate'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-black shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Simuler une note
            </button>
            <button
              onClick={() => setActiveTab('target')}
              className={`flex-1 py-2 text-xs font-display font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'target'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-300 text-black shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Calculer un objectif
            </button>
          </div>
        </div>

        {/* Tab 1: Prospective Simulation */}
        {activeTab === 'simulate' ? (
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-display font-bold text-slate-300 mb-1.5">
                Matière ciblée
              </label>
              <select
                value={selectedSubjectCode}
                onChange={e => setSelectedSubjectCode(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#29293c] bg-[#171722] text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {matieres.map(m => (
                  <option key={m.codeMatiere} value={m.codeMatiere}>
                    {m.discipline} (Coef {m.coef})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-display font-bold text-slate-300 mb-1.5">
                Titre de l évaluation
              </label>
              <input
                type="text"
                value={simTitle}
                onChange={e => setSimTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#29293c] bg-[#171722] text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                placeholder="ex: Prochain DS, Interro..."
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-display font-bold text-slate-300 mb-1.5">
                  Note espérée
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max={simNoteSur}
                  value={simGradeVal}
                  onChange={e => setSimGradeVal(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 text-base font-display font-extrabold text-emerald-400 rounded-xl border border-[#29293c] bg-[#171722] focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-display font-bold text-slate-300 mb-1.5">
                  Sur
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={simNoteSur}
                  onChange={e => setSimNoteSur(parseFloat(e.target.value) || 20)}
                  className="w-full px-3.5 py-2.5 text-base font-display font-extrabold text-white rounded-xl border border-[#29293c] bg-[#171722] focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-display font-bold text-slate-300 mb-1.5">
                  Coefficient note
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.25"
                  max="20"
                  value={simCoef}
                  onChange={e => setSimCoef(parseFloat(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 text-base font-display font-extrabold text-yellow-300 rounded-xl border border-[#29293c] bg-[#171722] focus:outline-hidden focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>

            {/* Projected Impact Card */}
            {projection && (
              <div className="bg-[#181824] rounded-2xl p-4 border border-[#28283c] space-y-3">
                <div className="text-[11px] font-display font-bold text-yellow-400 uppercase tracking-wider">
                  Impact projeté
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  {/* Subject Average Impact */}
                  <div className="bg-[#111118] p-3.5 rounded-xl border border-[#222232]">
                    <div className="text-xs text-slate-400">Moyenne Matière</div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-xs font-display font-bold text-slate-500 line-through">
                        {formatGrade(projection.currentSubjectAvg)}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-500 inline" />
                      <span className="text-lg font-display font-black text-white">
                        {formatGrade(projection.newSubjectAvg)}
                      </span>
                    </div>
                    {projection.diffSubject !== null && (
                      <div className={`text-xs font-display font-bold ${projection.diffSubject >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {projection.diffSubject >= 0 ? '+' : ''}{formatGrade(projection.diffSubject)} pts
                      </div>
                    )}
                  </div>

                  {/* General Average Impact */}
                  <div className="bg-[#111118] p-3.5 rounded-xl border border-[#222232]">
                    <div className="text-xs text-slate-400">Moyenne Générale</div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-xs font-display font-bold text-slate-500 line-through">
                        {formatGrade(projection.currentGeneralAvg)}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-500 inline" />
                      <span className="text-lg font-display font-black text-emerald-400">
                        {formatGrade(projection.newGeneralAvg)}
                      </span>
                    </div>
                    {projection.diffGeneral !== null && (
                      <div className={`text-xs font-display font-bold ${projection.diffGeneral >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {projection.diffGeneral >= 0 ? '+' : ''}{formatGrade(projection.diffGeneral)} pts
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              {simulatedNotesCount > 0 ? (
                <button
                  type="button"
                  onClick={onClearAllSimulatedNotes}
                  className="text-xs text-rose-400 hover:underline cursor-pointer"
                >
                  Effacer les {simulatedNotesCount} simulations
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={handleApplySimulation}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black shadow-md cursor-pointer"
                >
                  Appliquer la simulation
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Tab 2: Target Calculator */
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-display font-bold text-slate-300 mb-1.5">
                Moyenne Générale visée
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={targetGenAverage}
                  onChange={e => setTargetGenAverage(parseFloat(e.target.value) || 0)}
                  className="w-32 px-3.5 py-2 text-lg font-display font-black text-yellow-300 rounded-xl border border-[#29293c] bg-[#171722] focus:outline-hidden focus:ring-2 focus:ring-yellow-500"
                />
                <span className="text-sm font-display font-bold text-slate-400">/ 20</span>
                <span className="text-xs text-slate-500">
                  (Actuelle : {formatGrade(currentGeneral.average)}/20)
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-display font-bold text-slate-300 mb-1.5">
                Dans quelle matière passer le devoir ?
              </label>
              <select
                value={targetSubjectCode}
                onChange={e => setTargetSubjectCode(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#29293c] bg-[#171722] text-white focus:outline-hidden focus:ring-2 focus:ring-yellow-500"
              >
                {matieres.map(m => (
                  <option key={m.codeMatiere} value={m.codeMatiere}>
                    {m.discipline} (Coef {m.coef})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-display font-bold text-slate-300 mb-1.5">
                  Coefficient du devoir
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="10"
                  value={targetNoteCoef}
                  onChange={e => setTargetNoteCoef(parseFloat(e.target.value) || 1)}
                  className="w-full px-3.5 py-2 text-sm font-display font-bold rounded-xl border border-[#29293c] bg-[#171722] text-white focus:outline-hidden focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-display font-bold text-slate-300 mb-1.5">
                  Barème (sur)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={targetNoteSur}
                  onChange={e => setTargetNoteSur(parseFloat(e.target.value) || 20)}
                  className="w-full px-3.5 py-2 text-sm font-display font-bold rounded-xl border border-[#29293c] bg-[#171722] text-white focus:outline-hidden focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>

            {/* Target Calculator Result */}
            {targetResult && (
              <div className="bg-[#181824] rounded-2xl p-5 border border-[#28283c]">
                <div className="flex items-start gap-3.5">
                  {targetResult.feasible ? (
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-display font-bold text-slate-400 uppercase tracking-wider">
                      Note requise au prochain devoir
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl font-display font-black text-white">
                        {formatGrade(targetResult.requiredGradeOnBase)}
                      </span>
                      <span className="text-base font-display font-bold text-slate-500">
                        / {targetNoteSur}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-300">
                      {targetResult.requiredGradeOn20 <= 0 ? (
                        <span className="text-emerald-400 font-semibold">
                          Objectif déjà atteint ! Vous conservez cette moyenne même sans points supplémentaires.
                        </span>
                      ) : targetResult.requiredGradeOn20 <= 20 ? (
                        <span>
                          Obtenez au moins <span className="font-display font-bold text-emerald-400">{formatGrade(targetResult.requiredGradeOnBase)}/{targetNoteSur}</span> (coef {targetNoteCoef}) pour atteindre exactement {formatGrade(targetGenAverage)}/20.
                        </span>
                      ) : (
                        <span className="text-yellow-400 font-medium">
                          Note supérieure à 20/20 requise : un seul devoir ne suffira pas avec ce coefficient.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-display font-bold bg-white text-black rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Compris
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
