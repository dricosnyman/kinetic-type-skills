/**
 * Family 3 — breaking apart and building up: the letter itself is destroyed or built.
 *
 * Shatter and disintegrate destroy the text, so they are exits: the text is
 * readable by the settle time and holds, then breaks over the end of the
 * sequence and is gone on its last frame (useExit in kit.ts).
 * Particle assemble is the entrance: it is settled, as crisp text, by u = 1.
 *
 * Disintegrate and particle assemble rebuild the text out of grains, by drawing
 * it on a hidden canvas and sampling where the ink is. Like the showcase videos,
 * they use a system font (Arial Black) unless a font is given.
 */
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { C, easeInOut, mix, prog, useExit, useSettle } from "../kit";
import { KTLayout, KTLines, LWord, blockRect, useKTLayout, wordBoxes, wordColor } from "../layout";
import type { KTProps } from "../types";

const inline: React.CSSProperties = { display: "inline-block" };
const ARIAL = "'Arial Black', Arial, sans-serif";

const plainWord = (L: KTLayout) => (w: LWord) => <span style={{ ...inline, color: wordColor(L, w) }}>{w.text}</span>;

// ---------------------------------------------------------------------------
// Text sampling: draw the laid-out text on a hidden canvas and find the cells
// of a grid that are mostly ink. The cell size grows for long text, so there
// are never more than `maxDots` grains (render time stays reasonable).

type Grain = { x: number; y: number; isKey: boolean };
type InkGrid = { cell: number; grains: Grain[] };

const gridCache = new Map<string, InkGrid>();

const inkGrid = (L: KTLayout, maxDots: number): InkGrid => {
  const boxes = wordBoxes(L);
  const cacheKey = [
    L.fontWeight,
    L.fontSize,
    L.fontFamily,
    L.width,
    L.height,
    maxDots,
    ...boxes.map((b) => `${b.word.text}|${b.word.isKey}|${b.x.toFixed(1)}|${b.baseline.toFixed(1)}`),
  ].join("#");
  const hit = gridCache.get(cacheKey);
  if (hit) return hit;

  const b = blockRect(L);
  const x0 = Math.max(0, Math.floor(b.left - L.fontSize * 0.2));
  const y0 = Math.max(0, Math.floor(b.top));
  const W = Math.min(L.width, Math.ceil(b.right + L.fontSize * 0.2)) - x0;
  const H = Math.min(L.height, Math.ceil(b.bottom)) - y0;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, W);
  canvas.height = Math.max(1, H);
  const ctx = canvas.getContext("2d");
  if (!ctx) return { cell: 1, grains: [] };
  ctx.font = `${L.fontWeight} ${L.fontSize}px ${L.fontFamily}`;
  ctx.textBaseline = "alphabetic";
  // Red marks ink; green marks the key word's ink.
  for (const wb of boxes) {
    ctx.fillStyle = wb.word.isKey ? "#ffff00" : "#ff0000";
    ctx.fillText(wb.word.text, wb.x - x0, wb.baseline - y0);
  }
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  const sample = (cell: number): Grain[] => {
    const grains: Grain[] = [];
    const step = Math.max(1, Math.floor(cell / 4)); // a 4 × 4 sample of each cell is plenty
    for (let cy = 0; cy + cell <= H; cy += cell) {
      for (let cx = 0; cx + cell <= W; cx += cell) {
        let ink = 0;
        let key = 0;
        let n = 0;
        for (let y = Math.floor(cy); y < cy + cell; y += step) {
          for (let x = Math.floor(cx); x < cx + cell; x += step) {
            const i = (y * canvas.width + x) * 4;
            ink += data[i];
            key += data[i + 1];
            n++;
          }
        }
        if (ink / (n * 255) >= 0.5) grains.push({ x: x0 + cx, y: y0 + cy, isKey: key > ink / 2 });
      }
    }
    return grains;
  };

  let cell = Math.max(3, L.fontSize / 16);
  let grains = sample(cell);
  if (grains.length > maxDots) {
    cell *= Math.sqrt(grains.length / maxDots);
    grains = sample(cell);
  }
  const result = { cell, grains };
  gridCache.set(cacheKey, result);
  return result;
};

