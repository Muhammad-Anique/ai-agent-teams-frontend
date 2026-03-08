"use client";

import { useState, useCallback, useRef } from "react";
import AgentCanvas, { AGENT_CONFIGS } from "@/components/AgentCanvas";
import AgentCard from "@/components/AgentCard";
import TaskFeed from "@/components/TaskFeed";
import TaskInput from "@/components/TaskInput";
import DocumentPanel, { DocSection } from "@/components/DocumentPanel";
import QAPanel from "@/components/QAPanel";
import { useWebSocket } from "@/hooks/useWebSocket";
import { AgentId, AgentRuntimeState, FeedItem, WSEvent } from "@/lib/types";
import { Building2, X } from "lucide-react";

const AGENT_IDS: AgentId[] = ["alex", "sam", "jordan", "riley", "casey"];

function makeInitialAgents(): Record<AgentId, AgentRuntimeState> {
  const r = {} as Record<AgentId, AgentRuntimeState>;
  for (const id of AGENT_IDS) {
    r[id] = { id, state: "idle", x: 0, y: 0, targetX: 0, targetY: 0, lastThoughts: [], lastMessages: [] };
  }
  return r;
}

// Only these agents write to the document panel (isContent events)
const AGENT_SECTION_LABEL: Partial<Record<AgentId, string>> = {
  casey:  "Templates",
  sam:    "Draft",
  jordan: "Risk Review",
  riley:  "Compliance",
  alex:   "Final",
};

interface QAState {
  task: string;
  questions: string[] | null; // null = loading
}

