"use client";

import { useRef, useEffect, useCallback } from "react";
import { AgentId, AgentRuntimeState, AgentConfig } from "@/lib/types";

export const AGENT_CONFIGS: Record<AgentId, AgentConfig> = {
  alex:   { id: "alex",   name: "Alex Chen",    role: "Managing Partner",   department: "Leadership",        color: "#6366f1", emoji: "👔", mapsTo: "Orchestrator" },
  sam:    { id: "sam",    name: "Sam Rivera",   role: "Document Architect", department: "Document Creation", color: "#059669", emoji: "✍️", mapsTo: "Create"       },
  jordan: { id: "jordan", name: "Jordan Park",  role: "Risk Analyst",       department: "Risk & Compliance", color: "#d97706", emoji: "🔍", mapsTo: "Review"       },
  riley:  { id: "riley",  name: "Riley Morgan", role: "Legal Counsel",      department: "Legal Research",    color: "#2563eb", emoji: "💬", mapsTo: "Ask"          },
  casey:  { id: "casey",  name: "Casey Kim",    role: "Paralegal",          department: "Support Services",  color: "#db2777", emoji: "📚", mapsTo: "Templates"    },
};

const AGENT_IDS: AgentId[] = ["alex", "sam", "jordan", "riley", "casey"];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

// ── Speech bubble (drawn in screen space) ────────────────────────────────────
function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  ax: number, ay: number, // agent screen position
  R: number,              // agent radius
  text: string,
  color: string,
  W: number, _H: number
) {
  const maxBW = Math.min(W * 0.23, 210);
  const lH = 13;
  const padX = 11, padY = 8;

  ctx.save();
  ctx.font = "9px Inter, sans-serif";

  // Word-wrap to 3 lines max
  const words = text.replace(/\n/g, " ").split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxBW - padX * 2 && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length >= 3) { lines[2] += "…"; break; }
    } else {
      cur = test;
    }
  }
  if (cur && lines.length < 3) lines.push(cur);

  const bH = lines.length * lH + padY * 2;
  const bW = maxBW;

  // Position above agent, clamped to screen
  let bX = ax - bW / 2;
  let bY = ay - R - 14 - bH;
  bX = Math.max(6, Math.min(W - bW - 6, bX));
  bY = Math.max(6, bY);

  // Shadow
  ctx.shadowColor = "rgba(0,0,0,0.18)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;

  // Bubble background
  rr(ctx, bX, bY, bW, bH, 10);
  ctx.fillStyle = color + "F0";
  ctx.fill();
  ctx.shadowColor = "transparent";

  // Pointer triangle
  const tipX = Math.max(bX + 18, Math.min(bX + bW - 18, ax));
  ctx.beginPath();
  ctx.moveTo(tipX - 9, bY + bH);
  ctx.lineTo(tipX + 9, bY + bH);
  ctx.lineTo(tipX, bY + bH + 10);
  ctx.closePath();
  ctx.fillStyle = color + "F0";
  ctx.fill();

  // Text
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.font = "9px Inter, sans-serif";
  ctx.textAlign = "left";
  lines.forEach((line, i) => {
    ctx.fillText(line, bX + padX, bY + padY + 11 + i * lH);
  });

  ctx.restore();
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Desk positions and rotations in screen space
function getDeskLayout(W: number, H: number) {
  return {
    alex:   { x: W * 0.50,   y: H * 0.085,  rot: 0            },
    sam:    { x: W * 0.048,  y: H * 0.475,  rot:  Math.PI / 2 },
    jordan: { x: W * 0.952,  y: H * 0.475,  rot: -Math.PI / 2 },
    riley:  { x: W * 0.048,  y: H * 0.795,  rot:  Math.PI / 2 },
    casey:  { x: W * 0.952,  y: H * 0.795,  rot: -Math.PI / 2 },
  };
}