// ---------------------------------------------------------------------------
// Shatter: the text cracks like glass (the cracks flash), then breaks into
// jagged triangles that fly away from the impact point — the key word, if
// there is one — and fall.

type Shard = { poly: string; points: string; cx: number; cy: number; k: string };

const makeShards = (left: number, top: number, w: number, h: number, cols: number, rows: number): Shard[] => {
  const vx = (c: number, r: number) => left + (c / cols) * w + (c > 0 && c < cols ? (random(`kt-vx${c}-${r}`) - 0.5) * 0.45 * (w / cols) : 0);
  const vy = (c: number, r: number) => top + (r / rows) * h + (r > 0 && r < rows ? (random(`kt-vy${c}-${r}`) - 0.5) * 0.7 * (h / rows) : 0);
  const shards: Shard[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = [vx(c, r), vy(c, r)];
      const b = [vx(c + 1, r), vy(c + 1, r)];
      const d = [vx(c, r + 1), vy(c, r + 1)];
      const e = [vx(c + 1, r + 1), vy(c + 1, r + 1)];
      for (const [tri, k] of [
        [[a, b, e], "u"],
        [[a, e, d], "l"],
      ] as const) {
        shards.push({
          poly: `polygon(${tri.map((p) => `${p[0]}px ${p[1]}px`).join(",")})`,
          points: tri.map((p) => `${p[0]},${p[1]}`).join(" "),
          cx: (tri[0][0] + tri[1][0] + tri[2][0]) / 3,
          cy: (tri[0][1] + tri[1][1] + tri[2][1]) / 3,
          k: `${c}-${r}-${k}`,
        });
      }
    }
  }
  return shards;
};

