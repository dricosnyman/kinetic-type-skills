/**
 * Family 0 — the basics: the original 11 kinetic typography styles, plus a marker highlight.
 * (Camera-move typography and text-as-image are scene-specific, so they live in examples/.)
 *
 * Every component renders any text, gives the key word the accent treatment,
 * and is settled by u = 1 (see useSettle in kit.ts).
 */
import React, { useId } from "react";
import { AbsoluteFill, Easing, interpolate, random } from "remotion";
import { C, clamp, courier, easeIn, easeInOut, easeOut, mix, pop, prog, staggerStart, useSettle } from "../kit";
import { KTBlock, KTLines, LWord, blockMetrics, useKTLayout, wordColor } from "../layout";
import type { KTProps } from "../types";

const inline: React.CSSProperties = { display: "inline-block" };

/** A clean, unique id for SVG filters (React ids contain characters CSS url() dislikes). */
const useSvgId = (prefix: string) => `${prefix}-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

// ---------------------------------------------------------------------------
// Motion typography: whole words slide, scale, rotate or bounce into place.
// The letters never change shape. The key word spins in, in the accent colour.

type Move = (p: number) => React.CSSProperties;
const MOVES: { len: number; ease: (x: number) => number; style: Move }[] = [
  // slide in from the left
  { len: 0.45, ease: easeOut, style: (p) => ({ opacity: p, translate: `${mix(p, -4, 0)}em 0em` }) },
  // pop up from nothing
  { len: 0.45, ease: Easing.out(Easing.back(2.2)), style: (p) => ({ opacity: Math.min(1, p * 3), scale: `${Math.max(0, p)}` }) },
  // drop from above and bounce
  { len: 0.55, ease: Easing.bounce, style: (p) => ({ opacity: Math.min(1, p * 4), translate: `0em ${mix(p, -3, 0)}em` }) },
  // slide in from the right
  { len: 0.45, ease: easeOut, style: (p) => ({ opacity: p, translate: `${mix(p, 4, 0)}em 0em` }) },
  // rise and straighten
  { len: 0.45, ease: Easing.out(Easing.back(1.6)), style: (p) => ({ opacity: Math.min(1, p * 2), translate: `0em ${mix(p, 1.4, 0)}em`, rotate: `${mix(p, -14, 0)}deg` }) },
];
const SPIN: Move = (p) => ({ opacity: Math.min(1, p * 2), rotate: `${mix(p, -200, 0)}deg`, scale: `${mix(p, 0.2, 1)}` });

export const MotionTypography: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 800 });
  const { u } = useSettle();
  const n = L.words.length;
  return (
    <KTLines
      layout={L}
      renderWord={(w) => {
        const a = staggerStart(w.index, n, 0.55, 0.12);
        const move = MOVES[w.index % MOVES.length];
        const style = w.isKey
          ? SPIN(interpolate(u, [a, a + 0.55], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) }))
          : move.style(interpolate(u, [a, a + move.len], [0, 1], { ...clamp, easing: move.ease }));
        return <span style={{ ...inline, color: wordColor(L, w), ...style }}>{w.text}</span>;
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// Fluid typography: the letters change shape. Each word condenses out of a
// liquid blob (blur + a hard alpha edge makes nearby shapes merge like drops),
// then its letters stretch and squash like elastic before settling.

export const FluidTypography: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900 });
  const { u } = useSettle();
  const id = useSvgId("kt-goo");
  const n = L.words.length;
  // The hard "liquid" edge relaxes back to normal anti-aliased text as it settles.
  const soft = prog(u, 0.7, 1, easeInOut);
  const slope = mix(soft, 255, 1);
  const offset = mix(soft, -140, 0);
  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id={id}>
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${slope} ${offset}`}
            />
          </filter>
        </defs>
      </svg>
      <KTLines
        layout={L}
        outerStyle={{ filter: u < 1 ? `url(#${id})` : undefined }}
        renderWord={(w) => {
          const a = staggerStart(w.index, n, 0.7, 0.06, 0.85);
          const condense = prog(u, a, a + 0.7, easeInOut);
          const blur = mix(condense, 0.35, 0) * L.fontSize;
          return (
            <span style={{ ...inline, color: wordColor(L, w), filter: blur > 0.05 ? `blur(${blur}px)` : undefined }}>
              {w.letters.map((ch, j) => {
                // Elastic stretch: a decaying wobble that is exactly 0 by the end.
                const q = prog(u, a + 0.3 + j * 0.015, 1, (x) => x);
                const amt = (w.isKey ? 0.55 : 0.35) * Math.sin(q * Math.PI * 3) * Math.exp(-q * 3);
                return (
                  <span
                    key={j}
                    style={{ ...inline, transformOrigin: "50% 90%", scale: `${1 - amt * 0.35} ${1 + amt}` }}
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
// Word-by-word reveal: each word pops on in turn, as a narrator would say it.
// The key word lands bigger and in the accent colour.

export const WordByWordReveal: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 800, keyScale: 1.35 });
  const { u } = useSettle();
  const n = L.words.length;
  return (
    <KTLines
      layout={L}
      renderWord={(w) => {
        const a = staggerStart(w.index, n, 0.4, 0.14);
        const p = w.isKey ? pop(u, a, 0.4, 3) : pop(u, a, 0.3, 1.6);
        return (
          <span
            style={{
              ...inline,
              fontSize: `${w.scale}em`,
              color: wordColor(L, w),
              opacity: u < a ? 0 : 1,
              scale: `${p}`,
              translate: `0em ${mix(p, 0.3, 0)}em`,
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
// Emphasis scaling: the line arrives flat, then the key word grows bigger,
// bolder and coloured (with a little shout-shake) while the other words get quieter.

const EMPHASIS = 1.6;

export const EmphasisScaling: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 800, keyScale: EMPHASIS });
  const { u } = useSettle();
  const n = L.words.length;
  const hasKey = L.keyIndex >= 0;
  const e = hasKey ? interpolate(u, [0.35, 0.75], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) }) : 0;
  const shake = u > 0.75 && u < 1 ? Math.sin(u * 140) * 0.04 * (1 - prog(u, 0.75, 1, (x) => x)) : 0;
  return (
    <KTLines
      layout={L}
      renderWord={(w) => {
        const a = staggerStart(w.index, n, 0.25, 0.06, 0.35);
        const k = prog(u, a, a + 0.25);
        const quiet = Math.min(1, Math.max(0, e));
        return (
          <span
            style={{
              ...inline,
              opacity: k * (w.isKey ? 1 : mix(quiet, 1, 0.75)),
              translate: `${w.isKey ? shake : 0}em ${mix(k, 0.2, 0)}em`,
              fontSize: `${w.isKey ? mix(e, 1, EMPHASIS) : mix(quiet, 1, 0.92)}em`,
              fontWeight: w.isKey && e > 0.5 ? 900 : undefined,
              color: w.isKey && e > 0.3 ? L.accent : L.color,
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
// Marker highlight: the line rises in, then a highlighter bar sweeps in
// behind the key word. The bar is marker yellow unless an accent is given.

export const MarkerHighlight: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 800 });
  const { u } = useSettle();
  const n = L.words.length;
  const bar = prog(u, 0.45, 0.95, easeInOut);
  const barColor = props.accent ?? C.marker;
  return (
    <KTLines
      layout={L}
      renderWord={(w) => {
        const a = staggerStart(w.index, n, 0.3, 0.06, 0.45);
        const k = prog(u, a, a + 0.3);
        return (
          <span style={{ ...inline, position: "relative", opacity: k, translate: `0em ${mix(k, 0.25, 0)}em` }}>
            {w.isKey ? (
              <span
                style={{
                  position: "absolute",
                  left: "-0.1em",
                  right: "-0.1em",
                  top: "42%",
                  bottom: "0.04em",
                  borderRadius: "0.08em",
                  background: barColor,
                  transformOrigin: "0% 50%",
                  scale: `${bar} 1`,
                  rotate: "-1deg",
                }}
              />
            ) : null}
            <span style={{ position: "relative" }}>{w.text}</span>
          </span>
        );
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// Physics-based: words are dropped from above the frame and fall with real
// gravity, bouncing smaller each time. The key word squashes on impact and shakes the line.

const RESTITUTION = 0.4; // how much speed survives each bounce
// With restitution e, the bounces add up to 2e / (1 - e) of the first fall time.
const FALL_SHARE = 1 / (1 + (2 * RESTITUTION) / (1 - RESTITUTION));

/** Height above the resting spot (0..1 of the drop height) at q (0..1 of the fall-and-bounce time). */
const dropHeight = (q: number): number => {
  if (q <= 0) return 1;
  const g = 2 / (FALL_SHARE * FALL_SHARE);
  if (q < FALL_SHARE) return 1 - 0.5 * g * q * q;
  let v = g * FALL_SHARE * RESTITUTION;
  let rest = q - FALL_SHARE;
  while (v > 0.02) {
    const dur = (2 * v) / g;
    if (rest < dur) return v * rest - 0.5 * g * rest * rest;
    rest -= dur;
    v *= RESTITUTION;
  }
  return 0;
};

export const PhysicsBased: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 800 });
  const { u } = useSettle();
  const n = L.words.length;
  const SPAN = 0.6; // fall + bounces, in u
  const { height: blockH, lineTops } = blockMetrics(L);
  const blockTop = (L.height - blockH) / 2;

  // The key word's landing shakes the whole line a little.
  let shake = 0;
  if (L.keyIndex >= 0) {
    const land = staggerStart(L.keyIndex, n, SPAN, 0.15) + SPAN * FALL_SHARE;
    const s = u - land;
    if (s > 0 && s < 0.2) shake = Math.sin(s * 160) * 0.05 * (1 - s / 0.2);
  }

  return (
    <KTLines
      layout={L}
      outerStyle={{ translate: `${shake * 0.6 * L.fontSize}px ${shake * L.fontSize}px` }}
      renderWord={(w, li) => {
        const a = staggerStart(w.index, n, SPAN, 0.15);
        const q = (u - a) / SPAN;
        // Drop from just above the top of the frame.
        const dropPx = blockTop + lineTops[li] + L.fontSize * 1.5;
        const spin = (random(`kt-spin-${w.index}`) * 2 - 1) * 90;
        const tilt = (random(`kt-tilt-${w.index}`) * 2 - 1) * 3;
        const air = prog(q, 0, FALL_SHARE, (x) => x);
        const s = q - FALL_SHARE;
        const squash = s > 0 ? Math.exp(-s * 9) * Math.cos(s * 28) * (1 - prog(q, 0.85, 1, (x) => x)) : 0;
        const k = w.isKey ? 1 : 0.4;
        return (
          <span
            style={{
              ...inline,
              color: wordColor(L, w),
              opacity: q < 0 ? 0 : 1,
              transformOrigin: "50% 100%",
              translate: `0px ${-dropHeight(q) * dropPx}px`,
              rotate: `${mix(air, spin, tilt)}deg`,
              scale: `${1 + squash * 0.15 * k} ${1 - squash * 0.2 * k}`,
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
// Typewriter: letters appear one at a time, with a short pause after
// punctuation, and a blinking block cursor. Typed in Courier Prime unless a font is given.

const PAUSE: Record<string, number> = { ",": 3, ".": 4, "!": 4, "?": 4, ";": 3, ":": 3 };

export const Typewriter: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 700, defaultFamily: courier, lineHeight: 1.3 });
  const { u, t } = useSettle();

  // Each letter costs 1 tick (punctuation costs more); the gap between words is 1 tick.
  const cost: number[] = [];
  L.words.forEach((w, wi) => w.letters.forEach((ch, j) => cost.push((PAUSE[ch] ?? 1) + (wi > 0 && j === 0 ? 1 : 0))));
  const total = cost.reduce((a, b) => a + b, 0);
  let budget = prog(u, 0.05, 0.95, (x) => x) * total;
  let shown = 0;
  for (const c of cost) {
    if (budget < c) break;
    budget -= c;
    shown++;
  }
  const done = shown === L.letterCount;
  const cursorOn = done ? Math.floor(t * 2) % 2 === 0 : true;
  // The cursor sits after the last letter typed.
  const cursorAt = Math.max(0, shown - 1);

  const cursor = (
    <span style={{ ...inline, position: "relative", width: 0, height: 0 }}>
      <span
        style={{
          position: "absolute",
          left: "0.06em",
          bottom: "-0.2em",
          width: "0.55em",
          height: "1em",
          background: L.accent,
          opacity: cursorOn ? 1 : 0,
        }}
      />
    </span>
  );

  return (
    <KTLines
      layout={L}
      renderWord={(w) => (
        <span style={{ ...inline, color: wordColor(L, w) }}>
          {shown === 0 && w.index === 0 ? cursor : null}
          {w.letters.map((ch, j) => {
            const gi = w.letterStart + j;
            return (
              <React.Fragment key={j}>
                <span style={{ visibility: gi < shown ? "visible" : "hidden" }}>{ch}</span>
                {shown > 0 && gi === cursorAt ? cursor : null}
              </React.Fragment>
            );
          })}
        </span>
      )}
    />
  );
};

// ---------------------------------------------------------------------------
// Glitch / distortion: the text arrives in a burst of digital failure —
// red and cyan copies split apart, horizontal slices jump sideways, the
// whole thing flickers — then calms down, keeping a faint colour fringe.

const SLICES_PER_LINE = 4;

export const Glitch: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900 });
  const { u, t } = useSettle();
  if (!L.ready) return null;

  // A new random pattern every frame.
  const frameKey = Math.round(t * 1000);
  const r = (k: string) => random(`${k}-${frameKey}`) * 2 - 1;
  // Glitch strength: a big burst, easing off to calm by u = 1.
  const g = u < 0.55 ? 1 : mix(prog(u, 0.55, 1, easeIn), 1, 0);
  const burst = g > 0.3;
  const flicker = burst && random(`kt-flicker-${frameKey}`) < 0.25 ? 0.35 : 1;
  const fs = L.fontSize;
  const split = (0.02 + g * 0.18) * fs;

  const { height: blockH } = blockMetrics(L);
  const top = (L.height - blockH) / 2;
  const slices = Math.min(16, L.lines.length * SLICES_PER_LINE);

  const layer = (color: string | null, style: React.CSSProperties, key: string) => (
    <KTLines
      key={key}
      layout={L}
      outerStyle={style}
      renderWord={(w) => <span style={{ ...inline, color: color ?? wordColor(L, w) }}>{w.text}</span>}
    />
  );

  return (
    <AbsoluteFill style={{ opacity: prog(u, 0, 0.1, (x) => x) * flicker }}>
      {layer(C.glitchRed, { translate: `${-split + r("rx") * g * 0.1 * fs}px ${r("ry") * g * 0.04 * fs}px`, opacity: 0.85 }, "red")}
      {layer(C.glitchCyan, { translate: `${split + r("cx") * g * 0.1 * fs}px ${r("cy") * g * 0.04 * fs}px`, opacity: 0.85 }, "cyan")}
      {new Array(slices).fill(0).map((_, i) => {
        const y0 = top + (i * blockH) / slices;
        const y1 = top + ((i + 1) * blockH) / slices;
        // The first and last slices also reach the frame edges, so nothing is ever cut off.
        const insetTop = i === 0 ? 0 : y0;
        const insetBottom = i === slices - 1 ? 0 : L.height - y1;
        const jump = random(`kt-s${i}-${frameKey}`) < g * 0.7 ? r(`sx${i}`) * g * 0.8 * fs : 0;
        return layer(null, { clipPath: `inset(${insetTop}px 0px ${insetBottom}px 0px)`, translate: `${jump}px 0px` }, `s${i}`);
      })}
      {g > 0.6
        ? new Array(8).fill(0).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: (0.05 + random(`bx${i}-${frameKey}`) * 0.75) * L.width,
                top: top + random(`by${i}-${frameKey}`) * blockH,
                width: (0.03 + random(`bw${i}-${frameKey}`) * 0.2) * L.width,
                height: (0.03 + random(`bh${i}-${frameKey}`) * 0.12) * fs,
                background: i % 3 === 0 ? C.glitchRed : i % 3 === 1 ? C.glitchCyan : L.color,
                opacity: 0.8,
              }}
            />
          ))
        : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Masking and reveals: each line rises from behind an invisible edge,
// one line after the other. Clean and calm; the key word is in the accent colour.

export const MaskingAndReveals: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 800 });
  const { u } = useSettle();
  const nLines = L.lines.length;
  return (
    <KTLines
      layout={L}
      lineStyle={() => ({ overflow: "hidden", padding: "0.04em 0.1em 0.1em" })}
      renderWord={(w, li) => {
        const a = staggerStart(li, nLines, 0.65, 0.15);
        const p = prog(u, a, a + 0.65, easeOut);
        return <span style={{ ...inline, color: wordColor(L, w), translate: `0% ${mix(p, 115, 0)}%` }}>{w.text}</span>;
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// 3D extrusion: the text is a solid block (many thin copies stacked behind
// the front face, each a little darker). It flies in from the distance and
// turns to rest at an angle that shows its depth.

const DEPTH = 14;

export const Extrusion3D: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900, boxWidth: 0.78, boxHeight: 0.62 });
  const { u } = useSettle();
  if (!L.ready) return null;
  const fs = L.fontSize;
  const p = prog(u, 0, 0.75, easeOut);
  const turn = prog(u, 0.1, 1, easeInOut);
  const step = fs * 0.013;
  const z = mix(p, -10 * fs, 0);
  const rx = mix(turn, 35, 12);
  const ry = mix(turn, -70, -16);

  const copy = (i: number) => {
    const k = i / (DEPTH - 1);
    // Front face in the real colours; the sides darken towards the back.
    const dark = (c: string) => (i === 0 ? c : `color-mix(in srgb, ${c} ${Math.round(70 - k * 35)}%, black)`);
    return (
      <div
        key={i}
        style={{
          position: i === 0 ? "relative" : "absolute",
          inset: i === 0 ? undefined : 0,
          transform: `translateZ(${-i * step}px)`,
        }}
      >
        <KTBlock
          layout={L}
          renderWord={(w: LWord) => <span style={{ ...inline, color: dark(wordColor(L, w)) }}>{w.text}</span>}
        />
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", perspective: fs * 12 }}>
      <div
        style={{
          position: "relative",
          transformStyle: "preserve-3d",
          transform: `translateZ(${z}px) rotateX(${rx}deg) rotateY(${ry}deg)`,
          opacity: Math.min(1, p * 3),
        }}
      >
        {/* Back copies first, front face last, so the face is drawn on top. */}
        {new Array(DEPTH)
          .fill(0)
          .map((_, i) => DEPTH - 1 - i)
          .map((i) => copy(i))}
      </div>
    </AbsoluteFill>
  );
};
