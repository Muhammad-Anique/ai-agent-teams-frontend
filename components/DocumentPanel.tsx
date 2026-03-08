"use client";

import { useEffect, useRef } from "react";
import { AgentId } from "@/lib/types";
import { AGENT_CONFIGS } from "./AgentCanvas";
import { Bold, Italic, Underline, List, AlignLeft, Link2, Type, FileText, BookOpen } from "lucide-react";

export interface DocSection {
  id: string;
  agentId: AgentId;
  label: string;
  text: string;
  isActive: boolean;
}

interface Props {
  sections: DocSection[];
  activeAgents: Record<AgentId, string>;
}

// ── Inline markdown renderer ─────────────────────────────────────────────────
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIdx = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(text.slice(lastIdx, match.index));
    const m = match[0];
    if (m.startsWith("**"))
      parts.push(<strong key={match.index} style={{ fontWeight: 700, color: "#1e293b" }}>{m.slice(2, -2)}</strong>);
    else if (m.startsWith("*"))
      parts.push(<em key={match.index}>{m.slice(1, -1)}</em>);
    else if (m.startsWith("`"))
      parts.push(<code key={match.index} style={{ fontFamily: "monospace", background: "#f1f5f9", padding: "1px 4px", borderRadius: 3, fontSize: "10.5px" }}>{m.slice(1, -1)}</code>);
    lastIdx = match.index + m.length;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
        if (line.startsWith("# "))
          return <h1 key={i} style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 6, marginTop: i > 0 ? 14 : 0, fontFamily: "Georgia, serif" }}>{renderInline(line.slice(2))}</h1>;
        if (line.startsWith("## "))
          return <h2 key={i} style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4, marginTop: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>{renderInline(line.slice(3))}</h2>;
        if (line.startsWith("### "))
          return <h3 key={i} style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 3, marginTop: 8 }}>{renderInline(line.slice(4))}</h3>;
        if (line.match(/^[-*]\s/))
          return (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 3 }}>
              <span style={{ color: "#94a3b8", flexShrink: 0, marginTop: 2, fontSize: 13 }}>•</span>
              <span style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.75 }}>{renderInline(line.slice(2))}</span>
            </div>
          );
        if (line.match(/^\d+\.\s/)) {
          const num = line.match(/^(\d+)\./)?.[1];
          return (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 3 }}>
              <span style={{ color: "#94a3b8", flexShrink: 0, fontSize: 11, minWidth: 16 }}>{num}.</span>
              <span style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.75 }}>{renderInline(line.replace(/^\d+\.\s/, ""))}</span>
            </div>
          );
        }
        return <p key={i} style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.85, marginBottom: 3 }}>{renderInline(line)}</p>;
      })}
    </>
  );
}

