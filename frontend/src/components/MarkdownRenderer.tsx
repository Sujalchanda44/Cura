import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Parses inline markdown: **bold**, *italic*
 */
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Regex to match **bold** or *italic*
  const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-slate-900 dark:text-slate-100">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let currentBullets: string[] = [];
  let currentNumbered: { num: string; text: string }[] = [];

  const flushLists = (keyPrefix: number) => {
    if (currentBullets.length > 0) {
      elements.push(
        <ul key={`ul-${keyPrefix}`} className="space-y-1.5 my-2">
          {currentBullets.map((bullet, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#134E2F] dark:bg-[#C1F3BA] mt-2 shrink-0" />
              <span>{renderInline(bullet)}</span>
            </li>
          ))}
        </ul>
      );
      currentBullets = [];
    }

    if (currentNumbered.length > 0) {
      elements.push(
        <ol key={`ol-${keyPrefix}`} className="space-y-1.5 my-2">
          {currentNumbered.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              <span className="font-bold text-[#134E2F] dark:text-[#C1F3BA] shrink-0 min-w-[1.2rem] text-xs mt-0.5">
                {item.num}.
              </span>
              <span>{renderInline(item.text)}</span>
            </li>
          ))}
        </ol>
      );
      currentNumbered = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Check for Heading 2 or 3 (## Heading)
    if (/^##+\s+/.test(trimmed)) {
      flushLists(idx);
      const headingText = trimmed.replace(/^##+\s+/, '');
      elements.push(
        <h3 
          key={`h-${idx}`} 
          className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mt-3 first:mt-0 mb-1.5 flex items-center gap-1.5 tracking-tight"
        >
          {renderInline(headingText)}
        </h3>
      );
      return;
    }

    // Check for Bullet (- Item or * Item)
    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      if (currentNumbered.length > 0) flushLists(idx);
      currentBullets.push(bulletMatch[1]);
      return;
    }

    // Check for Numbered list (1. Item)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numMatch) {
      if (currentBullets.length > 0) flushLists(idx);
      currentNumbered.push({ num: numMatch[1], text: numMatch[2] });
      return;
    }

    // Blank line
    if (trimmed === '') {
      flushLists(idx);
      return;
    }

    // Regular paragraph
    flushLists(idx);
    elements.push(
      <p key={`p-${idx}`} className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 my-1">
        {renderInline(trimmed)}
      </p>
    );
  });

  flushLists(lines.length);

  return <div className={`space-y-1 text-left ${className}`}>{elements}</div>;
};

export default MarkdownRenderer;