export const Shatter: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900, boxWidth: 0.8, boxHeight: 0.66 });
  const { u, out } = useExit();
  if (!L.ready) return null;
  const b = blockRect(L);
  const pad = L.fontSize * 0.15;
  const rows = Math.max(2, Math.min(4, L.lines.length + 1));
  const cols = Math.max(4, Math.min(12, Math.round((rows * b.w) / Math.max(b.h, 1) / 1.2)));
  const shards = makeShards(b.left - pad, b.top - pad, b.w + 2 * pad, b.h + 2 * pad, cols, rows);
  const key = L.keyIndex >= 0 ? wordBoxes(L).find((wb) => wb.word.isKey) : undefined;
  const hitX = key ? key.cx : L.width / 2;
  const hitY = key ? key.cy : L.height / 2;

  const BREAK = 0.22; // the cracks show for the first part of the exit, then it breaks
  const cracking = out > 0 && out < BREAK;
  const s = prog(out, BREAK, 1, (x) => x);
  const tremble = cracking ? Math.sin(out * 300) * 0.012 * L.fontSize : 0;

  return (
    <AbsoluteFill style={{ opacity: prog(u, 0, 0.3), translate: `${tremble}px 0px` }}>
      {shards.map((sh) => {
        const dx = (sh.cx - hitX) / Math.max(b.w / 2, 1);
        const dy = (sh.cy - hitY) / Math.max(b.h / 2, 1);
        const sp = 0.6 + random(`kt-sp${sh.k}`) * 0.8;
        const x = dx * L.width * 0.35 * sp * s;
        const y = dy * L.height * 0.25 * sp * s + L.height * 0.9 * s * s;
        const rot = (random(`kt-r${sh.k}`) - 0.5) * 600 * s;
        return (
          <KTLines
            key={sh.k}
            layout={L}
            outerStyle={{
              clipPath: sh.poly,
              transformOrigin: `${sh.cx}px ${sh.cy}px`,
              translate: `${x}px ${y}px`,
              rotate: `${rot}deg`,
              opacity: 1 - prog(s, 0.55, 1, (q) => q),
            }}
            renderWord={plainWord(L)}
          />
        );
      })}
      {cracking ? (
        <svg width={L.width} height={L.height} style={{ position: "absolute", inset: 0 }}>
          {shards.map((sh) => (
            <polygon key={sh.k} points={sh.points} fill="none" stroke={C.paper} strokeWidth={Math.max(1.5, L.fontSize * 0.018)} />
          ))}
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Disintegrate / dust: the text erodes from left to right into grains that
// drift away up and to the right, the "Thanos snap".

const LIFE = 0.45; // how long one grain drifts, as a share of the exit
const LAST_RELEASE = 1 - LIFE;

export const Disintegrate: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900, defaultFamily: ARIAL, boxWidth: 0.78, boxHeight: 0.66 });
  const { u, out } = useExit(1.6, 0.55);
  if (!L.ready) return null;
  const b = blockRect(L);
  const fs = L.fontSize;
  const { cell, grains } = inkGrid(L, 2400);
  const jitter = fs * 0.6;
  // The eroding edge sweeps across so that the last grain leaves at out = LAST_RELEASE.
  const startX = b.left - jitter;
  const endX = startX + (b.right + jitter - startX) / LAST_RELEASE;
  const edge = mix(out, startX, endX);
  const soft = fs * 0.3;

  return (
    <AbsoluteFill style={{ opacity: prog(u, 0, 0.3) }}>
      <KTLines
        layout={L}
        outerStyle={
          out > 0
            ? {
                WebkitMaskImage: `linear-gradient(90deg, transparent ${edge - soft}px, black ${edge + soft}px)`,
                maskImage: `linear-gradient(90deg, transparent ${edge - soft}px, black ${edge + soft}px)`,
              }
            : undefined
        }
        renderWord={plainWord(L)}
      />
      {out > 0 ? (
        <svg width={L.width} height={L.height} style={{ position: "absolute", inset: 0 }}>
          {grains.map((g, i) => {
            const at = g.x + cell / 2 + (random(`kt-dj${i}`) - 0.5) * 2 * jitter;
            if (edge < at) return null;
            const released = (at - startX) / (endX - startX); // when the edge passed this grain
            const s = (out - released) / LIFE; // 0 → 1 over the grain's life
            if (s >= 1) return null;
            const x = g.x + s * (0.5 + random(`kt-dx${i}`) * 2.5) * fs + s * s * 0.8 * fs;
            const y = g.y - s * (random(`kt-dy${i}`) * 1.8 - 0.3) * fs + Math.sin(s * 5 + i) * 0.1 * fs * s;
            const size = cell * mix(s, 0.85, 0.4);
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={size}
                height={size}
                rx={size * 0.25}
                fill={g.isKey ? L.accent : L.color}
                opacity={1 - s}
              />
            );
          })}
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Particle assemble: a cloud of dots flies in from all over the frame and
// settles into the text, then the crisp letters take over from the dots.
// Dots are accent-coloured in flight and take the text colour as they land.

export const ParticleAssemble: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900, defaultFamily: ARIAL, boxWidth: 0.78, boxHeight: 0.66 });
  const { u } = useSettle();
  if (!L.ready) return null;
  const { cell, grains } = inkGrid(L, 1800);
  const crisp = prog(u, 0.72, 1, easeInOut);
  return (
    <AbsoluteFill>
      <svg width={L.width} height={L.height} style={{ position: "absolute", inset: 0, opacity: 1 - crisp }}>
        {grains.map((g, i) => {
          const delay = random(`kt-ad${i}`) * 0.3;
          const p = prog(u, delay, delay + 0.4, easeInOut);
          const sx = mix(random(`kt-ax${i}`), -0.2, 1.2) * L.width;
          const sy = mix(random(`kt-ay${i}`), -0.2, 1.2) * L.height;
          const landed = g.isKey ? L.accent : L.color;
          return (
            <circle
              key={i}
              cx={mix(p, sx, g.x + cell / 2)}
              cy={mix(p, sy, g.y + cell / 2)}
              r={cell * 0.45}
              fill={p >= 1 ? landed : L.accent}
              opacity={mix(p, 0.45, 1)}
            />
          );
        })}
      </svg>
      <KTLines layout={L} outerStyle={{ opacity: crisp }} renderWord={plainWord(L)} />
    </AbsoluteFill>
  );
};
