import { useCallback, useEffect, useRef, useState } from 'react';
import { CaseSetupScreen } from './components/CaseSetupScreen';
import { ChatPanel } from './components/ChatPanel';
import { ConfirmModal } from './components/ConfirmModal';
import { ExhibitPanel } from './components/ExhibitPanel';
import { Header } from './components/Header';
import { ScorecardCard, ScorecardModal } from './components/ScorecardView';
import { Scratchpad } from './components/Scratchpad';
import { StageTracker } from './components/StageTracker';
import type {
  CaseSessionConfig,
  CaseStage,
  CaseType,
  ChatMessage,
  Difficulty,
  ExhibitItem,
  ScorecardRow,
} from './types/case';
import {
  buildCaseStartPayload,
  extractMarkdownTables,
  extractScorecardRows,
  isScorecardTable,
  parseStageTag,
} from './utils/caseParser';

const SCRATCHPAD_STORAGE_KEY = 'casecoach_scratchpad';

interface PendingRequest {
  sessionId: string;
  apiMessage: string;
  history: Array<{ role: 'user' | 'model'; text: string }>;
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function App() {
  const [sessionId, setSessionId] = useState<string>(() => createId());
  const [caseConfig, setCaseConfig] = useState<CaseSessionConfig | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStage, setCurrentStage] = useState<CaseStage>('Clarify');
  const [exhibits, setExhibits] = useState<ExhibitItem[]>([]);
  const [scorecardRows, setScorecardRows] = useState<ScorecardRow[] | null>(null);
  const [isScorecardCollapsed, setIsScorecardCollapsed] = useState(false);
  const [isScorecardModalOpen, setIsScorecardModalOpen] = useState(false);
  const [isConfirmNewCaseOpen, setIsConfirmNewCaseOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Scratchpad persisted in localStorage
  const [scratchpad, setScratchpad] = useState<string>(() => {
    try {
      return localStorage.getItem(SCRATCHPAD_STORAGE_KEY) ?? '';
    } catch {
      return '';
    }
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const activeSessionRef = useRef<string>(sessionId);

  useEffect(() => {
    activeSessionRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    if (!caseConfig || !isTimerRunning) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [caseConfig, isTimerRunning]);

  const handleScratchpadChange = useCallback((value: string) => {
    setScratchpad(value);
    try {
      localStorage.setItem(SCRATCHPAD_STORAGE_KEY, value);
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const handleClearScratchpad = useCallback(() => {
    setScratchpad('');
    try {
      localStorage.removeItem(SCRATCHPAD_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const dispatchChatRequest = useCallback(async (request: PendingRequest) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    setPendingRequest(request);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: request.sessionId,
          message: request.apiMessage,
          history: request.history,
        }),
        signal: controller.signal,
      });

      const data = (await response.json().catch(() => ({}))) as {
        text?: string;
        error?: string;
      };

      if (!response.ok || !data.text) {
        throw new Error(
          data.error || `Request failed with status ${response.status}.`,
        );
      }

      if (activeSessionRef.current !== request.sessionId) {
        return;
      }

      const rawText = data.text;
      const { stage, displayContent } = parseStageTag(rawText);
      const modelMessageId = createId();

      if (stage) {
        setCurrentStage(stage);
      }

      const parsedTables = extractMarkdownTables(displayContent);
      const exhibitTables = parsedTables.filter(
        (table) => !(stage === 'Feedback' && isScorecardTable(table.headers)),
      );

      if (exhibitTables.length > 0) {
        setExhibits((prev) => {
          let nextNum = prev.length + 1;
          const additions: ExhibitItem[] = exhibitTables.map((t) => ({
            id: `${modelMessageId}-ex-${nextNum}`,
            number: nextNum++,
            headers: t.headers,
            rows: t.rows,
            messageId: modelMessageId,
          }));
          return [...prev, ...additions];
        });
      }

      if (stage === 'Feedback') {
        const extractedScorecard = extractScorecardRows(displayContent);
        if (extractedScorecard) {
          setScorecardRows(extractedScorecard);
          setIsScorecardCollapsed(false);
        }
      }

      const modelMsg: ChatMessage = {
        id: modelMessageId,
        role: 'model',
        displayContent,
        apiContent: rawText,
        stage: stage ?? undefined,
      };

      setMessages((prev) => [...prev, modelMsg]);
      setPendingRequest(null);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      const errMessage =
        err instanceof Error
          ? err.message
          : 'Failed to communicate with CaseCoach. Please try again.';
      setError(errMessage);
    } finally {
      if (activeSessionRef.current === request.sessionId) {
        setIsLoading(false);
      }
    }
  }, []);

  const handleStartCase = useCallback(
    (caseType: CaseType, difficulty: Difficulty, selectedIndustry: string) => {
      const newSessionId = createId();
      activeSessionRef.current = newSessionId;
      setSessionId(newSessionId);

      const config = buildCaseStartPayload(caseType, difficulty, selectedIndustry);
      setCaseConfig(config);

      const firstUserMessage: ChatMessage = {
        id: createId(),
        role: 'user',
        displayContent: config.initialVisibleMessage,
        apiContent: config.initialApiMessage,
      };

      setMessages([firstUserMessage]);
      setCurrentStage('Clarify');
      setExhibits([]);
      setScorecardRows(null);
      setIsScorecardCollapsed(false);
      setIsScorecardModalOpen(false);
      setError(null);
      setElapsedSeconds(0);
      setIsTimerRunning(true);

      void dispatchChatRequest({
        sessionId: newSessionId,
        apiMessage: config.initialApiMessage,
        history: [],
      });
    },
    [dispatchChatRequest],
  );

  const sendUserMessage = useCallback(
    (visibleAndApiText: string) => {
      if (isLoading || !caseConfig) return;

      const history = messages.map((m) => ({
        role: m.role,
        text: m.apiContent,
      }));

      const userMsg: ChatMessage = {
        id: createId(),
        role: 'user',
        displayContent: visibleAndApiText,
        apiContent: visibleAndApiText,
      };

      setMessages((prev) => [...prev, userMsg]);

      void dispatchChatRequest({
        sessionId,
        apiMessage: visibleAndApiText,
        history,
      });
    },
    [caseConfig, dispatchChatRequest, isLoading, messages, sessionId],
  );

  const handleRetry = useCallback(() => {
    if (!pendingRequest || isLoading) return;
    void dispatchChatRequest(pendingRequest);
  }, [dispatchChatRequest, isLoading, pendingRequest]);

  const handleEndCase = useCallback(() => {
    sendUserMessage('I have to stop here. Please score what I did so far.');
  }, [sendUserMessage]);

  const handleDrillWeakest = useCallback(() => {
    sendUserMessage("Yes, let's do the drill on my weakest skill.");
  }, [sendUserMessage]);

  const handleConfirmNewCase = useCallback(() => {
    abortControllerRef.current?.abort();
    const oldSessionId = sessionId;
    void fetch(`/api/chat/${encodeURIComponent(oldSessionId)}`, {
      method: 'DELETE',
    }).catch(() => {});

    const nextSessionId = createId();
    activeSessionRef.current = nextSessionId;
    setSessionId(nextSessionId);
    setCaseConfig(null);
    setMessages([]);
    setCurrentStage('Clarify');
    setExhibits([]);
    setScorecardRows(null);
    setIsScorecardCollapsed(false);
    setIsScorecardModalOpen(false);
    setIsConfirmNewCaseOpen(false);
    setIsLoading(false);
    setError(null);
    setPendingRequest(null);
    setElapsedSeconds(0);
    setIsTimerRunning(false);
  }, [sessionId]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Header
        inSession={caseConfig !== null}
        elapsedSeconds={elapsedSeconds}
        isTimerRunning={isTimerRunning}
        onStartTimer={() => setIsTimerRunning(true)}
        onPauseTimer={() => setIsTimerRunning(false)}
        onResetTimer={() => {
          setIsTimerRunning(false);
          setElapsedSeconds(0);
        }}
        onEndCase={handleEndCase}
        onRequestNewCase={() => setIsConfirmNewCaseOpen(true)}
        hasScorecard={scorecardRows !== null}
        onOpenScorecardModal={() => setIsScorecardModalOpen(true)}
        isLoading={isLoading}
      />

      {!caseConfig ? (
        <CaseSetupScreen onStartCase={handleStartCase} />
      ) : (
        <>
          <StageTracker
            currentStage={currentStage}
            hasScorecard={scorecardRows !== null}
          />

          <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 sm:px-6 py-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
              {/* Left / Center Column: Scorecard (when ready) + Chat */}
              <div className="flex-1 min-w-0 space-y-4">
                {scorecardRows && (
                  <ScorecardCard
                    rows={scorecardRows}
                    hiddenSetting={caseConfig.hiddenSetting}
                    onDrillWeakest={handleDrillWeakest}
                    onRequestNewCase={() => setIsConfirmNewCaseOpen(true)}
                    isLoading={isLoading}
                    isCollapsed={isScorecardCollapsed}
                    onToggleCollapse={() =>
                      setIsScorecardCollapsed((prev) => !prev)
                    }
                  />
                )}

                <ChatPanel
                  messages={messages}
                  isLoading={isLoading}
                  error={error}
                  onSendMessage={sendUserMessage}
                  onRetry={handleRetry}
                />
              </div>

              {/* Right Column: Exhibits & Scratchpad (stacks below chat on narrow screens) */}
              <aside
                aria-label="Case workspace tools"
                className="w-full lg:w-[390px] xl:w-[430px] shrink-0 flex flex-col gap-5 lg:h-[calc(100vh-190px)] lg:min-h-[460px]"
              >
                <ExhibitPanel exhibits={exhibits} />
                <Scratchpad
                  value={scratchpad}
                  onChange={handleScratchpadChange}
                  onClear={handleClearScratchpad}
                />
              </aside>
            </div>
          </main>
        </>
      )}

      {scorecardRows && caseConfig && (
        <ScorecardModal
          isOpen={isScorecardModalOpen}
          onClose={() => setIsScorecardModalOpen(false)}
          rows={scorecardRows}
          hiddenSetting={caseConfig.hiddenSetting}
          onDrillWeakest={handleDrillWeakest}
          onRequestNewCase={() => {
            setIsScorecardModalOpen(false);
            setIsConfirmNewCaseOpen(true);
          }}
          isLoading={isLoading}
        />
      )}

      <ConfirmModal
        isOpen={isConfirmNewCaseOpen}
        title="Start a new case?"
        message="Returning to case setup will clear your current conversation, exhibits, and timer."
        confirmLabel="New case"
        cancelLabel="Keep practising"
        onConfirm={handleConfirmNewCase}
        onCancel={() => setIsConfirmNewCaseOpen(false)}
      />
    </div>
  );
}
