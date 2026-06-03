'use client';

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';

type ChatArtifact = {
  type: 'image';
  url: string;
  prompt: string;
  layout: string;
  model: string;
};

type ChatSource = {
  title: string;
  url: string;
  publishedDate?: string;
  snippet?: string;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  artifacts?: ChatArtifact[];
  sources?: ChatSource[];
};

const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content: 'Bring me a rough LinkedIn idea, a topic, or a visual direction. I can research the angle, pressure-test the hook, draft post options, and generate images when you want a direction made tangible.',
  },
];

function MicrophoneIcon() {
  return (
    <svg aria-hidden="true" className="mx-auto h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11a7 7 0 0014 0M12 18v3M9 21h6" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg aria-hidden="true" className="mx-auto h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
    </svg>
  );
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function SourceList({ sources }: { sources?: ChatSource[] }) {
  if (!sources?.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {sources.map((source) => (
        <a
          key={source.url}
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="max-w-full rounded-md border border-studio-border bg-studio-bg px-2 py-1 text-xs text-studio-muted transition-colors hover:border-studio-muted hover:text-studio-text"
          title={source.snippet || source.title}
        >
          <span className="block max-w-52 truncate">{source.title}</span>
        </a>
      ))}
    </div>
  );
}

function ArtifactList({ artifacts }: { artifacts?: ChatArtifact[] }) {
  if (!artifacts?.length) return null;

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {artifacts.map((artifact) => (
        <div key={`${artifact.url}-${artifact.prompt}`} className="overflow-hidden rounded-lg border border-studio-border bg-studio-bg">
          <div className="aspect-[4/5] bg-black/20">
            <img src={artifact.url} alt={artifact.prompt} className="h-full w-full object-contain" />
          </div>
          <div className="space-y-2 p-3">
            <div className="flex flex-wrap gap-2 text-[11px] text-studio-muted">
              <span className="rounded bg-studio-elevated px-2 py-1">{artifact.layout}</span>
              <span className="rounded bg-studio-elevated px-2 py-1">{artifact.model}</span>
            </div>
            <p className="line-clamp-3 text-xs leading-relaxed text-studio-muted">{artifact.prompt}</p>
            <a
              href={artifact.url}
              download="imagegen-chat-output.png"
              className="inline-flex rounded-md border border-studio-border px-2 py-1 text-xs font-semibold text-studio-text hover:border-studio-muted"
            >
              Download image
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[min(760px,92%)] rounded-xl px-4 py-3 ${
          isUser
            ? 'bg-studio-accent text-white'
            : 'border border-studio-border bg-studio-surface text-studio-text'
        }`}
      >
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
        {!isUser && <ArtifactList artifacts={message.artifacts} />}
        {!isUser && <SourceList sources={message.sources} />}
      </div>
    </div>
  );
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = '0px';
    input.style.height = `${Math.min(input.scrollHeight, 180)}px`;
  }, [draft]);

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content || isSending) return;

    const userMessage: ChatMessage = { id: createId(), role: 'user', content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft('');
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages
            .filter((message) => message.id !== 'welcome')
            .map((message) => ({ role: message.role, content: message.content })),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'The chat agent failed.');
      }

      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: 'assistant',
          content: data.message?.content || 'I could not produce a response.',
          artifacts: data.message?.artifacts || [],
          sources: data.message?.sources || [],
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The chat agent failed.');
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void sendMessage();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const transcribeAudio = async (audio: Blob) => {
    setIsTranscribing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', audio, 'voice.webm');
      const response = await fetch('/api/transcribe', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Speech transcription failed.');
      }
      const text = typeof data.text === 'string' ? data.text.trim() : '';
      if (text) {
        setDraft((current) => current ? `${current.trimEnd()}\n${text}` : text);
        inputRef.current?.focus();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speech transcription failed.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser does not support microphone capture.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        const audio = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audio.size > 0) void transcribeAudio(audio);
      };

      recorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone permission was denied.');
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      void startRecording();
    }
  };

  return (
    <section className="flex h-full flex-col bg-studio-bg">
      <header className="border-b border-studio-border bg-studio-surface px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-studio-text">AI Chat</h1>
            <p className="mt-1 text-xs leading-relaxed text-studio-muted">
              Discuss ideas, research with OpenRouter Exa search, and generate images from the conversation.
            </p>
          </div>
          <div className="hidden rounded-lg border border-studio-border bg-studio-bg px-3 py-2 text-xs text-studio-muted sm:block">
            GPT-5.5 · medium reasoning
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto studio-scrollbar px-4 py-5">
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="rounded-xl border border-studio-border bg-studio-surface px-4 py-3 text-sm text-studio-muted">
                Thinking with tools...
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-studio-border bg-studio-surface px-4 py-3">
        <div className="mx-auto max-w-5xl">
          {error && (
            <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}
          <div className="flex items-end gap-2 rounded-xl border border-studio-border bg-studio-bg p-2 focus-within:border-studio-accent">
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask for LinkedIn post ideas, research, edits, or an image..."
              className="max-h-44 min-h-11 flex-1 resize-none bg-transparent px-2 py-3 text-sm text-studio-text placeholder:text-studio-muted focus:outline-none"
            />
            <button
              type="button"
              onClick={toggleRecording}
              disabled={isSending || isTranscribing}
              className={`h-10 w-10 shrink-0 rounded-lg border text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                isRecording
                  ? 'border-red-400 bg-red-500/20 text-red-200'
                  : 'border-studio-border bg-studio-elevated text-studio-text hover:border-studio-muted'
              }`}
              aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
              title={isRecording ? 'Stop recording' : 'Start voice input'}
            >
              {isTranscribing ? '...' : isRecording ? <StopIcon /> : <MicrophoneIcon />}
            </button>
            <button
              type="submit"
              disabled={isSending || !draft.trim()}
              className="h-10 shrink-0 rounded-lg bg-studio-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-studio-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
