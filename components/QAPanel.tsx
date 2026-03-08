"use client";

import { useState } from "react";
import { AGENT_CONFIGS } from "./AgentCanvas";
import { X, ArrowRight, Sparkles, Loader2 } from "lucide-react";

interface Props {
  task: string;
  questions: string[] | null; // null = still loading
  onSubmit: (answers: Record<string, string>) => void;
  onSkip: () => void;
  onClose: () => void;
}

export default function QAPanel({ task, questions, onSubmit, onSkip, onClose }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const alex = AGENT_CONFIGS["alex"];

  const handleSubmit = () => {
    onSubmit(answers);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: "#fff",
          boxShadow: "0 40px 100px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.06)",
          animation: "fadeInUp 0.25s ease",
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center gap-3 px-6 py-4"
          style={{
            background: alex.color + "0C",
            borderBottom: `1px solid ${alex.color}22`,
          }}
        >
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{
              background: alex.color + "20",
              border: `1.5px solid ${alex.color}40`,
            }}
          >
            👔
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: alex.color }}>
              Alex Chen
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
              Managing Partner · Anique&apos;s Organization
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto w-7 h-7 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "var(--surface-2)", color: "var(--text-3)" }}
          >
            <X size={13} />
          </button>
        </div>

        {/* ── Alex's greeting bubble ── */}
        <div className="px-6 pt-5 pb-3">
          <div
            className="rounded-2xl rounded-tl-sm px-4 py-3"
            style={{ background: alex.color + "0E", border: `1px solid ${alex.color}1A` }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
              Before I get the team started on{" "}
              <span className="font-semibold" style={{ color: "var(--text)" }}>
                &ldquo;{task.slice(0, 80)}{task.length > 80 ? "…" : ""}&rdquo;
              </span>
              , let me ask a few quick questions so we can deliver exactly what you need.
            </p>
          </div>
        </div>

        {/* ── Questions ── */}
        <div className="px-6 pb-3 space-y-4">
          {questions === null ? (
            /* Loading state */
            <div className="flex items-center gap-3 py-4">
              <Loader2 size={16} className="animate-spin" style={{ color: alex.color }} />
              <span className="text-sm" style={{ color: "var(--text-3)" }}>
                Alex is thinking about what to ask…
              </span>
            </div>
          ) : (
            questions.map((q, i) => (
              <div key={i} className="space-y-1.5">
                <label className="flex items-start gap-2.5">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center font-bold flex-shrink-0 mt-0.5"
                    style={{ background: alex.color, color: "white", fontSize: 10 }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {q}
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Your answer…"
                  value={answers[q] || ""}
                  onChange={(e) => setAnswers((p) => ({ ...p, [q]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && i === questions.length - 1) handleSubmit();
                  }}
                  className="w-full text-sm rounded-xl px-4 py-2.5 outline-none transition-all"
                  style={{
                    background: "var(--surface-2)",
                    border: "1.5px solid var(--border-soft)",
                    color: "var(--text)",
                    marginLeft: 28,
                    width: "calc(100% - 28px)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = alex.color + "80")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-soft)")}
                />
              </div>
            ))
          )}
        </div>

        {/* ── Actions ── */}
        <div className="px-6 pb-5 pt-2 flex items-center gap-3">
          <button
            onClick={onSkip}
            className="text-sm px-4 py-2.5 rounded-xl transition-colors"
            style={{ color: "var(--text-3)", background: "var(--surface-2)" }}
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={questions === null}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl transition-all"
            style={{
              background: questions === null ? "var(--surface-2)" : alex.color,
              color: questions === null ? "var(--text-3)" : "white",
              cursor: questions === null ? "not-allowed" : "pointer",
            }}
          >
            <Sparkles size={13} />
            Start Working
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
