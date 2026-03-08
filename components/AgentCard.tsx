"use client";

import { AgentId, AgentRuntimeState } from "@/lib/types";
import { AGENT_CONFIGS } from "./AgentCanvas";
import { Brain, MessageCircle, Briefcase, X } from "lucide-react";

interface Props {
  agentId: AgentId | null;
  agents: Record<AgentId, AgentRuntimeState>;
  onClose: () => void;
}

const STATE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  idle:     { label: "Idle",     color: "#16a34a", bg: "#f0fdf4" },
  thinking: { label: "Thinking", color: "#d97706", bg: "#fffbeb" },
  talking:  { label: "Speaking", color: "#2563eb", bg: "#eff6ff" },
  moving:   { label: "Moving",   color: "#7c3aed", bg: "#f5f3ff" },
};

export default function AgentCard({ agentId, agents, onClose }: Props) {
  const show = !!agentId;
  const cfg = agentId ? AGENT_CONFIGS[agentId] : null;
  const runtime = agentId ? agents[agentId] : null;
  const stateInfo = runtime ? (STATE_CONFIG[runtime.state] ?? STATE_CONFIG.idle) : STATE_CONFIG.idle;

  return (
    <div
      className="fixed top-0 right-0 h-full w-72 z-50 flex flex-col"
      style={{
        background: "var(--surface)",
        borderLeft: "1px solid var(--border-soft)",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.08)",
        transform: show ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {cfg && runtime && (
        <>
          {/* Header with color strip */}
          <div className="relative px-5 pt-5 pb-4" style={{ background: cfg.color + "08", borderBottom: "1px solid var(--border-soft)" }}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "var(--border-soft)", color: "var(--text-3)" }}
            >
              <X size={13} />
            </button>

            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: cfg.color + "20", border: `1.5px solid ${cfg.color}40` }}
              >
                {cfg.emoji}
              </div>
              <div>
                <h2 className="font-bold text-sm" style={{ color: "var(--text)" }}>{cfg.name}</h2>
                <p className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.role}</p>
                <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{cfg.department}</p>
              </div>
            </div>

            {/* Status */}
            <div className="mt-3 flex items-center gap-2">
              <span
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: stateInfo.bg, color: stateInfo.color }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {stateInfo.label}
              </span>
              <span
                className="text-[10px] px-2 py-1 rounded-full font-medium"
                style={{ background: cfg.color + "15", color: cfg.color }}
              >
                {cfg.mapsTo}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Current activity */}
            {(runtime.state === "thinking" && runtime.thought) && (
              <div className="rounded-xl p-3" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#d97706" }}>
                  💭 Currently thinking
                </p>
                <p className="text-xs italic" style={{ color: "#92400e" }}>"{runtime.thought}"</p>
              </div>
            )}
            {(runtime.state === "talking" && runtime.speechMessage) && (
              <div className="rounded-xl p-3" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#2563eb" }}>
                  💬 Currently saying
                </p>
                <p className="text-xs" style={{ color: "#1e40af" }}>"{runtime.speechMessage.slice(0, 100)}…"</p>
              </div>
            )}

            {/* Brain / recent thoughts */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Brain size={12} style={{ color: "var(--text-3)" }} />
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Brain</p>
              </div>
              {runtime.lastThoughts.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--text-3)" }}>No thoughts yet…</p>
              ) : (
                <div className="space-y-1.5">
                  {runtime.lastThoughts.slice(-3).reverse().map((t, i) => (
                    <div key={i} className="text-xs px-3 py-2 rounded-lg" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>
                      {t}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent messages */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <MessageCircle size={12} style={{ color: "var(--text-3)" }} />
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Recent Messages</p>
              </div>
              {runtime.lastMessages.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--text-3)" }}>No messages yet…</p>
              ) : (
                <div className="space-y-1.5">
                  {runtime.lastMessages.slice(-4).reverse().map((m, i) => (
                    <div
                      key={i}
                      className="text-xs px-3 py-2 rounded-lg border-l-2"
                      style={{ borderColor: cfg.color + "66", background: cfg.color + "08", color: "var(--text-2)" }}
                    >
                      {m.slice(0, 100)}{m.length > 100 ? "…" : ""}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Role info */}
            <div className="rounded-xl p-3" style={{ background: "var(--surface-2)" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Briefcase size={11} style={{ color: "var(--text-3)" }} />
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>Genie AI Pillar</p>
              </div>
              <p className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.mapsTo}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
