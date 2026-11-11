import { Bell, X } from 'lucide-react';
import type { Note } from '../types';
import { formatGrade } from '../utils/calculator';

interface NewGradeNotificationProps {
  newGrades: Note[];
  onDismiss: () => void;
}

export function NewGradeNotification({ newGrades, onDismiss }: NewGradeNotificationProps) {
  if (newGrades.length === 0) return null;

  const first = newGrades[0];
  const count = newGrades.length;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full p-4 rounded-2xl bg-[#14141c] text-white shadow-2xl flex items-start gap-3.5 border border-emerald-500/40 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
        <Bell className="w-5 h-5 text-yellow-400 animate-bounce" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-display font-extrabold uppercase tracking-wider text-emerald-400">
          Nouvelle note EcoleDirecte détectée
        </div>
        <div className="text-sm font-semibold truncate mt-0.5 text-white">
          {first.discipline} · {first.devoir}
        </div>
        <div className="text-xs text-slate-300 font-display mt-0.5">
          Note : <span className="font-extrabold text-white text-sm">{typeof first.valeur === 'number' ? formatGrade(first.valeur) : first.valeur}/{first.noteSur}</span> <span className="text-yellow-400 font-bold">(Coef {first.coef})</span>
        </div>
        {count > 1 && (
          <div className="text-[11px] text-slate-400 mt-1">
            + {count - 1} autre(s) note(s) ajoutée(s) automatiquement
          </div>
        )}
      </div>

      <button
        onClick={onDismiss}
        className="p-1.5 text-slate-500 hover:text-white rounded-lg cursor-pointer shrink-0"
        title="Fermer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