// Agent avatar positions — in front of their desk (toward room center)
function getHomePositions(W: number, H: number) {
  return {
    alex:   { x: W * 0.50,  y: H * 0.200 },
    sam:    { x: W * 0.155, y: H * 0.475 },
    jordan: { x: W * 0.845, y: H * 0.475 },
    riley:  { x: W * 0.155, y: H * 0.795 },
    casey:  { x: W * 0.845, y: H * 0.795 },
    center: { x: W * 0.50,  y: H * 0.50  },
  };
}

// ── Personalised screen content (drawn in local desk space) ──────────────────

function drawAlexScreen(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, active: boolean, t: number) {
  const p = active ? 0.5 + Math.sin(t * 0.003) * 0.4 : 0.25;
  const cx = x + w / 2;
  ctx.fillStyle = `rgba(99,102,241,${p})`;
  ctx.beginPath(); ctx.arc(cx, y + h * 0.3, 3.5, 0, Math.PI * 2); ctx.fill();
  const cols = [x + w*0.12, x + w*0.37, x + w*0.63, x + w*0.88];
  ctx.strokeStyle = `rgba(99,102,241,${p * 0.6})`; ctx.lineWidth = 0.8;
  for (const cx2 of cols) {
    ctx.beginPath(); ctx.moveTo(cx, y + h*0.3); ctx.lineTo(cx2, y + h*0.68); ctx.stroke();
    ctx.fillStyle = `rgba(99,102,241,${p * 0.85})`;
    ctx.beginPath(); ctx.arc(cx2, y + h*0.68, 2.2, 0, Math.PI*2); ctx.fill();
  }
  if (active) {
    ctx.fillStyle = `rgba(99,102,241,0.2)`;
    rr(ctx, x+2, y+h*0.82, w-4, h*0.1, 2); ctx.fill();
    ctx.fillStyle = `rgba(99,102,241,${p})`;
    rr(ctx, x+3, y+h*0.83, ((t*0.0008)%1)*(w-6), h*0.08, 1); ctx.fill();
  }
}

function drawSamScreen(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, active: boolean, t: number) {
  const a = active ? 0.75 : 0.3;
  const rows = [0.15, 0.29, 0.43, 0.57, 0.71];
  const ws   = [0.88, 0.62, 0.80, 0.48, 0.70];
  for (let i = 0; i < rows.length; i++) {
    let lw = ws[i];
    if (active && i === rows.length - 1) lw = ws[i] * (0.25 + ((t*0.0004)%0.75));
    ctx.fillStyle = `rgba(5,150,105,${a})`;
    ctx.fillRect(x+3, y+h*rows[i], (w-6)*lw, 1.5);
  }
  if (active && Math.floor(t/500)%2===0) {
    ctx.fillStyle = "rgba(5,150,105,0.95)";
    ctx.fillRect(x+3+(w-6)*0.32, y+h*0.71, 1, 7);
  }
}

function drawJordanScreen(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, active: boolean, t: number) {
  const grid = [["#dc2626","#ea580c","#d97706","#65a30d"],["#ea580c","#d97706","#65a30d","#16a34a"],["#d97706","#65a30d","#16a34a","#16a34a"]];
  const cw = (w-6)/4; const ch = (h-8)/3;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    const a = active ? 0.45+Math.sin(t*0.002+r+c)*0.3 : 0.25;
    ctx.fillStyle = grid[r][c]+Math.round(a*255).toString(16).padStart(2,"0");
    rr(ctx, x+3+c*cw, y+4+r*ch, cw-1.5, ch-1.5, 1.5); ctx.fill();
  }
  if (active) {
    const sr = Math.floor((t*0.0012)%3);
    ctx.strokeStyle="rgba(215,119,6,0.85)"; ctx.lineWidth=1;
    ctx.strokeRect(x+2, y+3+sr*ch, w-4, ch);
  }
}

