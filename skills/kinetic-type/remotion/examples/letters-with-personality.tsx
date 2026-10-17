/**
 * Example — letters with personality (family 16, text as character).
 *
 * WHAT IT SHOWS
 * A word that behaves like a character: every O becomes an eye that looks
 * left and right and blinks, the other letters breathe (squash a little), and
 * the whole word flinches — a quick jump — once. The last character is in the
 * accent colour (good for "!" or "?").
 *
 * HOW IT WORKS
 * - Each O is drawn as a ring (a bordered oval) with a pupil inside; the
 *   pupil's sideways shift is the "look", and squashing its height to a
 *   sliver is the blink.
 * - Everything is sized in em, so changing the font size scales the whole
 *   character.
 *
 * HOW TO ADAPT IT
 * - `text`: any short word with at least one O (e.g. "OOPS!", "NO!", "LOOK").
 *   Words without an O still breathe and flinch, but have no eyes; for other
 *   letters, draw the feature yourself (an A that opens like a mouth, an I
 *   that bows).
 * - Change BLINKS, LOOK_SPEED and FLINCH to time the acting to the narration
 *   (design seconds, DESIGN = 4).
 * - One character moment per video is plenty; it is a punchline, not a style.
 */
import React from "react";
import { C } from "../kit";
import { Canvas, useSceneTime } from "./scene";

export type LettersWithPersonalityProps = {
  readonly text?: string;
};

const DESIGN = 4; // design seconds
const BLINKS = [
  [1.6, 1.75],
  [2.9, 3.02],
];
const LOOK_SPEED = 2.2;
const FLINCH = [2.0, 2.5];

const Eye: React.FC<{ t: number; look: number }> = ({ t, look }) => {
  const blink = BLINKS.some(([a, b]) => t > a && t < b);
  return (
    <span style={{ position: "relative", display: "inline-flex", width: "0.6em", height: "0.78em", alignItems: "center", justifyContent: "center", margin: "0 0.02em" }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `0.16em solid ${C.ink}`, boxSizing: "border-box" }} />
      <span
        style={{
          width: "0.18em",
          height: blink ? "0.025em" : "0.18em",
          borderRadius: "0.09em",
          background: C.ink,
          translate: `${look * 0.056}em ${blink ? 0 : 0.024}em`,
        }}
      />
    </span>
  );
};

export const LettersWithPersonality: React.FC<LettersWithPersonalityProps> = ({ text = "OOPS!" }) => {
  const t = useSceneTime(DESIGN);
  const chars = Array.from(text);
  const fontSize = Math.min(250, 1500 / Math.max(1, chars.length * 0.65));
  const look = Math.sin(t * LOOK_SPEED) > 0 ? 1 : -1;
  const jump = t > FLINCH[0] && t < FLINCH[1] ? Math.sin(((t - FLINCH[0]) / (FLINCH[1] - FLINCH[0])) * Math.PI) * 0.24 : 0;
  const breathe = 1 - Math.max(0, Math.sin(t * 6)) * 0.08;
  return (
    <Canvas>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize,
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", translate: `0em ${-jump}em`, opacity: Math.min(1, t * 4) }}>
          {chars.map((ch, i) =>
            ch === "O" || ch === "o" ? (
              <Eye key={i} t={t} look={look} />
            ) : (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  whiteSpace: "pre",
                  color: i === chars.length - 1 ? C.orange : C.ink,
                  scale: `1 ${breathe}`,
                  transformOrigin: "50% 100%",
                }}
              >
                {ch}
              </span>
            ),
          )}
        </div>
      </div>
    </Canvas>
  );
};
