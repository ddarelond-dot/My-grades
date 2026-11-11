import { RefreshCw, UserCheck, School, Sparkles, Sliders } from 'lucide-react';
import type { EcoleDirecteSession } from '../types';

interface HeaderProps {
  session: EcoleDirecteSession | null;
  isSyncing: boolean;
  onSync: () => void;
  onOpenEcoleDirecteModal: () => void;
  onOpenSimulatorModal: () => void;
  onOpenCoefModal: () => void;
  activeView: 'dashboard' | 'analytics';
  setActiveView: (view: 'dashboard' | 'analytics') => void;
}

export function Header({
  session,
  isSyncing,
  onSync,
  onOpenEcoleDirecteModal,
  onOpenSimulatorModal,
  onOpenCoefModal,
  activeView,
  setActiveView,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#09090c]/90 backdrop-blur-xl border-b border-[#1f1f2a] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark: MyGrade — Ma Moyenne */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-yellow-400 p-[1.5px] shadow-sm">
            <div className="w-full h-full bg-[#0d0d12] rounded-[10px] flex items-center justify-center font-display font-black text-lg text-emerald-400">
              MG
            </div>
          </div>
          <div className="leading-none">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-extrabold text-xl tracking-tight text-white">
                MyGrade
              </span>
              <span className="text-[11px] font-medium text-emerald-400 font-display uppercase tracking-widest">
                Ma Moyenne
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`whitespace-nowrap transition-all py-1 cursor-pointer flex items-center gap-2 ${
              activeView === 'dashboard'
                ? 'text-white font-semibold border-b-2 border-emerald-400'
                : 'hover:text-white'
            }`}
          >
            <span>Matières & Notes</span>
          </button>

          <button
            onClick={onOpenSimulatorModal}
            className="whitespace-nowrap transition-colors hover:text-white py-1 cursor-pointer flex items-center gap-1.5 text-slate-300 hover:text-yellow-300"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>Simulateur</span>
          </button>

          <button
            onClick={onOpenCoefModal}
            className="whitespace-nowrap transition-colors hover:text-white py-1 cursor-pointer flex items-center gap-1.5 text-slate-300"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Coefficients</span>
          </button>

          <button
            onClick={() => setActiveView('analytics')}
            className={`whitespace-nowrap transition-all py-1 cursor-pointer flex items-center gap-2 ${
              activeView === 'analytics'
                ? 'text-white font-semibold border-b-2 border-emerald-400'
                : 'hover:text-white'
            }`}
          >
            <span>Statistiques</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action buttons */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Sync Button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            title={session ? 'Actualiser les notes depuis EcoleDirecte' : 'Actualiser'}
            className="p-2.5 text-slate-400 hover:text-emerald-400 hover:bg-[#161622] rounded-xl border border-transparent hover:border-[#2a2a3c] transition-all cursor-pointer disabled:opacity-50"
            aria-label="Synchroniser les notes"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* EcoleDirecte Connection Button */}
          <button
            onClick={onOpenEcoleDirecteModal}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              session
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/80 shadow-xs'
                : 'bg-gradient-to-r from-emerald-500 to-yellow-400 hover:from-emerald-400 hover:to-yellow-300 text-black font-bold shadow-md shadow-emerald-950/50 hover:shadow-emerald-900/80'
            }`}
          >
            {session ? (
              <>
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>{session.account.prenom || 'Connecté'}</span>
                <span className="text-[11px] opacity-75">({session.account.classe})</span>
              </>
            ) : (
              <>
                <School className="w-4 h-4" />
                <span>EcoleDirecte</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