function drawRileyScreen(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, active: boolean, t: number) {
  const a = active ? 0.85 : 0.35;
  ctx.strokeStyle=`rgba(37,99,235,${a*0.55})`; ctx.lineWidth=1;
  rr(ctx, x+3, y+h*0.1, w-6, h*0.2, 3); ctx.stroke();
  ctx.strokeStyle=`rgba(37,99,235,${a})`; ctx.lineWidth=1;
  ctx.beginPath(); ctx.arc(x+10, y+h*0.2, 3, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x+12.5,y+h*0.22); ctx.lineTo(x+15,y+h*0.26); ctx.stroke();
  const rows=[0.4,0.54,0.68,0.82];
  for (let i=0;i<rows.length;i++) {
    const ra = active ? (i===Math.floor((t*0.0012)%rows.length)?0.9:0.35) : 0.22;
    ctx.fillStyle=`rgba(37,99,235,${ra})`;
    ctx.fillRect(x+4, y+h*rows[i], (w-8)*0.78, 1.5);
    ctx.fillStyle=`rgba(37,99,235,${ra*0.45})`;
    ctx.fillRect(x+4, y+h*rows[i]+4, (w-8)*0.45, 1);
  }
}

function drawCaseyScreen(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, active: boolean, t: number) {
  const colors=["#db2777","#ec4899","#f472b6","#be185d","#db2777","#ec4899"];
  const fw=(w-8)/3; const fh=(h-8)/2;
  for (let r=0;r<2;r++) for (let c=0;c<3;c++) {
    const i=r*3+c;
    const hi=active&&i===Math.floor((t*0.001)%6);
    const a=hi?0.9:(active?0.45:0.22);
    ctx.fillStyle=colors[i]+Math.round(a*255).toString(16).padStart(2,"0");
    rr(ctx, x+4+c*fw, y+4+r*fh, fw*0.55, fh*0.18, 1); ctx.fill();
    rr(ctx, x+4+c*fw, y+4+r*fh+fh*0.16, fw-2, fh*0.68, 2); ctx.fill();
    if (hi) { ctx.strokeStyle=colors[i]; ctx.lineWidth=0.8; rr(ctx, x+4+c*fw, y+4+r*fh+fh*0.16, fw-2, fh*0.68, 2); ctx.stroke(); }
  }
}

// ── Draw one desk unit in LOCAL space (0,0 = desk center, "wall" = -y) ───────
function drawDeskUnit(
  ctx: CanvasRenderingContext2D,
  id: AgentId,
  cfg: AgentConfig,
  isActive: boolean,
  ts: number,
  W: number,
  H: number
) {
  const dW = W * 0.082;      // desk surface width
  const dH = H * 0.052;      // desk surface depth
  const mW = dW * 0.62;      // monitor width
  const mH = dH * 1.15;      // monitor height
  const gap = H * 0.006;     // gap between desk surface and monitor bottom

  // ── Desk surface (agent color) ─────────────────────────────────────────
  const g = ctx.createLinearGradient(0, -dH/2, 0, dH/2);
  g.addColorStop(0, cfg.color + "55");
  g.addColorStop(1, cfg.color + "30");
  ctx.fillStyle = g;
  rr(ctx, -dW/2, -dH/2, dW, dH, 6); ctx.fill();
  ctx.strokeStyle = cfg.color + "70"; ctx.lineWidth = 1;
  rr(ctx, -dW/2, -dH/2, dW, dH, 6); ctx.stroke();

  // ── Monitor stand ──────────────────────────────────────────────────────
  ctx.fillStyle = "#6b7280";
  ctx.fillRect(-1.5, -dH/2 - gap, 3, gap + 1);           // neck
  ctx.fillRect(-dW*0.1, -dH/2, dW*0.2, dH*0.12);         // base

  // ── Monitor bezel ──────────────────────────────────────────────────────
  const bezelY = -dH/2 - gap - mH;
  ctx.fillStyle = "#1e293b";
  rr(ctx, -mW/2, bezelY, mW, mH, 5); ctx.fill();

  // ── Screen ──────────────────────────────────────────────────────────────
  const sp = 2.5;
  const sX = -mW/2 + sp, sY = bezelY + sp;
  const sW = mW - sp*2,   sH = mH - sp*2 - 1;

  ctx.fillStyle = isActive ? cfg.color + "28" : cfg.color + "0e";
  rr(ctx, sX, sY, sW, sH, 2.5); ctx.fill();

  if (isActive) {
    ctx.save();
    ctx.shadowColor = cfg.color; ctx.shadowBlur = 10;
    ctx.strokeStyle = cfg.color + "55"; ctx.lineWidth = 0.6;
    rr(ctx, sX, sY, sW, sH, 2.5); ctx.stroke();
    ctx.restore();
  }

  // Screen content (clipped, drawn in local space)
  ctx.save();
  ctx.beginPath(); rr(ctx, sX, sY, sW, sH, 2.5); ctx.clip();
  if (id === "alex")   drawAlexScreen(ctx, sX, sY, sW, sH, isActive, ts);
  if (id === "sam")    drawSamScreen(ctx, sX, sY, sW, sH, isActive, ts);
  if (id === "jordan") drawJordanScreen(ctx, sX, sY, sW, sH, isActive, ts);
  if (id === "riley")  drawRileyScreen(ctx, sX, sY, sW, sH, isActive, ts);
  if (id === "casey")  drawCaseyScreen(ctx, sX, sY, sW, sH, isActive, ts);
  ctx.restore();

  // ── Chair (on viewer-side = +y in local space) ─────────────────────────
  const chairY = dH/2 + H * 0.027;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.1)"; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2;
  // seat
  ctx.beginPath(); ctx.arc(0, chairY, H * 0.019, 0, Math.PI * 2);
  ctx.fillStyle = cfg.color + "40"; ctx.fill();
  ctx.strokeStyle = cfg.color + "70"; ctx.lineWidth = 0.8; ctx.stroke();
  // back rest
  rr(ctx, -H*0.019, chairY - H*0.038, H*0.038, H*0.014, 3);
  ctx.fillStyle = cfg.color + "35"; ctx.fill(); ctx.stroke();
  ctx.restore();
}

