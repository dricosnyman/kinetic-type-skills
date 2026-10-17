/**
 * Family 5 — shape-shifting letters: the letter's own shape changes.
 *
 * Every component renders any text, gives the key word the accent treatment,
 * and is settled by u = 1 (see useSettle in kit.ts). Breathing keeps breathing
 * after that: the pulse is the technique.
 *
 * Breathing and width stretch need a variable font (one font file with sliders
 * for weight, width and slant), so they default to Roboto Flex, loaded here.
 * A font passed in must be a variable font with the same sliders.
 */
import React, { useId } from "react";
import { AbsoluteFill, interpolate, random } from "remotion";
import { loadVariableFont } from "@remotion/google-fonts/RobotoFlex";
import { measureText } from "@remotion/layout-utils";
import { clamp, easeInOut, easeOut, mix, prog, staggerStart, useSettle } from "../kit";
import { KTLayout, KTLines, LWord, useKTLayout, wordColor } from "../layout";
import type { KTProps } from "../types";

/** Roboto Flex: a variable font with weight (100–1000), width (25–151) and slant (0 to −10) sliders. */
export const flex = loadVariableFont("oblique 0deg 10deg", { subsets: ["latin", "latin-ext"] }).fontFamily;

const inline: React.CSSProperties = { display: "inline-block" };

