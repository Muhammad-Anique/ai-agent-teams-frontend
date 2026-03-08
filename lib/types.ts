export type AgentId = "alex" | "sam" | "jordan" | "riley" | "casey";

export type AgentState = "idle" | "thinking" | "talking" | "moving";

export interface AgentConfig {
  id: AgentId;
  name: string;
  role: string;
  department: string;
  color: string;
  emoji: string;
  mapsTo: string;
}

export interface AgentRuntimeState {
  id: AgentId;
  state: AgentState;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  thought?: string;
  speechTarget?: AgentId | "all";
  speechMessage?: string;
  lastThoughts: string[];
  lastMessages: string[];
}

export type WSEvent =
  | { type: "agent_thinking"; agent: AgentId; thought: string }
  | { type: "agent_move"; agent: AgentId; to: AgentId | "center" | "all" }
  | { type: "agent_speak"; from: AgentId; to: AgentId | "all"; message: string; isContent?: boolean }
  | { type: "agent_idle"; agent: AgentId }
  | { type: "task_complete"; result: string }
  | { type: "error"; message: string };

export interface FeedItem {
  id: string;
  agent?: AgentId;
  agentName?: string;
  type: string;
  message: string;
  timestamp: Date;
}
