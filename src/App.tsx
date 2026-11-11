import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Periode, Matiere, Note, EcoleDirecteSession } from './types';
import { MOCK_PERIODES_LYCEE } from './utils/mockData';
import { EcoleDirecteService } from './services/ecoleDirecteService';
import { calculateGeneralAverage } from './utils/calculator';
import { Header } from './components/Header';
import { GeneralAverageHero } from './components/GeneralAverageHero';
import { PeriodTabs } from './components/PeriodTabs';
import { SubjectCard } from './components/SubjectCard';
import { SimulatorModal } from './components/SimulatorModal';
import { AddNoteModal } from './components/AddNoteModal';
import { EditSubjectCoefModal } from './components/EditSubjectCoefModal';
import { CalculationDetailsModal } from './components/CalculationDetailsModal';
import { EcoleDirecteModal } from './components/EcoleDirecteModal';
import { AnalyticsView } from './components/AnalyticsView';
import { NewGradeNotification } from './components/NewGradeNotification';
import { Plus, Sliders, Search, Trash2, RotateCcw } from 'lucide-react';

export default function App() {
  // Always dark theme as requested ("Je veux un truc plus sombre, plus stylé, avec du vert, du jaune et du noir")
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Session & Periodes state
  const [session, setSession] = useState<EcoleDirecteSession | null>(() => {
    return EcoleDirecteService.loadSession();
  });

  // Load periodes: default to MOCK_PERIODES_LYCEE (which has 0 notes by default)
  const [periodes, setPeriodes] = useState<Periode[]>(() => {
    const cached = EcoleDirecteService.loadPeriodesCache();
    // If cached exists and is not the old mock with preloaded notes, use it
    if (cached && cached.length > 0) {
      return cached;
    }
    return MOCK_PERIODES_LYCEE;
  });

  const [activePeriodCode, setActivePeriodCode] = useState<string>(() => {
    return periodes[0]?.codePeriode || 'A001';
  });

  const [includeSimulated, setIncludeSimulated] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeView, setActiveView] = useState<'dashboard' | 'analytics'>('dashboard');

  // Modals state
  const [isEcoleDirecteModalOpen, setIsEcoleDirecteModalOpen] = useState(false);
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isEditCoefModalOpen, setIsEditCoefModalOpen] = useState(false);
  const [isCalcDetailsModalOpen, setIsCalcDetailsModalOpen] = useState(false);
  const [modalDefaultSubject, setModalDefaultSubject] = useState<string | undefined>(undefined);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [newlyDetectedGrades, setNewlyDetectedGrades] = useState<Note[]>([]);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(true);
  const [autoSyncInterval, setAutoSyncInterval] = useState<number>(5);

  // Active period resolution
  const currentPeriod = useMemo<Periode>(() => {
    if (activePeriodCode === 'ALL') {
      const matieresMap = new Map<string, Matiere>();
      for (const p of periodes) {
        for (const m of p.matieres) {
          if (!matieresMap.has(m.codeMatiere)) {
            matieresMap.set(m.codeMatiere, {
              ...m,
              notes: [...m.notes],
            });
          } else {
            const existing = matieresMap.get(m.codeMatiere)!;
            existing.notes = [...existing.notes, ...m.notes];
          }
        }
      }
      return {
        codePeriode: 'ALL',
        nom: 'Année Complète',
        matieres: Array.from(matieresMap.values()),
      };
    }

    const found = periodes.find(p => p.codePeriode === activePeriodCode);
    return found || periodes[0] || { codePeriode: 'A001', nom: 'Trimestre 1', matieres: [] };
  }, [periodes, activePeriodCode]);

  // Filtered matieres by search query
  const displayedMatieres = useMemo(() => {
    if (!searchQuery.trim()) return currentPeriod.matieres;
    const q = searchQuery.toLowerCase().trim();
    return currentPeriod.matieres.filter(
      m => m.discipline.toLowerCase().includes(q) || m.codeMatiere.toLowerCase().includes(q)
    );
  }, [currentPeriod.matieres, searchQuery]);

  // Overall calculations for active period
  const generalResult = useMemo(() => {
    return calculateGeneralAverage(currentPeriod.matieres, includeSimulated);
  }, [currentPeriod.matieres, includeSimulated]);

  // Count simulated notes in active period
  const simulatedNotesCount = useMemo(() => {
    return currentPeriod.matieres.reduce(
      (sum, m) => sum + m.notes.filter(n => n.isSimulated).length,
      0
    );
  }, [currentPeriod.matieres]);

  // Total notes count in active period
  const totalNotesCount = useMemo(() => {
    return currentPeriod.matieres.reduce((sum, m) => sum + m.notes.length, 0);
  }, [currentPeriod.matieres]);

  // Save periodes cache on changes
  useEffect(() => {
    EcoleDirecteService.savePeriodesCache(periodes);
  }, [periodes]);

  // Manual or automatic synchronization method
  const syncWithEcoleDirecte = useCallback(async (silent: boolean = false) => {
    if (!session || !session.token) {
      if (!silent) setIsEcoleDirecteModalOpen(true);
      return;
    }

    setIsSyncing(true);
    setSyncErrorMessage(null);

    try {
      let res = await EcoleDirecteService.fetchNotes(session.account.id, session.token);

      // If token expired, try silent re-login with cached credentials
      if (!res.success && res.message?.includes('expirée')) {
        const creds = EcoleDirecteService.loadCredentials();
        if (creds) {
          const loginRes = await EcoleDirecteService.login(creds.identifiant, creds.motdepasse);
          if (loginRes.success && loginRes.token) {
            setSession(prev => prev ? { ...prev, token: loginRes.token! } : null);
            res = await EcoleDirecteService.fetchNotes(session.account.id, loginRes.token);
          }
        }
      }

      if (res.success && res.periodes) {
        // Detect newly arrived grades
        const newGrades = EcoleDirecteService.detectNewGrades(periodes, res.periodes);
        if (newGrades.length > 0) {
          setNewlyDetectedGrades(newGrades);
        }

        // Preserve any manually added or simulated notes from user
        const mergedPeriodes = res.periodes.map(newP => {
          const oldP = periodes.find(p => p.codePeriode === newP.codePeriode);
          if (!oldP) return newP;

          const mergedMatieres = newP.matieres.map(newM => {
            const oldM = oldP.matieres.find(m => m.codeMatiere === newM.codeMatiere);
            if (!oldM) return newM;

            const userNotes = oldM.notes.filter(n => n.isSimulated || n.source === 'manual');
            return {
              ...newM,
              coef: oldM.coef ?? newM.coef,
              notes: [...newM.notes, ...userNotes],
            };
          });

          return { ...newP, matieres: mergedMatieres };
        });

        setPeriodes(mergedPeriodes);

        const updatedSession = { ...session, lastSync: new Date().toISOString() };
        setSession(updatedSession);
        EcoleDirecteService.saveSession(updatedSession);
      } else if (!silent) {
        setSyncErrorMessage(res.message || 'Impossible de synchroniser.');
      }
    } catch (err: any) {
      if (!silent) setSyncErrorMessage(err.message || 'Erreur de connexion');
    } finally {
      setIsSyncing(false);
    }
  }, [session, periodes]);

  // Background Auto-sync effect
  useEffect(() => {
    if (!autoSyncEnabled || !session) return;

    const intervalMs = autoSyncInterval * 60 * 1000;
    const intervalId = setInterval(() => {
      syncWithEcoleDirecte(true);
    }, intervalMs);

    const handleFocus = () => {
      syncWithEcoleDirecte(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [autoSyncEnabled, session, autoSyncInterval, syncWithEcoleDirecte]);

  // Handlers
  const handleLogin = async (identifiant: string, motdepasse: string, remember: boolean): Promise<any> => {
    setSyncErrorMessage(null);
    const res = await EcoleDirecteService.login(identifiant, motdepasse);
    if (res.success && res.student && res.token) {
      if (remember) {
        EcoleDirecteService.saveCredentials(identifiant, motdepasse);
      }
      const newSession: EcoleDirecteSession = {
        token: res.token,
        account: res.student,
        allStudents: res.allStudents,
        lastSync: new Date().toISOString(),
        autoSyncEnabled: true,
        autoSyncIntervalMinutes: autoSyncInterval,
      };
      setSession(newSession);
      EcoleDirecteService.saveSession(newSession);

      const notesRes = await EcoleDirecteService.fetchNotes(res.student.id, res.token);
      if (notesRes.success && notesRes.periodes) {
        setPeriodes(notesRes.periodes);
        if (notesRes.periodes[0]) {
          setActivePeriodCode(notesRes.periodes[0].codePeriode);
        }
      }
      setIsEcoleDirecteModalOpen(false);
    } else if (!res.needs2FA) {
      setSyncErrorMessage(res.message || 'Erreur lors de la connexion.');
    }
    return res;
  };

  const handleCompleteAuth = async (authResult: any, remember: boolean = true) => {
    if (!authResult.student || !authResult.token) return;
    if (remember && authResult.identifiant && authResult.motdepasse) {
      EcoleDirecteService.saveCredentials(authResult.identifiant, authResult.motdepasse);
    }
    const newSession: EcoleDirecteSession = {
      token: authResult.token,
      account: authResult.student,
      allStudents: authResult.allStudents,
      lastSync: new Date().toISOString(),
      autoSyncEnabled: true,
      autoSyncIntervalMinutes: autoSyncInterval,
    };
    setSession(newSession);
    EcoleDirecteService.saveSession(newSession);

    const notesRes = await EcoleDirecteService.fetchNotes(authResult.student.id, authResult.token);
    if (notesRes.success && notesRes.periodes) {
      setPeriodes(notesRes.periodes);
      if (notesRes.periodes[0]) {
        setActivePeriodCode(notesRes.periodes[0].codePeriode);
      }
    }
    setIsEcoleDirecteModalOpen(false);
  };

  const handleLogout = () => {
    setSession(null);
    EcoleDirecteService.clearSession();
    EcoleDirecteService.clearCredentials();
    setIsEcoleDirecteModalOpen(false);
  };

  // Reset all notes to zero (clean slate as requested)
  const handleResetToZeroNotes = () => {
    const cleaned = periodes.map(p => ({
      ...p,
      matieres: p.matieres.map(m => ({
        ...m,
        notes: [],
      })),
    }));
    setPeriodes(cleaned);
    EcoleDirecteService.savePeriodesCache(cleaned);
  };

  const handleSwitchStudent = async (studentId: number) => {
    if (!session || !session.allStudents) return;
    const targetStudent = session.allStudents.find(s => s.id === studentId);
    if (!targetStudent) return;

    const updatedSession = { ...session, account: targetStudent };
    setSession(updatedSession);
    EcoleDirecteService.saveSession(updatedSession);

    const notesRes = await EcoleDirecteService.fetchNotes(studentId, session.token);
    if (notesRes.success && notesRes.periodes) {
      setPeriodes(notesRes.periodes);
    }
  };

  // Note CRUD
  const handleAddNote = (noteData: Partial<Note> & { codeMatiere: string }) => {
    const newNote: Note = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      devoir: noteData.devoir || 'Évaluation',
      codeMatiere: noteData.codeMatiere,
      discipline: noteData.discipline || noteData.codeMatiere,
      date: noteData.date || new Date().toISOString().split('T')[0],
      valeur: noteData.valeur ?? 15,
      noteSur: noteData.noteSur || 20,
      coef: noteData.coef || 1,
      isSimulated: Boolean(noteData.isSimulated),
      source: noteData.isSimulated ? undefined : 'manual',
    };

    setPeriodes(prev =>
      prev.map(p => {
        if (p.codePeriode === activePeriodCode || activePeriodCode === 'ALL') {
          return {
            ...p,
            matieres: p.matieres.map(m => {
              if (m.codeMatiere === noteData.codeMatiere) {
                return {
                  ...m,
                  notes: [newNote, ...m.notes],
                };
              }
              return m;
            }),
          };
        }
        return p;
      })
    );
  };

  const handleDeleteNote = (noteId: string) => {
    setPeriodes(prev =>
      prev.map(p => ({
        ...p,
        matieres: p.matieres.map(m => ({
          ...m,
          notes: m.notes.filter(n => n.id !== noteId),
        })),
      }))
    );
  };

  const handleClearAllSimulatedNotes = () => {
    setPeriodes(prev =>
      prev.map(p => ({
        ...p,
        matieres: p.matieres.map(m => ({
          ...m,
          notes: m.notes.filter(n => !n.isSimulated),
        })),
      }))
    );
  };

  const handleUpdateSubjectCoef = (codeMatiere: string, newCoef: number) => {
    EcoleDirecteService.saveCustomCoef(codeMatiere, newCoef);
    setPeriodes(prev =>
      prev.map(p => ({
        ...p,
        matieres: p.matieres.map(m => (m.codeMatiere === codeMatiere ? { ...m, coef: newCoef } : m)),
      }))
    );
  };

  const handleAddNewSubject = (discipline: string, coef: number) => {
    const code = discipline.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8) || `MAT_${Date.now()}`;
    const newMatiere: Matiere = {
      codeMatiere: code,
      discipline,
      coef,
      notes: [],
    };

    setPeriodes(prev =>
      prev.map(p => ({
        ...p,
        matieres: [...p.matieres, newMatiere],
      }))
    );
  };

  const handleOpenAddNoteForSubject = (codeMatiere?: string) => {
    setModalDefaultSubject(codeMatiere);
    setIsAddNoteModalOpen(true);
  };

  const handleOpenSimulatorForSubject = (codeMatiere?: string) => {
    setModalDefaultSubject(codeMatiere);
    setIsSimulatorModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#09090c] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Bar Header */}
      <Header
        session={session}
        isSyncing={isSyncing}
        onSync={() => syncWithEcoleDirecte(false)}
        onOpenEcoleDirecteModal={() => setIsEcoleDirecteModalOpen(true)}
        onOpenSimulatorModal={() => handleOpenSimulatorForSubject()}
        onOpenCoefModal={() => setIsEditCoefModalOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section: General Average Display with Outfit typography and green/yellow aura */}
        <GeneralAverageHero
          generalResult={generalResult}
          matieres={currentPeriod.matieres}
          includeSimulated={includeSimulated}
          onToggleIncludeSimulated={() => setIncludeSimulated(!includeSimulated)}
          onOpenSimulator={() => handleOpenSimulatorForSubject()}
          onOpenAddNote={() => handleOpenAddNoteForSubject()}
          onOpenCalcDetails={() => setIsCalcDetailsModalOpen(true)}
          onOpenEcoleDirecte={() => setIsEcoleDirecteModalOpen(true)}
          simulatedNotesCount={simulatedNotesCount}
        />

        {/* View Switch */}
        {activeView === 'analytics' ? (
          <AnalyticsView
            matieres={currentPeriod.matieres}
            generalResult={generalResult}
            includeSimulated={includeSimulated}
          />
        ) : (
          /* Dashboard: Subject Cards & Controls */
          <div className="space-y-6">
            {/* Period Tabs Bar */}
            <div className="bg-[#111117] rounded-3xl border border-[#232332] p-4 shadow-xl">
              <PeriodTabs
                periodes={periodes}
                activePeriodCode={activePeriodCode}
                onSelectPeriod={setActivePeriodCode}
                showAllOption={true}
              />
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Rechercher une matière..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-[#232332] bg-[#111117] text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500 shadow-sm"
                />
              </div>

              <div className="flex items-center gap-2.5">
                {totalNotesCount > 0 && (
                  <button
                    onClick={handleResetToZeroNotes}
                    title="Vider toutes les notes pour repartir de zéro"
                    className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-2xl bg-[#14141c] border border-[#262638] text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Vider les notes</span>
                  </button>
                )}

                <button
                  onClick={() => setIsEditCoefModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-display font-bold rounded-2xl bg-[#14141c] border border-[#262638] text-slate-300 hover:text-white hover:border-[#38384e] transition-all cursor-pointer whitespace-nowrap"
                >
                  <Sliders className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Coefficients</span>
                </button>

                <button
                  onClick={() => handleOpenAddNoteForSubject()}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-display font-bold rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black transition-all cursor-pointer shadow-md whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Ajouter une note</span>
                </button>
              </div>
            </div>

            {/* Subject Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {displayedMatieres.map(matiere => (
                <SubjectCard
                  key={matiere.codeMatiere}
                  matiere={matiere}
                  includeSimulated={includeSimulated}
                  onAddNote={() => handleOpenAddNoteForSubject(matiere.codeMatiere)}
                  onSimulateNote={() => handleOpenSimulatorForSubject(matiere.codeMatiere)}
                  onDeleteNote={handleDeleteNote}
                  onEditSubjectCoef={() => {
                    setModalDefaultSubject(matiere.codeMatiere);
                    setIsEditCoefModalOpen(true);
                  }}
                />
              ))}
            </div>

            {displayedMatieres.length === 0 && (
              <div className="p-12 text-center bg-[#111117] rounded-3xl border border-[#232332]">
                <div className="text-slate-400 text-sm">
                  Aucune matière trouvée pour &quot;{searchQuery}&quot;.
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1a24] bg-[#0c0c10] py-7 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold text-white">MyGrade</span>
            <span>—</span>
            <span className="text-emerald-400 font-medium">Ma Moyenne</span>
            <span className="text-slate-600">·</span>
            <span>Synchronisation EcoleDirecte en direct</span>
          </div>
          <div className="flex items-center gap-5">
            <button
              onClick={() => setIsEcoleDirecteModalOpen(true)}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Statut EcoleDirecte
            </button>
            <button
              onClick={() => setIsCalcDetailsModalOpen(true)}
              className="hover:text-yellow-400 transition-colors cursor-pointer"
            >
              Détail des formules
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SimulatorModal
        isOpen={isSimulatorModalOpen}
        onClose={() => setIsSimulatorModalOpen(false)}
        matieres={currentPeriod.matieres}
        defaultCodeMatiere={modalDefaultSubject}
        onAddSimulatedNote={handleAddNote}
        onClearAllSimulatedNotes={handleClearAllSimulatedNotes}
        simulatedNotesCount={simulatedNotesCount}
      />

      <AddNoteModal
        isOpen={isAddNoteModalOpen}
        onClose={() => setIsAddNoteModalOpen(false)}
        matieres={currentPeriod.matieres}
        defaultCodeMatiere={modalDefaultSubject}
        onAddNote={handleAddNote}
      />

      <EditSubjectCoefModal
        isOpen={isEditCoefModalOpen}
        onClose={() => setIsEditCoefModalOpen(false)}
        matieres={currentPeriod.matieres}
        onUpdateCoef={handleUpdateSubjectCoef}
        onAddNewSubject={handleAddNewSubject}
      />

      <CalculationDetailsModal
        isOpen={isCalcDetailsModalOpen}
        onClose={() => setIsCalcDetailsModalOpen(false)}
        matieres={currentPeriod.matieres}
        includeSimulated={includeSimulated}
      />

      <EcoleDirecteModal
        isOpen={isEcoleDirecteModalOpen}
        onClose={() => setIsEcoleDirecteModalOpen(false)}
        session={session}
        onLogin={handleLogin}
        onCompleteAuth={handleCompleteAuth}
        onLogout={handleLogout}
        onManualSync={() => syncWithEcoleDirecte(false)}
        onLoadMockData={() => {}}
        isSyncing={isSyncing}
        errorMessage={syncErrorMessage}
        onSwitchStudent={handleSwitchStudent}
        autoSyncEnabled={autoSyncEnabled}
        onToggleAutoSync={setAutoSyncEnabled}
        autoSyncInterval={autoSyncInterval}
        onChangeInterval={setAutoSyncInterval}
      />

      {/* New Grade Toast Notification */}
      <NewGradeNotification
        newGrades={newlyDetectedGrades}
        onDismiss={() => setNewlyDetectedGrades([])}
      />
    </div>
  );
}
