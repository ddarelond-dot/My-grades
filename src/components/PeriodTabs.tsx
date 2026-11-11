import { Calendar } from 'lucide-react';
import type { Periode } from '../types';

interface PeriodTabsProps {
  periodes: Periode[];
  activePeriodCode: string;
  onSelectPeriod: (code: string) => void;
  showAllOption?: boolean;
}

export function PeriodTabs({
  periodes,
  activePeriodCode,
  onSelectPeriod,
  showAllOption = true,
}: PeriodTabsProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Segmented Control */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#0e0e14] rounded-2xl border border-[#232332] overflow-x-auto">
        {periodes.map(p => {
          const isActive = activePeriodCode === p.codePeriode;
          const notesCount = p.matieres.reduce((acc, m) => acc + m.notes.length, 0);

          return (
            <button
              key={p.codePeriode}
              onClick={() => onSelectPeriod(p.codePeriode)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-display font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-black shadow-md shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-[#181822]'
              }`}
            >
              <span>{p.nom}</span>
              <span className={`text-[11px] font-display font-extrabold px-1.5 py-0.2 rounded-md ${
                isActive ? 'bg-black/20 text-black' : 'bg-[#181822] text-slate-500'
              }`}>
                {notesCount}
              </span>
            </button>
          );
        })}

        {showAllOption && periodes.length > 1 && (
          <button
            onClick={() => onSelectPeriod('ALL')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-display font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activePeriodCode === 'ALL'
                ? 'bg-gradient-to-r from-yellow-400 to-amber-300 text-black shadow-md shadow-yellow-950/50'
                : 'text-slate-400 hover:text-white hover:bg-[#181822]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Année Complète</span>
          </button>
        )}
      </div>

      <div className="text-xs text-slate-500 flex items-center gap-2">
        <span>Sélectionnez votre période pour gérer vos notes</span>
      </div>
    </div>
  );
}
