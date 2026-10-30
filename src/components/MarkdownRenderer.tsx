"use client";

import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeLanguage = "";
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      if (listType === "ul") {
        elements.push(
          <ul
            key={`list-${elements.length}`}
            className="my-3 space-y-1.5 list-disc list-inside text-slate-300 text-sm leading-relaxed"
          >
            {listItems.map((item, idx) => (
              <li key={idx} className="text-slate-300">
                {renderInline(item)}
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol
            key={`list-${elements.length}`}
            className="my-3 space-y-1.5 list-decimal list-inside text-slate-300 text-sm leading-relaxed"
          >
            {listItems.map((item, idx) => (
              <li key={idx} className="text-slate-300">
                {renderInline(item)}
              </li>
            ))}
          </ol>
        );
      }
      listItems = [];
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced Code Block start/end
    if (line.trim().startsWith("```")) {
      flushList();
      if (inCodeBlock) {
        // End code block
        const codeText = codeBlockContent.join("\n");
        elements.push(
          <div
            key={`code-${elements.length}`}
            className="my-4 rounded-lg border border-slate-800 bg-[#06080d] p-4 font-mono text-xs text-emerald-400 overflow-x-auto shadow-inner"
          >
            {codeLanguage && (
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-800 pb-1">
                {codeLanguage}
              </div>
            )}
            <pre className="font-mono leading-relaxed">{codeText}</pre>
          </div>
        );
        inCodeBlock = false;
        codeBlockContent = [];
        codeLanguage = "";
      } else {
        // Start code block
        inCodeBlock = true;
        codeLanguage = line.trim().replace(/^```/, "");
        codeBlockContent = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Dividers
    if (line.trim() === "---" || line.trim() === "***") {
      flushList();
      elements.push(
        <hr
          key={`hr-${elements.length}`}
          className="my-6 border-slate-800"
        />
      );
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3
          key={`h3-${elements.length}`}
          className="mt-6 mb-2 text-base font-semibold text-white font-mono"
        >
          {renderInline(line.replace("### ", ""))}
        </h3>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2
          key={`h2-${elements.length}`}
          className="mt-8 mb-3 text-lg sm:text-xl font-bold text-white font-mono border-b border-slate-800/80 pb-2"
        >
          {renderInline(line.replace("## ", ""))}
        </h2>
      );
      continue;
    }

    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1
          key={`h1-${elements.length}`}
          className="mt-6 mb-4 text-2xl font-bold text-white font-mono"
        >
          {renderInline(line.replace("# ", ""))}
        </h1>
      );
      continue;
    }

    // Unordered lists
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      if (listType === "ol") flushList();
      listType = "ul";
      listItems.push(line.trim().replace(/^[-*]\s+/, ""));
      continue;
    }

    // Ordered lists
    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      if (listType === "ul") flushList();
      listType = "ol";
      listItems.push(numMatch[2]);
      continue;
    }

    // Normal paragraph or empty line
    flushList();
    if (line.trim().length === 0) {
      continue;
    }

    elements.push(
      <p
        key={`p-${elements.length}`}
        className="my-3 text-sm sm:text-base leading-relaxed text-slate-300"
      >
        {renderInline(line)}
      </p>
    );
  }

  flushList();

  return <div className="space-y-1">{elements}</div>;
}

/**
 * Parses inline bold, code, and links.
 */
function renderInline(text: string): React.ReactNode {
  // Regex to match `code`, **bold**, or [text](url)
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-xs text-emerald-300 border border-slate-700/60"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 underline hover:text-emerald-300 transition-colors"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}
