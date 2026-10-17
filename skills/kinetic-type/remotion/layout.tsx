/**
 * Fitting any text into the frame, and finding the key word.
 *
 * Every component lays its text out the same way:
 *   1. wait until the font has loaded (measuring with a fallback font gives wrong sizes)
 *   2. measure each word, then pick the biggest font size at which the words,
 *      wrapped onto lines, fit inside the frame's text box
 *   3. render those exact lines, centred — so lines never re-wrap while animating
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, useVideoConfig } from "remotion";
import { measureText } from "@remotion/layout-utils";
import { C, bundledFontsLoaded, poppins } from "./kit";
import type { KTProps } from "./types";

// ---------- key word ----------

const PUNCTUATION = /[.,!?;:"'()“”‘’]/g;
const bare = (s: string) => s.replace(PUNCTUATION, "").toLocaleLowerCase();

/** True when `word` is the key word, ignoring punctuation and case. */
export const keyMatch = (word: string, key?: string): boolean =>
  !!key && bare(key).length > 0 && bare(word) === bare(key);

/** Index of the first word that matches the key word, or -1. */
export const findKeyIndex = (words: readonly string[], key?: string): number =>
  words.findIndex((w) => keyMatch(w, key));

// ---------- fonts ----------

const readyFonts = new Set<string>();

/** False until `weight` of `family` (and the bundled fonts) can be measured. Holds the render meanwhile. */
const useFontsReady = (family: string, weight: number): boolean => {
  const spec = `${weight} 100px ${family}`;
  const [ready, setReady] = useState(() => readyFonts.has(spec));
  const handle = useRef<number | null>(null);
  if (!ready && handle.current === null) handle.current = delayRender(`Loading font ${spec}`);

  useEffect(() => {
    if (ready) return;
    let live = true;
    const release = () => {
      if (handle.current !== null) continueRender(handle.current);
      handle.current = null;
    };
    const fontLoad = document.fonts.load(spec).catch(() => undefined);
    Promise.all([bundledFontsLoaded(), fontLoad])
      .catch(() => undefined)
      .then(() => {
        readyFonts.add(spec);
        if (live) setReady(true);
        release();
      });
    return () => {
      live = false;
      release();
    };
  }, [ready, spec]);

  return ready;
};

// ---------- layout ----------

export type LWord = {
  readonly text: string;
  readonly index: number; // position in the line of text
  readonly isKey: boolean;
  readonly scale: number; // size relative to the base font size
  readonly letters: readonly string[];
  readonly letterStart: number; // index of this word's first letter among all letters
};

export type KTLayout = {
  readonly ready: boolean;
  readonly fontSize: number;
  readonly fontFamily: string;
  readonly fontWeight: number;
  readonly color: string;
  readonly accent: string;
  readonly lineHeight: number;
  readonly words: readonly LWord[];
  readonly lines: readonly (readonly LWord[])[];
  readonly letterCount: number;
  readonly keyIndex: number;
  /** Width of the widest line in px, at the settled size. */
  readonly maxLineWidth: number;
  /** Width of each line in px, at the settled size. */
  readonly lineWidths: readonly number[];
  readonly width: number;
  readonly height: number;
};

export type LayoutOptions = {
  readonly fontWeight?: number;
  /** Used when the props don't give a font. */
  readonly defaultFamily?: string;
  /** Settled letter-spacing in em. */
  readonly letterSpacing?: number;
  /** Size of the key word relative to the others (layout leaves room for it). */
  readonly keyScale?: number;
  readonly lineHeight?: number;
  /** Fraction of the frame the text may use. */
  readonly boxWidth?: number;
  readonly boxHeight?: number;
};

/** Space between words, in em. */
export const WORD_GAP = 0.28;

