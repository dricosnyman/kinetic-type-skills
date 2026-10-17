/**
 * Family 2 — cuts, slices and masks: text cut by a line, shown in strips, or seen through a window.
 *
 * Every component renders any text, gives the key word the accent treatment,
 * and is settled by u = 1 (see useSettle in kit.ts). Zoom through a letter is
 * a transition: the text is readable first, then the dive plays at the end (useExit).
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { easeIn, easeInOut, mix, prog, staggerStart, useExit, useSettle, useT } from "../kit";
import { KTLayout, KTLines, LWord, WordBox, blockMetrics, blockRect, fontMetrics, useKTLayout, wordBoxes, wordColor } from "../layout";
import type { KTProps } from "../types";

const inline: React.CSSProperties = { display: "inline-block" };

const plainWord = (L: KTLayout) => (w: LWord) => <span style={{ ...inline, color: wordColor(L, w) }}>{w.text}</span>;

// ---------------------------------------------------------------------------
// Slice / cut: a blade cuts diagonally through every line of text, then the
// two halves of each line (copies clipped to either side of the cut) slide
// apart along the cut and stay apart.

export const Slice: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900, boxWidth: 0.8, boxHeight: 0.66 });
  const { u } = useSettle();
  if (!L.ready) return null;
  const fs = L.fontSize;
  const { lineTops, lineHeights, height: blockH } = blockMetrics(L);
  const top0 = (L.height - blockH) / 2;
  const boxes = wordBoxes(L);
  const appear = prog(u, 0, 0.2);
  const blade = prog(u, 0.12, 0.42, easeInOut);
  const apart = prog(u, 0.45, 0.95, easeInOut);

  // One cut per line: through the middle of its lowercase letters, lower on the left.
  const cuts = L.lines.map((_, li) => {
    const inLine = boxes.filter((wb) => wb.line === li);
    const xl = (L.width - L.lineWidths[li]) / 2 - 0.3 * fs;
    const xr = (L.width + L.lineWidths[li]) / 2 + 0.3 * fs;
    const mid = (inLine[0]?.baseline ?? top0 + lineTops[li] + lineHeights[li]) - 0.36 * fs;
    const slope = (-0.3 * fs) / Math.max(xr - xl, fs);
    const yAt = (x: number) => mid + (x - (xl + xr) / 2) * slope;
    // The band of frame this line owns; the first and last bands reach the frame edges.
    const bandTop = li === 0 ? 0 : top0 + lineTops[li];
    const bandBottom = li === L.lines.length - 1 ? L.height : top0 + lineTops[li] + lineHeights[li];
    return { xl, xr, yAt, bandTop, bandBottom };
  });

  const piece = (li: number, top: boolean) => {
    const c = cuts[li];
    const edge = `${L.width}px ${c.yAt(c.xr)}px, ${c.xr}px ${c.yAt(c.xr)}px, ${c.xl}px ${c.yAt(c.xl)}px, 0px ${c.yAt(c.xl)}px`;
    const edgeBack = `0px ${c.yAt(c.xl)}px, ${c.xl}px ${c.yAt(c.xl)}px, ${c.xr}px ${c.yAt(c.xr)}px, ${L.width}px ${c.yAt(c.xr)}px`;
    const clip = top
      ? `polygon(0px ${c.bandTop}px, ${L.width}px ${c.bandTop}px, ${edge})`
      : `polygon(${edgeBack}, ${L.width}px ${c.bandBottom}px, 0px ${c.bandBottom}px)`;
    const d = apart * (top ? -1 : 1);
    return (
      <KTLines
        key={`${li}-${top}`}
        layout={L}
        outerStyle={{ clipPath: clip, translate: `${d * 0.16 * fs}px ${d * 0.07 * fs}px` }}
        renderWord={plainWord(L)}
      />
    );
  };

  return (
    <AbsoluteFill style={{ opacity: appear }}>
      {cuts.map((_, li) => [piece(li, true), piece(li, false)])}
      <svg width={L.width} height={L.height} style={{ position: "absolute", inset: 0, opacity: 1 - apart }}>
        {blade > 0
          ? cuts.map((c, li) => {
              const x1 = mix(blade, c.xl, c.xr);
              return (
                <line key={li} x1={c.xl} y1={c.yAt(c.xl)} x2={x1} y2={c.yAt(x1)} stroke={L.color} strokeWidth={Math.max(2, fs * 0.025)} />
              );
            })
          : null}
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Shred / strip reveal: the text arrives in thin horizontal strips that slide
// in from alternating sides and lock together.

export const Shred: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900 });
  const { u } = useSettle();
  if (!L.ready) return null;
  const b = blockRect(L);
  // About one strip per 0.13 em of height (9 on one line), at most 30.
  const n = Math.max(7, Math.min(30, Math.round(b.h / (0.13 * L.fontSize))));
  return (
    <AbsoluteFill>
      {new Array(n).fill(0).map((_, i) => {
        const y0 = b.top + (i * b.h) / n;
        const y1 = b.top + ((i + 1) * b.h) / n;
        // The first and last strips also reach the frame edges, so nothing is ever cut off.
        const insetTop = i === 0 ? 0 : y0;
        const insetBottom = i === n - 1 ? 0 : L.height - y1;
        const a = staggerStart(i, n, 0.55, 0.06);
        const p = prog(u, a, a + 0.55, easeInOut);
        const dir = i % 2 ? 1 : -1;
        return (
          <KTLines
            key={i}
            layout={L}
            outerStyle={{
              clipPath: `inset(${insetTop}px 0px ${insetBottom}px 0px)`,
              translate: `${dir * (1 - p) * L.width}px 0px`,
            }}
            renderWord={plainWord(L)}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Knockout / stencil: the letters are windows onto a moving picture (a sunset
// sky with a drifting sun). The key word gets an accent outline.
// The picture keeps drifting after the text has settled — that movement is the technique.

export const Knockout: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900 });
  const { u } = useSettle();
  const t = useT();
  if (!L.ready) return null;
  const b = blockRect(L);
  const drift = (t % 6) / 6; // the sun crosses the sky every 6 seconds
  const picture = [
    `radial-gradient(circle at ${mix(drift, 10, 90)}% ${mix(drift, 80, 35)}%, #FFE38A 0, #F4B942 ${Math.min(b.w, b.h) * 0.12}px, transparent ${Math.min(b.w, b.h) * 0.13}px)`,
    `linear-gradient(180deg, #2B2D6E 0%, #C2477A 55%, ${L.accent} 80%, #F4B942 100%)`,
  ].join(", ");
  const boxes = new Map(wordBoxes(L).map((wb) => [wb.word.index, wb]));
  return (
    <KTLines
      layout={L}
      outerStyle={{ opacity: prog(u, 0, 0.4), scale: `${mix(prog(u, 0, 0.8), 0.9, 1)}` }}
      renderWord={(w) => {
        const wb = boxes.get(w.index)!;
        return (
          <span
            style={{
              ...inline,
              color: "transparent",
              // One picture across the whole block: each word shows its own part of it.
              backgroundImage: picture,
              backgroundSize: `${b.w}px ${b.h}px`,
              backgroundPosition: `${b.left - wb.x}px ${b.top - wb.top}px`,
              backgroundRepeat: "no-repeat",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextStroke: w.isKey ? `${0.025 * L.fontSize}px ${L.accent}` : undefined,
            }}
          >
            {w.text}
          </span>
        );
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// Zoom through a letter: the text sits still, then the camera dives through
// the hole of a letter (from the key word if it has one; an O if possible) into
// the next scene. The hole holds the accent colour, and the sequence ends on a
// full frame of it — start the next scene on that colour (or pass its colour as accent).

type Hole = { x: number; y: number; r: number };

// Letters that usually have a hole, best first.
const HOLEY = "oO0QDdbpqgaeABPR68&9@";

const holeCache = new Map<string, { x: number; y: number; r: number } | null>();

/**
 * Finds the biggest enclosed hole in one letter by drawing it on a canvas.
 * Returns its middle (the point furthest from the ink) and radius, in px
 * from the letter's left edge and its baseline, or null when it has no hole.
 */
