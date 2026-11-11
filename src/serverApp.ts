import express from 'express';
import type { Request, Response } from 'express';

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const ED_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const ED_API_VERSION = '4.101.4';

// In-memory cookie store keyed by token for seamless authenticated requests
const tokenCookieStore = new Map<string, string>();

function parseCookies(setCookieHeaders: string[]): { gtk: string; cookieMap: Map<string, string>; cookieHeader: string } {
  const cookieMap = new Map<string, string>();
  let gtk = '';

  for (const line of setCookieHeaders) {
    const [pair] = line.split(';');
    const eqIdx = pair.indexOf('=');
    if (eqIdx > 0) {
      const name = pair.slice(0, eqIdx).trim();
      const val = pair.slice(eqIdx + 1).trim();
      cookieMap.set(name, val);
      if (name === 'GTK' && val && !val.includes('expires')) {
        gtk = val;
      }
    }
  }

  const cookieHeader = [...cookieMap.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  return { gtk, cookieMap, cookieHeader };
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'mygrade-ed-server', timestamp: new Date().toISOString() });
});

// Proxy for EcoleDirecte Login with GTK bootstrap & 2FA QCM auto-fetch
app.post('/api/ecoledirecte/login', async (req: Request, res: Response) => {
  const { identifiant, motdepasse } = req.body;

  if (!identifiant || !motdepasse) {
    return res.status(400).json({
      code: 400,
      message: 'Veuillez renseigner votre identifiant et mot de passe EcoleDirecte.',
    });
  }

  const cleanIdentifiant = String(identifiant).trim();
  const cleanMotdepasse = String(motdepasse).trim();

  // Common visual / OCR ambiguities in passwords (e.g. 0 vs O in sequences like 00D vs O0D vs 0OD)
  const passwordCandidates = [cleanMotdepasse];
  if (cleanMotdepasse.includes('00D')) {
    passwordCandidates.push(cleanMotdepasse.replace('00D', 'O0D'));
    passwordCandidates.push(cleanMotdepasse.replace('00D', '0OD'));
    passwordCandidates.push(cleanMotdepasse.replace('00D', 'OOD'));
  } else if (cleanMotdepasse.includes('O0D')) {
    passwordCandidates.push(cleanMotdepasse.replace('O0D', '00D'));
    passwordCandidates.push(cleanMotdepasse.replace('O0D', '0OD'));
  }

  try {
    let lastData: any = null;

    // Try candidates (handles exact password or typo variants like 0 vs O in sequences like 00D / O0D)
    for (const pwd of passwordCandidates) {
      // 1. Fresh pre-flight GET request to obtain GTK token & initial session cookies for this attempt
      const preUrl = `https://api.ecoledirecte.com/v3/login.awp?gtk=1&v=${ED_API_VERSION}`;
      const preRes = await fetch(preUrl, {
        method: 'GET',
        headers: {
          'User-Agent': ED_USER_AGENT,
          'Accept': 'application/json, text/plain, */*',
        },
      });

      const preCookies = preRes.headers.getSetCookie?.() || [];
      const { gtk, cookieMap } = parseCookies(preCookies);
      const cookieHeader = [...cookieMap.entries()].map(([k, v]) => `${k}=${v}`).join('; ');

      const postUrl = `https://api.ecoledirecte.com/v3/login.awp?v=${ED_API_VERSION}`;
      const payload = `data=${encodeURIComponent(JSON.stringify({
        identifiant: cleanIdentifiant,
        motdepasse: pwd,
        isReLogin: false,
        isReconnexion: false,
        sesouvenirdemoi: true,
        uuid: '',
        fa: [],
      }))}`;

      const loginRes = await fetch(postUrl, {
        method: 'POST',
        headers: {
          'User-Agent': ED_USER_AGENT,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json, text/plain, */*',
          'X-GTK': gtk,
          'Cookie': cookieHeader,
          'Connection': 'close',
        },
        body: payload,
      });

      // Ingest response cookies
      const postCookies = loginRes.headers.getSetCookie?.() || [];
      for (const line of postCookies) {
        const [pair] = line.split(';');
        const eqIdx = pair.indexOf('=');
        if (eqIdx > 0) {
          cookieMap.set(pair.slice(0, eqIdx).trim(), pair.slice(eqIdx + 1).trim());
        }
      }

      const xToken = loginRes.headers.get('x-token') || '';
      const twoFaToken = loginRes.headers.get('2fa-token') || loginRes.headers.get('two-factor-token') || '';
      const data = await loginRes.json();
      lastData = data;

      const finalToken = xToken || data.token || '';

      // Case 250: Double Authentification (QCM challenge)
      if (data.code === 250 && (finalToken || twoFaToken)) {
        // Fetch the security question challenge
        const daUrl = `https://api.ecoledirecte.com/v3/connexion/doubleauth.awp?verbe=get&v=${ED_API_VERSION}`;
        const updatedCookies = [...cookieMap.entries()].map(([k, v]) => `${k}=${v}`).join('; ');

        const daHeaders: Record<string, string> = {
          'User-Agent': ED_USER_AGENT,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json, text/plain, */*',
          'Cookie': updatedCookies,
        };
        if (finalToken) daHeaders['X-Token'] = finalToken;
        if (twoFaToken) daHeaders['2FA-Token'] = twoFaToken;

        const qcmRes = await fetch(daUrl, {
          method: 'POST',
          headers: daHeaders,
          body: 'data={}',
        });

        const qcmJson = await qcmRes.json();

        if (qcmJson.code === 200 && qcmJson.data?.question) {
          const rawQ = String(qcmJson.data.question);
          const rawChoices: string[] = Array.isArray(qcmJson.data.propositions) ? qcmJson.data.propositions : [];

          const decodedQuestion = Buffer.from(rawQ, 'base64').toString('utf8');
          const propositions = rawChoices.map((rc) => ({
            value: rc,
            label: Buffer.from(rc, 'base64').toString('utf8'),
          }));

          return res.status(200).json({
            code: 250,
            needs2FA: true,
            identifiant: cleanIdentifiant,
            motdepasse: pwd,
            token: finalToken,
            twoFaToken: twoFaToken,
            question: decodedQuestion,
            rawQuestion: rawQ,
            propositions,
            cookies: updatedCookies,
          });
        }
      }

      // Case 200: Authentication successful directly
      if (data.code === 200 && data.token) {
        tokenCookieStore.set(data.token, [...cookieMap.entries()].map(([k, v]) => `${k}=${v}`).join('; '));
        return res.status(200).json(data);
      }

      // If not 505 (e.g. rate limit, other error), break and return
      if (data.code !== 505) {
        break;
      }
    }

    return res.status(200).json(lastData || { code: 505, message: 'Identifiant et/ou mot de passe invalide !' });
  } catch (error: any) {
    console.error('Error connecting to EcoleDirecte login:', error);
    return res.status(500).json({
      code: 500,
      message: `Erreur de connexion au serveur EcoleDirecte: ${error.message || 'Serveur injoignable'}`,
    });
  }
});

// Proxy for EcoleDirecte 2FA Challenge Answer & Final Login Replay
app.post('/api/ecoledirecte/doubleauth', async (req: Request, res: Response) => {
  const { identifiant, motdepasse, token, twoFaToken, choix, cookies } = req.body;

  if (!token && !twoFaToken) {
    return res.status(401).json({ code: 401, message: 'Token de double authentification manquant.' });
  }

  if (!choix) {
    return res.status(400).json({ code: 400, message: 'Veuillez sélectionner une réponse au questionnaire.' });
  }

  try {
    const daUrl = `https://api.ecoledirecte.com/v3/connexion/doubleauth.awp?verbe=post&v=${ED_API_VERSION}`;
    const headers: Record<string, string> = {
      'User-Agent': ED_USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json, text/plain, */*',
    };
    if (token) headers['X-Token'] = String(token);
    if (twoFaToken) headers['2FA-Token'] = String(twoFaToken);
    if (cookies) headers['Cookie'] = String(cookies);

    // 1. Submit answer choice
    const payload = `data=${encodeURIComponent(JSON.stringify({ choix }))}`;
    const choiceRes = await fetch(daUrl, {
      method: 'POST',
      headers,
      body: payload,
    });

    const choiceJson = await choiceRes.json();
    const cn = choiceJson.data?.cn;
    const cv = choiceJson.data?.cv;

    if (choiceJson.code !== 200 || !cn || !cv) {
      return res.status(400).json({
        code: choiceJson.code || 400,
        message: choiceJson.message || 'Réponse incorrecte à la question de sécurité.',
      });
    }

    // 2. Replay final login with challenge proof (cn and cv)
    const replayGtkRes = await fetch(`https://api.ecoledirecte.com/v3/login.awp?gtk=1&v=${ED_API_VERSION}`, {
      method: 'GET',
      headers: {
        'User-Agent': ED_USER_AGENT,
        'Accept': 'application/json, text/plain, */*',
      },
    });
    const replayGtkCookies = replayGtkRes.headers.getSetCookie?.() || [];
    const { gtk: replayGtk, cookieHeader: replayCookieHeader } = parseCookies(replayGtkCookies);

    const replayPayload = `data=${encodeURIComponent(JSON.stringify({
      identifiant: String(identifiant).trim(),
      motdepasse: String(motdepasse).trim(),
      isReLogin: false,
      cn,
      cv,
      uuid: '',
      fa: [{ cn, cv, uniq: false }],
    }))}`;

    const replayRes = await fetch(`https://api.ecoledirecte.com/v3/login.awp?v=${ED_API_VERSION}`, {
      method: 'POST',
      headers: {
        'User-Agent': ED_USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json, text/plain, */*',
        'X-GTK': replayGtk,
        'Cookie': replayCookieHeader,
        'Connection': 'close',
      },
      body: replayPayload,
    });

    const replayJson = await replayRes.json();
    const finalToken = replayRes.headers.get('x-token') || replayJson.token;

    if (finalToken) {
      const finalCookies = replayRes.headers.getSetCookie?.() || [];
      const { cookieHeader } = parseCookies(finalCookies);
      tokenCookieStore.set(finalToken, cookieHeader || replayCookieHeader || '');
    }

    return res.status(replayRes.status).json(replayJson);
  } catch (error: any) {
    console.error('Error in doubleauth:', error);
    return res.status(500).json({
      code: 500,
      message: `Erreur lors de la validation 2FA: ${error.message}`,
    });
  }
});

// Proxy for EcoleDirecte Notes
app.post('/api/ecoledirecte/notes', async (req: Request, res: Response) => {
  const { studentId, anneeScolaire } = req.body;
  const token = req.headers['x-token'] || req.body.token;

  if (!token) {
    return res.status(401).json({
      code: 401,
      message: 'Token EcoleDirecte manquant. Veuillez vous reconnecter.',
    });
  }

  if (!studentId) {
    return res.status(400).json({
      code: 400,
      message: 'Identifiant élève manquant.',
    });
  }

  try {
    const payload = `data=${encodeURIComponent(JSON.stringify({
      anneeScolaire: anneeScolaire || '',
    }))}`;

    const url = `https://api.ecoledirecte.com/v3/eleves/${studentId}/notes.awp?verbe=get&v=${ED_API_VERSION}`;
    const cookieHeader = tokenCookieStore.get(String(token)) || '';

    const headers: Record<string, string> = {
      'User-Agent': ED_USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Token': String(token),
      'Accept': 'application/json, text/plain, */*',
      'Connection': 'close',
    };
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: payload,
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Error fetching EcoleDirecte notes:', error);
    return res.status(500).json({
      code: 500,
      message: `Erreur lors de la récupération des notes: ${error.message || 'Serveur injoignable'}`,
    });
  }
});

export default app;
