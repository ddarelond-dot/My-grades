import { useState } from 'react';
import { Plus, Sparkles, Trash2, Edit3, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import type { Matiere } from '../types';
import { calculateSubjectAverage, formatGrade, normalizeTo20, parseGradeValue } from '../utils/calculator';

interface SubjectCardProps {
  matiere: Matiere;
  includeSimulated: boolean;
  onAddNote: (codeMatiere: string) => void;
  onSimulateNote: (codeMatiere: string) => void;
  onDeleteNote: (noteId: string) => void;
  onEditSubjectCoef: (matiere: Matiere) => void;
}

export function SubjectCard({
  matiere,
  includeSimulated,
  onAddNote,
  onSimulateNote,
  onDeleteNote,
  onEditSubjectCoef,
}: SubjectCardProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const subResult = calculateSubjectAverage(matiere, includeSimulated);
  const avg = subResult.average;
  const realAvg = subResult.realAverage;
  const hasNotes = avg !== null;

  const isPassing = avg !== null && avg >= 10;
  const isHigh = avg !== null && avg >= 14;

  return (
    <div className="bg-[#121218] rounded-2xl border border-[#232332] hover:border-[#2e2e42] transition-all shadow-lg overflow-hidden">
      {/* Subject Header */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1c1c28]">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#191924] border border-[#262638] text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <BookOpen className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-display font-bold text-white">
                {matiere.discipline}
              </h2>

              {/* Subject Coefficient Button in warm yellow accent */}
              <button
                onClick={() => onEditSubjectCoef(matiere)}
                title="Modifier le coefficient de cette matière"
                className="inline-flex items-center gap-1 text-xs font-display font-bold px-2.5 py-0.5 rounded-lg bg-yellow-400/10 text-yellow-300 border border-yellow-400/25 hover:bg-yellow-400/20 transition-all cursor-pointer"
              >
                <span>Coef {matiere.coef}</span>
                <Edit3 className="w-3 h-3 text-yellow-400/80" />
              </button>
            </div>

            {/* Metadata without pills */}
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-400 flex-wrap">
              {matiere.professeur && <span>{matiere.professeur}</span>}
              {matiere.professeur && <span aria-hidden="true" className="text-slate-600">·</span>}
              <span>{matiere.notes.length} {matiere.notes.length > 1 ? 'notes' : 'note'}</span>

              {matiere.moyenneClasse !== undefined && (
                <>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span>
                    Classe : <span className="font-display font-bold text-slate-300">{formatGrade(matiere.moyenneClasse)}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Score & Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-4">
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1.5">
              <span
                className={`text-2xl sm:text-3xl font-display font-black tracking-tight ${
                  !hasNotes
                    ? 'text-slate-600'
                    : isHigh
                    ? 'text-emerald-400'
                    : isPassing
                    ? 'text-white'
                    : 'text-yellow-400'
                }`}
              >
                {hasNotes ? formatGrade(avg) : '--,--'}
              </span>
              <span className="text-xs font-display font-bold text-slate-500">/ 20</span>
            </div>

            {subResult.hasSimulated && realAvg !== null && (
              <div className="text-[11px] text-slate-400 font-display">
                Sans simu : <span className="font-bold text-slate-300">{formatGrade(realAvg)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 bg-[#181824] p-1 rounded-xl border border-[#252538]">
            <button
              onClick={() => onSimulateNote(matiere.codeMatiere)}
              title="Simuler une note"
              className="p-1.5 text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={() => onAddNote(matiere.codeMatiere)}
              title="Ajouter une note"
              className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Réduire' : 'Déplier'}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Notes List */}
      {isExpanded && (
        <div className="divide-y divide-[#1c1c28]">
          {matiere.notes.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Aucune note saisie pour l instant.{' '}
              <button
                onClick={() => onAddNote(matiere.codeMatiere)}
                className="text-emerald-400 hover:underline font-semibold cursor-pointer ml-1"
              >
                + Ajouter une note
              </button>
            </div>
          ) : (
            matiere.notes.map(note => {
              const numVal = parseGradeValue(note.valeur);
              const noteSur = note.noteSur || 20;
              const valOn20 = numVal !== null ? normalizeTo20(numVal, noteSur) : null;
              const isDifferentBase = noteSur !== 20 && numVal !== null;

              return (
                <div
                  key={note.id}
                  className={`p-3.5 sm:px-5 flex items-center justify-between gap-4 transition-all ${
                    note.isSimulated
                      ? 'bg-yellow-500/5 border-l-2 border-yellow-400'
                      : 'hover:bg-[#161622]'
                  }`}
                >
                  {/* Left: Devoir title, date & metadata */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white truncate">
                        {note.devoir || 'Évaluation'}
                      </span>
                      {note.isSimulated && (
                        <span className="text-[10px] font-display font-extrabold px-1.5 py-0.2 rounded bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                          Simulée
                        </span>
                      )}
                      {note.nonSignificatif && (
                        <span className="text-[10px] text-slate-500 italic">
                          (Non significatif)
                        </span>
                      )}
                    </div>

                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                      <span>{note.date || 'Sans date'}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="text-yellow-400 font-display font-bold">
                        Coef {note.coef}
                      </span>
                      {note.moyenneClasse !== undefined && (
                        <>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span>
                            Classe :{' '}
                            <span className="font-display font-semibold text-slate-300">
                              {formatGrade(note.moyenneClasse)}/{noteSur}
                            </span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Note value & actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="flex items-baseline justify-end gap-1">
                        <span className="text-base sm:text-lg font-display font-black text-white">
                          {numVal !== null ? formatGrade(numVal, numVal % 1 === 0 ? 0 : 2) : String(note.valeur)}
                        </span>
                        <span className="text-xs text-slate-500 font-display font-bold">
                          / {noteSur}
                        </span>
                      </div>

                      {isDifferentBase && valOn20 !== null && (
                        <div className="text-[11px] text-emerald-400 font-display font-bold">
                          = {formatGrade(valOn20)}/20
                        </div>
                      )}
                    </div>

                    {/* Delete Note */}
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      title="Supprimer cette note"
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
