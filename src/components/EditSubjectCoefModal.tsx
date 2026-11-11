import { useState } from 'react';
import { X, Sliders, Plus, Trash2 } from 'lucide-react';
import type { Matiere } from '../types';

interface EditSubjectCoefModalProps {
  isOpen: boolean;
  onClose: () => void;
  matieres: Matiere[];
  onUpdateCoef: (codeMatiere: string, newCoef: number) => void;
  onAddNewSubject: (discipline: string, coef: number) => void;
  onRemoveSubject?: (codeMatiere: string) => void;
}

export function EditSubjectCoefModal({
  isOpen,
  onClose,
  matieres,
  onUpdateCoef,
  onAddNewSubject,
  onRemoveSubject,
}: EditSubjectCoefModalProps) {
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCoef, setNewSubjectCoef] = useState(2);
  const [localCoefs, setLocalCoefs] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    matieres.forEach(m => {
      map[m.codeMatiere] = m.coef;
    });
    return map;
  });

  if (!isOpen) return null;

  const handleCoefChange = (codeMatiere: string, val: number) => {
    setLocalCoefs(prev => ({ ...prev, [codeMatiere]: val }));
    onUpdateCoef(codeMatiere, val);
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    onAddNewSubject(newSubjectName.trim(), Number(newSubjectCoef) || 1);
    setNewSubjectName('');
    setNewSubjectCoef(2);
  };

  const applyPreset = (preset: 'lycee1ere' | 'terminale' | 'college' | 'equal') => {
    matieres.forEach(m => {
      let c = 1;
      const lower = m.discipline.toLowerCase();
      if (preset === 'lycee1ere') {
        if (lower.includes('math')) c = 5;
        else if (lower.includes('physique') || lower.includes('chimie')) c = 4;
        else if (lower.includes('français')) c = 4;
        else if (lower.includes('histoire') || lower.includes('géo')) c = 3;
        else if (lower.includes('anglais') || lower.includes('lv1')) c = 3;
        else if (lower.includes('svt') || lower.includes('ses')) c = 3;
        else if (lower.includes('espagnol') || lower.includes('allemand') || lower.includes('lv2')) c = 2;
        else if (lower.includes('eps')) c = 2;
        else if (lower.includes('emc')) c = 1;
      } else if (preset === 'terminale') {
        if (lower.includes('spécialité') || lower.includes('spé')) c = 16;
        else if (lower.includes('philo')) c = 8;
        else if (lower.includes('histoire') || lower.includes('géo')) c = 3;
        else if (lower.includes('lv1') || lower.includes('anglais')) c = 3;
        else if (lower.includes('lv2')) c = 3;
        else if (lower.includes('scientifique')) c = 3;
        else if (lower.includes('eps')) c = 6;
      } else if (preset === 'college') {
        if (lower.includes('math') || lower.includes('français')) c = 4;
        else if (lower.includes('histoire') || lower.includes('anglais')) c = 3;
        else if (lower.includes('svt') || lower.includes('physique')) c = 2;
        else c = 1;
      } else if (preset === 'equal') {
        c = 1;
      }
      handleCoefChange(m.codeMatiere, c);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#121218] rounded-3xl border border-[#262638] shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#1c1c28] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-white">
                Coefficients des Matières
              </h2>
              <div className="text-xs text-slate-400">
                Poids de chaque matière dans votre moyenne générale
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

        {/* Presets */}
        <div className="p-4 bg-[#161622] border-b border-[#1f1f2e]">
          <div className="text-[11px] font-display font-bold text-yellow-400 uppercase tracking-wider mb-2">
            Modèles rapides :
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => applyPreset('lycee1ere')}
              className="px-3 py-1.5 text-xs font-display font-semibold rounded-lg bg-[#202030] text-slate-300 hover:text-white border border-[#2e2e42] cursor-pointer"
            >
              1ère Générale
            </button>
            <button
              onClick={() => applyPreset('terminale')}
              className="px-3 py-1.5 text-xs font-display font-semibold rounded-lg bg-[#202030] text-slate-300 hover:text-white border border-[#2e2e42] cursor-pointer"
            >
              Terminale (Bac)
            </button>
            <button
              onClick={() => applyPreset('college')}
              className="px-3 py-1.5 text-xs font-display font-semibold rounded-lg bg-[#202030] text-slate-300 hover:text-white border border-[#2e2e42] cursor-pointer"
            >
              Collège
            </button>
            <button
              onClick={() => applyPreset('equal')}
              className="px-3 py-1.5 text-xs font-display font-semibold rounded-lg bg-[#202030] text-slate-300 hover:text-white border border-[#2e2e42] cursor-pointer"
            >
              Tous coef 1
            </button>
          </div>
        </div>

        {/* Subject Coefs List */}
        <div className="flex-1 overflow-y-auto p-5 divide-y divide-[#1c1c28]">
          {matieres.map(m => (
            <div key={m.codeMatiere} className="py-3 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white truncate">
                  {m.discipline}
                </div>
                <div className="text-xs text-slate-500 font-display">
                  {m.notes.length} note(s)
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-yellow-400 font-display font-bold">Coef :</span>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="30"
                  value={localCoefs[m.codeMatiere] ?? m.coef}
                  onChange={e => handleCoefChange(m.codeMatiere, parseFloat(e.target.value) || 1)}
                  className="w-20 px-2.5 py-1.5 text-sm font-display font-extrabold text-center text-yellow-300 rounded-xl border border-[#2a2a3e] bg-[#171722] focus:outline-hidden focus:ring-2 focus:ring-yellow-500"
                />
                {onRemoveSubject && m.notes.length === 0 && (
                  <button
                    onClick={() => onRemoveSubject(m.codeMatiere)}
                    title="Supprimer la matière vide"
                    className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add custom subject form */}
        <form onSubmit={handleCreateSubject} className="p-4 bg-[#161622] border-t border-[#1f1f2e]">
          <div className="text-xs font-display font-bold text-slate-300 mb-2">
            Ajouter une nouvelle matière (ex: Option Latin, DNL, Chinois...)
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Nom de la discipline"
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-[#2a2a3e] bg-[#101016] text-white"
            />
            <input
              type="number"
              placeholder="Coef"
              min="0.5"
              max="20"
              value={newSubjectCoef}
              onChange={e => setNewSubjectCoef(parseFloat(e.target.value) || 1)}
              className="w-20 px-2 py-2 text-xs font-display font-bold text-center text-yellow-300 rounded-xl border border-[#2a2a3e] bg-[#101016]"
            />
            <button
              type="submit"
              className="flex items-center gap-1 px-3.5 py-2 text-xs font-display font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-black cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter</span>
            </button>
          </div>
        </form>

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
