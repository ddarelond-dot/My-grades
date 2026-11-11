import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { Matiere, Note } from '../types';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  matieres: Matiere[];
  defaultCodeMatiere?: string;
  onAddNote: (note: Partial<Note> & { codeMatiere: string }) => void;
}

export function AddNoteModal({
  isOpen,
  onClose,
  matieres,
  defaultCodeMatiere,
  onAddNote,
}: AddNoteModalProps) {
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>(
    defaultCodeMatiere || (matieres[0]?.codeMatiere ?? '')
  );
  const [devoir, setDevoir] = useState('');
  const [valeur, setValeur] = useState<string>('15');
  const [noteSur, setNoteSur] = useState<number>(20);
  const [coef, setCoef] = useState<number>(1);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numVal = parseFloat(valeur.replace(',', '.'));
    if (isNaN(numVal) && !['abs', 'disp', 'ne'].includes(valeur.toLowerCase().trim())) {
      alert('Veuillez saisir une note valide ou une mention (Abs, Disp)');
      return;
    }

    const currentMatiere = matieres.find(m => m.codeMatiere === selectedSubjectCode);
    if (!currentMatiere) return;

    onAddNote({
      codeMatiere: selectedSubjectCode,
      discipline: currentMatiere.discipline,
      devoir: devoir || 'Évaluation',
      valeur: isNaN(numVal) ? valeur : numVal,
      noteSur: Number(noteSur) || 20,
      coef: Number(coef) || 1,
      date,
      isSimulated,
      source: 'manual',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#121218] rounded-3xl border border-[#262638] shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6 border-b border-[#1c1c28] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-white">
                Ajouter une note
              </h2>
              <div className="text-xs text-slate-400">
                Pondération automatique dans votre moyenne
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-display font-bold text-slate-300 mb-1.5">
              Matière
            </label>
            <select
              value={selectedSubjectCode}
              onChange={e => setSelectedSubjectCode(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#29293c] bg-[#171722] text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              {matieres.map(m => (
                <option key={m.codeMatiere} value={m.codeMatiere}>
                  {m.discipline} (Matière Coef {m.coef})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-display font-bold text-slate-300 mb-1.5">
              Intitulé de l évaluation
            </label>
            <input
              type="text"
              required
              value={devoir}
              onChange={e => setDevoir(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#29293c] bg-[#171722] text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              placeholder="ex: DS 1, DM de synthèse, Contrôle..."
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-display font-bold text-slate-300 mb-1.5">
                Note
              </label>
              <input
                type="text"
                required
                value={valeur}
                onChange={e => setValeur(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base font-display font-black text-emerald-400 rounded-xl border border-[#29293c] bg-[#171722] focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                placeholder="15.5"
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
                required
                value={noteSur}
                onChange={e => setNoteSur(parseFloat(e.target.value) || 20)}
                className="w-full px-3.5 py-2.5 text-base font-display font-extrabold text-white rounded-xl border border-[#29293c] bg-[#171722] focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-display font-bold text-slate-300 mb-1.5">
                Coefficient note
              </label>
              <input
                type="number"
                step="0.25"
                min="0.1"
                max="20"
                required
                value={coef}
                onChange={e => setCoef(parseFloat(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 text-base font-display font-extrabold text-yellow-300 rounded-xl border border-[#29293c] bg-[#171722] focus:outline-hidden focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-display font-bold text-slate-300 mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#29293c] bg-[#171722] text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isSimulated}
                onChange={e => setIsSimulated(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-[#29293c] bg-[#171722]"
              />
              <span>Note simulée (marquer comme hypothèse d entraînement)</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1c1c28]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-display font-bold bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black rounded-xl shadow-md cursor-pointer"
            >
              Enregistrer la note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
