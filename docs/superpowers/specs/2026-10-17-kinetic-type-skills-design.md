# Kinetic type skills: design

*Draft written 17 October 2026, from a conversation with Drico. It moves into the skills repo once that exists.*

## Intent and why

Drico (a former maths teacher who now makes educational video content, and is learning to code) noticed that when Claude is asked for kinetic typography, the result is almost always basic: words fade, slide or pop in. Claude reaches for the first few techniques that come to mind unless the wider range is put in front of it at that moment. A long research session produced a catalogue of 17 families and about 70 named techniques, plus two Remotion showcase videos demonstrating 77 of them. The goal now is to make that knowledge **show up automatically** whenever words appear in a video, and to give Drico a way to **direct** the typography of a video before it is built.

Two skills, shipped together:

1. **`kinetic-type`**: the reminder. Loads whenever Claude is about to put words on screen in a video. It holds the menu of techniques and the principles for choosing one. It reminds; it does not direct or force anything.
2. **`kinetic-type-director`**: the full process. When Drico asks for a kinetic-typography video, Claude writes a "type script" (a technique for every line, chosen for its meaning), shows it as an interactive HTML page where Drico can preview and swap styles, then builds the approved version in Remotion. It uses `kinetic-type`'s menu rather than keeping its own copy.

Plus one page:

3. **The gallery**: an HTML page that does what the two showcase videos do. It shows every technique with a live animated preview, its family, and a short explanation. It is a browsable, interactive version of the videos. Drico asked for it alongside the skills.

Skill 2 in the conversation is skill 1 here, and the reverse; this document uses the names above.

## Goals

- When words appear in any video Claude makes, Claude knowingly picks techniques from the full range, choosing by what the words mean, instead of defaulting to fade, slide and pop.
- Drico can see, compare and change the typography of every line before anything is rendered, without reading code.
- Drico can browse every technique visually in one page, the gallery, to learn and pick from.
- Both skills install on two Windows PCs (personal and work, with **different Claude accounts**) from one place, and stay in sync as Drico refines them.

## Non-goals

- Not a general video-editing or motion-graphics skill. It is about words on screen.
- `kinetic-type` does not add an approval step, a script page, or any workflow. That belongs to the director only.
- Version 1 assumes **typography-led videos**: the type is the main visual, like the two showcase videos. Videos where type only *supports* other visuals (diagrams, footage, characters) are a known later question, raised but not settled. `kinetic-type` still applies to them because it only reminds.
- No new technique research. The content comes from the existing catalogue and showcase code.

## Anti-goals (would make it a failure even if it works)

