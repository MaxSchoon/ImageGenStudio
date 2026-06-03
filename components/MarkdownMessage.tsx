'use client';

import Markdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Render the model's markdown output (headings, bold, lists, blockquotes,
// links, code, tables) styled for the dark studio chat. react-markdown builds
// React elements and ignores raw HTML, so model output cannot inject markup.
const components: Components = {
  p: ({ children }) => <p className="mb-3 leading-relaxed last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-studio-text">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-studio-accent underline underline-offset-2 transition-colors hover:text-studio-accent-hover"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0 marker:text-studio-muted">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0 marker:text-studio-muted">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-studio-accent/60 pl-3 text-studio-muted">{children}</blockquote>
  ),
  h1: ({ children }) => <h1 className="mb-2 mt-4 text-base font-semibold first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-4 text-base font-semibold first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-1.5 mt-3 text-sm font-semibold first:mt-0">{children}</h3>,
  h4: ({ children }) => <h4 className="mb-1.5 mt-3 text-sm font-semibold first:mt-0">{children}</h4>,
  hr: () => <hr className="my-4 border-studio-border" />,
  code: ({ className, children }) => {
    const isBlock = /language-/.test(className ?? '');
    return isBlock ? (
      <code className={`${className ?? ''} font-mono`}>{children}</code>
    ) : (
      <code className="rounded bg-studio-elevated px-1 py-0.5 font-mono text-[0.85em]">{children}</code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-lg border border-studio-border bg-studio-bg p-3 text-xs leading-relaxed last:mb-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-left text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border border-studio-border px-2 py-1 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border border-studio-border px-2 py-1">{children}</td>,
};

export default function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="break-words text-sm leading-relaxed text-studio-text">
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </Markdown>
    </div>
  );
}
