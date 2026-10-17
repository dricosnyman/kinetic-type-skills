/**
 * Family 17 — code, interaction and AI: type driven by formulas, data or the
 * viewer. (Generative flow is scene-specific, so it lives in examples/.)
 *
 * Every component renders any text, gives the key word the accent treatment,
 * and is settled by u = 1 (see useSettle in kit.ts). Sine-wave type keeps a
 * gentle wave after that, and the pointer keeps hovering: the motion is the
 * technique.
 *
 * Cursor-reactive and scroll-linked are web effects; a video can only show a
 * pretend recording of them, which is what these do. Cursor-reactive needs a
 * variable font, so it defaults to Roboto Flex (loaded in f05-shape-shift.tsx).
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { C, easeInOut, easeOut, mix, prog, staggerStart, useSettle } from "../kit";
import { KTLines, blockRect, letterWidths, useKTLayout, wordBoxes } from "../layout";
import type { KTProps } from "../types";
import { flex } from "./f05-shape-shift";

const inline: React.CSSProperties = { display: "inline-block" };

// ---------------------------------------------------------------------------
// Sine-wave type: each letter's height comes from a formula,
//   y = a·sin(3t + 0.5n) + b·sin(5.3t − 1.1n)     (n = the letter's number, t = time)
// so the letters ride two waves added together. The waves start big as the
// letters fade in, then calm to a gentle swell. The key word is in the accent
// colour. With showFormula, the formula is written under the text.

export type SineWaveProps = KTProps & {
  /** Write the formula under the text (default false). */
  readonly showFormula?: boolean;
};

