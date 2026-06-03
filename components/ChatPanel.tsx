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
    <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11a7 7 0 0014 0M12 18v3M9 21h6" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="currentColor" viewBox="0 0 24 24">
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg aria-hidden="true" className="h-[18px] w-[18px] animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} />
      <path className="opacity-90" fill="currentColor" d="M12 2a10 10 0 0110 10h-3a7 7 0 00-7-7V2z" />
    </svg>
  );
}

function AssistantMark() {
  return (
    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-studio-accent/15 text-studio-accent ring-1 ring-inset ring-studio-accent/25">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
        <path d="M12 1.6c.46 5.2 2.9 7.64 8.4 8.4-5.5.76-7.94 3.2-8.4 8.4-.46-5.2-2.9-7.64-8.4-8.4 5.5-.76 7.94-3.2 8.4-8.4Z" />
      </svg>
    </span>
  );
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function SourceList({ sources }: { sources?: ChatSource[] }) {
  if (!sources?.length) return null;

  return (
    <div className="mt-3">
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-studio-muted">Sources</div>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((source, index) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-studio-border bg-studio-bg px-2 py-1 text-xs text-studio-muted transition-colors hover:border-studio-muted hover:text-studio-text"
            title={source.snippet || source.title}
          >
            <span className="text-studio-muted/70">{index + 1}</span>
            <span className="block max-w-52 truncate">{source.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function ArtifactList({ artifacts }: { artifacts?: ChatArtifact[] }) {
  if (!artifacts?.length) return null;

  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {artifacts.map((artifact) => (
        <figure key={`${artifact.url}-${artifact.prompt}`} className="overflow-hidden rounded-lg border border-studio-border bg-studio-bg">
          <a href={artifact.url} target="_blank" rel="noreferrer" className="block aspect-[4/5] bg-black/20" title="Open full size">
            <img src={artifact.url} alt={artifact.prompt} className="h-full w-full object-contain" />
          </a>
          <figcaption className="space-y-2 p-3">
            <div className="flex flex-wrap gap-1.5 text-[11px] text-studio-muted">
              <span className="rounded bg-studio-elevated px-2 py-0.5">{artifact.layout}</span>
              <span className="rounded bg-studio-elevated px-2 py-0.5">{artifact.model}</span>
            </div>
            <p className="line-clamp-2 text-xs leading-relaxed text-studio-muted">{artifact.prompt}</p>
            <div className="flex gap-2 pt-0.5">
              <a
                href={artifact.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-md border border-studio-border px-2 py-1 text-xs font-semibold text-studio-text transition-colors hover:border-studio-muted"
              >
                Open
              </a>
              <a
                href={artifact.url}
                download="imagegen-chat-output.png"
                className="inline-flex rounded-md border border-studio-border px-2 py-1 text-xs font-semibold text-studio-text transition-colors hover:border-studio-muted"
              >
                Download
              </a>
            </div>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function MessageRow({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[min(640px,85%)] rounded-2xl bg-studio-elevated px-4 py-2.5 text-sm leading-relaxed text-studio-text">
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <AssistantMark />
      <div className="min-w-0 flex-1">
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-studio-text">{message.content}</div>
        <ArtifactList artifacts={message.artifacts} />
        <SourceList sources={message.sources} />
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
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micSupported, setMicSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setMicSupported(
      typeof navigator !== 'undefined' &&
        Boolean(navigator.mediaDevices?.getUserMedia) &&
        typeof window !== 'undefined' &&
        typeof window.MediaRecorder !== 'undefined',
    );
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = '0px';
    input.style.height = `${Math.min(input.scrollHeight, 180)}px`;
  }, [draft]);

  useEffect(() => {
    if (!isRecording) return;
    setRecordingSeconds(0);
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setRecordingSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRecording]);

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
      } else {
        setError('No speech was detected. Try again.');
      }
      inputRef.current?.focus();
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
      setMicSupported(false);
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
      setIsRecording(false);
      const denied = err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      setError(
        denied
          ? 'Microphone access was denied. Enable it in your browser settings to dictate.'
          : 'Could not start recording. Check your microphone and try again.',
      );
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      void startRecording();
    }
  };

  const micDisabled = !micSupported || isSending || isTranscribing;
  const micLabel = !micSupported
    ? 'Voice input is not supported in this browser'
    : isTranscribing
      ? 'Transcribing voice input'
      : isRecording
        ? 'Stop recording'
        : 'Start voice input';

  return (
    <section className="flex h-full flex-col bg-studio-bg">
      <header className="border-b border-studio-border bg-studio-surface px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <h1 className="text-sm font-semibold text-studio-text">AI Chat</h1>
          <span className="rounded-md border border-studio-border bg-studio-bg px-2 py-1 text-[11px] text-studio-muted">
            GPT-5.5 · medium reasoning
          </span>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto studio-scrollbar px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {messages.map((message) => (
            <MessageRow key={message.id} message={message} />
          ))}
          {isSending && (
            <div className="flex gap-3" aria-live="polite">
              <AssistantMark />
              <div className="flex items-center gap-1 pt-2.5">
                <span className="chat-typing-dot h-1.5 w-1.5 rounded-full bg-studio-muted" />
                <span className="chat-typing-dot h-1.5 w-1.5 rounded-full bg-studio-muted" />
                <span className="chat-typing-dot h-1.5 w-1.5 rounded-full bg-studio-muted" />
                <span className="sr-only">Generating a response</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-studio-border bg-studio-surface px-4 py-3">
        <div className="mx-auto max-w-3xl">
          {error && (
            <div className="mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
              {error}
            </div>
          )}
          {isRecording && (
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200" aria-live="polite">
              <span className="loading-pulse h-2 w-2 rounded-full bg-red-400" aria-hidden="true" />
              <span className="tabular-nums">Recording · {formatDuration(recordingSeconds)}</span>
              <span className="text-red-200/70">— tap the stop button to transcribe</span>
            </div>
          )}
          <div className="flex items-end gap-2 rounded-xl border border-studio-border bg-studio-bg p-2 transition-colors focus-within:border-studio-accent">
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask for LinkedIn post ideas, research, edits, or an image..."
              aria-label="Message"
              className="studio-scrollbar max-h-44 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm text-studio-text placeholder:text-studio-muted focus:outline-none"
            />
            <button
              type="button"
              onClick={toggleRecording}
              disabled={micDisabled}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                isRecording
                  ? 'border-red-400 bg-red-500/20 text-red-200'
                  : 'border-studio-border bg-studio-elevated text-studio-text hover:border-studio-muted'
              }`}
              aria-label={micLabel}
              aria-pressed={isRecording}
              title={micLabel}
            >
              {isTranscribing ? <SpinnerIcon /> : isRecording ? <StopIcon /> : <MicrophoneIcon />}
            </button>
            <button
              type="submit"
              disabled={isSending || !draft.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-studio-accent text-white transition-colors hover:bg-studio-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message"
              title="Send message"
            >
              {isSending ? <SpinnerIcon /> : <SendIcon />}
            </button>
          </div>
          <p className="mt-1.5 px-1 text-[11px] text-studio-muted">
            Enter to send · Shift+Enter for a new line
          </p>
        </div>
      </form>
    </section>
  );
}
