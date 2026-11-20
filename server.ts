import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, type Chat, type Content } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { FULL_SYSTEM_INSTRUCTION } from './src/systemPrompt.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const PRIMARY_MODEL = 'gemini-3.8-flash';
const FALLBACK_MODEL = 'gemini-4-hydrogen';

function getAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface HistoryTurn {
  role: 'user' | 'model';
  text: string;
}

interface ChatSessionEntry {
  chat: Chat;
  model: string;
}

const chatSessions = new Map<string, ChatSessionEntry>();

function formatHistory(history?: HistoryTurn[]): Content[] {
  if (!Array.isArray(history)) {
    return [];
  }
  return history
    .filter(
      (item) =>
        item &&
        (item.role === 'user' || item.role === 'model') &&
        typeof item.text === 'string' &&
        item.text.trim().length > 0,
    )
    .map((item) => ({
      role: item.role,
      parts: [{ text: item.text }],
    }));
}

function getErrorStatus(err: unknown): number | undefined {
  if (typeof (err as { status?: unknown })?.status === 'number') {
    return (err as { status: number }).status;
  }
  if (typeof (err as { code?: unknown })?.code === 'number') {
    return (err as { code: number }).code;
  }
  const message = err instanceof Error ? err.message : String(err ?? '');
  const lower = message.toLowerCase();
  if (
    lower.includes('503') ||
    lower.includes('unavailable') ||
    lower.includes('high demand')
  ) {
    return 503;
  }
  if (
    lower.includes('429') ||
    lower.includes('quota') ||
    lower.includes('resource_exhausted')
  ) {
    return 429;
  }
  return undefined;
}

function isFallbackEligibleError(err: unknown): boolean {
  const status = getErrorStatus(err);
  return status === 503 || status === 429;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.post('/api/chat', async (req, res) => {
    try {
      const { sessionId, message, history } = req.body as {
        sessionId?: string;
        message?: string;
        history?: HistoryTurn[];
      };

      if (!sessionId || typeof sessionId !== 'string') {
        res.status(400).json({ error: 'Missing sessionId.' });
        return;
      }
      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Missing message.' });
        return;
      }

      const ai = getAIClient();
      let session = chatSessions.get(sessionId);
      const historyForFallback: Content[] = Array.isArray(history)
        ? formatHistory(history)
        : session
          ? await session.chat.getHistory()
          : [];

      if (!session) {
        const chat = ai.chats.create({
          model: PRIMARY_MODEL,
          history: historyForFallback,
          config: {
            systemInstruction: FULL_SYSTEM_INSTRUCTION,
          },
        });
        session = { chat, model: PRIMARY_MODEL };
        chatSessions.set(sessionId, session);
      }

      let activeModel = session.model;
      let response;

      try {
        response = await session.chat.sendMessage({ message });
      } catch (primaryErr: unknown) {
        if (session.model === PRIMARY_MODEL && isFallbackEligibleError(primaryErr)) {
          const reason = getErrorStatus(primaryErr) ?? 'error';
          console.warn(
            `[CaseCoach] ${PRIMARY_MODEL} failed (${reason}) for session ${sessionId}; retrying once with ${FALLBACK_MODEL}.`,
          );

          const fallbackChat = ai.chats.create({
            model: FALLBACK_MODEL,
            history: historyForFallback,
            config: {
              systemInstruction: FULL_SYSTEM_INSTRUCTION,
            },
          });

          session = { chat: fallbackChat, model: FALLBACK_MODEL };
          chatSessions.set(sessionId, session);
          activeModel = FALLBACK_MODEL;
          response = await fallbackChat.sendMessage({ message });
        } else {
          throw primaryErr;
        }
      }

      const text = response.text ?? '';

      if (!text.trim()) {
        res.status(502).json({
          error: 'CaseCoach returned an empty response. Please try again.',
        });
        return;
      }

      console.log(`[CaseCoach] Session ${sessionId} answered by ${activeModel}`);
      res.json({ text });
    } catch (err: unknown) {
      console.error('Gemini API error:', err);
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred while contacting CaseCoach.';
      const status = getErrorStatus(err) ?? 500;

      res.status(status >= 400 && status < 600 ? status : 500).json({
        error: message,
      });
    }
  });

  app.delete('/api/chat/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    if (sessionId) {
      chatSessions.delete(sessionId);
    }
    res.json({ ok: true });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CaseCoach server running on http://localhost:${PORT}`);
  });
}

startServer();
