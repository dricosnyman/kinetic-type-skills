/**
 * Family 11 — hand-made and analogue: visible human imperfection (paper,
 * collage, film grain, chalk).
 *
 * Every component renders any text, gives the key word the accent treatment,
 * and is settled by u = 1 (see useSettle in kit.ts). The ransom letters and
 * paper cards keep a small jitter, and the film keeps its grain and flicker,
 * after that: the imperfection is the technique.
 *
 * Faux film and chalk bring their own backdrop (a dark film frame, a
 * chalkboard). Faux film defaults to Georgia; chalk to Caveat, a handwriting
 * font loaded here.
 */
import React, { useId } from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { C, courier, easeInOut, easeOut, mix, poppins, pop, prog, staggerStart, useSettle } from "../kit";
import { KTLines, blockRect, useKTLayout } from "../layout";
import type { KTProps } from "../types";

/** Caveat: a chalky handwriting font. */
export const caveat = loadCaveat("normal", { weights: ["700"], subsets: ["latin", "latin-ext"] }).fontFamily;

const inline: React.CSSProperties = { display: "inline-block" };

/** A clean, unique id for SVG filters (React ids contain characters CSS url() dislikes). */
const useSvgId = (prefix: string) => `${prefix}-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

// ---------------------------------------------------------------------------
// Ransom-note collage: every letter is cut from a different magazine — its own
// font, size and paper colour — and pasted on one by one. The cut-outs keep
// jittering in place (a new pose every 3 frames). The key word's letters are
// all cut from accent-coloured paper.

const CUT_FONTS = [poppins, "Georgia, serif", courier, "Impact, sans-serif", caveat, "'Times New Roman', serif"];
const CUT_PAPERS = ["#FFFFFF", C.yellow, C.ink, "#BFE3DD", "#FFFFFF", "#E8D7FF", "#D9E4F5"];

export const RansomNoteCollage: React.FC<KTProps> = (props) => {
  // Room is left for the paper around each letter (letter spacing) and the size jumps.
  const L = useKTLayout(props, { fontWeight: 700, letterSpacing: 0.22, lineHeight: 1.4, boxWidth: 0.78, boxHeight: 0.66 });
  const { u } = useSettle();
  const frame = useCurrentFrame();
  const step = Math.floor(frame / 3);
  const N = L.letterCount;
  const settled = prog(u, 0.9, 1.2);
  return (
    <KTLines
      layout={L}
      renderWord={(w) => (
        <span style={{ ...inline, display: "inline-flex", alignItems: "center", gap: "0.04em" }}>
          {w.letters.map((ch, j) => {
            const gi = w.letterStart + j;
            const at = staggerStart(gi, N, 0.15, 0.06, 0.9);
            const paper = w.isKey ? L.accent : CUT_PAPERS[Math.floor(random(`kt-rn-bg${gi}`) * CUT_PAPERS.length)];
            const dark = paper === C.ink || w.isKey;
            // Big poses while pasting, small ones once settled.
            const wobble = mix(settled, 1, 0.45);
            return (
              <span
                key={j}
                style={{
                  ...inline,
                  fontFamily: CUT_FONTS[Math.floor(random(`kt-rn-f${gi}`) * CUT_FONTS.length)],
                  fontSize: `${0.86 + random(`kt-rn-s${gi}`) * 0.24}em`,
                  lineHeight: 1.1,
                  background: paper,
                  color: dark ? "#FFFFFF" : L.color,
                  padding: "0.02em 0.08em",
                  boxShadow: "0.03em 0.04em 0 rgba(0,0,0,0.15)",
                  rotate: `${((random(`kt-rn-r${gi}-${step}`) - 0.5) * 6 * wobble + (random(`kt-rn-r${gi}`) - 0.5) * 8).toFixed(2)}deg`,
                  translate: `0em ${((random(`kt-rn-y${gi}-${step}`) - 0.5) * 0.05 * wobble).toFixed(3)}em`,
                  opacity: u >= at ? 1 : 0,
                  scale: `${mix(pop(u, at, 0.15, 3), 1.3, 1)}`,
                }}
              >
                {ch}
              </span>
            );
          })}
        </span>
      )}
    />
  );
};

// ---------------------------------------------------------------------------
// Paper stop-motion: every letter is printed on its own paper card, and the
// cards hop in from the left at a choppy 8 frames a second (or more steps for
// a very short clip), each pose slightly off, like real stop motion. Once in
// place they keep a tiny hand-placed jitter. The key word is in the accent colour.

const CARD = "#FFFDF6";

export const PaperStopMotion: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900, letterSpacing: 0.3, lineHeight: 1.45, boxWidth: 0.8, boxHeight: 0.66 });
  const { t, settle } = useSettle();
  // Only a few poses a second: time moves in steps.
  const q = Math.min(1 / 8, settle / 6);
  const k = Math.floor(t / q);
  const uq = (k * q) / settle;
  const N = L.letterCount;
  return (
    <KTLines
      layout={L}
      renderWord={(w) => (
        <span style={{ ...inline, display: "inline-flex", gap: "0.08em" }}>
          {w.letters.map((ch, j) => {
            const gi = w.letterStart + j;
            const a = staggerStart(gi, N, 0.45, 0.06, 0.82);
            const p = prog(uq, a, a + 0.45, easeOut);
            const hop = Math.sin(p * Math.PI) * 0.7;
            const jx = (random(`kt-pm-x${gi}-${k}`) - 0.5) * 0.035;
            const jy = (random(`kt-pm-y${gi}-${k}`) - 0.5) * 0.035;
            return (
              <span
                key={j}
                style={{
                  ...inline,
                  background: CARD,
                  color: w.isKey ? L.accent : L.color,
                  padding: "0.05em 0.1em",
                  lineHeight: 1.15,
                  boxShadow: "0.04em 0.06em 0 rgba(0,0,0,0.12)",
                  clipPath: "polygon(1% 2%, 99% 0%, 100% 97%, 0% 100%)",
                  translate: `${(1 - p) * -3 + jx}em ${-hop + jy}em`,
                  rotate: `${((random(`kt-pm-r${gi}-${k}`) - 0.5) * 4 + (1 - p) * -30).toFixed(2)}deg`,
                  opacity: p > 0 ? 1 : 0,
                }}
              >
                {ch}
              </span>
            );
          })}
        </span>
      )}
    />
  );
};

// ---------------------------------------------------------------------------
// Faux film: old cinema. A dark, sepia film frame with grain, flicker, the odd
// scratch and dust speck, and a frame that wobbles (gate weave). Titles in a
// serif face, cream unless a colour is given; the key word is in the accent colour.

const FILM_FRAME = "#1A1712";
const FILM_CREAM = "#F1E6CF";

export const FauxFilm: React.FC<KTProps> = (props) => {
  const L = useKTLayout(
    { ...props, color: props.color ?? FILM_CREAM },
    { fontWeight: 700, defaultFamily: "Georgia, 'Times New Roman', serif", letterSpacing: 0.04, boxWidth: 0.74, boxHeight: 0.56 },
  );
  const { u } = useSettle();
  const frame = useCurrentFrame();
  const id = useSvgId("kt-film");
  if (!L.ready || L.words.length === 0) return null;
  const r = (k: string) => random(`kt-film-${k}-${frame}`);
  const fs = L.fontSize;
  const b = blockRect(L);
  const padX = 0.7 * fs;
  const padY = 0.7 * fs;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: b.left - padX,
          top: b.top - padY,
          width: b.w + 2 * padX,
          height: b.h + 2 * padY,
          background: FILM_FRAME,
          borderRadius: 0.12 * fs,
          overflow: "hidden",
          filter: `brightness(${(0.9 + r("b") * 0.2).toFixed(3)}) sepia(0.4)`,
          opacity: prog(u, 0, 0.15),
        }}
      >
        {/* scratches and dust */}
        {r("s1") < 0.5 ? (
          <div style={{ position: "absolute", left: `${r("sx") * 100}%`, top: 0, bottom: 0, width: 2, background: "rgba(255,255,255,0.35)" }} />
        ) : null}
        {r("s2") < 0.2 ? (
          <div
            style={{
              position: "absolute",
              left: `${r("dx") * 100}%`,
              top: `${r("dy") * 80}%`,
              width: 0.04 * fs,
              height: 0.04 * fs,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.7)",
            }}
          />
        ) : null}
      </div>
      <KTLines
        layout={L}
        outerStyle={{
          translate: `${((r("x") - 0.5) * 0.03 * fs).toFixed(2)}px ${((r("y") - 0.5) * 0.04 * fs).toFixed(2)}px`,
          opacity: prog(u, 0.1, 0.6) * (u < 0.6 ? 0.75 + r("o") * 0.25 : 1),
          filter: `sepia(0.4) brightness(${(0.92 + r("b") * 0.16).toFixed(3)})`,
        }}
        renderWord={(w) => <span style={{ ...inline, color: w.isKey ? L.accent : L.color }}>{w.text}</span>}
      />
      {/* grain and vignette over everything inside the frame */}
      <div
        style={{
          position: "absolute",
          left: b.left - padX,
          top: b.top - padY,
          width: b.w + 2 * padX,
          height: b.h + 2 * padY,
          borderRadius: 0.12 * fs,
          overflow: "hidden",
          opacity: prog(u, 0, 0.15),
        }}
      >
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", mixBlendMode: "overlay", opacity: 0.55 }}>
          <filter id={id}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 100} />
          </filter>
          <rect width="100%" height="100%" filter={`url(#${id})`} />
        </svg>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)" }} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Chalk: handwriting on a chalkboard. The strokes are grainy (noise punches