// ── Toolbar button ────────────────────────────────────────────────────────────
function ToolBtn({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <button
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded transition-colors hover:bg-slate-100"
      style={{ color: "#64748b" }}
    >
      {children}
    </button>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DocumentPanel({ sections, activeAgents }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sections.length]);

  const hasContent = sections.length > 0;

  // Agents currently active (not idle)
  const activeEditorIds = (Object.entries(activeAgents) as [AgentId, string][])
    .filter(([, state]) => state !== "idle")
    .map(([id]) => id);

  return (
    <div className="flex flex-col h-full" style={{ background: "#f8fafc" }}>

      {/* ── Google Docs chrome ───────────────────────────────────────────── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>

        {/* Title row */}
        <div className="flex items-center gap-2.5 px-4 pt-3 pb-1.5">
          <div
            className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: "#4285f4" }}
          >
            <FileText size={14} color="white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: "#202124", fontFamily: "'Google Sans', sans-serif" }}>
              {hasContent ? "Legal Document" : "Untitled Document"}
            </div>
            <div className="text-[10px]" style={{ color: "#80868b" }}>
              {hasContent ? "All changes saved" : "Ready to draft"}
            </div>
          </div>

          {/* Active agent avatars — like Google Docs user cursors */}
          {activeEditorIds.length > 0 && (
            <div className="flex items-center flex-shrink-0" style={{ gap: -4 }}>
              {activeEditorIds.map((id, i) => {
                const cfg = AGENT_CONFIGS[id];
                const initials = cfg.name.split(" ").map((w: string) => w[0]).join("");
                return (
                  <div
                    key={id}
                    title={`${cfg.name} is editing`}
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                    style={{
                      background: cfg.color,
                      color: "white",
                      fontSize: 9,
                      border: "2px solid white",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
                      marginLeft: i > 0 ? -6 : 0,
                      zIndex: activeEditorIds.length - i,
                      position: "relative",
                    }}
                  >
                    {initials}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-3 pb-2">
          <ToolBtn title="Bold"><Bold size={13} /></ToolBtn>
          <ToolBtn title="Italic"><Italic size={13} /></ToolBtn>
          <ToolBtn title="Underline"><Underline size={13} /></ToolBtn>
          <div className="w-px h-4 mx-1 flex-shrink-0" style={{ background: "#e2e8f0" }} />
          <ToolBtn title="Heading"><Type size={13} /></ToolBtn>
          <ToolBtn title="Bullet list"><List size={13} /></ToolBtn>
          <ToolBtn title="Align left"><AlignLeft size={13} /></ToolBtn>
          <div className="w-px h-4 mx-1 flex-shrink-0" style={{ background: "#e2e8f0" }} />
          <ToolBtn title="Link"><Link2 size={13} /></ToolBtn>
        </div>
      </div>

      {/* ── Page area ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "16px 12px", background: "#f1f3f4" }}>

        {/* Empty state */}
        {!hasContent && (
          <div
            className="bg-white rounded-lg p-10 text-center"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" }}
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ background: "#f1f5f9" }}>
              <BookOpen size={22} style={{ color: "#cbd5e1" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "#64748b" }}>No document yet</p>
            <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>Submit a task to start drafting</p>
          </div>
        )}

        {/* Document page */}
        {hasContent && (
          <div
            className="bg-white rounded-lg overflow-hidden"
            style={{
              boxShadow: "0 1px 8px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)",
              minHeight: 400,
            }}
          >
            {sections.map((section, idx) => {
              const cfg = AGENT_CONFIGS[section.agentId];
              const isEditing = section.isActive;

              return (
                <div
                  key={section.id}
                  className="relative"
                  style={{
                    borderTop: idx > 0 ? `1px solid ${cfg.color}20` : "none",
                    transition: "all 0.35s ease",
                  }}
                >
                  {/* Section label bar */}
                  <div
                    className="flex items-center gap-2 px-5 pt-4 pb-1.5"
                    style={{ background: isEditing ? cfg.color + "08" : "transparent" }}
                  >
                    <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
                      {section.label}
                    </span>
                    <span className="text-[10px]" style={{ color: "#94a3b8" }}>· {cfg.name}</span>

                    {/* Inline editor avatar + "editing…" when active */}
                    {isEditing && (
                      <div className="ml-auto flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center font-bold"
                          style={{ background: cfg.color, color: "white", fontSize: 8 }}
                        >
                          {cfg.name.split(" ").map((w: string) => w[0]).join("")}
                        </div>
                        <span className="text-[10px] font-semibold animate-pulse" style={{ color: cfg.color }}>
                          editing…
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content with scan line */}
                  <div
                    className="relative px-5 pb-5"
                    style={{
                      borderLeft: `3px solid ${isEditing ? cfg.color + "70" : "transparent"}`,
                      background: isEditing ? cfg.color + "04" : "transparent",
                      transition: "all 0.35s ease",
                    }}
                  >
                    {isEditing && (
                      <div
                        className="absolute left-0 right-0 h-0.5 pointer-events-none"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${cfg.color}90, transparent)`,
                          animation: "scan 2s linear infinite",
                          opacity: 0.65,
                          top: 0,
                        }}
                      />
                    )}

                    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                      {renderMarkdown(section.text)}
                    </div>
                  </div>
                </div>
              );
            })}

            <div ref={bottomRef} style={{ height: 16 }} />
          </div>
        )}
      </div>
    </div>
  );
}
