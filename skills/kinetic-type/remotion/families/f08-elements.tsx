/**
 * Family 8 — elemental materials: letters made of, revealed by, or destroyed
 * into a substance (liquid, ink, water, smoke). These are code fakes;
 * convincing fire, smoke and water use real footage or simulation tools.
 *
 * Every component renders any text, gives the key word the accent treatment,
 * and is settled by u = 1 (see useSettle in kit.ts). The liquid's surface and
 * the water's ripples keep moving after that: the movement is the technique.
 * Smoke dissolve destroys the text, so it is an exit: readable first, then gone
 * by the last frame (useExit in kit.ts).
 */
import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, easeInOut, easeOut, mix, prog, staggerStart, useExit, useSettle } from "../kit";
import { KTBlock, KTLines, WORD_GAP, useKTLayout, wordBoxes, wordColor } from "../layout";
import type { KTProps } from "../types";

const inline: React.CSSProperties = { display: "inline-block" };

/** A clean, unique id for SVG filters (React ids contain characters CSS url() dislikes). */
const useSvgId = (prefix: string) => `${prefix}-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

// ---------------------------------------------------------------------------
// Liquid fill: the letters are outlines, and a wavy liquid surface rises inside
// them like water filling a glass. It fills them completely — or, if the text
// contains a percentage (like "75%"), only that far up the letters.
// The liquid is blue unless a colour is given; the key word fills with the accent colour.

const CAP = 0.72; // letter height used for percentages, in em

export const LiquidFill: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900 });
  const { u, t } = useSettle();
  const id = useSvgId("kt-liquid");
  if (!L.ready) return null;
  const fs = L.fontSize;
  const liquid = props.color ?? C.blue;
  const boxes = wordBoxes(L);
  const pct = /(\d{1,3}(?:[.,]\d+)?)\s?%/.exec(props.text);
  const target = pct ? Math.min(1, Math.max(0.05, parseFloat(pct[1].replace(",", ".")) / 100)) : null;
  const amp = 0.06 * fs;

  // One liquid surface per line, rising from below the letters.
  const surface = (li: number) => {
    const inLine = boxes.filter((wb) => wb.line === li);
    if (inLine.length === 0) return "";
    const baseline = inLine[0].baseline;
    const x0 = inLine[0].x - fs * 0.3;
    const x1 = inLine[inLine.length - 1].x + inLine[inLine.length - 1].w + fs * 0.3;
    const bottom = baseline + 0.32 * fs;
    const full = target === null ? baseline - 1.05 * fs - amp : baseline - target * CAP * fs;
    const a = staggerStart(li, L.lines.length, 0.75, 0.08, 0.95);
    const y0 = mix(prog(u, a + 0.05, a + 0.8, easeInOut), bottom + amp, full);
    let d = `M ${x0} ${bottom + amp} L ${x0} ${y0}`;
    for (let x = x0; x <= x1 + fs * 0.12; x += fs * 0.12) {
      d += ` L ${x} ${y0 + Math.sin(x / (0.42 * fs) + t * 6) * amp + Math.sin(x / (0.16 * fs) - t * 4) * amp * 0.4}`;
    }
    return `${d} L ${x1 + fs * 0.12} ${bottom + amp} Z`;
  };

  const texts = (isKey: boolean, style: React.SVGProps<SVGTextElement>) =>
    boxes
      .filter((wb) => wb.word.isKey === isKey)
      .map((wb) => (
        <text
          key={wb.word.index}
          x={wb.x}
          y={wb.baseline}
          fontFamily={L.fontFamily}
          fontWeight={L.fontWeight}
          fontSize={fs}
          {...style}
        >
          {wb.word.text}
        </text>
      ));
  const paths = L.lines.map((_, li) => surface(li));

  return (
    <AbsoluteFill style={{ opacity: prog(u, 0, 0.15) }}>
      <svg width={L.width} height={L.height}>
        <defs>
          <clipPath id={`${id}-w`}>{texts(false, {})}</clipPath>
          <clipPath id={`${id}-k`}>{texts(true, {})}</clipPath>
        </defs>
        <g clipPath={`url(#${id}-w)`}>
          {paths.map((d, i) => (
            <path key={i} d={d} fill={liquid} />
          ))}
        </g>
        <g clipPath={`url(#${id}-k)`}>
          {paths.map((d, i) => (
            <path key={i} d={d} fill={L.accent} />
          ))}
        </g>
        {texts(false, { fill: "none", stroke: liquid, strokeWidth: Math.max(1.5, fs * 0.022) })}
        {texts(true, { fill: "none", stroke: L.accent, strokeWidth: Math.max(1.5, fs * 0.022) })}
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Ink bleed: the text appears crisp, then its edges swell and roughen like ink
// soaking into paper, and stay that way. The key word bleeds more, in the accent colour.

export const InkBleed: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 600 });
  const { u } = useSettle();
  const id = useSvgId("kt-bleed");
  const fs = L.fontSize;
  const k = prog(u, 0.1, 1, easeOut);
  const filter = (suffix: string, spread: number, rough: number) => (
    <filter id={`${id}-${suffix}`} x="-20%" y="-20%" width="140%" height="140%">
      <feMorphology operator="dilate" radius={k * spread * fs} in="SourceGraphic" result="fat" />
      <feTurbulence type="fractalNoise" baseFrequency={12.6 / fs} numOctaves={3} seed={4} result="noise" />
      <feDisplacementMap in="fat" in2="noise" scale={mix(k, 0.01, rough) * fs} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  );
  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          {filter("w", 0.03, 0.1)}
          {filter("k", 0.045, 0.14)}
        </defs>
      </svg>
      <KTLines
        layout={L}
        outerStyle={{ opacity: prog(u, 0, 0.2) }}
        renderWord={(w) => (
          <span style={{ ...inline, color: wordColor(L, w), filter: `url(#${id}-${w.isKey ? "k" : "w"})` }}>{w.text}</span>
        )}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Water reflection: the text sits on a waterline, with a flipped, faded copy