/** A clean, unique id for SVG filters (React ids contain characters CSS url() dislikes). */
const useSvgId = (prefix: string) => `${prefix}-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

const letters = (L: KTLayout, w: LWord, style: (gi: number, j: number) => React.CSSProperties) => (
  <span style={{ ...inline, color: wordColor(L, w) }}>
    {w.letters.map((ch, j) => (
      <span key={j} style={{ ...inline, ...style(w.letterStart + j, j) }}>
        {ch}
      </span>
    ))}
  </span>
);

// ---------------------------------------------------------------------------
// Variable-font breathing: a wave of boldness ripples through the text as the
// font's weight slider moves — the letters pulse without moving. They arrive
// thin and swell to the wave; the key word breathes deeper, in the accent colour.

export const VariableFontBreathing: React.FC<KTProps> = (props) => {
  // Laid out at the boldest weight the wave reaches, so it never overflows.
  const L = useKTLayout(props, { fontWeight: 900, defaultFamily: flex, boxWidth: 0.84 });
  const { u, t } = useSettle();
  const N = L.letterCount;
  return (
    <KTLines
      layout={L}
      renderWord={(w) =>
        letters(L, w, (gi) => {
          const a = staggerStart(gi, N, 0.45, 0.03);
          const k = prog(u, a, a + 0.45, easeOut);
          const amp = w.isKey ? 280 : 200;
          const wave = 700 + amp * Math.sin(t * 3.2 - gi * 0.55);
          return { opacity: Math.min(1, k * 2), fontVariationSettings: `"wght" ${mix(k, 100, wave)}` };
        })
      }
    />
  );
};

// ---------------------------------------------------------------------------
// Width stretch / slant lean: the font's width slider squeezes the text thin,
// then stretches it wide, and the slant slider leans it forward as it settles —
// like it is running. The key word is in the accent colour.

const WIDE = 145; // widest width during the stretch (the font allows 25–151)
const REST_WIDTH = 125;

export const WidthStretch: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 800, defaultFamily: flex });
  const { u } = useSettle();
  if (!L.ready) return null;
  // The layout is measured at normal width; shrink it if the widest moment would overflow.
  const normal = measureText({ text: props.text, fontFamily: L.fontFamily, fontSize: 100, fontWeight: 800 }).width;
  const wide = measureText({
    text: props.text,
    fontFamily: L.fontFamily,
    fontSize: 100,
    fontWeight: 800,
    additionalStyles: { fontStretch: `${WIDE}%` },
  }).width;
  const grow = normal > 0 ? wide / normal : 1;
  const fit = Math.min(1, (0.92 * L.width) / Math.max(1, L.maxLineWidth * grow));
  const wdth = interpolate(u, [0, 0.3, 0.65, 0.95], [100, 30, WIDE, REST_WIDTH], { ...clamp, easing: easeInOut });
  const slnt = interpolate(u, [0.6, 0.95], [0, -10], { ...clamp, easing: easeInOut });
  return (
    <KTLines
      layout={L}
      style={{ fontSize: L.fontSize * fit, opacity: prog(u, 0, 0.15), fontVariationSettings: `"wght" 800, "wdth" ${wdth}, "slnt" ${slnt}` }}
      renderWord={(w) => <span style={{ ...inline, color: wordColor(L, w) }}>{w.text}</span>}
    />
  );
};

// ---------------------------------------------------------------------------
// Construction: every letter is built from four separate pieces (its four
// quarters) that fly in from different directions, spinning, and snap
// together. One piece of each letter flies in the accent colour.

const QUARTERS = ["inset(0 50% 50% 0)", "inset(0 0 50% 50%)", "inset(50% 50% 0 0)", "inset(50% 0 0 50%)"];

export const Construction: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900 });
  const { u } = useSettle();
  const N = L.letterCount;
  return (
    <KTLines
      layout={L}
      renderWord={(w) => (
        <span style={{ ...inline, color: wordColor(L, w) }}>
          {w.letters.map((ch, j) => {
            const gi = w.letterStart + j;
            const a = staggerStart(gi, N, 0.5, 0.05, 0.95);
            if (u >= a + 0.5) return <span key={j} style={inline}>{ch}</span>;
            return (
              <span key={j} style={{ ...inline, position: "relative" }}>
                <span style={{ visibility: "hidden" }}>{ch}</span>
                {QUARTERS.map((clip, q) => {
                  const k = prog(u, a + q * 0.06, a + 0.32 + q * 0.06, easeInOut);
                  const angle = random(`kt-con-a${gi}-${q}`) * Math.PI * 2;
                  const dist = (w.isKey ? 3 : 2) + random(`kt-con-d${gi}-${q}`) * 1.5;
                  const spin = (random(`kt-con-r${gi}-${q}`) - 0.5) * 400;
                  return (
                    <span
                      key={q}
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        clipPath: clip,
                        color: q === 0 ? L.accent : undefined,
                        opacity: k > 0 ? 1 : 0,
                        translate: `${(1 - k) * Math.cos(angle) * dist}em ${(1 - k) * Math.sin(angle) * dist}em`,
                        rotate: `${(1 - k) * spin}deg`,
                      }}
                    >
                      {ch}
                    </span>
                  );
                })}
              </span>
            );
          })}
        </span>
      )}
    />
  );
};

// ---------------------------------------------------------------------------
// Outline morph: each letter starts as a different character and melts into
// its real shape — the two shapes blur together under a hard "liquid" edge,
// so one outline flows into the other. Left to right; the key word is in the
// accent colour. (A true point-by-point morph needs the glyph outlines, which
// a component that takes any font cannot get; this is the code-only version.)

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";

/** A different character of the same kind to start from, or null for punctuation. */
const morphFrom = (ch: string, seed: string): string | null => {
  const set = UPPER.includes(ch) ? UPPER : LOWER.includes(ch) ? LOWER : DIGITS.includes(ch) ? DIGITS : null;
  if (!set) return null;
  const i = set.indexOf(ch);
  return set[(i + 3 + Math.floor(random(seed) * (set.length - 6))) % set.length];
};

export const OutlineMorph: React.FC<KTProps> = (props) => {
  const L = useKTLayout(props, { fontWeight: 900 });
  const { u } = useSettle();
  const id = useSvgId("kt-morph");
  const N = L.letterCount;
  const fs = L.fontSize;
  return (
    <AbsoluteFill style={{ opacity: prog(u, 0, 0.12) }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id={id}>
            <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 40 -18" />
          </filter>
        </defs>
      </svg>
      <KTLines
        layout={L}
        renderWord={(w) => (
          <span style={{ ...inline, color: wordColor(L, w) }}>
            {w.letters.map((ch, j) => {
              const gi = w.letterStart + j;
              const from = morphFrom(ch, `kt-morph${gi}`);
              const a = 0.1 + staggerStart(gi, N, 0.45, 0.05, 0.85);
              const m = prog(u, a, a + 0.45, easeInOut);
              if (!from || m >= 1) return <span key={j} style={inline}>{ch}</span>;
              const blur = Math.sin(m * Math.PI) * 0.07 * fs;
              const layer = (c: string, o: number): React.CSSProperties => ({
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                textAlign: "center",
                opacity: o,
                filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
              });
              return (
                <span key={j} style={{ ...inline, position: "relative", filter: m > 0 ? `url(#${id})` : undefined }}>
                  <span style={{ visibility: "hidden" }}>{ch}</span>
                  <span style={layer(from, 1 - m)}>{from}</span>
                  <span style={layer(ch, m)}>{ch}</span>
                </span>
              );
            })}
          </span>
        )}
      />
    </AbsoluteFill>
  );
};
