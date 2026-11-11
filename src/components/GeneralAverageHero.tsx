import { Award, TrendingUp, TrendingDown, HelpCircle, Sparkles, Plus, Eye, EyeOff, Zap } from 'lucide-react';
import type { GeneralAverageResult, Matiere } from '../types';
import { formatGrade, calculateSubjectAverage } from '../utils/calculator';

interface GeneralAverageHeroProps {
  generalResult: GeneralAverageResult;
  matieres: Matiere[];
  includeSimulated: boolean;
  onToggleIncludeSimulated: () => void;
  onOpenSimulator: () => void;
  onOpenAddNote: () => void;
  onOpenCalcDetails: () => void;
  onOpenEcoleDirecte: () => void;
  simulatedNotesCount: number;
}

export function GeneralAverageHero({
  generalResult,
  matieres,
  includeSimulated,
  onToggleIncludeSimulated,
  onOpenSimulator,
  onOpenAddNote,
  onOpenCalcDetails,
  onOpenEcoleDirecte,
  simulatedNotesCount,
}: GeneralAverageHeroProps) {
  // Find top and lowest subject
  let bestMatiere: { name: string; avg: number } | null = null;
  let lowestMatiere: { name: string; avg: number } | null = null;

  for (const m of matieres) {
    const res = calculateSubjectAverage(m, includeSimulated);
    if (res.average !== null) {
      if (!bestMatiere || res.average > bestMatiere.avg) {
        bestMatiere = { name: m.discipline, avg: res.average };
      }
      if (!lowestMatiere || res.average < lowestMatiere.avg) {
        lowestMatiere = { name: m.discipline, avg: res.average };
      }
    }
  }

  const avgNum = generalResult.average;
  const hasNotes = avgNum !== null;
  const isGood = avgNum !== null && avgNum >= 14;
  const isPassing = avgNum !== null && avgNum >= 10;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#111117] border border-[#232332] p-6 sm:p-9 shadow-2xl transition-all">
      {/* Background ambient light aura (emerald green & golden yellow glows) */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top bar within Hero */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-7 border-b border-[#1f1f2e]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="text-emerald-400">Pondération officielle</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{generalResult.matieresCount} matières notées</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Total coefficients : {generalResult.totalCoeff}</span>
          </div>

          <h1 className="mt-1.5 text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-white">
            Moyenne Générale
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-lg">
            Calcul en temps réel de votre vraie moyenne avec coefficients par matière et par note.
          </p>
        </div>

        {/* Action Controls in sleek dark/green/yellow styling */}
        <div className="flex flex-wrap items-center gap-2.5">
          {simulatedNotesCount > 0 && (
            <button
              onClick={onToggleIncludeSimulated}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer border ${
                includeSimulated
                  ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/25'
                  : 'bg-[#181824] text-slate-400 border-[#2a2a3e] hover:text-white'
              }`}
            >
              {includeSimulated ? <Eye className="w-3.5 h-3.5 text-yellow-400" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>Simulations ({simulatedNotesCount})</span>
            </button>
          )}

          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-[#181824] hover:bg-[#202030] text-yellow-300 border border-yellow-500/30 hover:border-yellow-400/50 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>Simulateur & Objectif</span>
          </button>

          <button
            onClick={onOpenAddNote}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Ajouter une note</span>
          </button>
        </div>
      </div>

      {/* Main Score & Metrics */}
      <div className="relative z-10 pt-7 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Prominent Score Zone with Outfit Display Font */}
        <div className="md:col-span-5 flex items-baseline gap-4">
          <div className="font-display font-black text-6xl sm:text-7xl tracking-tight text-white">
            {hasNotes ? (
              <span className="bg-gradient-to-r from-white via-slate-100 to-emerald-300 bg-clip-text text-transparent">
                {formatGrade(avgNum)}
              </span>
            ) : (
              <span className="text-slate-600 font-extrabold">--,--</span>
            )}
          </div>

          <div className="flex flex-col">
            <span className="font-display text-2xl sm:text-3xl font-extrabold text-slate-500">
              / 20
            </span>
          </div>

          {/* Mention or Status tag */}
          <div className="ml-2 pl-4 border-l border-[#242436]">
            {hasNotes ? (
              <>
                <div className="flex items-center gap-1.5">
                  <Award className={`w-4 h-4 ${isGood ? 'text-yellow-400' : isPassing ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${isGood ? 'text-yellow-400' : isPassing ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {generalResult.mention}
                  </span>
                </div>
                {generalResult.hasSimulated && generalResult.realAverage !== null && (
                  <div className="mt-1 text-xs text-slate-400">
                    Réelle : <span className="font-display font-bold text-white">{formatGrade(generalResult.realAverage)}</span>
                    {avgNum !== null && (
                      <span className={`ml-1 font-display font-semibold ${avgNum >= generalResult.realAverage ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ({avgNum >= generalResult.realAverage ? '+' : ''}{formatGrade(avgNum - generalResult.realAverage)})
                      </span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-slate-400">
                <span className="text-yellow-400 font-semibold">Prêt pour vos notes</span>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Ajoutez vos notes ou connectez EcoleDirecte
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Highlights & Quick Stats */}
        <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          {/* Class Average or Prompt */}
          <div className="bg-[#161622] rounded-2xl p-4 border border-[#232334]">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Moyenne classe
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-xl font-display font-extrabold text-white">
                {generalResult.classAverage !== null ? formatGrade(generalResult.classAverage) : '-'}
              </span>
              {generalResult.deltaVsClass !== null && (
                <span
                  className={`text-xs font-display font-bold flex items-center ${
                    generalResult.deltaVsClass >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {generalResult.deltaVsClass >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5 inline" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 mr-0.5 inline" />
                  )}
                  {generalResult.deltaVsClass >= 0 ? '+' : ''}
                  {formatGrade(generalResult.deltaVsClass)}
                </span>
              )}
            </div>
          </div>

          {/* Best Subject */}
          <div className="bg-[#161622] rounded-2xl p-4 border border-[#232334]">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Discipline phare
            </div>
            <div className="mt-1.5">
              {bestMatiere ? (
                <>
                  <div className="text-xs font-semibold text-slate-200 truncate" title={bestMatiere.name}>
                    {bestMatiere.name}
                  </div>
                  <div className="text-base font-display font-bold text-emerald-400 mt-0.5">
                    {formatGrade(bestMatiere.avg)} / 20
                  </div>
                </>
              ) : (
                <span className="text-xs text-slate-500">En attente de notes</span>
              )}
            </div>
          </div>

          {/* Area of progress or sync CTA */}
          <div className="bg-[#161622] rounded-2xl p-4 border border-[#232334] col-span-2 sm:col-span-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Formule</span>
              <button
                onClick={onOpenCalcDetails}
                className="text-[11px] text-yellow-400 hover:text-yellow-300 flex items-center gap-0.5 cursor-pointer"
              >
                <HelpCircle className="w-3 h-3" />
                <span>Détail</span>
              </button>
            </div>
            <div className="mt-1.5">
              {lowestMatiere ? (
                <>
                  <div className="text-xs font-semibold text-slate-200 truncate" title={lowestMatiere.name}>
                    {lowestMatiere.name}
                  </div>
                  <div className="text-base font-display font-bold text-yellow-400 mt-0.5">
                    {formatGrade(lowestMatiere.avg)} / 20
                  </div>
                </>
              ) : (
                <button
                  onClick={onOpenEcoleDirecte}
                  className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Zap className="w-3 h-3 text-yellow-400" />
                  <span>Importer EcoleDirecte</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