interface AgentAnim {
  x: number; y: number; targetX: number; targetY: number;
  blinkTimer: number; blinkDuration: number; blinkCooldown: number;
  breathPhase: number; dotsPhase: number;
}

interface Props {
  agents: Record<AgentId, AgentRuntimeState>;
  onAgentClick: (id: AgentId) => void;
}

export default function AgentCanvas({ agents, onAgentClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animAgents = useRef<Record<AgentId, AgentAnim>>({} as Record<AgentId, AgentAnim>);
  const ready = useRef(false);
  const rafRef = useRef<number>(0);
  const agentsRef = useRef(agents);
  agentsRef.current = agents;

  const init = useCallback((W: number, H: number) => {
    const home = getHomePositions(W, H);
    for (const id of AGENT_IDS) {
      const p = home[id];
      if (!animAgents.current[id]) {
        animAgents.current[id] = {
          x: p.x, y: p.y, targetX: p.x, targetY: p.y,
          blinkTimer: Math.random() * 100, blinkDuration: 3,
          blinkCooldown: 90 + Math.random() * 120,
          breathPhase: Math.random() * Math.PI * 2,
          dotsPhase: Math.random() * Math.PI * 2,
        };
      }
    }
    ready.current = true;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      if (!w || !h) return;
      canvas.width  = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.scale(dpr, dpr);
      init(w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let lastTs = 0;
    const draw = (ts: number) => {
      const dt = Math.min((ts - lastTs) / 16.67, 4);
      lastTs = ts;
      // Use CSS dimensions (logical pixels) for all drawing math
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      if (!ready.current || !W || !H) { rafRef.current = requestAnimationFrame(draw); return; }

      const home = getHomePositions(W, H);
      const deskLayout = getDeskLayout(W, H);
      const props = agentsRef.current;

      ctx.clearRect(0, 0, W, H);

      // ── Floor ────────────────────────────────────────────────────────────
      ctx.fillStyle = "#f0ece2";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(0,0,0,0.032)";
      ctx.lineWidth = 1;
      const tile = 42;
      for (let x = 0; x < W; x += tile) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += tile) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

      // ── Workspace zone markers (very subtle tint, no box) ─────────────────
      for (const id of AGENT_IDS) {
        const cfg = AGENT_CONFIGS[id];
        const prop = props[id];
        if (prop?.state !== "idle") {
          const dp = (deskLayout as Record<string, {x:number;y:number;rot:number}>)[id];
          if (!dp) continue;
          ctx.save();
          ctx.translate(dp.x, dp.y);
          ctx.beginPath(); ctx.ellipse(0, 0, W*0.14, H*0.14, 0, 0, Math.PI*2);
          ctx.fillStyle = cfg.color + "09"; ctx.fill();
          ctx.restore();
        }
      }

      // ── Desks (rotated per side) ──────────────────────────────────────────
      for (const id of AGENT_IDS) {
        const cfg = AGENT_CONFIGS[id];
        const prop = props[id];
        const dp = (deskLayout as Record<string, {x:number;y:number;rot:number}>)[id];
        if (!dp) continue;
        const isActive = prop?.state !== "idle";
        ctx.save();
        ctx.translate(dp.x, dp.y);
        ctx.rotate(dp.rot);
        drawDeskUnit(ctx, id, cfg, isActive, ts, W, H);
        ctx.restore();
      }

      // ── Connection lines ──────────────────────────────────────────────────
      for (const id of AGENT_IDS) {
        const ag = animAgents.current[id];
        const prop = props[id];
        if (!ag || prop?.state !== "talking" || !prop.speechTarget || prop.speechTarget === "all") continue;
        const tgt = animAgents.current[prop.speechTarget as AgentId];
        if (!tgt) continue;
        const cfg = AGENT_CONFIGS[id];
        ctx.save();
        ctx.setLineDash([5,5]); ctx.lineDashOffset = -(ts*0.05);
        ctx.strokeStyle = cfg.color + "55"; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(ag.x, ag.y); ctx.lineTo(tgt.x, tgt.y); ctx.stroke();
        ctx.setLineDash([]); ctx.restore();
      }

      // ── Agent avatars ─────────────────────────────────────────────────────
      for (const id of AGENT_IDS) {
        const ag = animAgents.current[id];
        const prop = props[id];
        const cfg = AGENT_CONFIGS[id];
        if (!ag || !prop || !cfg) continue;

        let destName: string = id;
        if (prop.state === "moving" && prop.speechTarget) destName = String(prop.speechTarget);
        const dest = (home as Record<string, {x:number;y:number}>)[destName] ?? home[id];
        ag.targetX = dest.x; ag.targetY = dest.y;
        ag.x = lerp(ag.x, ag.targetX, 0.055*dt);
        ag.y = lerp(ag.y, ag.targetY, 0.055*dt);

        ag.breathPhase += 0.018*dt;
        ag.dotsPhase   += 0.06*dt;
        ag.blinkTimer  += dt;
        let eyeOpen = true;
        if (ag.blinkTimer >= ag.blinkCooldown) {
          if (ag.blinkTimer < ag.blinkCooldown + ag.blinkDuration) eyeOpen = false;
          else if (ag.blinkTimer >= ag.blinkCooldown + ag.blinkDuration + 4) {
            ag.blinkTimer=0; ag.blinkDuration=2+Math.random()*3; ag.blinkCooldown=90+Math.random()*150;
          }
        }
        const R = 23*(1+Math.sin(ag.breathPhase)*0.022);

        ctx.save(); ctx.translate(ag.x, ag.y);

        // Active ring
        if (prop.state !== "idle") {
          const rc = prop.state==="thinking" ? "#fbbf24" : prop.state==="talking" ? "#60a5fa" : cfg.color;
          ctx.beginPath(); ctx.arc(0,0,R+8,0,Math.PI*2);
          ctx.strokeStyle=rc+"55"; ctx.lineWidth=2.5; ctx.stroke();
        }

        // Shadow + body
        ctx.save();
        ctx.shadowColor="rgba(0,0,0,0.18)"; ctx.shadowBlur=8; ctx.shadowOffsetY=3;
        const grad=ctx.createRadialGradient(-R*.3,-R*.3,2,0,0,R);
        grad.addColorStop(0,cfg.color+"ff"); grad.addColorStop(1,cfg.color+"cc");
        ctx.beginPath(); ctx.arc(0,0,R,0,Math.PI*2);
        ctx.fillStyle=grad; ctx.fill();
        ctx.restore();
        ctx.strokeStyle="rgba(255,255,255,0.45)"; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(0,0,R,0,Math.PI*2); ctx.stroke();

        // Eyes
        const eY=prop.state==="thinking"?-8:-6, eH=eyeOpen?3.8:1;
        for (const ex of [-6,6]) {
          ctx.fillStyle="rgba(255,255,255,0.95)";
          ctx.beginPath(); ctx.ellipse(ex,eY,3.8,eH,0,0,Math.PI*2); ctx.fill();
          if (eyeOpen) {
            ctx.fillStyle="rgba(15,15,40,0.9)";
            ctx.beginPath(); ctx.arc(ex+.4,eY+(prop.state==="thinking"?-1:0),1.8,0,Math.PI*2); ctx.fill();
          }
        }

        // Mouth
        ctx.strokeStyle="rgba(255,255,255,0.88)"; ctx.lineWidth=1.5; ctx.lineCap="round";
        if (prop.state==="talking") {
          const wv=Math.sin(ag.dotsPhase*4)*2;
          ctx.beginPath(); ctx.moveTo(-5,6); ctx.quadraticCurveTo(0,6+wv,5,6); ctx.stroke();
        } else if (prop.state==="thinking") {
          ctx.beginPath(); ctx.moveTo(-4,7); ctx.lineTo(4,7); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.moveTo(-5,5); ctx.quadraticCurveTo(0,10,5,5); ctx.stroke();
        }

        // Status dot
        const dc=prop.state==="idle"?"#22c55e":prop.state==="thinking"?"#f59e0b":prop.state==="talking"?"#3b82f6":"#8b5cf6";
        ctx.beginPath(); ctx.arc(R-3,-R+3,4,0,Math.PI*2);
        ctx.fillStyle=dc; ctx.fill(); ctx.strokeStyle="white"; ctx.lineWidth=1.5; ctx.stroke();

        // Thinking dots — no text box
        if (prop.state==="thinking") {
          for (let i=0;i<3;i++) {
            const b=Math.sin(ag.dotsPhase*3+i*1.1)*4;
            ctx.beginPath(); ctx.arc(-5+i*5,-R-13+b,2.5,0,Math.PI*2);
            ctx.fillStyle="#f59e0b"; ctx.fill();
          }
        }

        // Talking ripple — no text box
        if (prop.state==="talking") {
          const rp=(ts%1200)/1200;
          ctx.beginPath(); ctx.arc(0,0,R+8+rp*16,0,Math.PI*2);
          ctx.strokeStyle=cfg.color+Math.round((1-rp)*80).toString(16).padStart(2,"0");
          ctx.lineWidth=1.5; ctx.stroke();
        }

        // Name tag under avatar (small, clean)
        ctx.textAlign="center";
        ctx.fillStyle=cfg.color;
        ctx.font=`bold 9px Inter,sans-serif`;
        ctx.fillText(cfg.name, 0, R+14);
        ctx.fillStyle=cfg.color+"99";
        ctx.font="7.5px Inter,sans-serif";
        ctx.fillText(cfg.role, 0, R+25);

        ctx.restore();

        // Speech bubble (drawn in screen space, outside save/restore)
        if (prop.state === "talking" && prop.speechMessage) {
          drawSpeechBubble(ctx, ag.x, ag.y, R, prop.speechMessage, cfg.color, W, H);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [init]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    for (const id of AGENT_IDS) {
      const ag=animAgents.current[id];
      if (!ag) continue;
      if (Math.hypot(cx-ag.x,cy-ag.y)<30) { onAgentClick(id); break; }
    }
  }, [onAgentClick]);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      style={{ display:"block", width:"100%", height:"100%", cursor:"pointer" }}
    />
  );
}