- **No readability rules.** Drico explicitly asked that the skills impose no reading-time or readability limits. (The catalogue's facts may stay in the reference file as information, but nothing in the skills tells Claude to enforce them.)
- **No forced variety.** Using many techniques is never the goal. The skill must not push Claude to show off the menu.
- **No Wolkskool or work content** anywhere in the repo. It is public. Sample scripts are generic, like the Pythagoras example.
- No dependence on files outside the repo, such as `Testing stuff/` paths. Each skill must work on a machine that has only the repo.

## Decided by Drico

**Creative freedom is a core value.** Drico values Claude's creative freedom "very, very much". Everything in both skills is written as **guidance and defaults, never rules**: the modes, house style and accents, and the menu. Claude may break any default when it judges that a moment calls for it, and should say why in the suggestion's reason. The skills exist to widen Claude's options, not to box them in. Drico keeps the final say through the page.

**Timing is estimated.** When a video has a voice-over, Claude estimates each line's timing. The recording is added later. No transcription or audio sync, and no audio on the page.

**Variety modes.**
- **Teaching mode** is the default (a default, not a cage), and is the right fit for educational content where viewers shouldn't be overwhelmed. One **house style** is used for every ordinary line, plus a **small set of accents** saved for moments that matter: a key term, the answer, a warning.
- **Free rein** applies when Drico says so, e.g. "be very creative" or "go wild". Claude may use anything from the full list, chosen by meaning. Freedom does not mean using many.
- The mode is stated in the request; if it isn't, assume teaching mode.

**House style choice.** Claude proposes three house-style candidates suited to the topic and tone, marks its first pick, and Drico chooses on the HTML page. Changing the house style updates every house line.

**The HTML type-script page** (skill 1). Drico likes the current mockup (`.superpowers/brainstorm/.../type-script-v4.html`) and will refine it through use. Version 1 should match it:
- A header with the title, the mode toggle (teaching / free rein) and "Reset to my suggestions".
- A player that plays the whole video in order, with a timeline strip of blocks (grey for house, orange for accent, width proportional to duration). Clicking a block jumps to that line.
- The three house-style cards, with live previews of the first line.
- One row per line:
  - number and start time
  - the line text, where clicking a word sets it as the key word
  - a preview that plays on hover and otherwise rests on its settled frame
  - a House or Accent chip
  - a Swap button
  - "+ note for Claude"
- The Swap panel shows "My suggestions for this line" first: house style plus Claude's picks, each with a one-line reason. Below that:
  - in teaching mode, other lesson-suitable accents
  - in free rein, everything, grouped into collapsible families
- A footer with a summary (house, accent count, number of changes), "Copy choices", and "Looks good: send to Claude", which shows a confirmation summary.
- Known fixes for version 1: the emphasised word crowds its neighbours in emphasis previews, and the slice preview looks odd when its line wraps.

**Previews are lookalikes.** The page uses quick JS/CSS imitations. The final video is built properly in Remotion.

**Distribution:** a **public** GitHub repo on Drico's personal account, holding both skills, installable on both PCs.

## How it works (the parts settled in conversation)

### `kinetic-type`
- **Trigger:** any time Claude is about to make words appear in a video: titles, captions, labels, formulas, key terms. This applies to Remotion and to other video work. The description must be written so it loads without Drico mentioning it.
- **Body:**
  - A short decision guide: choose per moment by meaning; the house style + accents default; free rein when asked.
  - An index of the 17 families. For each technique: a one-line look, a "reach for it when…" cue (e.g. slice → something splits or breaks), and a pointer to how it's built.
- **References** (opened only when needed): the full catalogue, plus Remotion recipes taken from the showcase code (`kinetic-typography/src/scenes` and `src/part2`), copied into the skill so it is self-contained.

### `kinetic-type-director`
1. **Gather** the script, aspect ratio and mode, and estimate each line's timing. There is no audio sync; any voice-over is added later.
2. **Draft the type script:**
   - three house candidates with reasons
   - for each line: a house or accent choice, a key word, and suggestions with one-line reasons
   - everything drawn from `kinetic-type`'s menu
3. **Generate the page:** copy the HTML template from the skill and inject the type-script data. Open it in the built-in browser pane as a local file; no server is needed.
4. **Read the choices.** Drico edits and says done. Claude reads the choices from the page (e.g. a `window.TYPE_SCRIPT_RESULT` object read through the browser pane). "Copy choices" plus paste is the fallback.
5. **Build** the approved type script in Remotion with the recipes, then preview and render as usual.

### The gallery
- One self-contained HTML page in the repo.
- All the techniques from the catalogue, grouped into the 17 families plus the original 11 basics. Each technique gets a live preview, a name, and a one-line "what it is / reach for it when", taken from the same menu as `kinetic-type`.
- **One shared preview library** powers both the gallery and the director's Swap panel, so a technique added once appears in both.
- Like the videos, it should help Drico *see* each technique, with clear navigation between families (Drico values findability over features).

## Constraints

- Windows; Claude Code desktop app with its built-in browser pane; Remotion 4.0.536 as used in the existing project.
- Poppins is the brand font where the choice is Drico's. The page may load fonts from Google Fonts, so it needs internet.
- Drico is learning to code: install and update steps must be a few copy-paste commands, explained plainly.

## Left to the builder

- The exact repo name and folder layout, and whether to package it as a Claude Code plugin marketplace (my recommendation, so each PC runs one "add" and one "install" command, and updates with one command) or as plain skill folders that get cloned. Verify the current plugin and marketplace format against Claude Code docs before building.
- How to split skill content between `SKILL.md` and reference files, keeping `SKILL.md` short.
- How many techniques get live previews on the page. Every technique offered in the Swap panel should have one, or a clear static card if a preview isn't practical.
- The data format injected into the HTML template.
- The licence. My suggestion is MIT.
- The gallery's layout and navigation (e.g. a family sidebar or index; hover vs always-playing previews), matching the calm look of the type-script page.

## Calls I made (not discussed with Drico; check these)

- Build `kinetic-type` first, then the director, because the director depends on it.
- Plugin packaging as the recommended install route.
- Skill names `kinetic-type` and `kinetic-type-director`.
- Recipes are copied from the showcase code into the repo rather than referenced.
- Default to teaching mode when the request doesn't say.
- The director opens the page as a local file instead of using the mockup server.
- The gallery is also published with GitHub Pages (free hosting for a public repo), so it opens as a link on any computer without downloading anything.
- The gallery and the director's page share one preview library.
- **Remotion recipes are a reusable component library**, not just notes. Each technique becomes a component that takes any text, key word, duration and size, so the final video matches what Drico approved on the page. Techniques that can't sensibly be made generic, such as illustrated in-footage scenes, stay as annotated example code.
- **The mode toggle on the page only widens or narrows the Swap list.** Claude drafts its picks for the mode named in the request. For a fresh free-rein draft, Drico asks Claude, and the page is regenerated.
- **Remotion is the only build target.** For other video work, `kinetic-type` still provides the menu and the choosing principles, but build pointers are Remotion-only.