export default function HomePage() {
  const [agents, setAgents] = useState<Record<AgentId, AgentRuntimeState>>(makeInitialAgents);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [docSections, setDocSections] = useState<DocSection[]>([]);
  const [finalResult, setFinalResult] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentId | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [qaState, setQaState] = useState<QAState | null>(null);
  const feedIdRef = useRef(0);
  const docIdRef = useRef(0);
  const docSectionsByAgent = useRef<Partial<Record<AgentId, string>>>({});

  const addFeed = useCallback((item: Omit<FeedItem, "id" | "timestamp">) => {
    const id = String(feedIdRef.current++);
    setFeedItems(p => [...p.slice(-199), { ...item, id, timestamp: new Date() }]);
  }, []);

  const setAgentState = useCallback((id: AgentId, patch: Partial<AgentRuntimeState>) => {
    setAgents(p => ({ ...p, [id]: { ...p[id], ...patch } }));
  }, []);

  const updateDocActiveState = useCallback((activeAgentId: AgentId | null) => {
    if (!activeAgentId) return;
    const readingMap: Partial<Record<AgentId, AgentId[]>> = {
      jordan: ["sam"],
      riley:  ["sam", "jordan"],
      alex:   ["sam", "jordan", "riley", "casey"],
    };
    const reading = readingMap[activeAgentId] ?? [];
    setDocSections(prev =>
      prev.map(s => ({ ...s, isActive: reading.includes(s.agentId) }))
    );
  }, []);

  const addDocSection = useCallback((agentId: AgentId, text: string) => {
    const label = AGENT_SECTION_LABEL[agentId];
    if (!label || !text || text.length < 50) return;
    const id = String(docIdRef.current++);
    docSectionsByAgent.current[agentId] = id;
    setDocSections(p => [
      ...p.map(s => ({ ...s, isActive: false })),
      { id, agentId, label, text, isActive: true },
    ]);
  }, []);

  const handleWSEvent = useCallback((event: WSEvent) => {
    switch (event.type) {
      case "agent_thinking": {
        const { agent, thought } = event;
        setAgents(p => ({
          ...p,
          [agent]: { ...p[agent], state: "thinking", thought, lastThoughts: [...(p[agent]?.lastThoughts ?? []), thought].slice(-10) },
        }));
        updateDocActiveState(agent);
        addFeed({ agent, agentName: AGENT_CONFIGS[agent].name, type: "agent_thinking", message: thought });
        break;
      }
      case "agent_move": {
        const { agent, to } = event;
        setAgentState(agent, { state: "moving", speechTarget: to as AgentId });
        addFeed({ agent, agentName: AGENT_CONFIGS[agent].name, type: "agent_move", message: `Moving to ${to === "center" ? "center" : AGENT_CONFIGS[to as AgentId]?.name ?? to}` });
        break;
      }
      case "agent_speak": {
        const { from, to, message, isContent } = event;
        const toName = to === "all" ? "everyone" : AGENT_CONFIGS[to as AgentId]?.name ?? to;
        setAgents(p => ({
          ...p,
          [from]: {
            ...p[from],
            state: "talking",
            speechTarget: to,
            speechMessage: message,
            lastMessages: [...(p[from]?.lastMessages ?? []), message].slice(-10),
          },
        }));
        // Only add to document panel when backend marks it as content
        if (isContent) {
          addDocSection(from, message);
          updateDocActiveState(from);
        }
        const feedMsg = isContent
          ? `→ ${toName}: [document content — ${message.length} chars]`
          : `→ ${toName}: ${message}`;
        addFeed({ agent: from, agentName: AGENT_CONFIGS[from].name, type: "agent_speak", message: feedMsg });
        break;
      }
      case "agent_idle": {
        const { agent } = event;
        setAgentState(agent, { state: "idle", thought: undefined, speechTarget: undefined, speechMessage: undefined });
        setDocSections(p => p.map(s => s.agentId === agent ? { ...s, isActive: false } : s));
        break;
      }
      case "task_complete": {
        const { result } = event;
        setFinalResult(result);
        setIsRunning(false);
        setDocSections(p => p.map(s => ({ ...s, isActive: false })));
        addFeed({ type: "task_complete", message: "Task complete — final deliverable ready!" });
        setAgents(p => {
          const n = { ...p };
          for (const id of AGENT_IDS) n[id] = { ...n[id], state: "idle", thought: undefined, speechMessage: undefined, speechTarget: undefined };
          return n;
        });
        break;
      }
      case "error": {
        addFeed({ type: "error", message: event.message });
        setIsRunning(false);
        break;
      }
    }
  }, [setAgentState, addFeed, addDocSection, updateDocActiveState]);

  useWebSocket(handleWSEvent);

  // Submit task to backend with optional Q&A answers
  const submitTask = useCallback(async (task: string, answers: Record<string, string>) => {
    setIsRunning(true);
    setQaState(null);
    setFinalResult(null);
    setFeedItems([]);
    setDocSections([]);
    docSectionsByAgent.current = {};
    addFeed({ type: "agent_thinking", message: `Task: "${task}"` });
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";
      const res = await fetch(`${apiUrl}/task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, answers }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      addFeed({ type: "error", message: `Failed to submit: ${msg}` });
      setIsRunning(false);
    }
  }, [addFeed]);

  // When user submits — show QA panel first, fetch Alex's questions
  const handleSubmit = useCallback(async (task: string) => {
    // Show panel immediately with loading state
    setQaState({ task, questions: null });
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";
      const res = await fetch(`${apiUrl}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      });
      const data = await res.json();
      setQaState({ task, questions: data.questions ?? [] });
    } catch {
      // Fallback questions if API fails
      setQaState({
        task,
        questions: [
          "Who are the parties involved and what are their roles?",
          "Which jurisdiction or governing law should apply?",
          "Any specific clauses or requirements to include?",
        ],
      });
    }
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: "var(--bg)" }}>

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <header
        className="flex items-center gap-4 px-5 h-12 flex-shrink-0"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border-soft)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#6366f1" }}>
            <Building2 size={14} color="white" />
          </div>
          <div>
            <span className="font-bold text-sm" style={{ color: "var(--text)" }}>Anique&apos;s Organization</span>
            <span className="text-xs ml-1.5" style={{ color: "var(--text-3)" }}>AI Law Firm</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 ml-4">
          {AGENT_IDS.map(id => {
            const cfg = AGENT_CONFIGS[id];
            const ag = agents[id];
            const isActive = ag?.state !== "idle";
            return (
              <div key={id} className="flex items-center gap-1 px-2 py-1 rounded-full transition-all" style={{
                background: isActive ? cfg.color + "18" : "var(--surface-2)",
                border: `1px solid ${isActive ? cfg.color + "44" : "var(--border-soft)"}`,
              }}>
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    background: isActive ? cfg.color : "var(--border)",
                    boxShadow: isActive ? `0 0 0 3px ${cfg.color}30` : "none",
                    transition: "all 0.3s",
                  }}
                />
                <span className="text-[10px] font-medium hidden sm:block" style={{ color: isActive ? cfg.color : "var(--text-3)" }}>
                  {cfg.name.split(" ")[0]}
                </span>
              </div>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
            style={{
              background: isRunning ? "#fffbeb" : "#f0fdf4",
              color: isRunning ? "#d97706" : "#16a34a",
            }}
          >
            <span className={`w-1.5 h-1.5 rounded-full bg-current ${isRunning ? "animate-pulse" : ""}`} />
            {isRunning ? "Running" : "Ready"}
          </span>
          <span className="text-xs" style={{ color: "var(--text-3)" }}>gpt-4o-mini</span>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        <div className="flex-1 relative min-w-0">
          <AgentCanvas
            agents={agents}
            onAgentClick={id => setSelectedAgent(selectedAgent === id ? null : id)}
          />
          <div className="absolute bottom-3 left-3 text-[10px] px-2 py-1 rounded-md" style={{ background: "rgba(255,255,255,0.7)", color: "var(--text-3)", backdropFilter: "blur(4px)" }}>
            Click any agent to inspect
          </div>
        </div>

        <div className="w-[440px] flex-shrink-0 flex flex-col overflow-hidden" style={{ borderLeft: "1px solid var(--border-soft)" }}>
          <div className="flex-1 min-h-0 overflow-hidden">
            <DocumentPanel
              sections={docSections}
              activeAgents={Object.fromEntries(AGENT_IDS.map(id => [id, agents[id]?.state ?? "idle"])) as Record<AgentId, string>}
            />
          </div>
          <div className="h-56 flex-shrink-0 overflow-hidden" style={{ borderTop: "1px solid var(--border-soft)" }}>
            <TaskFeed items={feedItems} />
          </div>
        </div>
      </div>

      {/* ── Task input ───────────────────────────────────────────────────────── */}
      <TaskInput onSubmit={handleSubmit} disabled={isRunning} />

      {/* ── Agent card overlay ───────────────────────────────────────────────── */}
      <AgentCard agentId={selectedAgent} agents={agents} onClose={() => setSelectedAgent(null)} />

      {/* ── Q&A panel (Alex asks questions before starting) ──────────────────── */}
      {qaState && (
        <QAPanel
          task={qaState.task}
          questions={qaState.questions}
          onSubmit={(answers) => submitTask(qaState.task, answers)}
          onSkip={() => submitTask(qaState.task, {})}
          onClose={() => setQaState(null)}
        />
      )}

      {/* ── Final result modal ───────────────────────────────────────────────── */}
      {finalResult && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-2xl rounded-2xl overflow-hidden" style={{ background: "var(--surface)", boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
              <div className="flex items-center gap-2">
                <span className="text-lg">🎉</span>
                <h3 className="font-bold" style={{ color: "var(--text)" }}>Final Deliverable</h3>
              </div>
              <button onClick={() => setFinalResult(null)} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ background: "var(--surface-2)", color: "var(--text-3)" }}>
                <X size={14} />
              </button>
            </div>
            <div
              className="p-6 max-h-96 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: "var(--text-2)", fontFamily: "Georgia, serif", lineHeight: 1.9 }}
            >
              {finalResult}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
