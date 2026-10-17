/**
 * Example — search-bar typing (family 16, text as interface).
 *
 * WHAT IT SHOWS
 * A search box types a question one letter at a time, with a blinking cursor,
 * then a list of suggestions drops down under it — each one the question plus
 * an ending in bold. A good way to open with "what people ask".
 *
 * HOW IT WORKS
 * - The typed text is the query cut off at a letter count that grows with
 *   time (steady typing; add pauses by making the count grow in steps).
 * - The suggestion panel fades and slides down once typing is done.
 *
 * HOW TO ADAPT IT
 * - `query` and `suggestions` (the endings shown in bold). Keep the query
 *   short enough for one line (about 40 characters at this size).
 * - Change the timing in design seconds (DESIGN = 4): typing runs from
 *   TYPE_FROM to TYPE_TO, the suggestions appear after.
 */
import React from "react";
import { C, mix, prog } from "../kit";
import { Canvas, useSceneTime } from "./scene";

export type SearchBarTypingProps = {
  readonly query?: string;
  readonly suggestions?: readonly string[];
};

const DESIGN = 4; // design seconds
const TYPE_FROM = 0.3;
const TYPE_TO = 2.2;

export const SearchBarTyping: React.FC<SearchBarTypingProps> = ({
  query = "why is the hypotenuse the longest side",
  suggestions = ["…of a right triangle", "…proof", "…for kids"],
}) => {
  const t = useSceneTime(DESIGN);
  const letters = Array.from(query);
  const n = Math.floor(mix(prog(t, TYPE_FROM, TYPE_TO, (v) => v), 0, letters.length));
  const sug = prog(t, TYPE_TO + 0.1, TYPE_TO + 0.5);
  return (
    <Canvas>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 1300 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              background: "#FFFFFF",
              borderRadius: 60,
              padding: "26px 44px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
              fontSize: 50,
              whiteSpace: "pre",
            }}
          >
            <span style={{ color: C.muted }}>⌕</span>
            <span>
              {letters.slice(0, n).join("")}
              <span style={{ opacity: Math.floor(t * 3) % 2 ? 0 : 1, color: C.blue }}>|</span>
            </span>
          </div>
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 30,
              marginTop: 14,
              padding: "10px 44px",
              opacity: sug,
              translate: `0px ${(1 - sug) * -20}px`,
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            }}
          >
            {suggestions.map((s) => (
              <div key={s} style={{ fontSize: 40, padding: "12px 0", color: C.muted }}>
                {query} <b style={{ color: C.ink }}>{s}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Canvas>
  );
};
