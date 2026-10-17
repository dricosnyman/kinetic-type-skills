/**
 * Family 9 — 3D surfaces: what the letter is made of (chrome, foil, balloon),
 * or what it is wrapped onto. These are 2D fakes made with gradients; real
 * chrome, glass and inflation need a 3D tool.
 *
 * Every component renders any text, gives the key word the accent treatment,
 * and is settled by u = 1 (see useSettle in kit.ts). The chrome horizon, the
 * holographic sheen and the cylinder keep moving gently after that: the
 * moving reflection is the technique.
 *
 * Chrome brings its own dark panel (a mirror only reads against dark).
 * Inflated letters are pink unless a colour is given.
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { clamp, easeInOut, easeOut, mix, prog, staggerStart, useSettle } from "../kit";
import { KTLines, blockRect, letterWidths, useKTLayout, wordBoxes } from "../layout";
import type { KTProps } from "../types";

const inline: React.CSSProperties = { display: "inline-block" };

/** Paints a gradient inside the letters only. */
const clipText = (backgroundImage: string): React.CSSProperties => ({
  color: "transparent",
  backgroundImage,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
});

// ---------------------------------------------------------------------------
// Chrome: a mirror-like metal, faked with a gradient inside the letters — sky
// above a horizon line, dark ground just below it, then light ground. The
// horizon sweeps down into place as the text arrives, then drifts a little as
// if the letters were tilting. The key word is chrome tinted with the accent.

const PANEL = "#16171D";

export const Chrome: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900, boxWidth: 0.78, boxHeight: 0.62 });
  const { u, t } = useSettle();
  if (!L.ready || L.words.length === 0) return null;
  const fs = L.fontSize;
  const b = blockRect(L);
  const pad = 0.45 * fs;
  const settled = prog(u, 0.2, 1, easeInOut);
  const h = mix(settled, 8, 50) + Math.sin(t * 1.6) * 5 * settled;
  const metal = (sky: string, ground: string) =>
    `linear-gradient(180deg, #E9F3FF 0%, ${sky} ${h - 14}%, #FFFFFF ${h - 1}%, #2B2118 ${h}%, ${ground} ${h + 18}%, #F0D9B5 100%)`;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: b.left - pad,
          top: b.top - pad * 0.7,
          width: b.w + 2 * pad,
          height: b.h + 1.4 * pad,
          borderRadius: 0.25 * fs,
          background: PANEL,
          opacity: prog(u, 0, 0.15),
        }}
      />
      <KTLines
        layout={L}
        outerStyle={{ opacity: prog(u, 0.05, 0.35), scale: `${mix(prog(u, 0, 0.6), 0.92, 1)}` }}
        renderWord={(w) => (
          <span
            style={{
              ...inline,
              ...clipText(
                w.isKey
                  ? metal(`color-mix(in srgb, ${L.accent} 70%, white)`, `color-mix(in srgb, ${L.accent} 80%, black)`)
                  : metal("#8DB7E8", "#8A6F55"),
              ),
              WebkitTextStroke: `${Math.max(1, 0.012 * fs)}px ${w.isKey ? L.accent : "#C9D3DF"}`,
              filter: `drop-shadow(0 ${0.03 * fs}px ${0.05 * fs}px rgba(0,0,0,0.6))`,
            }}
          >
            {w.text}
          </span>
        )}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Holographic: a rainbow sheen slides across the letters like a foil sticker.
// The foil is one sheet across the whole block (each word shows its own part
// of it). The words sweep on left to right; the key word has an accent edge.

const FOIL = ["#F77FC6", "#6FC9F2", "#8EDB8A", "#F2CF5B"];