const letterHole = (ch: string, L: KTLayout): { x: number; y: number; r: number } | null => {
  const spec = `${L.fontWeight} ${L.fontSize}px ${L.fontFamily}`;
  const cacheKey = `${spec}|${ch}`;
  if (holeCache.has(cacheKey)) return holeCache.get(cacheKey)!;
  const { ascent, descent } = fontMetrics(L);
  const pad = 4;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.font = spec;
  const W = Math.ceil(ctx.measureText(ch).width + 2 * pad);
  const H = Math.ceil(ascent + descent + 2 * pad);
  canvas.width = W;
  canvas.height = H;
  ctx.font = spec;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(ch, pad, pad + ascent);
  const data = ctx.getImageData(0, 0, W, H).data;
  const ink = (i: number) => data[i * 4 + 3] >= 128;
  // 1. Flood the empty space from the border: whatever empty space is left is a hole.
  const outside = new Uint8Array(W * H);
  const stack: number[] = [];
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
  while (stack.length) {
    const i = stack.pop()!;
    if (outside[i] || ink(i)) continue;
    outside[i] = 1;
    const x = i % W;
    const y = (i - x) / W;
    if (x > 0) stack.push(i - 1);
    if (x < W - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - W);
    if (y < H - 1) stack.push(i + W);
  }
  // 2. Distance from every hole pixel to the nearest non-hole pixel (breadth-first, 8 neighbours).
  const dist = new Int32Array(W * H).fill(-1);
  const queue: number[] = [];
  for (let i = 0; i < W * H; i++) {
    if (outside[i] || ink(i)) {
      dist[i] = 0;
      queue.push(i);
    }
  }
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q];
    const x = i % W;
    const y = (i - x) / W;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (dist[j] === -1) {
          dist[j] = dist[i] + 1;
          queue.push(j);
        }
      }
    }
  }
  let best = -1;
  let bestD = 0;
  for (let i = 0; i < W * H; i++) {
    if (dist[i] > bestD) {
      bestD = dist[i];
      best = i;
    }
  }
  // Ignore specks: a real hole is at least a few percent of the font size across.
  const found = best >= 0 && bestD >= Math.max(2, L.fontSize * 0.04)
    ? { x: (best % W) - pad, y: Math.floor(best / W) - pad - ascent, r: bestD }
    : null;
  holeCache.set(cacheKey, found);
  return found;
};

