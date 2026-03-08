"use client";

import { useState } from "react";
import { Send, Zap } from "lucide-react";

interface Props {
  onSubmit: (task: string) => void;
  disabled: boolean;
}

const EXAMPLES = [
  "Draft an NDA between Anique's Organization and Genie AI",
  "Review this service agreement for liability risks",
  "What jurisdiction applies to a remote work contract?",
  "Create an IP assignment agreement for a software contractor",
];

export default function TaskInput({ onSubmit, disabled }: Props) {
  const [value, setValue] = useState("");
  const [showExamples, setShowExamples] = useState(false);

  const submit = () => {
    const t = value.trim();
    if (!t || disabled) return;
    onSubmit(t);
    setValue("");
    setShowExamples(false);
  };

  return (
    <div className="relative" style={{ background: "var(--surface)", borderTop: "1px solid var(--border-soft)" }}>
      {/* Example suggestions */}
      {showExamples && (
        <div
          className="absolute bottom-full left-0 right-0 p-3 space-y-1"
          style={{ background: "var(--surface)", borderTop: "1px solid var(--border-soft)", boxShadow: "0 -8px 24px rgba(0,0,0,0.07)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-3)" }}>
            Quick examples
          </p>
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => { setValue(ex); setShowExamples(false); }}
              className="w-full text-left text-xs px-3 py-2 rounded-lg transition-colors"
              style={{ color: "var(--text-2)", background: "transparent" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setShowExamples(s => !s)}
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: showExamples ? "#eef2ff" : "var(--surface-2)", color: showExamples ? "#6366f1" : "var(--text-3)" }}
          title="Examples"
        >
          <Zap size={14} />
        </button>

        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder={disabled ? "Agents are working…" : `Submit a legal task… e.g. "Draft an NDA"`}
          disabled={disabled}
          className="flex-1 text-sm outline-none bg-transparent placeholder:text-slate-400"
          style={{ color: "var(--text)" }}
        />

        <button
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: disabled || !value.trim() ? "var(--surface-2)" : "#6366f1",
            color: disabled || !value.trim() ? "var(--text-3)" : "white",
            cursor: disabled || !value.trim() ? "not-allowed" : "pointer",
          }}
        >
          {disabled ? (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
          ) : (
            <>
              <Send size={13} />
              Run
            </>
          )}
        </button>
      </div>
    </div>
  );
}
