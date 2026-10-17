/**
 * Family 10 — screen and print looks: type as if shown on a particular device
 * or printed a particular way.
 *
 * Every component renders any text, gives the key word the accent treatment,
 * and is settled by u = 1 (see useSettle in kit.ts). VHS keeps its jitter,
 * noise band and fringes after that: the unsteady picture is the technique.
 *
 * LED board, pixelate, halftone and ASCII rebuild the laid-out text out of
 * cells (inkCells in layout.tsx). Each keeps the number of cells under a budget,
 * so long text gets coarser cells rather than a slow render.
 *
 * LED board, ASCII and VHS bring their own dark screen, and their text
 * defaults to the screen's own light colour.
 */
import React, { useId } from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { C, courier, easeInOut, easeOut, mix, prog, useSettle } from "../kit";
import { KTLayout, KTLines, LWord, blockRect, cellForBudget, inkCells, useKTLayout } from "../layout";
import type { KTProps } from "../types";

const inline: React.CSSProperties = { display: "inline-block" };

/** A clean, unique id for SVG defs (React ids contain characters CSS url() dislikes). */
const useSvgId = (prefix: string) => `${prefix}-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

const SCREEN = "#14151B";

/** A dark rounded panel just around the grid. */
const Panel: React.FC<{ x: number; y: number; w: number; h: number; pad: number; opacity: number; color?: string }> = ({
  x,
  y,
  w,
  h,
  pad,
  opacity,
  color = SCREEN,
}) => (
  <div
    style={{
      position: "absolute",
      left: x - pad,
      top: y - pad,
      width: w + 2 * pad,
      height: h + 2 * pad,
      borderRadius: pad * 0.8,
      background: color,
      opacity,
    }}
  />
);

// ---------------------------------------------------------------------------
// LED board / dot-matrix: a dark board covered in a grid of dots; only the
// dots inside the letters light up. The text scrolls in from the right, a
// whole dot at a time, and stops in the middle. Amber unless a colour is
// given; the key word lights up green, or in the accent colour when one is given.

const LED_AMBER = "#FFB627";
const LED_GREEN = "#5CFF7A";

export const LedBoard: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900, boxWidth: 0.8, boxHeight: 0.62 });
  const { u } = useSettle();
  const id = useSvgId("kt-led");
  if (!L.ready || L.words.length === 0) return null;
  const cell = cellForBudget(L, 12000, L.fontSize / 11, 0.3);
  const g = inkCells(L, cell, cell, 0.3);
  const lit = props.color ?? LED_AMBER;
  const keyLit = props.accent ?? LED_GREEN;
  const shift = Math.round((1 - prog(u, 0.05, 0.85, easeOut)) * g.cols);
  const r = cell * 0.36;
  const dots: React.ReactNode[] = [];
  for (let row = 0; row < g.rows; row++) {
    for (let c = shift; c < g.cols; c++) {
      const i = row * g.cols + (c - shift);
      if (g.ink[i] < 0.4) continue;
      dots.push(<circle key={`${row}-${c}`} cx={(c + 0.5) * cell} cy={(row + 0.5) * cell} r={r} fill={g.key[i] ? keyLit : lit} />);
    }
  }
  const W = g.cols * cell;
  const H = g.rows * cell;
  return (
    <AbsoluteFill style={{ opacity: prog(u, 0, 0.1) }}>
      <Panel x={g.x0} y={g.y0} w={W} h={H} pad={cell * 2} opacity={1} />
      <svg style={{ position: "absolute", left: g.x0, top: g.y0 }} width={W} height={H}>
        <defs>
          <pattern id={`${id}-off`} width={cell} height={cell} patternUnits="userSpaceOnUse">
            <circle cx={cell / 2} cy={cell / 2} r={r} fill="#2A2B33" />
          </pattern>
          <filter id={`${id}-glow`} x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation={cell * 0.35} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width={W} height={H} fill={`url(#${id}-off)`} />
        <g filter={`url(#${id}-glow)`}>{dots}</g>
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Pixelate reveal: the text starts as a few chunky blocks; the grid gets finer
// in steps (each block's shade is how much ink it covers) until the crisp text
// takes over. The key word's blocks are in the accent colour.

const PIXEL_STEPS = [0.8, 0.4, 0.2, 0.1]; // block size in em, coarse to fine
const PIXEL_BUDGET = 12000;

export const PixelateReveal: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900 });
  const { u } = useSettle();
  if (!L.ready || L.words.length === 0) return null;
  const fs = L.fontSize;
  const b = blockRect(L);
  // Steps finer than the budget allows are skipped (the crisp text comes sooner).
  const steps = PIXEL_STEPS.map((s) => s * fs).filter(
    (cell) => ((b.w + 0.4 * fs) / cell) * ((b.h + 0.4 * fs) / cell) <= PIXEL_BUDGET,
  );
  const k = Math.floor(u / (0.8 / Math.max(1, steps.length)));
  if (k >= steps.length || u >= 0.8) {
    return <KTLines layout={L} renderWord={(w) => <span style={{ ...inline, color: w.isKey ? L.accent : L.color }}>{w.text}</span>} />;
  }
  const cell = steps[k];
  const g = inkCells(L, cell);
  const blocks: React.ReactNode[] = [];
  for (let i = 0; i < g.ink.length; i++) {
    if (g.ink[i] < 0.02) continue;
    blocks.push(
      <rect
        key={i}
        x={(i % g.cols) * cell}
        y={Math.floor(i / g.cols) * cell}
        width={cell + 0.5}
        height={cell + 0.5}
        fill={g.key[i] ? L.accent : L.color}
        fillOpacity={Math.min(1, g.ink[i] * 1.4)}
        shapeRendering="crispEdges"
      />,
    );
  }
  return (
    <AbsoluteFill style={{ opacity: prog(u, 0, 0.08) }}>
      <svg style={{ position: "absolute", left: g.x0, top: g.y0 }} width={g.cols * cell} height={g.rows * cell}>
        {blocks}
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Halftone: the text is rebuilt from printed dots on a grid — the more ink in
// a cell, the bigger its dot (like comic-book printing). Small pale dots fill
// the background; the ink dots grow in left to right. The key word's dots
// are in the accent colour.

export const Halftone: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900 });
  const { u } = useSettle();
  const id = useSvgId("kt-halftone");
  if (!L.ready || L.words.length === 0) return null;
  const cell = cellForBudget(L, 9000, L.fontSize / 10, 0.3);
  const g = inkCells(L, cell, cell, 0.3);
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < g.ink.length; i++) {
    const v = g.ink[i];
    if (v < 0.04) continue;
    const c = i % g.cols;
    const a = (c / Math.max(1, g.cols)) * 0.45;
    const grow = prog(u, a, a + 0.5, easeOut);
    if (grow <= 0) continue;
    dots.push(
      <circle
        key={i}
        cx={(c + 0.5) * cell}
        cy={(Math.floor(i / g.cols) + 0.5) * cell}
        r={Math.sqrt(v) * cell * 0.64 * grow}
        fill={g.key[i] ? L.accent : L.color}
      />,
    );
  }
  const W = g.cols * cell;
  const H = g.rows * cell;
  return (
    <AbsoluteFill>
      <svg style={{ position: "absolute", left: g.x0, top: g.y0 }} width={W} height={H}>
        <defs>
          <pattern id={id} width={cell} height={cell} patternUnits="userSpaceOnUse">
            <circle cx={cell / 2} cy={cell / 2} r={cell * 0.13} fill={L.color} fillOpacity={0.18} />
          </pattern>
        </defs>
        <rect width={W} height={H} fill={`url(#${id})`} opacity={prog(u, 0, 0.25)} />
        {dots}
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// ASCII: each cell of the grid becomes a character — sparse ones like "." for
// a little ink, dense ones like "@" for a lot — on a dark terminal screen.
// The picture prints top to bottom over a drizzle of random 0s and 1s.
// Green unless a colour is given; the key word's characters are in the accent colour.

const RAMP = " .:-=+*#%@";
const TERMINAL_GREEN = "#5CFF9D";

export const Ascii: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900 });
  const { u } = useSettle();
  const frame = useCurrentFrame();
  if (!L.ready || L.words.length === 0) return null;
  // Courier characters are 0.6 em wide; cells are twice as tall as wide.
  const cellW = cellForBudget(L, 8000, L.fontSize / 12, 0.25) / Math.SQRT2;
  const cellH = cellW * 2;
  const g = inkCells(L, cellW, cellH, 0.25);
  const green = props.color ?? TERMINAL_GREEN;
  const printed = prog(u, 0.05, 0.9, easeInOut) * 1.05;
  const noise = Math.floor(frame / 2);
  const rows: React.ReactNode[] = [];
  for (let r = 0; r < g.rows; r++) {
    // Runs of characters in the same colour become one span.
    const runs: { key: boolean; text: string }[] = [];
    const shown = r / g.rows < printed;
    for (let c = 0; c < g.cols; c++) {
      const i = r * g.cols + c;
      const ch = shown
        ? RAMP[Math.min(RAMP.length - 1, Math.floor(g.ink[i] * RAMP.length))]
        : random(`kt-ascii-${r}-${c}-${noise}`) < 0.08
          ? random(`kt-ascii-b${r}-${c}-${noise}`) < 0.5
            ? "0"
            : "1"
          : " ";
      const isKey = shown && g.key[i] === 1;
      const last = runs[runs.length - 1];
      if (last && last.key === isKey) last.text += ch;
      else runs.push({ key: isKey, text: ch });
    }
    rows.push(
      <div key={r} style={{ height: cellH }}>
        {runs.map((run, k) => (
          <span key={k} style={{ color: run.key ? L.accent : green }}>
            {run.text}
          </span>
        ))}
      </div>,
    );
  }
  return (
    <AbsoluteFill style={{ opacity: prog(u, 0, 0.08) }}>
      <Panel x={g.x0} y={g.y0} w={g.cols * cellW} h={g.rows * cellH} pad={cellH * 1.5} opacity={1} />
      <div
        style={{
          position: "absolute",
          left: g.x0,
          top: g.y0,
          fontFamily: courier,
          fontWeight: 700,
          fontSize: cellW / 0.6,
          lineHeight: `${cellH}px`,
          whiteSpace: "pre",
        }}
      >
        {rows}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// VHS / CRT: an 80s video-tape picture. Red and cyan copies of the text sit
// slightly off to each side (colour fringes), the picture jitters, a bright
// noise band rolls down and scanlines cover everything. The picture rolls in
// like a tape finding its tracking; the fringes start wide and close in.
// White unless a colour is given; the key word is in the accent colour.

const TAPE = "#1B1A2E";

const vhsWord = (L: KTLayout, color: string | null) => (w: LWord) => (
  <span style={{ ...inline, color: color ?? (w.isKey ? L.accent : L.color) }}>{w.text}</span>
);

export const Vhs: React.FC<KTProps> = (props) => {
  const L = useKTLayout({ ...props, color: props.color ?? "#FFFFFF" }, { fontWeight: 900, boxWidth: 0.74, boxHeight: 0.56 });
  const { u, t } = useSettle();
  const frame = useCurrentFrame();
  if (!L.ready || L.words.length === 0) return null;
  const fs = L.fontSize;
  const b = blockRect(L);
  const padX = 0.6 * fs;
  const padY = 0.9 * fs;
  const W = b.w + 2 * padX;
  const H = b.h + 2 * padY;
  const label = Math.max(12, Math.min(0.24 * fs, H * 0.09));
  const track = prog(u, 0, 0.7, easeOut);
  const fringe = mix(prog(u, 0.2, 1, easeInOut), 0.12, 0.03) * fs;
  const jitter = (random(`kt-vhs-j${frame}`) - 0.5) * 0.025 * fs;
  const roll = (1 - track) * H * 0.6;
  const band = ((t * 0.45) % 1) * (H + 0.6 * fs) - 0.3 * fs;
  const layer = (dx: number, color: string | null, blend: boolean, opacity: number) => (
    <KTLines
      layout={L}
      outerStyle={{ translate: `${dx + jitter}px ${-roll}px`, mixBlendMode: blend ? "screen" : "normal", opacity }}
      renderWord={vhsWord(L, color)}
    />
  );
  return (
    <AbsoluteFill style={{ opacity: prog(u, 0, 0.1) }}>
      <div
        style={{
          position: "absolute",
          left: b.left - padX,
          top: b.top - padY,
          width: W,
          height: H,
          background: TAPE,
          borderRadius: 0.2 * fs,
          overflow: "hidden",
          fontFamily: courier,
          fontWeight: 700,
          color: "#FFFFFF",
        }}
      >
        <div style={{ position: "absolute", left: label, top: label * 0.6, fontSize: label }}>PLAY ▶</div>
        <div style={{ position: "absolute", right: label, top: label * 0.6, fontSize: label * 0.9 }}>
          SP 0:{String(14 + Math.floor(t)).padStart(2, "0")}
        </div>
        <AbsoluteFill style={{ left: -(b.left - padX), top: -(b.top - padY), width: L.width, height: L.height }}>
          {layer(-fringe, C.glitchRed, true, 0.8)}
          {layer(fringe, C.glitchCyan, true, 0.8)}
          {layer(0, null, false, 0.92)}
        </AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: band,
            height: 0.3 * fs,
            background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.18), transparent)",
            backdropFilter: "blur(2px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0 2px, transparent 2px 5px)",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