/** Where to dive: a hole in the key word, else in the first word that has one, else the gap after a word, else a word's middle. */
const findHole = (L: KTLayout, boxes: WordBox[]): Hole => {
  const order = [...boxes].sort((a, b) => Number(b.word.isKey) - Number(a.word.isKey));
  const canvas = document.createElement("canvas").getContext("2d");
  for (const wb of order) {
    for (const ch of HOLEY) {
      const j = wb.word.letters.indexOf(ch);
      if (j < 0 || !canvas) continue;
      const hole = letterHole(ch, L);
      if (!hole) continue;
      canvas.font = `${L.fontWeight} ${L.fontSize}px ${L.fontFamily}`;
      const before = canvas.measureText(wb.word.letters.slice(0, j).join("")).width;
      return { x: wb.x + before + hole.x, y: wb.baseline + hole.y, r: hole.r };
    }
  }
  const gapW = 0.28 * L.fontSize;
  const key = order[0];
  const sameLine = boxes.find((wb) => wb.line === key.line && wb.word.index === key.word.index + 1);
  if (sameLine) return { x: key.x + key.w + gapW / 2, y: key.cy, r: gapW / 2 };
  return { x: key.cx, y: key.cy, r: L.fontSize * 0.05 };
};

export const ZoomThroughLetter: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900, boxWidth: 0.8 });
  const { u, out } = useExit(1.4, 0.5);
  if (!L.ready || L.words.length === 0) return null;
  const hole = findHole(L, wordBoxes(L));
  // Scale at which the hole covers the whole frame.
  const far = Math.max(
    Math.hypot(hole.x, hole.y),
    Math.hypot(L.width - hole.x, hole.y),
    Math.hypot(hole.x, L.height - hole.y),
    Math.hypot(L.width - hole.x, L.height - hole.y),
  );
  const maxScale = Math.min(400, Math.max(8, (1.15 * far) / Math.max(hole.r, 1)));
  const z = prog(out, 0, 0.85, easeIn);
  const scale = Math.exp(z * Math.log(maxScale));
  return (
    <AbsoluteFill style={{ opacity: prog(u, 0, 0.3) }}>
      <AbsoluteFill style={{ transformOrigin: `${hole.x}px ${hole.y}px`, scale: `${scale}` }}>
        {/* The next scene, waiting inside the hole. */}
        <div
          style={{
            position: "absolute",
            left: hole.x - hole.r * 0.95,
            top: hole.y - hole.r * 0.95,
            width: hole.r * 1.9,
            height: hole.r * 1.9,
            borderRadius: "50%",
            background: L.accent,
            opacity: prog(out, 0, 0.15),
          }}
        />
        <KTLines layout={L} renderWord={plainWord(L)} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: L.accent, opacity: prog(out, 0.78, 0.95) }} />
    </AbsoluteFill>
  );
};