// below it that ripples (a moving noise pattern shifts it about).

export const WaterReflection: React.FC<KTProps> = (props) => {
  // Half the usual height: the reflection needs the other half.
  const L = useKTLayout(props, { fontWeight: 800, boxHeight: 0.38 });
  const { u } = useSettle();
  const frame = useCurrentFrame();
  const id = useSvgId("kt-water");
  if (!L.ready) return null;
  const fs = L.fontSize;
  const renderWord = (w: (typeof L.words)[number]) => <span style={{ ...inline, color: wordColor(L, w) }}>{w.text}</span>;
  const rise = prog(u, 0, 0.5, easeOut);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id={id} x="-10%" y="-20%" width="120%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={`${1.9 / fs} ${17 / fs}`}
              numOctaves={2}
              seed={Math.floor(frame / 2)}
              result="n"
            />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={0.11 * fs} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <KTBlock layout={L} style={{ opacity: rise, translate: `0px ${(1 - rise) * -0.2 * fs}px` }} renderWord={renderWord} />
        <div
          style={{
            alignSelf: "stretch",
            height: Math.max(2, 0.025 * fs),
            margin: `${0.04 * fs}px -${WORD_GAP * fs}px`,
            background: L.color,
            opacity: 0.25 * prog(u, 0.1, 0.5),
          }}
        />
        <KTBlock
          layout={L}
          renderWord={renderWord}
          style={{
            scale: "1 -1",
            opacity: 0.35 * prog(u, 0.2, 0.8),
            filter: `url(#${id}) blur(${Math.max(0.5, fs * 0.006)}px)`,
            WebkitMaskImage: "linear-gradient(to top, #000 0%, transparent 90%)",
            maskImage: "linear-gradient(to top, #000 0%, transparent 90%)",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Smoke dissolve: the text holds, then word by word it swirls (a noise pattern
// pushes it about), blurs, spreads out and drifts up until it is gone.

export const SmokeDissolve: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 800, boxWidth: 0.8, boxHeight: 0.66 });
  const { u, out } = useExit(1.6, 0.55);
  const frame = useCurrentFrame();
  const id = useSvgId("kt-smoke");
  const fs = L.fontSize;
  const n = L.words.length;
  const seed = Math.floor(frame / 3) % 50;
  const smoke = (i: number) => {
    const a = staggerStart(i, n, 0.7, 0.12);
    return prog(out, a, a + 0.7, easeInOut);
  };
  return (
    <AbsoluteFill style={{ opacity: prog(u, 0, 0.3) }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          {out > 0
            ? L.words.map((w) => {
                const p = smoke(w.index);
                return (
                  <filter key={w.index} id={`${id}-${w.index}`} x="-60%" y="-120%" width="220%" height="340%">
                    <feTurbulence type="fractalNoise" baseFrequency={1.7 / fs} numOctaves={3} seed={seed + w.index} result="n" />
                    <feDisplacementMap in="SourceGraphic" in2="n" scale={p * 1.0 * fs} xChannelSelector="R" yChannelSelector="G" />
                    <feGaussianBlur stdDeviation={p * 0.07 * fs} />
                  </filter>
                );
              })
            : null}
        </defs>
      </svg>
      <KTLines
        layout={L}
        renderWord={(w) => {
          const p = out > 0 ? smoke(w.index) : 0;
          return (
            <span
              style={{
                ...inline,
                color: wordColor(L, w),
                filter: p > 0 ? `url(#${id}-${w.index})` : undefined,
                opacity: 1 - p,
                translate: `0px ${-p * 0.8 * fs}px`,
                letterSpacing: `${p * 0.15}em`,
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
