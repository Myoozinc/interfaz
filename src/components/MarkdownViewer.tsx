import React from 'react';

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split content by code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`space-y-2.5 leading-relaxed text-xs sm:text-sm text-slate-800 ${className}`}>
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          const lang = lines[0]?.match(/^[a-z0-9_-]+$/i) ? lines[0] : '';
          const code = lang ? lines.slice(1).join('\n') : lines.join('\n');
          return (
            <div key={index} className="my-2.5 rounded-xl bg-slate-900 text-slate-100 overflow-hidden text-xs font-mono shadow-xs">
              {lang && (
                <div className="px-3 py-1 bg-slate-800/80 border-b border-slate-700 text-[10px] text-slate-400 font-sans uppercase tracking-wider font-semibold">
                  {lang}
                </div>
              )}
              <pre className="p-3 overflow-x-auto select-text font-mono leading-normal text-emerald-400">{code}</pre>
            </div>
          );
        }

        // Render normal markdown blocks (headings, lists, blockquotes, paragraphs)
        const lines = part.split('\n');
        const elements: React.ReactNode[] = [];
        let currentList: React.ReactNode[] = [];

        const flushList = () => {
          if (currentList.length > 0) {
            elements.push(
              <ul key={`ul-${elements.length}`} className="space-y-1.5 my-2 pl-1">
                {currentList}
              </ul>
            );
            currentList = [];
          }
        };

        lines.forEach((line, lIdx) => {
          const trimmed = line.trim();

          if (!trimmed) {
            flushList();
            return;
          }

          // Headers
          if (trimmed.startsWith('### ')) {
            flushList();
            elements.push(
              <h3 key={`h3-${lIdx}`} className="text-xs sm:text-sm font-bold text-indigo-950 mt-3 mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block"></span>
                <span>{renderInline(trimmed.slice(4))}</span>
              </h3>
            );
          } else if (trimmed.startsWith('## ')) {
            flushList();
            elements.push(
              <h2 key={`h2-${lIdx}`} className="text-sm sm:text-base font-extrabold text-slate-900 mt-3.5 mb-1.5">
                {renderInline(trimmed.slice(3))}
              </h2>
            );
          } else if (trimmed.startsWith('# ')) {
            flushList();
            elements.push(
              <h1 key={`h1-${lIdx}`} className="text-base sm:text-lg font-black text-slate-900 mt-4 mb-2">
                {renderInline(trimmed.slice(2))}
              </h1>
            );
          } else if (trimmed.startsWith('> ')) {
            flushList();
            elements.push(
              <div key={`quote-${lIdx}`} className="p-3 my-2 rounded-xl bg-indigo-50/90 border-l-3 border-indigo-500 text-indigo-950 text-xs font-medium leading-relaxed shadow-2xs">
                {renderInline(trimmed.slice(2))}
              </div>
            );
          } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            currentList.push(
              <li key={`li-${lIdx}`} className="flex items-start gap-2 text-xs text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span className="flex-1">{renderInline(trimmed.slice(2))}</span>
              </li>
            );
          } else {
            flushList();
            elements.push(
              <p key={`p-${lIdx}`} className="my-1 text-slate-700 text-xs sm:text-[13px]">
                {renderInline(trimmed)}
              </p>
            );
          }
        });

        flushList();
        return <React.Fragment key={index}>{elements}</React.Fragment>;
      })}
    </div>
  );
};

function renderInline(text: string): React.ReactNode {
  const tokens = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={i} className="font-semibold text-slate-900">{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-indigo-600 font-mono text-[11px] border border-slate-200">
          {token.slice(1, -1)}
        </code>
      );
    }
    return token;
  });
}
