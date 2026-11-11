import { useState } from 'react';
import { X, Lock, User, RefreshCw, CheckCircle, AlertTriangle, ShieldCheck, LogOut, ArrowLeft, KeyRound, Sparkles } from 'lucide-react';
import type { EcoleDirecteSession } from '../types';
import { EcoleDirecteService, type DoubleAuthProposition, type LoginResult } from '../services/ecoleDirecteService';

interface EcoleDirecteModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: EcoleDirecteSession | null;
  onLogin: (identifiant: string, motdepasse: string, remember: boolean) => Promise<LoginResult>;
  onCompleteAuth?: (authResult: LoginResult, remember: boolean) => Promise<void>;
  onLogout: () => void;
  onManualSync: () => Promise<void>;
  onLoadMockData: () => void;
  isSyncing: boolean;
  errorMessage: string | null;
  onSwitchStudent?: (studentId: number) => void;
  autoSyncEnabled: boolean;
  onToggleAutoSync: (enabled: boolean) => void;
  autoSyncInterval: number;
  onChangeInterval: (minutes: number) => void;
}

interface TwoFAData {
  question: string;
  propositions: DoubleAuthProposition[];
  token: string;
  twoFaToken: string;
  cookies?: string;
  identifiant: string;
  motdepasse: string;
}

