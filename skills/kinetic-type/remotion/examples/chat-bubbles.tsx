/**
 * Example — chat bubbles (family 16, text as interface).
 *
 * WHAT IT SHOWS
 * A text-message conversation. Messages pop in one after another; before each
 * reply, a bubble with three bouncing "typing…" dots appears first. Your own
 * messages are blue on the right, the other person's grey on the left.
 *
 * HOW IT WORKS
 * - Each message has a time; in the 0.7 s before it, a reply shows the typing
 *   bubble instead of the text, then the bubble pops (a springy scale from
 *   its tail corner) into the real message.
 * - The dots pulse with a sine wave, each a little behind the one before.
 *
 * HOW TO ADAPT IT
 * - `messages`: { me, text } in order; they are spread evenly over the
 *   sequence. For narration, give each an `at` (design seconds, DESIGN = 5).
 * - Up to about five short messages fit one screen; for more, scroll the
 *   column up as new ones arrive.
 * - App looks date quickly: keep it plain unless the video is about one app.
 */
import React from "react";
import { C, pop } from "../kit";
import { Canvas, useSceneTime } from "./scene";

export type ChatMessage = { readonly me: boolean; readonly text: string; readonly at?: number };

export type ChatBubblesProps = {
  readonly messages?: readonly ChatMessage[];
};

const DESIGN = 5; // design seconds
const TYPING = 0.7; // seconds of "typing…" before a reply

const DEFAULT_MESSAGES: ChatMessage[] = [
  { me: false, text: "Which side is the hypotenuse?" },
  { me: true, text: "The longest one." },
  { me: false, text: "And it's always opposite the right angle!" },
];

export const ChatBubbles: React.FC<ChatBubblesProps> = ({ messages = DEFAULT_MESSAGES }) => {
  const t = useSceneTime(DESIGN);
  const step = (DESIGN - 1.2) / Math.max(1, messages.length);
  return (
    <Canvas>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 1000, display: "flex", flexDirection: "column", gap: 22 }}>
          {messages.map((m, i) => {
            const at = m.at ?? 0.2 + i * step + (i > 0 ? TYPING : 0);
            if (t < at - (i > 0 ? TYPING : 0)) return null;
            const typing = i > 0 && t < at;
            const p = pop(t, at, 0.35, 2);
            return (
              <div key={i} style={{ display: "flex", justifyContent: m.me ? "flex-end" : "flex-start" }}>
                <div
                  style={{
                    maxWidth: 760,
                    background: m.me ? C.blue : "#E4DED2",
                    color: m.me ? "#FFFFFF" : C.ink,
                    fontSize: 50,
                    fontWeight: 600,
                    lineHeight: 1.3,
                    padding: "22px 36px",
                    borderRadius: 40,
                    borderBottomRightRadius: m.me ? 8 : 40,
                    borderBottomLeftRadius: m.me ? 40 : 8,
                    scale: typing ? "1" : `${p}`,
                    transformOrigin: m.me ? "100% 100%" : "0% 100%",
                  }}
                >
                  {typing ? (
                    <span style={{ letterSpacing: 8 }}>
                      {[0, 1, 2].map((d) => (
                        <span key={d} style={{ opacity: 0.35 + 0.65 * Math.max(0, Math.sin(t * 10 - d)) }}>
                          ●
                        </span>
                      ))}
                    </span>
                  ) : (
                    m.text
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Canvas>
  );
};
