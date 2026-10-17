/**
 * The lab: compositions for checking the technique components.
 *   Library    every registered component in turn, 2.5 s each, with its menu name as a caption
 *   EdgeCases  a few components under stress: a 24-word line, Afrikaans and maths
 *              characters, a missing key word, and a 20-frame clip
 *   Examples   every annotated example scene (remotion/examples/) in turn, with its defaults
 */
import React from "react";
import { AbsoluteFill, Composition, Sequence } from "remotion";
import { KT_MENU } from "../skills/kinetic-type/assets/menu.js";
import { KT_COMPONENTS } from "../skills/kinetic-type/remotion";
import { C, poppins } from "../skills/kinetic-type/remotion/kit";
import { CameraMoveTypography } from "../skills/kinetic-type/remotion/examples/camera-move-typography";
import { ChartMadeOfType } from "../skills/kinetic-type/remotion/examples/chart-made-of-type";
import { ChatBubbles } from "../skills/kinetic-type/remotion/examples/chat-bubbles";
import { GenerativeFlow } from "../skills/kinetic-type/remotion/examples/generative-flow";
import { LabelsInTheScene } from "../skills/kinetic-type/remotion/examples/labels-in-the-scene";
import { LettersWithPersonality } from "../skills/kinetic-type/remotion/examples/letters-with-personality";
import { MatchMovedTitle } from "../skills/kinetic-type/remotion/examples/match-moved-title";
import { SearchBarTyping } from "../skills/kinetic-type/remotion/examples/search-bar-typing";
import { TextAsImage } from "../skills/kinetic-type/remotion/examples/text-as-image";
import { TextBehindSubject } from "../skills/kinetic-type/remotion/examples/text-behind-subject";

const FPS = 30;
const W = 1920;
const H = 1080;

const nameOf = (id: string) => KT_MENU.find((e) => e.id === id)?.name ?? id;

// The Pythagoras sample script.
const SAMPLES = [
  { text: "Every right-angled triangle hides a secret.", keyWord: "secret" },
  { text: "The longest side is the hypotenuse.", keyWord: "hypotenuse" },
  { text: "But ONLY for right angles.", keyWord: "ONLY" },
];

const Caption: React.FC<{ title: string; note: string }> = ({ title, note }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 40,
      display: "flex",
      justifyContent: "center",
    }}
  >
    {/* A paper backing keeps the caption readable over techniques that darken the frame. */}
    <div
      style={{
        textAlign: "center",
        fontFamily: poppins,
        color: C.muted,
        background: C.paper,
        borderRadius: 16,
        padding: "6px 24px",
      }}
    >
      <div style={{ fontSize: 34, fontWeight: 800, color: C.ink }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 400 }}>{note}</div>
    </div>
  </div>
);

// ---------- Library ----------

const LIB_EACH = Math.round(2.5 * FPS);
const LIB_IDS = Object.keys(KT_COMPONENTS);

const Library: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.paper }}>
    {LIB_IDS.map((id, i) => {
      const Comp = KT_COMPONENTS[id];
      const sample = SAMPLES[i % SAMPLES.length];
      return (
        <Sequence key={id} name={id} from={i * LIB_EACH} durationInFrames={LIB_EACH}>
          <Comp {...sample} />
          <Caption title={nameOf(id)} note={`${id} · key word: ${sample.keyWord}`} />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);

// ---------- Edge cases ----------

const EDGE_IDS = ["word-by-word-reveal", "emphasis-scaling", "slice", "scramble", "liquid-fill", "stroke-write-on"];

const EDGE_CASES: { label: string; text: string; keyWord?: string; frames: number }[] = [
  {
    label: "24-word line",
    text: "Square the two short sides, add them together, and you get the longest side squared, which is the secret every right-angled triangle always hides.",
    keyWord: "secret",
    frames: 60,
  },
  { label: "Afrikaans and maths, key word 'nee'", text: "Gerald sê: nee! a² + b² = c²", keyWord: "nee", frames: 60 },
  { label: "key word missing from the line", text: "Every right-angled triangle hides a secret.", keyWord: "banana", frames: 60 },
  { label: "20-frame clip", text: "The longest side is the hypotenuse.", keyWord: "hypotenuse", frames: 20 },
];
const EDGE_EACH = EDGE_CASES.reduce((a, c) => a + c.frames, 0);

const EdgeCases: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      {EDGE_IDS.flatMap((id) =>
        EDGE_CASES.map((c) => {
          const Comp = KT_COMPONENTS[id];
          const start = from;
          from += c.frames;
          return (
            <Sequence key={`${id}-${c.label}`} name={`${id}: ${c.label}`} from={start} durationInFrames={c.frames}>
              <Comp text={c.text} keyWord={c.keyWord} />
              <Caption title={nameOf(id)} note={c.label} />
            </Sequence>
          );
        }),
      )}
    </AbsoluteFill>
  );
};

// ---------- Examples ----------

const EXAMPLES: { id: string; Comp: React.FC; seconds: number }[] = [
  { id: "camera-move-typography", Comp: CameraMoveTypography, seconds: 10 },
  { id: "text-as-image", Comp: TextAsImage, seconds: 8 },
  { id: "match-moved-title", Comp: MatchMovedTitle, seconds: 4 },
  { id: "text-behind-subject", Comp: TextBehindSubject, seconds: 4 },
  { id: "labels-in-the-scene", Comp: LabelsInTheScene, seconds: 4 },
  { id: "letters-with-personality", Comp: LettersWithPersonality, seconds: 4 },
  { id: "chart-made-of-type", Comp: ChartMadeOfType, seconds: 4 },
  { id: "chat-bubbles", Comp: ChatBubbles, seconds: 5 },
  { id: "search-bar-typing", Comp: SearchBarTyping, seconds: 4 },
  { id: "generative-flow", Comp: GenerativeFlow, seconds: 4 },
];
const EXAMPLES_FRAMES = EXAMPLES.reduce((a, e) => a + e.seconds * FPS, 0);

const Examples: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      {EXAMPLES.map(({ id, Comp, seconds }) => {
        const start = from;
        from += seconds * FPS;
        return (
          <Sequence key={id} name={id} from={start} durationInFrames={seconds * FPS}>
            <Comp />
            <Caption title={nameOf(id)} note={`examples/${id}.tsx`} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const Root: React.FC = () => (
  <>
    <Composition id="Library" component={Library} durationInFrames={LIB_IDS.length * LIB_EACH} fps={FPS} width={W} height={H} />
    <Composition id="EdgeCases" component={EdgeCases} durationInFrames={EDGE_IDS.length * EDGE_EACH} fps={FPS} width={W} height={H} />
    <Composition id="Examples" component={Examples} durationInFrames={EXAMPLES_FRAMES} fps={FPS} width={W} height={H} />
  </>
);