export function EcoleDirecteModal({
  isOpen,
  onClose,
  session,
  onLogin,
  onCompleteAuth,
  onLogout,
  onManualSync,
  isSyncing,
  errorMessage,
  onSwitchStudent,
  autoSyncEnabled,
  onToggleAutoSync,
  autoSyncInterval,
  onChangeInterval,
}: EcoleDirecteModalProps) {
  const [identifiant, setIdentifiant] = useState('O.DaTel');
  const [motdepasse, setMotdepasse] = useState('D@&RI.0nH1€O0D.25&è');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2FA Security Challenge State
  const [twoFAState, setTwoFAState] = useState<TwoFAData | null>(null);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);
  const [isSubmitting2FA, setIsSubmitting2FA] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifiant || !motdepasse) return;
    setIsSubmitting(true);
    setTwoFAError(null);
    try {
      const res = await onLogin(identifiant, motdepasse, remember);
      if (res.needs2FA && res.question2FA && res.propositions2FA) {
        setTwoFAState({
          question: res.question2FA,
          propositions: res.propositions2FA,
          token: res.token || '',
          twoFaToken: res.twoFaToken || '',
          cookies: res.cookies,
          identifiant: res.identifiant || identifiant,
          motdepasse: res.motdepasse || motdepasse,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectProposition = async (propValue: string) => {
    if (!twoFAState || isSubmitting2FA) return;
    setSelectedChoice(propValue);
    setIsSubmitting2FA(true);
    setTwoFAError(null);

    try {
      const authRes = await EcoleDirecteService.submitDoubleAuthChoice(
        twoFAState.identifiant,
        twoFAState.motdepasse,
        twoFAState.token,
        twoFAState.twoFaToken,
        propValue,
        twoFAState.cookies
      );

      if (authRes.success && authRes.student && authRes.token) {
        if (onCompleteAuth) {
          await onCompleteAuth(authRes, remember);
        }
        setTwoFAState(null);
      } else {
        setTwoFAError(authRes.message || 'Réponse incorrecte, veuillez réessayer.');
      }
    } catch (err: any) {
      setTwoFAError(`Erreur: ${err.message || 'Impossible de vérifier la réponse'}`);
    } finally {
      setIsSubmitting2FA(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#121218] rounded-3xl border border-[#262638] shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#1c1c28] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-yellow-400 p-[1.5px] shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-[#0d0d12] rounded-[10px] flex items-center justify-center font-display font-extrabold text-sm text-emerald-400">
                ED
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-display font-bold text-white flex items-center gap-2">
                <span>Connexion EcoleDirecte</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  En direct
                </span>
              </h2>
              <div className="text-xs text-slate-400">
                Synchronisation automatique de vos vraies notes
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {session ? (
            /* Connected state */
            <div className="space-y-5">
              <div className="bg-emerald-950/40 rounded-2xl p-4 border border-emerald-500/30">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-display font-bold text-emerald-300">
                      Compte connecté avec succès
                    </div>
                    <div className="mt-1 text-xs text-emerald-200">
                      Élève : <span className="font-bold">{session.account.prenom} {session.account.nom}</span>
                      {session.account.classe && (
                        <span> · Classe : {session.account.classe}</span>
                      )}
                    </div>
                    {session.lastSync && (
                      <div className="mt-1 text-[11px] text-emerald-400 font-display">
                        Dernière synchronisation : {new Date(session.lastSync).toLocaleTimeString('fr-FR')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Multi-student switch */}
              {session.allStudents && session.allStudents.length > 1 && onSwitchStudent && (
                <div>
                  <label className="block text-xs font-display font-bold text-slate-300 mb-1.5">
                    Sélectionner l élève :
                  </label>
                  <select
                    value={session.account.id}
                    onChange={e => onSwitchStudent(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#2a2a3e] bg-[#171722] text-white"
                  >
                    {session.allStudents.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.prenom} {st.nom} ({st.classe})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Auto Sync Settings */}
              <div className="bg-[#181824] rounded-2xl p-4 border border-[#28283c] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-display font-bold text-white">
                      Ajout automatique des nouvelles notes
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Vérifie en arrière-plan et ajoute chaque note sans aucune action
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSyncEnabled}
                    onChange={e => onToggleAutoSync(e.target.checked)}
                    className="w-5 h-5 rounded text-emerald-500 focus:ring-emerald-500 border-[#2a2a3e] bg-[#101016]"
                  />
                </div>

                {autoSyncEnabled && (
                  <div className="flex items-center gap-2 pt-2 border-t border-[#242436]">
                    <span className="text-xs text-slate-400">Fréquence :</span>
                    <select
                      value={autoSyncInterval}
                      onChange={e => onChangeInterval(Number(e.target.value))}
                      className="px-2.5 py-1 text-xs font-display font-semibold rounded-lg border border-[#2a2a3e] bg-[#101016] text-white"
                    >
                      <option value={2}>Toutes les 2 minutes</option>
                      <option value={5}>Toutes les 5 minutes</option>
                      <option value={15}>Toutes les 15 minutes</option>
                      <option value={30}>Toutes les 30 minutes</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Se déconnecter</span>
                </button>

                <button
                  type="button"
                  onClick={onManualSync}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-display font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-black cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-500/20"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Synchroniser maintenant</span>
                </button>
              </div>
            </div>
          ) : twoFAState ? (
            /* 2FA Security Challenge Screen */
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-display font-bold text-yellow-300">
                    Vérification de sécurité EcoleDirecte
                  </div>
                  <div className="text-[11px] text-yellow-200/80 mt-0.5">
                    Un nouvel appareil a été détecté. Veuillez répondre à la question posée par EcoleDirecte pour valider votre session :
                  </div>
                </div>
              </div>

              {twoFAError && (
                <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="font-semibold text-rose-200">
                      {twoFAError.includes('Une erreur est survenue') || twoFAError.includes('bloqu')
                        ? 'Compte EcoleDirecte temporairement verrouillé par la sécurité'
                        : twoFAError}
                    </div>
                  </div>
                  {(twoFAError.includes('Une erreur est survenue') || twoFAError.includes('bloqu')) && (
                    <div className="text-[11px] text-slate-300 bg-[#171722] p-3 rounded-xl border border-[#2b2b3f] space-y-1.5 leading-relaxed">
                      <div className="text-yellow-400 font-bold flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Comment débloquer votre compte :</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-slate-300">
                        <li>
                          <strong className="text-white">Attendez 15 à 30 minutes</strong> : EcoleDirecte lève automatiquement ce blocage de sécurité après ce délai.
                        </li>
                        <li>
                          <strong className="text-white">Ou débloquez-le immédiatement</strong> : Rendez-vous sur{' '}
                          <a
                            href="https://www.ecoledirecte.com"
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-400 underline font-semibold"
                          >
                            ecoledirecte.com
                          </a>{' '}
                          et cliquez sur « Mot de passe oublié » pour réinitialiser l accès sans attendre.
                        </li>
                        <li>
                          Une fois débloqué, revenez ici et cliquez sur <strong className="text-emerald-400">DUSAUTOIS C.</strong> : la synchronisation importera directement vos notes !
                        </li>
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {/* Question display */}
              <div className="p-4 rounded-2xl bg-[#171722] border border-[#2b2b3f] text-center space-y-1">
                <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">
                  Question de sécurité
                </div>
                <div className="text-sm sm:text-base font-display font-extrabold text-white">
                  « {twoFAState.question} »
                </div>
              </div>

              {/* Propositions list */}
              <div className="space-y-2">
                <div className="text-xs font-display font-semibold text-slate-300">
                  Cliquez sur votre réponse :
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {twoFAState.propositions.map((prop, idx) => {
                    const isCurrent = selectedChoice === prop.value;
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isSubmitting2FA}
                        onClick={() => handleSelectProposition(prop.value)}
                        className={`text-left px-3.5 py-2.5 rounded-xl text-xs font-display font-semibold border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isCurrent && isSubmitting2FA
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : 'bg-[#181824] hover:bg-[#202030] hover:border-emerald-500/50 border-[#2a2a3e] text-slate-200 hover:text-white'
                        }`}
                      >
                        <span className="truncate">{prop.label}</span>
                        {isCurrent && isSubmitting2FA && (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[#1c1c28]">
                <button
                  type="button"
                  onClick={() => setTwoFAState(null)}
                  disabled={isSubmitting2FA}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-400 hover:text-white rounded-xl cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Retour à la saisie</span>
                </button>
                {isSubmitting2FA && (
                  <span className="text-xs text-emerald-400 font-display flex items-center gap-1.5 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Validation en cours...
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* Login Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-xs text-slate-300 leading-relaxed">
                Renseignez vos identifiants EcoleDirecte. Vos notes et coefficients seront automatiquement importés et synchronisés en direct.
              </div>

              {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1">
                    <div className="font-semibold text-rose-200">{errorMessage}</div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-display font-bold text-slate-300 mb-1.5">
                  Identifiant EcoleDirecte
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifiant}
                    onChange={e => setIdentifiant(e.target.value)}
                    placeholder="Identifiant élève ou parent"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-[#29293c] bg-[#171722] text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-display font-bold text-slate-300 mb-1.5">
                  Mot de passe EcoleDirecte
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={motdepasse}
                    onChange={e => setMotdepasse(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-16 py-2.5 text-sm rounded-xl border border-[#29293c] bg-[#171722] text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-slate-500 hover:text-white cursor-pointer"
                  >
                    {showPassword ? 'Masquer' : 'Afficher'}
                  </button>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-[#29293c] bg-[#171722]"
                  />
                  <span>Mémoriser pour la synchronisation automatique en direct</span>
                </label>
              </div>

              {/* Privacy badge */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#171722] border border-[#262638] text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Vos identifiants sont strictement conservés dans le stockage local de votre navigateur.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-display font-bold bg-gradient-to-r from-emerald-500 to-yellow-400 hover:from-emerald-400 hover:to-yellow-300 text-black rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-md shadow-emerald-500/20"
                >
                  {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>Se connecter</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
