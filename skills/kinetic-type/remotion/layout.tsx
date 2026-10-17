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
export const useFontsReady = (family: string, weight: number): boolean => {
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
  /** Width of each word in px, at the settled size (key word scale included). */
  readonly wordWidths: readonly number[];
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
      return { fontSize: maxSize, lines: [base.words], lineWidths: [0], wordWidths: base.words.map(() => 0) };
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
    return { fontSize: size, lines: best.lines, lineWidths: best.widths, wordWidths: w100.map((x) => (x * size) / 100) };
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
    wordWidths: fitted.wordWidths,
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

// ---------- positions ----------
// For components that draw the text themselves (SVG, canvas) or aim at one
// spot in it. Positions are in px from the frame's top-left, for the block
// as KTLines centres it.

const metricsCache = new Map<string, { ascent: number; descent: number }>();

/** The font's ascent and descent in px at the layout's size (what CSS uses to place the baseline). */
export const fontMetrics = (L: KTLayout, sizeEm = 1): { ascent: number; descent: number } => {
  const size = L.fontSize * sizeEm;
  const spec = `${L.fontWeight} ${size}px ${L.fontFamily}`;
  const hit = metricsCache.get(spec);
  if (hit) return hit;
  const ctx = document.createElement("canvas").getContext("2d");
  let m = { ascent: size * 0.95, descent: size * 0.3 };
  if (ctx) {
    ctx.font = spec;
    const t = ctx.measureText("Hgy");
    if (t.fontBoundingBoxAscent !== undefined) m = { ascent: t.fontBoundingBoxAscent, descent: t.fontBoundingBoxDescent };
  }
  metricsCache.set(spec, m);
  return m;
};

export type WordBox = {
  readonly word: LWord;
  readonly line: number;
  /** Left edge and width of the word. */
  readonly x: number;
  readonly w: number;
  /** Top and height of its line. */
  readonly top: number;
  readonly h: number;
  /** The baseline the letters sit on. */
  readonly baseline: number;
  /** Middle of the word (horizontally) and of its line (vertically). */
  readonly cx: number;
  readonly cy: number;
};

/** The block's edges and size in px. */
export const blockRect = (L: KTLayout) => {
  const { height } = blockMetrics(L);
  const left = (L.width - L.maxLineWidth) / 2;
  const top = (L.height - height) / 2;
  return { left, top, right: left + L.maxLineWidth, bottom: top + height, w: L.maxLineWidth, h: height };
};

/** Where every word sits, in px from the frame's top-left. */
export const wordBoxes = (L: KTLayout): WordBox[] => {
  const { height: blockH, lineTops, lineHeights } = blockMetrics(L);
  const top0 = (L.height - blockH) / 2;
  const gap = WORD_GAP * L.fontSize;
  const { ascent, descent } = fontMetrics(L);
  const boxes: WordBox[] = [];
  L.lines.forEach((line, li) => {
    let x = (L.width - L.lineWidths[li]) / 2;
    const top = top0 + lineTops[li];
    const h = lineHeights[li];
    const baseline = top + (h - (ascent + descent)) / 2 + ascent;
    line.forEach((word) => {
      const w = L.wordWidths[word.index];
      boxes.push({ word, line: li, x, w, top, h, baseline, cx: x + w / 2, cy: top + h / 2 });
      x += w + gap;
    });
  });
  return boxes;
};

/** Width of each letter of a word in px, measured one by one (as letters in separate spans are drawn). */
export const letterWidths = (L: KTLayout, w: LWord): number[] =>
  w.letters.map(
    (ch) =>
      measureText({ text: ch, fontFamily: L.fontFamily, fontSize: L.fontSize * w.scale, fontWeight: L.fontWeight }).width,
  );

// ---------- ink sampling ----------
// For components that rebuild the text out of cells (dots, pixels, characters):
// the laid-out text is drawn on a hidden canvas, exactly where KTLines puts it,
// and each cell of a grid over the block records how much of it is ink.

export type InkCells = {
  /** Top-left of the grid in frame px. */
  readonly x0: number;
  readonly y0: number;
  readonly cols: number;
  readonly rows: number;
  readonly cellW: number;
  readonly cellH: number;
  /** Ink cover of each cell, 0 (empty) to 1 (full), row by row. */
  readonly ink: Float32Array;
  /** 1 where most of the cell's ink belongs to the key word. */
  readonly key: Uint8Array;
};

const inkCache = new Map<string, InkCells>();

/**
 * A grid of cells over the text block (plus `pad` em of margin on every side),
 * cellW × cellH px each, with the ink cover of every cell. Cached.
 */
export const inkCells = (L: KTLayout, cellW: number, cellH = cellW, pad = 0.2): InkCells => {
  const boxes = wordBoxes(L);
  const cacheKey = [
    L.fontWeight,
    L.fontSize,
    L.fontFamily,
    L.width,
    L.height,
    cellW.toFixed(2),
    cellH.toFixed(2),
    pad,
    ...boxes.map((b) => `${b.word.text}|${b.word.isKey}|${b.x.toFixed(1)}|${b.baseline.toFixed(1)}`),
  ].join("#");
  const hit = inkCache.get(cacheKey);
  if (hit) return hit;

  const b = blockRect(L);
  const m = pad * L.fontSize;
  const cols = Math.max(0, Math.ceil((b.w + 2 * m) / cellW));
  const rows = Math.max(0, Math.ceil((b.h + 2 * m) / cellH));
  const x0 = b.left + b.w / 2 - (cols * cellW) / 2;
  const y0 = b.top + b.h / 2 - (rows * cellH) / 2;
  const ink = new Float32Array(cols * rows);
  const key = new Uint8Array(cols * rows);
  const result = { x0, y0, cols, rows, cellW, cellH, ink, key };
  const W = Math.ceil(cols * cellW);
  const H = Math.ceil(rows * cellH);
  const ctx = W > 0 && H > 0 ? document.createElement("canvas").getContext("2d", { willReadFrequently: true }) : null;
  if (!ctx) {
    inkCache.set(cacheKey, result);
    return result;
  }
  ctx.canvas.width = W;
  ctx.canvas.height = H;
  ctx.font = `${L.fontWeight} ${L.fontSize}px ${L.fontFamily}`;
  ctx.textBaseline = "alphabetic";
  // Red marks ink; green marks the key word's ink.
  for (const wb of boxes) {
    ctx.font = `${L.fontWeight} ${L.fontSize * wb.word.scale}px ${L.fontFamily}`;
    ctx.fillStyle = wb.word.isKey ? "#ffff00" : "#ff0000";
    ctx.fillText(wb.word.text, wb.x - x0, wb.baseline - y0);
  }
  const data = ctx.getImageData(0, 0, W, H).data;
  // A 4 × 4 sample of each cell is plenty.
  const sx = Math.max(1, cellW / 4);
  const sy = Math.max(1, cellH / 4);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let red = 0;
      let green = 0;
      let n = 0;
      for (let y = r * cellH + sy / 2; y < (r + 1) * cellH; y += sy) {
        for (let x = c * cellW + sx / 2; x < (c + 1) * cellW; x += sx) {
          const i = (Math.floor(y) * W + Math.floor(x)) * 4;
          red += data[i];
          green += data[i + 1];
          n++;
        }
      }
      const i = r * cols + c;
      ink[i] = n > 0 ? red / (n * 255) : 0;
      key[i] = green > red / 2 && red > 0 ? 1 : 0;
    }
  }
  inkCache.set(cacheKey, result);
  return result;
};

/** The biggest square cell no smaller than `minCell` px that keeps the grid over the block (with `pad` em margin) under `maxCells` cells. */
export const cellForBudget = (L: KTLayout, maxCells: number, minCell: number, pad = 0.2): number => {
  const b = blockRect(L);
  const m = pad * L.fontSize;
  const area = Math.max(1, (b.w + 2 * m) * (b.h + 2 * m));
  return Math.max(minCell, Math.sqrt(area / maxCells));
};