export const useKTLayout = (props: KTProps, opts: LayoutOptions = {}): KTLayout => {
  const { width, height } = useVideoConfig();
  const fontWeight = opts.fontWeight ?? 800;
  const fontFamily = props.fontFamily ?? opts.defaultFamily ?? poppins;
  const letterSpacing = opts.letterSpacing ?? 0;
  const keyScale = opts.keyScale ?? 1;
  const lineHeight = opts.lineHeight ?? 1.15;
  const boxW = width * (opts.boxWidth ?? 0.86);
  const boxH = height * (opts.boxHeight ?? 0.72);
  // Default: big, sized from the frame width, capped so a 9:16 frame doesn't get a huge size either.
  const maxSize = props.fontSize ?? Math.min(width * 0.075, height * 0.16);
  const ready = useFontsReady(fontFamily, fontWeight);

  const base = useMemo(() => {
    const texts = props.text.split(/\s+/).filter((w) => w.length > 0);
    const keyIndex = findKeyIndex(texts, props.keyWord);
    let letterStart = 0;
    const words: LWord[] = texts.map((text, index) => {
      const letters = Array.from(text);
      const w = { text, index, isKey: index === keyIndex, scale: index === keyIndex ? keyScale : 1, letters, letterStart };
      letterStart += letters.length;
      return w;
    });
    return { words, keyIndex, letterCount: letterStart };
  }, [props.text, props.keyWord, keyScale]);

  const fitted = useMemo(() => {
    if (!ready || base.words.length === 0) {
      return { fontSize: maxSize, lines: [base.words], lineWidths: [0] };
    }
    // Width of each word at 100px (width grows in proportion to font size).
    const w100 = base.words.map(
      (w) =>
        measureText({
          text: w.text,
          fontFamily,
          fontSize: 100,
          fontWeight,
          letterSpacing: `${letterSpacing}em`,
        }).width * w.scale,
    );
    const wrap = (size: number) => {
      const k = size / 100;
      const gap = WORD_GAP * size;
      const lines: LWord[][] = [];
      const widths: number[] = [];
      let cur: LWord[] = [];
      let curW = 0;
      base.words.forEach((w, i) => {
        const ww = w100[i] * k;
        if (cur.length > 0 && curW + gap + ww > boxW) {
          lines.push(cur);
          widths.push(curW);
          cur = [];
          curW = 0;
        }
        curW += (cur.length > 0 ? gap : 0) + ww;
        cur.push(w);
      });
      lines.push(cur);
      widths.push(curW);
      const totalH = lines.reduce((a, l) => a + size * lineHeight * Math.max(...l.map((w) => w.scale)), 0);
      const fits = totalH <= boxH && widths.every((x) => x <= boxW);
      return { lines, widths, fits };
    };
    // Biggest size that fits (binary search).
    let lo = 4;
    let hi = maxSize;
    if (wrap(hi).fits) lo = hi;
    else {
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (wrap(mid).fits) lo = mid;
        else hi = mid;
      }
    }
    const size = Math.floor(lo * 10) / 10;
    const best = wrap(size);
    return { fontSize: size, lines: best.lines, lineWidths: best.widths };
  }, [ready, base, fontFamily, fontWeight, letterSpacing, lineHeight, boxW, boxH, maxSize]);

  return {
    ready,
    fontSize: fitted.fontSize,
    fontFamily,
    fontWeight,
    color: props.color ?? C.ink,
    accent: props.accent ?? C.orange,
    lineHeight,
    words: base.words,
    lines: fitted.lines,
    letterCount: base.letterCount,
    keyIndex: base.keyIndex,
    maxLineWidth: Math.max(0, ...fitted.lineWidths),
    lineWidths: fitted.lineWidths,
    width,
    height,
  };
};

// ---------- rendering ----------

type BlockProps = {
  layout: KTLayout;
  /** Draws one word. Words sit side by side in a line that never wraps. */
  renderWord: (w: LWord, lineIndex: number) => React.ReactNode;
  /** Extra style for the block holding all lines. */
  style?: React.CSSProperties;
  /** Extra style for one line. */
  lineStyle?: (lineIndex: number) => React.CSSProperties | undefined;
};

/** Renders the laid-out lines, centred in the frame. */
export const KTLines: React.FC<BlockProps & { outerStyle?: React.CSSProperties }> = ({ outerStyle, ...block }) => {
  if (!block.layout.ready) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", ...outerStyle }}>
      <KTBlock {...block} />
    </AbsoluteFill>
  );
};

/** The block of lines on its own (no centring frame), for components that place it themselves. */
export const KTBlock: React.FC<BlockProps> = ({ layout, renderWord, style, lineStyle }) => {
  if (!layout.ready) return null;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: layout.fontFamily,
        fontWeight: layout.fontWeight,
        fontSize: layout.fontSize,
        lineHeight: layout.lineHeight,
        color: layout.color,
        ...style,
      }}
    >
      {layout.lines.map((line, li) => (
        <div
          key={li}
          style={{
            display: "flex",
            flexWrap: "nowrap",
            justifyContent: "center",
            alignItems: "baseline",
            gap: `0 ${WORD_GAP}em`,
            whiteSpace: "pre",
            ...lineStyle?.(li),
          }}
        >
          {line.map((w) => (
            <React.Fragment key={w.index}>{renderWord(w, li)}</React.Fragment>
          ))}
        </div>
      ))}
    </div>
  );
};

/** Height of the block of lines in px, and the top of each line measured from the block's top. */
export const blockMetrics = (layout: KTLayout): { height: number; lineTops: number[]; lineHeights: number[] } => {
  const lineHeights = layout.lines.map(
    (l) => layout.fontSize * layout.lineHeight * Math.max(1, ...l.map((w) => w.scale)),
  );
  const lineTops: number[] = [];
  let y = 0;
  for (const h of lineHeights) {
    lineTops.push(y);
    y += h;
  }
  return { height: y, lineTops, lineHeights };
};

/** Colour of a word: accent for the key word, else the text colour. */
export const wordColor = (layout: KTLayout, w: LWord): string => (w.isKey ? layout.accent : layout.color);
