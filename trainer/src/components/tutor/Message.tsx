'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export interface MessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  onCitationClick?: (slug: string, anchor?: string) => void;
}

// Detect [Ch. 4 § Negation Test] / [Appendix § Reverse Trap] and turn them into
// clickable spans that scroll the iframe.
const CITATION_RE = /\[(Ch\.\s*\d+|Appendix)\s*§\s*([^\]]+)\]/g;

function transformCitations(
  text: string,
  onClick?: (slug: string, anchor?: string) => void,
): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  CITATION_RE.lastIndex = 0;
  while ((m = CITATION_RE.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const label = m[0];
    const chapterToken = m[1];
    const heading = m[2].trim();
    const slug = slugFromCitation(chapterToken);
    parts.push(
      <button
        key={`${m.index}-${label}`}
        type="button"
        className="citation-pill"
        onClick={() => onClick?.(slug, slugifyHeading(heading))}
        title={`Open ${slug}#${slugifyHeading(heading)}`}
      >
        {label}
      </button>,
    );
    last = m.index + label.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function slugFromCitation(token: string): string {
  if (token.toLowerCase().startsWith('appendix')) return 'appendix-trap-library';
  const m = token.match(/(\d+)/);
  if (!m) return '';
  const n = m[1].padStart(2, '0');
  const map: Record<string, string> = {
    '01': '01-quant-number-properties',
    '02': '02-quant-algebraic-logic',
    '03': '03-quant-word-problems',
    '04': '04-verbal-critical-reasoning',
    '05': '05-verbal-reading-comp',
    '06': '06-di-data-sufficiency',
    '07': '07-di-multi-source-reasoning',
    '08': '08-di-table-analysis',
    '09': '09-di-graphics-interpretation',
    '10': '10-strategy-art-of-skip',
  };
  return map[n] ?? '';
}

function slugifyHeading(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function Message({
  role,
  content,
  onCitationClick,
}: MessageProps) {
  const isUser = role === 'user';
  return (
    <div
      className="flex w-full gap-3 px-4 py-3"
      style={{
        background: isUser ? 'transparent' : 'var(--accent-mute)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
        style={{
          background: isUser ? 'var(--accent)' : 'var(--panel)',
          color: isUser ? '#fff' : 'var(--ink)',
          border: isUser ? 'none' : '1px solid var(--border)',
        }}
      >
        {isUser ? 'YOU' : 'GMT'}
      </div>
      <div
        className="prose-tutor min-w-0 flex-1 text-sm leading-relaxed"
        style={{ color: 'var(--ink)' }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            p({ children }) {
              return <p>{wrapTextChildren(children, onCitationClick)}</p>;
            },
            li({ children }) {
              return <li>{wrapTextChildren(children, onCitationClick)}</li>;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

function wrapTextChildren(
  children: React.ReactNode,
  onClick?: (slug: string, anchor?: string) => void,
): React.ReactNode {
  if (typeof children === 'string') {
    return <>{transformCitations(children, onClick)}</>;
  }
  if (Array.isArray(children)) {
    return children.map((c, i) =>
      typeof c === 'string' ? (
        <span key={i}>{transformCitations(c, onClick)}</span>
      ) : (
        c
      ),
    );
  }
  return children;
}
