"use client";

import { FeedItem, AgentId } from "@/lib/types";
import { AGENT_CONFIGS } from "./AgentCanvas";
import { Brain, ArrowRight, MessageCircle, CheckCircle2, PartyPopper, AlertCircle, Activity } from "lucide-react";

interface Props {
  items: FeedItem[];
}

const EVENT_META: Record<string, { icon: React.ReactNode; label: string }> = {
  agent_thinking: { icon: <Brain size={11} />,         label: "Thinking"  },
  agent_move:     { icon: <ArrowRight size={11} />,    label: "Moving"    },
  agent_speak:    { icon: <MessageCircle size={11} />, label: "Speaking"  },
  agent_idle:     { icon: <CheckCircle2 size={11} />,  label: "Done"      },
  task_complete:  { icon: <PartyPopper size={11} />,   label: "Complete"  },
  error:          { icon: <AlertCircle size={11} />,   label: "Error"     },
};

function timeStr(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function TaskFeed({ items }: Props) {
  return (
    <div className="flex flex-col h-full" style={{ background: "#fff" }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--border-soft)", background: "var(--surface)" }}>
        <Activity size={14} style={{ color: "var(--text-3)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Org Log</span>
        {items.length > 0 && (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "var(--border)", color: "var(--text-2)" }}>
            {items.length}
          </span>
        )}
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {items.length === 0 && (
          <div className="text-center pt-8">
            <p className="text-xs" style={{ color: "var(--text-3)" }}>Waiting for task...</p>
          </div>
        )}

        {[...items].reverse().map((item) => {
          const cfg = item.agent ? AGENT_CONFIGS[item.agent as AgentId] : null;
          const meta = EVENT_META[item.type] ?? { icon: <Activity size={11} />, label: item.type };
          const isComplete = item.type === "task_complete";
          const isError = item.type === "error";

          return (
            <div
              key={item.id}
              className="rounded-lg p-2.5 animate-in"
              style={{
                background: isComplete ? "#f0fdf4" : isError ? "#fef2f2" : "var(--surface)",
                border: `1px solid ${isComplete ? "#bbf7d0" : isError ? "#fecaca" : "var(--border-soft)"}`,
              }}
            >
              {/* Top row */}
              <div className="flex items-center gap-1.5 mb-1">
                {/* Event type badge */}
                <span
                  className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{
                    background: isComplete ? "#dcfce7" : isError ? "#fee2e2" : cfg ? cfg.color + "15" : "var(--surface-2)",
                    color: isComplete ? "#15803d" : isError ? "#dc2626" : cfg ? cfg.color : "var(--text-2)",
                  }}
                >
                  {meta.icon}
                  <span>{meta.label}</span>
                </span>

                {/* Agent name */}
                {cfg && (
                  <span className="text-[10px] font-semibold" style={{ color: cfg.color }}>
                    {cfg.name.split(" ")[0]}
                  </span>
                )}

                {/* Time */}
                <span className="ml-auto text-[9px]" style={{ color: "var(--text-3)" }}>
                  {timeStr(item.timestamp)}
                </span>
              </div>

              {/* Message */}
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-2)" }}>
                {item.message.slice(0, 120)}{item.message.length > 120 ? "…" : ""}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