// holes in them) and wobble slightly, and each line writes itself on from left
// to right, one line after another. Chalk-white unless a colour is given; the
// key word is in yellow chalk, or the accent colour when one is given.

const BOARD = "#2F4A3A";
const FRAME_WOOD = "#8A5A36";
const CHALK = "#F5F5EE";

export const Chalk: React.FC<KTProps> = (props) => {
  const L = useKTLayout(
    { ...props, color: props.color ?? CHALK, accent: props.accent ?? C.yellow },
    { fontWeight: 700, defaultFamily: caveat, lineHeight: 1.2, boxWidth: 0.74, boxHeight: 0.58 },
  );
  const { u } = useSettle();
  const frame = useCurrentFrame();
  const id = useSvgId("kt-chalk");
  if (!L.ready || L.words.length === 0) return null;
  const fs = L.fontSize;
  const b = blockRect(L);
  const padX = 0.6 * fs;
  const padY = 0.5 * fs;
  const border = Math.max(6, 0.08 * fs);
  const n = L.lines.length;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: b.left - padX - border,
          top: b.top - padY - border,
          width: b.w + 2 * padX,
          height: b.h + 2 * padY,
          background: BOARD,
          border: `${border}px solid ${FRAME_WOOD}`,
          borderRadius: 0.1 * fs,
          opacity: prog(u, 0, 0.12),
        }}
      />
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={id} x="-5%" y="-10%" width="110%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={3} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -2.2 1.6" result="holes" />
          <feComposite in="SourceGraphic" in2="holes" operator="in" result="grainy" />
          <feTurbulence type="fractalNoise" baseFrequency={1.6 / fs} numOctaves={1} seed={Math.floor(frame / 5)} result="w" />
          <feDisplacementMap in="grainy" in2="w" scale={0.025 * fs} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <KTLines
        layout={L}
        style={{ filter: `url(#${id})` }}
        lineStyle={(li) => {
          const a = 0.05 + staggerStart(li, n, 0.6, 0.35, 0.9);
          const write = prog(u, a, a + 0.6, easeInOut);
          return { clipPath: `inset(-20% ${(100 - write * 100).toFixed(2)}% -20% -5%)` };
        }}
        renderWord={(w) => <span style={{ ...inline, color: w.isKey ? L.accent : L.color }}>{w.text}</span>}
      />
    </AbsoluteFill>
  );
};
