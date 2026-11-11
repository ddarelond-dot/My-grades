import type { EcoleDirecteSession, EcoleDirecteStudent, Matiere, Note, Periode } from '../types';

export interface DoubleAuthProposition {
  label: string;
  value: string;
}

export interface LoginResult {
  success: boolean;
  message?: string;
  token?: string;
  twoFaToken?: string;
  student?: EcoleDirecteStudent;
  allStudents?: EcoleDirecteStudent[];
  needs2FA?: boolean;
  question2FA?: string;
  propositions2FA?: DoubleAuthProposition[];
  cookies?: string;
  identifiant?: string;
  motdepasse?: string;
}

export class EcoleDirecteService {
  private static STORAGE_KEY_SESSION = 'mygrade_ed_session';
  private static STORAGE_KEY_CREDENTIALS = 'mygrade_ed_credentials_cache';
  private static STORAGE_KEY_PERIODES = 'mygrade_ed_periodes_cache';
  private static STORAGE_KEY_CUSTOM_COEFS = 'mygrade_ed_custom_coefs';

  /**
   * Log into EcoleDirecte via proxy server
   */
  static async login(identifiant: string, motdepasse: string): Promise<LoginResult> {
    const cleanId = identifiant.trim();
    const cleanPass = motdepasse.trim();

    try {
      const response = await fetch('/api/ecoledirecte/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifiant: cleanId, motdepasse: cleanPass }),
      });

      const json = await response.json();

      if (json.code === 250 || json.needs2FA) {
        // Double authentication required
        return {
          success: false,
          needs2FA: true,
          token: json.token,
          twoFaToken: json.twoFaToken,
          question2FA: json.question || (json.data?.question ? atobSafe(json.data.question) : 'Répondez à la question de sécurité EcoleDirecte'),
          propositions2FA: Array.isArray(json.propositions)
            ? json.propositions
            : (json.data?.propositions || []).map((p: any) => ({
                value: p,
                label: atobSafe(p),
              })),
          cookies: json.cookies,
          identifiant: json.identifiant || cleanId,
          motdepasse: json.motdepasse || cleanPass,
        };
      }

      if (json.code === 505) {
        return {
          success: false,
          message: 'Identifiant ou mot de passe incorrect (code 505 renvoyé par EcoleDirecte). Vérifiez vos majuscules/minuscules et la confusion 0 (zéro) et O.',
        };
      }

      if (json.code !== 200 || !json.data) {
        return {
          success: false,
          message: json.message || 'Identifiant ou mot de passe invalide.',
        };
      }

      return this.handleSuccessfulAuth(json);
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, message: `Impossible de contacter le serveur : ${err.message}` };
    }
  }

  /**
   * Submit answer to 2FA security challenge
   */
  static async submitDoubleAuthChoice(
    identifiant: string,
    motdepasse: string,
    token: string,
    twoFaToken: string,
    choix: string,
    cookies?: string
  ): Promise<LoginResult> {
    try {
      const response = await fetch('/api/ecoledirecte/doubleauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifiant,
          motdepasse,
          token,
          twoFaToken,
          choix,
          cookies,
        }),
      });

      const json = await response.json();

      if (json.code !== 200 || !json.data) {
        return {
          success: false,
          message: json.message || 'Réponse incorrecte à la question de sécurité.',
        };
      }

      return this.handleSuccessfulAuth(json);
    } catch (err: any) {
      console.error('DoubleAuth error:', err);
      return { success: false, message: `Erreur validation 2FA : ${err.message}` };
    }
  }

  private static handleSuccessfulAuth(json: any): LoginResult {
    const comptes = json.data.accounts || json.data.comptes || [];
    if (comptes.length === 0) {
      return { success: false, message: 'Aucun compte trouvé sur cet accès EcoleDirecte.' };
    }

    let student: EcoleDirecteStudent;
    let allStudents: EcoleDirecteStudent[] = [];

    const primaryCompte = comptes[0];
    const typeCompte = primaryCompte.typeCompte || primaryCompte.type || 'E';
    const elevesList = primaryCompte.profile?.eleves || primaryCompte.eleves || [];
    const classeLabel = primaryCompte.profile?.classe?.libelle || primaryCompte.classe?.libelle || primaryCompte.classe?.code || (typeof primaryCompte.classe === 'string' ? primaryCompte.classe : 'Élève');

    if (typeCompte === 'P' && elevesList.length > 0) {
      // Famille / Parent account with children list
      allStudents = elevesList.map((el: any) => ({
        id: el.id,
        nom: el.nom || primaryCompte.nom,
        prenom: el.prenom || '',
        classe: el.classe?.libelle || el.classe?.code || (typeof el.classe === 'string' ? el.classe : 'Élève'),
        photo: el.photo,
      }));
      student = allStudents[0];
    } else {
      // Élève account
      student = {
        id: primaryCompte.id,
        nom: primaryCompte.nom || '',
        prenom: primaryCompte.prenom || '',
        classe: classeLabel,
        photo: primaryCompte.photo,
      };
      allStudents = [student];
    }

    const session: EcoleDirecteSession = {
      token: json.token,
      account: student,
      allStudents,
      lastSync: new Date().toISOString(),
      autoSyncEnabled: true,
      autoSyncIntervalMinutes: 5,
    };

    this.saveSession(session);
    return {
      success: true,
      token: json.token,
      student,
      allStudents,
    };
  }

  /**
   * Fetch notes for student and transform them into structured Periodes
   */
  static async fetchNotes(studentId: number, token: string): Promise<{ success: boolean; periodes?: Periode[]; message?: string }> {
    try {
      const response = await fetch('/api/ecoledirecte/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': token,
        },
        body: JSON.stringify({ studentId, token }),
      });

      const json = await response.json();

      if (json.code === 520 || json.code === 525 || json.code === 401) {
        return { success: false, message: 'Session EcoleDirecte expirée. Veuillez vous reconnecter.' };
      }

      if (json.code !== 200 || !json.data) {
        return { success: false, message: json.message || 'Impossible de récupérer les notes.' };
      }

      const periodesRaw = json.data.periodes || [];
      const notesRaw = json.data.notes || [];

      const customCoefs = this.loadCustomCoefs();
      const periodesParsed: Periode[] = [];

      // If EcoleDirecte provides periodes list
      if (periodesRaw.length > 0) {
        for (const p of periodesRaw) {
          const pCode = p.codePeriode;
          const pName = p.periode || `Période ${pCode}`;
          const edDisciplines = p.ensembleMatieres?.disciplines || [];

          // Map disciplines to matieres
          const matieresMap = new Map<string, Matiere>();

          // Seed subjects defined in this period's ensembleMatieres
          for (const d of edDisciplines) {
            const code = d.codeMatiere || d.discipline;
            const customCoef = customCoefs[code];
            const defaultCoef = d.coef ? parseFloat(String(d.coef).replace(',', '.')) : 1;

            matieresMap.set(code, {
              codeMatiere: code,
              discipline: d.discipline || code,
              coef: customCoef !== undefined ? customCoef : (defaultCoef > 0 ? defaultCoef : 1),
              professeur: d.professeurs?.[0]?.nom || undefined,
              moyenneClasse: d.moyenneClasse ? parseFloat(String(d.moyenneClasse).replace(',', '.')) : undefined,
              moyenneMin: d.moyenneMin ? parseFloat(String(d.moyenneMin).replace(',', '.')) : undefined,
              moyenneMax: d.moyenneMax ? parseFloat(String(d.moyenneMax).replace(',', '.')) : undefined,
              notes: [],
            });
          }

          // Distribute notes that belong to this period
          const periodNotes = notesRaw.filter((n: any) => n.codePeriode === pCode);

          for (const rawNote of periodNotes) {
            const code = rawNote.codeMatiere || rawNote.discipline || 'AUTRE';
            if (!matieresMap.has(code)) {
              const customCoef = customCoefs[code];
              matieresMap.set(code, {
                codeMatiere: code,
                discipline: rawNote.discipline || code,
                coef: customCoef !== undefined ? customCoef : 1,
                notes: [],
              });
            }

            const matiere = matieresMap.get(code)!;
            const parsedVal = parseRawNoteValue(rawNote.valeur);
            const noteSur = rawNote.noteSur ? parseFloat(String(rawNote.noteSur).replace(',', '.')) : 20;
            const coef = rawNote.coef ? parseFloat(String(rawNote.coef).replace(',', '.')) : 1;

            const noteObj: Note = {
              id: String(rawNote.id || `ed_${Math.random()}`),
              devoir: rawNote.devoir || 'Évaluation',
              codeMatiere: code,
              discipline: rawNote.discipline || matiere.discipline,
              date: rawNote.date || new Date().toISOString().split('T')[0],
              valeur: parsedVal,
              noteSur: isNaN(noteSur) || noteSur <= 0 ? 20 : noteSur,
              coef: isNaN(coef) || coef <= 0 ? 1 : coef,
              nonSignificatif: Boolean(rawNote.nonSignificatif),
              moyenneClasse: rawNote.moyenneClasse ? parseFloat(String(rawNote.moyenneClasse).replace(',', '.')) : undefined,
              minClasse: rawNote.minClasse ? parseFloat(String(rawNote.minClasse).replace(',', '.')) : undefined,
              maxClasse: rawNote.maxClasse ? parseFloat(String(rawNote.maxClasse).replace(',', '.')) : undefined,
              source: 'ecoledirecte',
            };

            matiere.notes.push(noteObj);
          }

          periodesParsed.push({
            codePeriode: pCode,
            nom: pName,
            cloture: Boolean(p.cloture),
            matieres: Array.from(matieresMap.values()),
          });
        }
      } else {
        // Fallback: organize raw notes into one single general period
        const matieresMap = new Map<string, Matiere>();
        for (const rawNote of notesRaw) {
          const code = rawNote.codeMatiere || rawNote.discipline || 'AUTRE';
          if (!matieresMap.has(code)) {
            const customCoef = customCoefs[code];
            matieresMap.set(code, {
              codeMatiere: code,
              discipline: rawNote.discipline || code,
              coef: customCoef !== undefined ? customCoef : 1,
              notes: [],
            });
          }
          const matiere = matieresMap.get(code)!;
          const noteSur = rawNote.noteSur ? parseFloat(String(rawNote.noteSur).replace(',', '.')) : 20;
          const coef = rawNote.coef ? parseFloat(String(rawNote.coef).replace(',', '.')) : 1;
          matiere.notes.push({
            id: String(rawNote.id || `ed_${Math.random()}`),
            devoir: rawNote.devoir || 'Évaluation',
            codeMatiere: code,
            discipline: rawNote.discipline || matiere.discipline,
            date: rawNote.date || new Date().toISOString().split('T')[0],
            valeur: parseRawNoteValue(rawNote.valeur),
            noteSur: isNaN(noteSur) || noteSur <= 0 ? 20 : noteSur,
            coef: isNaN(coef) || coef <= 0 ? 1 : coef,
            nonSignificatif: Boolean(rawNote.nonSignificatif),
            source: 'ecoledirecte',
          });
        }
        periodesParsed.push({
          codePeriode: 'ALL',
          nom: 'Toutes les notes',
          matieres: Array.from(matieresMap.values()),
        });
      }

      this.savePeriodesCache(periodesParsed);
      return { success: true, periodes: periodesParsed };
    } catch (err: any) {
      console.error('Fetch notes error:', err);
      return { success: false, message: `Erreur lors de la récupération : ${err.message}` };
    }
  }

  /**
   * Compares previous period notes with newly fetched ones and detects additions
   */
  static detectNewGrades(prevPeriodes: Periode[], newPeriodes: Periode[]): Note[] {
    const prevIds = new Set<string>();
    for (const p of prevPeriodes) {
      for (const m of p.matieres) {
        for (const n of m.notes) {
          prevIds.add(n.id);
        }
      }
    }

    const newGrades: Note[] = [];
    for (const p of newPeriodes) {
      for (const m of p.matieres) {
        for (const n of m.notes) {
          if (!prevIds.has(n.id) && !n.isSimulated) {
            newGrades.push(n);
          }
        }
      }
    }
    return newGrades;
  }

  // Session persistence
  static saveSession(session: EcoleDirecteSession) {
    try {
      localStorage.setItem(this.STORAGE_KEY_SESSION, JSON.stringify(session));
    } catch {}
  }

  static loadSession(): EcoleDirecteSession | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_SESSION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static clearSession() {
    try {
      localStorage.removeItem(this.STORAGE_KEY_SESSION);
    } catch {}
  }

  // Credentials cache for background auto-sync
  static saveCredentials(identifiant: string, motdepasse: string) {
    try {
      localStorage.setItem(this.STORAGE_KEY_CREDENTIALS, JSON.stringify({ identifiant, motdepasse }));
    } catch {}
  }

  static loadCredentials(): { identifiant: string; motdepasse: string } | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_CREDENTIALS);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static clearCredentials() {
    try {
      localStorage.removeItem(this.STORAGE_KEY_CREDENTIALS);
    } catch {}
  }

  // Periodes cache
  static savePeriodesCache(periodes: Periode[]) {
    try {
      localStorage.setItem(this.STORAGE_KEY_PERIODES, JSON.stringify(periodes));
    } catch {}
  }

  static loadPeriodesCache(): Periode[] | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_PERIODES);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // Custom coefficients persistence (Matière code -> coef)
  static saveCustomCoef(codeMatiere: string, coef: number) {
    try {
      const current = this.loadCustomCoefs();
      current[codeMatiere] = coef;
      localStorage.setItem(this.STORAGE_KEY_CUSTOM_COEFS, JSON.stringify(current));
    } catch {}
  }

  static loadCustomCoefs(): Record<string, number> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_CUSTOM_COEFS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }
}

function parseRawNoteValue(raw: any): number | string {
  if (raw === undefined || raw === null) return '';
  const str = String(raw).trim();
  const num = parseFloat(str.replace(',', '.'));
  if (!isNaN(num) && !['abs', 'disp', 'ne'].includes(str.toLowerCase())) {
    return num;
  }
  return str;
}

function atobSafe(str: string): string {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch {
    return str;
  }
}