export const Holographic: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900 });
  const { u, t } = useSettle();
  if (!L.ready) return null;
  const fs = L.fontSize;
  const b = blockRect(L);
  const boxes = wordBoxes(L);
  const n = L.words.length;
  // The sheen: a repeating rainbow, wider than the block, sliding to the right.
  const band = Math.max(b.w, fs) * 0.6;
  // Sliding the stops of a repeating gradient by whole periods is seamless.
  const period = band * FOIL.length;
  const shift = ((t * 0.35 * band) % period) - period;
  const angle = 100 + Math.sin(t * 2) * 20;
  const stops = [...FOIL, FOIL[0]].map((c, i) => `${c} ${(i * band + shift).toFixed(1)}px`).join(", ");
  const foil = `repeating-linear-gradient(${angle}deg, ${stops})`;
  return (
    <KTLines
      layout={L}
      renderWord={(w) => {
        const wb = boxes[w.index];
        const a = staggerStart(w.index, n, 0.5, 0.1, 0.9);
        const p = prog(u, a, a + 0.5, easeOut);
        return (
          <span
            style={{
              ...inline,
              ...clipText(foil),
              backgroundSize: `${b.w + 2 * fs}px ${b.h + fs}px`,
              backgroundPosition: `${-(wb.x - b.left + fs)}px ${-(wb.top - b.top)}px`,
              WebkitTextStroke: w.isKey
                ? `${Math.max(1.5, 0.02 * fs)}px ${L.accent}`
                : `${Math.max(1, 0.014 * fs)}px color-mix(in srgb, ${L.color} 55%, transparent)`,
              opacity: p,
              translate: `${mix(p, -0.3, 0)}em 0em`,
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
// Inflated / puffy: each letter swells up like a balloon (an elastic bounce),
// with a soft highlight top-left and a shade bottom-right that suggest a round
// surface, and a thick outline of the same colour that fattens the shapes.
// Pink unless a colour is given; the key word inflates in the accent colour.

const BALLOON = "#FF6F9A";

const balloon = (base: string) =>
  `radial-gradient(circle at 35% 28%, #FFFFFF 0%, color-mix(in srgb, ${base} 45%, white) 18%, ${base} 55%, color-mix(in srgb, ${base} 70%, black) 100%)`;

export const Inflated: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900, boxWidth: 0.8, boxHeight: 0.66 });
  const { u, t } = useSettle();
  const base = props.color ?? BALLOON;
  const N = L.letterCount;
  const fs = L.fontSize;
  const breathe = 1 + Math.sin(t * 4) * 0.012 * prog(u, 1, 1.4);
  return (
    <KTLines
      layout={L}
      renderWord={(w) => {
        const c = w.isKey ? L.accent : base;
        return (
          <span style={inline}>
            {w.letters.map((ch, j) => {
              const gi = w.letterStart + j;
              const a = staggerStart(gi, N, 0.6, 0.04, 0.95);
              const s = interpolate(u, [a, a + 0.6], [0.3, 1], { ...clamp, easing: Easing.out(Easing.elastic(1.2)) });
              return (
                <span
                  key={j}
                  style={{
                    ...inline,
                    ...clipText(balloon(c)),
                    WebkitTextStroke: `${0.055 * fs}px ${c}`,
                    paintOrder: "stroke fill",
                    filter: `drop-shadow(0 ${0.06 * fs}px ${0.06 * fs}px color-mix(in srgb, ${c} 40%, transparent))`,
                    opacity: prog(u, a, a + 0.1),
                    scale: `${s * breathe}`,
                    transformOrigin: "50% 80%",
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
  );
};

// ---------------------------------------------------------------------------
// Wrapped on a cylinder: the text is a label on a can. Every letter sits on a
// circle in 3D; the can spins one full turn and slows to a stop with the text
// facing you (the ends of each line curve away round the can), then sways a
// little. Letters going round the back show through, mirrored and faint.
// The key word is in the accent colour.

export const WrappedOnCylinder: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 800, boxWidth: 0.8 });
  const { u, t } = useSettle();
  if (!L.ready || L.words.length === 0) return null;
  const b = blockRect(L);
  const cx = b.left + b.w / 2;
  const cy = b.top + b.h / 2;
  // The radius makes the widest line reach about 52° round each side.
  const R = Math.max(L.fontSize, b.w / 2 / 0.9);
  const P = 3 * R; // viewing distance, for perspective
  const spin = (prog(u, 0, 0.95, easeOut) - 1) * Math.PI * 2 + Math.sin(t * 1.2) * 0.07 * prog(u, 1, 1.5);
  const appear = prog(u, 0, 0.2);
  return (
    <AbsoluteFill>
      {wordBoxes(L).flatMap((wb) => {
        const widths = letterWidths(L, wb.word);
        let x = wb.cx - widths.reduce((s, v) => s + v, 0) / 2;
        return wb.word.letters.map((ch, j) => {
          const lw = widths[j];
          const s = x + lw / 2 - cx; // distance round the can from the front
          x += lw;
          const a = s / R + spin;
          const cos = Math.cos(a);
          const D = P + R * (1 - cos); // distance from the eye
          const f = P / D;
          // How much the letter is squeezed sideways: the slope of the projected position.
          // It reaches 0 at the can's visible edge and is negative (mirrored) round the back.
          const sx = (P * ((P + R) * cos - R)) / (D * D);
          return (
            <span
              key={`${wb.word.index}-${j}`}
              style={{
                position: "absolute",
                left: cx + R * Math.sin(a) * f - lw / 2,
                top: cy + (wb.cy - cy) * f - wb.h / 2,
                width: lw,
                height: wb.h,
                lineHeight: `${wb.h}px`,
                textAlign: "center",
                whiteSpace: "pre",
                fontFamily: L.fontFamily,
                fontWeight: L.fontWeight,
                fontSize: L.fontSize * wb.word.scale,
                color: wb.word.isKey ? L.accent : L.color,
                transform: `scale(${sx}, ${f})`,
                opacity: appear * (sx > 0 ? 1 : 0.12),
              }}
            >
              {ch}
            </span>
          );
        });
      })}
    </AbsoluteFill>
  );
};
