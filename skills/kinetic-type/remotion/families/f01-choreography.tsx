/**
 * Family 1 — letter choreography: every letter (or word) does the same move, a beat apart.
 *
 * Every component renders any text, gives the key word the accent colour,
 * and is settled by u = 1 (see useSettle in kit.ts).
 */
import React from "react";
import { random } from "remotion";
import { easeInOut, easeOut, mix, pop, prog, staggerStart, useSettle } from "../kit";
import { KTLines, KTLayout, LWord, useKTLayout, wordColor } from "../layout";
import type { KTProps } from "../types";

const inline: React.CSSProperties = { display: "inline-block" };

/** Renders a word letter by letter; `style(globalLetterIndex)` styles each letter. */
const letters = (L: KTLayout, w: LWord, style: (gi: number) => React.CSSProperties) => (
  <span style={{ ...inline, color: wordColor(L, w) }}>
    {w.letters.map((ch, j) => (
      <span key={j} style={{ ...inline, ...style(w.letterStart + j) }}>
        {ch}
      </span>
    ))}
  </span>
);

// ---------------------------------------------------------------------------
// Cascade / stagger: every letter drops in from above with a little
// overshoot, each one a beat after the one before.

export const Cascade: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900 });
  const { u } = useSettle();
  const N = L.letterCount;
  return (
    <KTLines
      layout={L}
      renderWord={(w) =>
        letters(L, w, (gi) => {
          const p = pop(u, staggerStart(gi, N, 0.45, 0.06), 0.45, 1.8);
          return { opacity: Math.min(1, p * 2), translate: `0em ${mix(p, -1.1, 0)}em` };
        })
      }
    />
  );
};

// ---------------------------------------------------------------------------
// Random-order pop-on: same idea, but the letters pop up in a shuffled order.

export const RandomOrderPopOn: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900 });
  const { u } = useSettle();
  const N = L.letterCount;
  // rank[gi] = when letter gi pops, in a fixed shuffled order.
  const rank = new Array(N).fill(0);
  new Array(N)
    .fill(0)
    .map((_, i) => ({ i, r: random(`kt-pop-${i}`) }))
    .sort((a, b) => a.r - b.r)
    .forEach((o, k) => (rank[o.i] = k));
  return (
    <KTLines
      layout={L}
      renderWord={(w) =>
        letters(L, w, (gi) => {
          const p = pop(u, staggerStart(rank[gi], N, 0.35, 0.09), 0.35, 2.5);
          return { scale: `${p}` };
        })
      }
    />
  );
};

// ---------------------------------------------------------------------------
// Wave / ripple: each letter bobs on a sine wave, slightly behind its neighbour.
// The wave is big as the letters arrive and calms to a gentle ripple once settled.

export const Wave: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900, boxHeight: 0.62 });
  const { u, t } = useSettle();
  const N = L.letterCount;
  const amp = 0.3 * (1 - 0.75 * prog(u, 0.3, 1, easeInOut));
  return (
    <KTLines
      layout={L}
      renderWord={(w) =>
        letters(L, w, (gi) => {
          const a = staggerStart(gi, N, 0.3, 0.04, 0.7);
          const k = prog(u, a, a + 0.3);
          return { opacity: k, translate: `0em ${Math.sin(t * 5 - gi * 0.6) * amp * k}em` };
        })
      }
    />
  );
};

// ---------------------------------------------------------------------------
// 3D flip-in: letters turn over like cards (hinged at the bottom), one after another.

export const FlipIn3D: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900 });
  const { u } = useSettle();
  const N = L.letterCount;
  return (
    <KTLines
      layout={L}
      renderWord={(w) =>
        letters(L, w, (gi) => {
          const a = staggerStart(gi, N, 0.5, 0.07);
          const p = prog(u, a, a + 0.5, easeOut);
          return {
            transformOrigin: "50% 100%",
            transform: `perspective(5em) rotateX(${mix(p, -95, 0)}deg)`,
            opacity: p > 0.02 ? 1 : 0,
          };
        })
      }
    />
  );
};

// ---------------------------------------------------------------------------
// Tracking in: letters start far apart and slowly drift together — the
// movie-trailer look. Long lines start less spread out so they stay in frame.

const TRACK_END = 0.04; // settled letter-spacing, in em
const TRACK_START = 0.5;

export const TrackingIn: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 600, letterSpacing: TRACK_END });
  const { u } = useSettle();
  // How much extra spacing each line has room for before it would leave the frame.
  const room = L.lines.map((line, li) => {
    const chars = line.reduce((a, w) => a + w.letters.length, 0);
    return chars > 0 ? (L.width * 0.96 - L.lineWidths[li]) / (chars * L.fontSize) : TRACK_START;
  });
  const start = TRACK_END + Math.max(0, Math.min(TRACK_START, ...room));
  const k = prog(u, 0, 1, (x) => 1 - Math.pow(1 - x, 2));
  return (
    <KTLines
      layout={L}
      style={{ letterSpacing: `${mix(k, start, TRACK_END)}em`, opacity: prog(u, 0, 0.35) }}
      renderWord={(w) => <span style={{ ...inline, color: wordColor(L, w) }}>{w.text}</span>}
    />
  );
};

// ---------------------------------------------------------------------------
// Simple fade: the whole line fades in gently, with no other movement.

export const SimpleFade: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 800 });
  const { u } = useSettle();
  return (
    <KTLines
      layout={L}
      style={{ opacity: prog(u, 0, 1, easeOut) }}
      renderWord={(w) => <span style={{ ...inline, color: wordColor(L, w) }}>{w.text}</span>}
    />
  );
};

// ---------------------------------------------------------------------------
// Stomp: each word slams down from huge to its place, one per beat, and
// the line jolts on every impact. The key word slams in from even bigger.

const SLAM = 0.2; // how long one slam takes, in u

export const Stomp: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900 });
  const { u } = useSettle();
  const n = L.words.length;
  const startOf = (i: number) => staggerStart(i, n, SLAM, 0.18, 0.85);
  // A short jolt after every landing.
  let jolt = 0;
  for (let i = 0; i < n; i++) {
    const s = u - (startOf(i) + SLAM);
    if (s > 0 && s < 0.15) jolt += Math.sin(s * 120) * (L.words[i].isKey ? 0.06 : 0.025) * (1 - s / 0.15);
  }
  return (
    <KTLines
      layout={L}
      outerStyle={{ translate: `0px ${jolt * L.fontSize}px` }}
      renderWord={(w) => {
        const k = prog(u, startOf(w.index), startOf(w.index) + SLAM, (x) => x);
        const land = 1 - Math.pow(1 - k, 3);
        return (
          <span
            style={{
              ...inline,
              color: wordColor(L, w),
              opacity: k > 0 ? Math.min(1, k * 4) : 0,
              scale: `${1 + (1 - land) * (w.isKey ? 3.2 : 2.2)}`,
            }}
          >
            {w.text}
          </span>
        );
      }}
    />
  );
};
