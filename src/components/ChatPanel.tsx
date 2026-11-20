import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AlertCircle, RefreshCw, Send } from 'lucide-react';
import type { ChatMessage } from '../types/case';

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (text: string) => void;
  onRetry: () => void;
}

export function ChatPanel({
  messages,
  isLoading,
  error,
  onSendMessage,
  onRetry,
}: ChatPanelProps) {
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, error]);

  const submitMessage = () => {
    const trimmed = draft.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setDraft('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  };

  return (
    <section
      aria-label="Case interview conversation"
      className="flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden h-[620px] lg:h-[calc(100vh-190px)] min-h-[460px]"
    >
      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <span className="mb-1 text-xs font-medium text-slate-500">
                {isUser ? 'You' : 'CaseCoach'}
              </span>
              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-lg px-4 py-3 text-[15px] leading-relaxed ${
                  isUser
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 bg-slate-50 text-slate-900'
                }`}
              >
                {isUser ? (
                  <div className="whitespace-pre-wrap break-words">
                    {msg.displayContent}
                  </div>
                ) : (
                  <div className="case-markdown overflow-x-auto break-words">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.displayContent}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex flex-col items-start">
            <span className="mb-1 text-xs font-medium text-slate-500">CaseCoach</span>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              CaseCoach is thinking…
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-medium">Unable to reach CaseCoach</p>
                <p className="mt-0.5 text-xs text-rose-800">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onRetry}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-md border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-slate-50/60 p-3 sm:p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitMessage();
          }}
          className="flex items-end gap-3"
        >
          <label htmlFor="chat-input" className="sr-only">
            Your response
          </label>
          <textarea
            id="chat-input"
            ref={textareaRef}
            rows={2}
            value={draft}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your response… (Enter to send, Shift+Enter for a new line)"
            className="flex-1 resize-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
          />
          <button
            type="submit"
            disabled={isLoading || !draft.trim()}
            className="inline-flex h-[42px] items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            <span>Send</span>
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </section>
  );
}
