/**
 * Family 7 — line, light and shadow: letters treated as lines to draw, or as
 * objects light falls on.
 *
 * Every component renders any text, gives the key word the accent treatment,
 * and is settled by u = 1 (see useSettle in kit.ts). Neon glows steadily once
 * settled (no flicker after that).
 *
 * Neon sign and spotlight reveal bring their own darkness (a sign panel, a dark
 * frame), because light only shows up against dark. Their text defaults to
 * light colours.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { C, easeInOut, mix, prog, staggerStart, useSettle } from "../kit";
import { KTLines, blockRect, letterWidths, useKTLayout, wordBoxes, wordColor } from "../layout";
import type { KTProps } from "../types";

const inline: React.CSSProperties = { display: "inline-block" };

// ---------------------------------------------------------------------------
// Stroke write-on: the outline of each letter draws itself like a pen, one
// letter after another, then the colour fills in. Drawn as SVG text, with a
// stroke dash that uncovers the outline.

const PEN = 6; // dash length in em: longer than any letter's outline, so the pen moves at an even speed

export const StrokeWriteOn: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 800 });
  const { u } = useSettle();
  // Each letter's x position (letters are drawn one by one, so they are placed one by one).
  const placed = useMemo(() => {
    if (!L.ready) return [];
    return wordBoxes(L).flatMap((wb) => {
      const widths = letterWidths(L, wb.word);
      let x = wb.cx - widths.reduce((a, b) => a + b, 0) / 2;
      return wb.word.letters.map((ch, j) => {
        const at = x;
        x += widths[j];
        return { ch, x: at, y: wb.baseline, gi: wb.word.letterStart + j, color: wordColor(L, wb.word) };
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only depends on these parts of the layout
  }, [L.ready, L.lines, L.fontSize, L.fontFamily, L.fontWeight, L.color, L.accent]);
  if (!L.ready) return null;
  const fs = L.fontSize;
  const N = L.letterCount;
  const D = PEN * fs;
  const fill = prog(u, 0.7, 1, easeInOut);
  return (
    <AbsoluteFill>
      <svg width={L.width} height={L.height}>
        {placed.map((l) => {
          const a = staggerStart(l.gi, N, 0.55, 0.05, 0.85);
          const p = prog(u, a, a + 0.55, easeInOut);
          if (p <= 0) return null;
          return (
            <text
              key={l.gi}
              x={l.x}
              y={l.y}
              fontFamily={L.fontFamily}
              fontWeight={L.fontWeight}
              fontSize={fs}
              fill={l.color}
              fillOpacity={fill}
              stroke={l.color}
              strokeWidth={Math.max(1.5, fs * 0.022)}
              strokeLinejoin="round"
              strokeDasharray={`${D} ${D}`}
              strokeDashoffset={D * (1 - p)}
            >
              {l.ch}
            </text>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Neon sign: glass tubes on a dark sign buzz on letter by letter, flickering
// as they catch, then glow steadily. Tubes are pink; the key word's tube is
// cyan, or the accent colour when one is given.

const SIGN = "#14151B";
const NEON_PINK = "#FF4FA3";
const NEON_CYAN = "#4FE3FF";

export const NeonSign: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 400, lineHeight: 1.25, boxWidth: 0.78, boxHeight: 0.62 });
  const { u } = useSettle();
  const frame = useCurrentFrame();
  if (!L.ready) return null;
  const fs = L.fontSize;
  const b = blockRect(L);
  const pad = 0.45 * fs;
  const N = L.letterCount;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: b.left - pad,
          top: b.top - pad * 0.8,
          width: b.w + 2 * pad,
          height: b.h + 1.6 * pad,
          borderRadius: 0.3 * fs,
          background: SIGN,
          opacity: prog(u, 0, 0.15),
        }}
      />
      <KTLines
        layout={L}
        renderWord={(w) => {
          const tube = w.isKey ? props.accent ?? NEON_CYAN : NEON_PINK;
          return (
            <span style={inline}>
              {w.letters.map((ch, j) => {
                const gi = w.letterStart + j;
                const on = staggerStart(gi, N, 0.2, 0.06, 0.8) + 0.12;
                // A few random dark frames just after switching on, then steady.
                const buzz = u >= on && u < on + 0.18 && random(`kt-neon${gi}-${Math.floor(frame / 2)}`) < 0.45;
                const lit = u >= on && !buzz;
                return (
                  <span
                    key={j}
                    style={{
                      ...inline,
                      color: lit ? "#FFFFFF" : "#2A2B33",
                      textShadow: lit
                        ? `0 0 ${0.04 * fs}px ${tube}, 0 0 ${0.12 * fs}px ${tube}, 0 0 ${0.3 * fs}px ${tube}, 0 0 ${0.55 * fs}px ${tube}`
                        : "none",
                      WebkitTextStroke: `${Math.max(1, 0.012 * fs)}px ${lit ? tube : "#3A3B44"}`,
                    }}
                  >
                    {ch}
                  </span>
                );
              })}
            </span>
          );
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Light sweep: a band of light slides across the text, like a reflection on
// polished metal. The text is gold (or metal in the given colour); the key
// word is metal in the accent colour.

const GOLD = { dark: "#8A6A1F", mid: "#C9A64A", light: "#FFF6D6", edge: "#5E4712" };
const metal = (c: string) => ({
  dark: `color-mix(in srgb, ${c} 65%, black)`,
  mid: c,
  light: `color-mix(in srgb, ${c} 20%, white)`,
  edge: `color-mix(in srgb, ${c} 45%, black)`,
});

export const LightSweep: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900 });
  const { u } = useSettle();
  if (!L.ready) return null;
  const b = blockRect(L);
  const boxes = new Map(wordBoxes(L).map((wb) => [wb.word.index, wb]));
  const x = mix(prog(u, 0.15, 0.9, easeInOut), -40, 140);
  const plain = props.color ? metal(props.color) : GOLD;
  const keyed = metal(L.accent);
  return (
    <KTLines
      layout={L}
      outerStyle={{ opacity: prog(u, 0, 0.25) }}
      renderWord={(w) => {
        const wb = boxes.get(w.index)!;
        const m = w.isKey ? keyed : plain;
        return (
          <span
            style={{
              ...inline,
              color: "transparent",
              // One band across the whole block: each word shows its own part of it.
              backgroundImage: `linear-gradient(110deg, ${m.dark} 0%, ${m.mid} ${x - 16}%, ${m.light} ${x}%, ${m.mid} ${x + 16}%, ${m.dark} 100%)`,
              backgroundSize: `${b.w}px ${b.h}px`,
              backgroundPosition: `${b.left - wb.x}px ${b.top - wb.top}px`,
              backgroundRepeat: "no-repeat",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              filter: `drop-shadow(0 ${0.03 * L.fontSize}px 0 ${m.edge})`,
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
// Long shadow: a long, hard diagonal shadow grows out of every letter (many
// copies of the letters, each nudged one pixel further down and right).
// The shadow is a pale tone of the text colour, made for a light background.

export const LongShadow: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900, boxWidth: 0.8, boxHeight: 0.66 });
  const { u } = useSettle();
  const len = mix(prog(u, 0.15, 0.95, easeInOut), 0, 0.55 * L.fontSize);
  const steps = Math.min(120, Math.round(len));
  const shadow = (c: string) =>
    steps > 0
      ? new Array(steps)
          .fill(0)
          .map((_, i) => {
            const d = ((i + 1) * len) / steps;
            return `${d.toFixed(2)}px ${d.toFixed(2)}px 0 ${c}`;
          })
          .join(", ")
      : "none";
  const plain = shadow(`color-mix(in srgb, ${L.color} 22%, ${C.paper})`);
  const keyed = shadow(`color-mix(in srgb, ${L.accent} 35%, ${C.paper})`);
  return (
    <KTLines
      layout={L}
      outerStyle={{ opacity: prog(u, 0, 0.2) }}
      renderWord={(w) => (
        <span style={{ ...inline, color: wordColor(L, w), textShadow: w.isKey ? keyed : plain }}>{w.text}</span>
      )}
    />
  );
};

// ---------------------------------------------------------------------------
// Spotlight reveal: the frame is dark; a circle of light roams around, finds
// the key word (or the middle of the text), then opens up to show it all.
// The text is light (paper) unless a colour is given; the key word is in the accent colour.

export const SpotlightReveal: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900, boxWidth: 0.8, boxHeight: 0.66 });
  const { u } = useSettle();
  if (!L.ready) return null;
  const fs = L.fontSize;
  const b = blockRect(L);
  const key = wordBoxes(L).find((wb) => wb.word.isKey);
  const tx = key?.cx ?? L.width / 2;
  const ty = key?.cy ?? L.height / 2;
  // Roam: start up and to the left, wander, and arrive on the target.
  const find = prog(u, 0, 0.6, easeInOut);
  const sway = 1 - prog(u, 0.45, 0.6);
  const sx = mix(find, b.left + b.w * 0.1, tx) + Math.sin(u * 9) * 0.6 * fs * sway;
  const sy = mix(find, b.top - fs * 0.2, ty) + Math.cos(u * 7) * 0.3 * fs * sway;
  // Then open up wide enough to light every corner of the text.
  const far = Math.max(
    Math.hypot(b.left - tx, b.top - ty),
    Math.hypot(b.right - tx, b.top - ty),
    Math.hypot(b.left - tx, b.bottom - ty),
    Math.hypot(b.right - tx, b.bottom - ty),
  );
  // (The light's edge is soft from 80% of its radius, so the radius reaches past the far corner.)
  const r = mix(prog(u, 0.6, 0.95, easeInOut), fs * 0.9, (far + fs * 0.4) / 0.8);
  const light = `radial-gradient(circle ${r}px at ${sx}px ${sy}px, black ${r * 0.8}px, transparent ${r}px)`;
  const textColor = props.color ?? C.paper;
  return (
    <AbsoluteFill style={{ background: C.night, opacity: prog(u, 0, 0.1) }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle ${r * 1.2}px at ${sx}px ${sy}px, #2A2B33 0%, ${C.night} 100%)` }} />
      <KTLines
        layout={L}
        outerStyle={{ WebkitMaskImage: light, maskImage: light }}
        renderWord={(w) => <span style={{ ...inline, color: w.isKey ? L.accent : textColor }}>{w.text}</span>}
      />
    </AbsoluteFill>
  );
};