export const SineWaveType: React.FC<SineWaveProps> = (props) => {
  // Extra line height leaves room for the waves.
  const L = useKTLayout(props, { fontWeight: 900, lineHeight: 1.6, boxHeight: props.showFormula ? 0.6 : 0.72 });
  const { u, t } = useSettle();
  if (!L.ready) return null;
  const N = L.letterCount;
  const amp = mix(prog(u, 0.3, 1, easeInOut), 0.45, 0.16); // in em
  const b = blockRect(L);
  const fs = L.fontSize;
  return (
    <AbsoluteFill>
      <KTLines
        layout={L}
        renderWord={(w) => (
          <span style={{ ...inline, color: w.isKey ? L.accent : L.color }}>
            {w.letters.map((ch, j) => {
              const n = w.letterStart + j;
              const a = staggerStart(n, N, 0.3, 0.03, 0.6);
              const y = amp * (0.7 * Math.sin(t * 3 + n * 0.5) + 0.3 * Math.sin(t * 5.3 - n * 1.1));
              return (
                <span key={j} style={{ ...inline, translate: `0em ${y.toFixed(4)}em`, opacity: prog(u, a, a + 0.3) }}>
                  {ch}
                </span>
              );
            })}
          </span>
        )}
      />
      {props.showFormula ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: b.bottom + 0.2 * fs,
            textAlign: "center",
            fontFamily: "monospace",
            fontSize: Math.max(16, 0.24 * fs),
            color: C.muted,
            opacity: prog(u, 0.5, 1),
          }}
        >
          y = a·sin(3t + 0.5n) + b·sin(5.3t − 1.1n)
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Cursor-reactive: a pretend mouse pointer glides across the text; letters
// near it grow heavier and a little wider (the variable font's weight and
// width sliders) and turn to the accent colour, then relax as it moves on.
// The pointer comes to rest on the key word (or the end of the text) and
// hovers there. The key word is in the accent colour.

const REST_WEIGHT = 400;
const NEAR_WEIGHT = 950;

export const CursorReactive: React.FC<KTProps> = (props) => {
  // Laid out at the heaviest weight, so no line overflows when letters get heavy.
  const L = useKTLayout(props, { fontWeight: 900, defaultFamily: flex, boxWidth: 0.8 });
  const { u, t } = useSettle();
  if (!L.ready || L.words.length === 0) return null;
  const fs = L.fontSize;
  const b = blockRect(L);
  const boxes = wordBoxes(L);
  // Where each letter is (close enough to measure distance from the pointer).
  const centres = boxes.map((wb) => {
    const widths = letterWidths(L, wb.word);
    let x = wb.cx - widths.reduce((a, v) => a + v, 0) / 2;
    return widths.map((lw) => {
      const c = { x: x + lw / 2, y: wb.cy };
      x += lw;
      return c;
    });
  });
  const target = L.keyIndex >= 0 ? boxes[L.keyIndex] : boxes[boxes.length - 1];
  const tx = target.cx;
  const ty = target.cy;
  // The pointer: in from the left, weaving across the lines, to the target.
  const q = prog(u, 0.05, 0.9, easeInOut);
  const sx = b.left - 0.8 * fs;
  const sy = b.top + 0.3 * b.h;
  const hover = prog(u, 0.9, 1.2);
  const px = mix(q, sx, tx) + Math.cos(t * 2) * 0.08 * fs * hover;
  const py = mix(q, sy, ty) + Math.sin(q * Math.PI * 2) * 0.35 * b.h + Math.sin(t * 2.6) * 0.06 * fs * hover;
  const reach = 1.6 * fs;
  return (
    <AbsoluteFill style={{ opacity: prog(u, 0, 0.12) }}>
      <KTLines
        layout={L}
        renderWord={(w) => (
          <span style={{ ...inline, whiteSpace: "pre" }}>
            {w.letters.map((ch, j) => {
              const c = centres[w.index][j];
              const near = Math.max(0, 1 - Math.hypot(c.x - px, c.y - py) / reach);
              return (
                <span
                  key={j}
                  style={{
                    ...inline,
                    fontVariationSettings: `"wght" ${Math.round(mix(near, REST_WEIGHT, NEAR_WEIGHT))}, "wdth" ${(100 + near * 22).toFixed(1)}`,
                    color: w.isKey || near > 0.5 ? L.accent : L.color,
                    translate: `0em ${(-near * 0.12).toFixed(3)}em`,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </span>
        )}
      />
      <svg
        width={0.3 * fs}
        height={0.42 * fs}
        viewBox="0 0 50 70"
        style={{ position: "absolute", left: px, top: py, overflow: "visible" }}
      >
        <path d="M 2 2 L 2 56 L 16 44 L 26 66 L 36 61 L 26 40 L 44 40 Z" fill="#FFFFFF" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scroll-linked: a pretend browser window. As the visitor scrolls (the
// scrollbar slides down), the text builds word by word — each word rises
// and darkens from a faint grey as its turn comes. The key word is in the
// accent colour.

export const ScrollLinked: React.FC<KTProps> = (props) => {
  // Room is left for the window around the text.
  const L = useKTLayout(props, { fontWeight: 900, boxWidth: 0.72, boxHeight: 0.52 });
  const { u } = useSettle();
  if (!L.ready || L.words.length === 0) return null;
  const fs = L.fontSize;
  const b = blockRect(L);
  const n = L.words.length;
  const sc = prog(u, 0.05, 0.92, easeInOut);
  const padX = 0.7 * fs;
  const bar = Math.max(24, 0.32 * fs);
  const padY = 0.6 * fs;
  const winW = b.w + 2 * padX;
  const winH = b.h + 2 * padY + bar;
  const left = b.left - padX;
  const top = b.top - padY - bar;
  const thumb = 0.3 * (winH - bar);
  return (
    <AbsoluteFill style={{ opacity: prog(u, 0, 0.12) }}>
      <div
        style={{
          position: "absolute",
          left,
          top,
          width: winW,
          height: winH,
          background: "#FFFFFF",
          borderRadius: 0.16 * fs,
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
        }}
      >
        <div style={{ height: bar, background: "#ECE6DA", display: "flex", alignItems: "center", gap: 0.3 * bar, paddingLeft: 0.5 * bar }}>
          {[C.orange, C.yellow, C.teal].map((c) => (
            <div key={c} style={{ width: 0.36 * bar, height: 0.36 * bar, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            right: 0.15 * bar,
            top: bar + 0.1 * bar + sc * (winH - bar - thumb - 0.2 * bar),
            width: 0.22 * bar,
            height: thumb,
            borderRadius: 0.11 * bar,
            background: C.faint,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0.5 * bar,
            bottom: 0.3 * bar,
            fontFamily: L.fontFamily,
            fontSize: 0.5 * bar,
            color: C.muted,
            opacity: 1 - sc,
          }}
        >
          ↓ scroll
        </div>
      </div>
      <KTLines
        layout={L}
        outerStyle={{ translate: `0px ${((1 - sc) * 0.3 * fs).toFixed(2)}px` }}
        renderWord={(w) => {
          const p = prog(sc, w.index / Math.max(1, n), (w.index + 1) / Math.max(1, n), easeOut);
          const c = w.isKey ? L.accent : L.color;
          return (
            <span
              style={{
                ...inline,
                color: p >= 1 ? c : `color-mix(in srgb, ${c} ${Math.round(25 + p * 55)}%, ${C.faint})`,
                translate: `0em ${((1 - p) * 0.35).toFixed(3)}em`,
                opacity: 0.35 + p * 0.65,
              }}
            >
              {w.text}
            </span>
          );
        }}
      />
    </AbsoluteFill>
  );
};
