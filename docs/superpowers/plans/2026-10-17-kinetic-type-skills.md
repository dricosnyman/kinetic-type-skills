# Kinetic Type Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A public Claude Code plugin with two skills (`kinetic-type` reminder, `kinetic-type-director` process) and a gallery page. All three share one technique menu, one browser preview library and one Remotion component library.

**Architecture:**
- One menu file, `menu.js`, is the single source of truth for every technique (id, family, look, "reach for it when", how it's built).
- `previews.js` animates each technique in the browser. The gallery and the director's type-script page both use it.
- `remotion/` holds a component per technique, used to build the final video.
- The repo root is both the plugin root and a Remotion "lab" project for checking the components.

**Tech Stack:**
- Claude Code plugin and marketplace manifests
- Plain HTML, CSS and JS (no build step)
- Node `node:test`
- Remotion 4.0.536 with React 19 and TypeScript
- GitHub with GitHub Pages

**Spec:** `docs/superpowers/specs/2026-10-17-kinetic-type-skills-design.md`. Read it first. Moved into the repo in Task 1.

## Global Constraints

- Repo: **public** `github.com/dricosnyman/kinetic-type-skills`; local clone at `C:/Users/drico/Claude/Projects/kinetic-type-skills`; licence MIT.
- Names:
  - marketplace `kinetic-type-skills`
  - plugin `kinetic-type`
  - skills `kinetic-type` and `kinetic-type-director`
- Remotion packages pinned at exactly `4.0.536` (`remotion`, `@remotion/cli`, `@remotion/google-fonts`, `@remotion/transitions`, `@remotion/media`). Match `Testing stuff/kinetic-typography/package.json`.
- Windows. The only interactive surface is the Claude Code desktop app's built-in browser pane.
- **No Wolkskool or work content anywhere.** Sample scripts are generic (use the Pythagoras sample from the mockup).
- **No readability rules.** No skill text may tell Claude to enforce reading time, words per second or similar. Catalogue facts may stay in `references/catalogue.md` as information only.
- **Creative freedom:** every rule-like statement in both skills is phrased as a default or guidance that Claude may break with a stated reason.
- **Self-contained:** nothing references `Testing stuff/` paths at runtime. Content is copied in.
- Poppins is the default typeface. HTML pages may load Google Fonts, but must still work offline with fallback fonts.
- Timing in the director is Claude's estimate. No audio and no transcription.

## Review Focus

1. **Long lines** (20+ words): previews, page rows and Remotion components must wrap or shrink to fit, never overflow the frame. Tested in Tasks 5, 7 and 9.
2. **Key-word edge cases:**
   - the key word has punctuation attached ("secret.")
   - the key word appears twice
   - the line contains Afrikaans and maths characters (ê, ë, ô, ², "")
   - the key word is not in the line at all

   Matching strips punctuation, highlights the first match only, and the line still renders when the key is missing. Tested in Tasks 2 and 7.
3. **Very short lines** (under 1 second, e.g. 20 frames): components must reach a readable settled state, not freeze mid-entrance. Tested in Task 5.
4. **Page reloaded or reopened:** the director page keeps Drico's choices (localStorage keyed by title), and `window.TYPE_SCRIPT_RESULT` reflects them after reload. Tested in Task 9.
5. **Offline / no Google Fonts:** gallery and page render with fallback fonts and no console errors. Tested in Tasks 8 and 9.

---

## File structure

```
kinetic-type-skills/                       (repo root = marketplace root = plugin root = Remotion lab)
  .claude-plugin/marketplace.json          marketplace "kinetic-type-skills", one plugin, source "./"
  .claude-plugin/plugin.json               plugin "kinetic-type", MIT, version 1.0.0
  README.md                                what it is + install/update on a new PC (copy-paste commands)
  LICENSE  .gitignore  package.json  tsconfig.json  remotion.config.ts
  index.html                               the gallery (also the GitHub Pages home page)
  docs/superpowers/specs/…design.md        moved from Testing stuff
  docs/superpowers/plans/…skills.md        this plan, moved
  skills/kinetic-type/
    SKILL.md                               trigger description + how to choose (short)
    references/menu.md                     GENERATED from assets/menu.js
    references/catalogue.md                the research catalogue (copy of the report, ✚ additions included)
    assets/menu.js                         technique menu (single source of truth)
    assets/previews.js                     browser preview library
    remotion/kit.ts                        timing helpers (prog, pop, mix, useT, easings)
    remotion/types.ts                      KTProps
    remotion/families/f00-basics.tsx … f17-code.tsx   components, one file per family
    remotion/index.ts                      KT_COMPONENTS registry
    remotion/examples/*.tsx                scene-specific techniques kept as annotated examples
  skills/kinetic-type-director/
    SKILL.md                               the workflow
    references/type-script-format.md       data in / result out
    assets/type-script.html                page template (placeholders, no inlined libs)
    scripts/make-page.mjs                  template + data + inlined libs -> one self-contained HTML
  lab/index.ts  lab/Root.tsx               Remotion lab: renders every component (and edge cases)
  scripts/build-menu.mjs                   menu.js -> references/menu.md (and --check)
  tests/*.test.mjs                         node:test suites
  evals/…                                  trigger evals for both skills
```

## Shared interfaces (decided here; tasks reference them)

**Menu entry** (`skills/kinetic-type/assets/menu.js`). The file works both as a browser `<script>` (it sets `window.KT_MENU` and `window.KT_FAMILIES`) and as a CommonJS module (`module.exports = { KT_MENU, KT_FAMILIES }`).

```js
// KT_FAMILIES: [{ num: 0..17, name: string, gloss: string }]   0 = "The basics" (the original 11)
// KT_MENU entry:
{ id: "slice",                       // kebab-case of the name before any " / " (e.g. "Scramble / decode" -> "scramble",
                                     //  "Word-by-word reveal" -> "word-by-word-reveal"); unique
  name: "Slice / cut",
  aka: ["split text", "slit text"],
  family: 2,                         // 0..17
  calm: false,                       // true = suitable as a house style
  teach: true,                       // true = suggested as an accent in teaching mode (never also calm)
  look: "A line cuts the word; the halves slide apart.",
  reachFor: "Something splits, breaks or is divided.",
  build: "component" | "example" | "elsewhere",   // elsewhere = After Effects/3D; no code here
  example: "remotion/examples/in-footage.tsx",    // only when build === "example"
  isNew: false }                     // true for the four ✚ additions
```

Content: every technique demonstrated in the two showcase videos (`Testing stuff/kinetic-typography/src/scenes/*` = family 0; `src/part2/F01…F17` = families 1–17, 66 techniques), plus three entries the mockup uses: `fit-to-box` (family 13, `isNew: true`), `simple-fade` (family 1) and `marker-highlight` (family 0). Motion blur is a finishing touch, recorded in SKILL.md, not in the menu. KineTy goes in `catalogue.md` only.

**Preview library** (`skills/kinetic-type/assets/previews.js`, same dual export, `window.KT_PREVIEWS`):
- `KT_PREVIEWS[id] = { build(line) -> htmlString, tick(el, p, line) -> void, dark?: boolean, svg?: boolean, static?: boolean }`
- `line = { text: string, key: string }`; `p` = seconds into a 3.4 s loop.
- `KT.fit(box)` shrinks or wraps text to fit its box.
- `KT.keyMatch(word, key) -> boolean` strips `.,!?;:"'()` before comparing.

This is the generalised form of `TECH` in `.superpowers/brainstorm/1864-1792202278/content/type-script-v4.html`, which is the reference implementation to port.

**Remotion component** (`skills/kinetic-type/remotion/types.ts`):
```ts
export type KTProps = {
  readonly text: string;
  readonly keyWord?: string;
  readonly fontFamily?: string;   // default Poppins (loaded in kit.ts)
  readonly color?: string;        // default ink #1E1E24
  readonly accent?: string;       // default orange #F2643D
  readonly fontSize?: number;     // default fits the composition width
};
```
- Each component animates from frame 0 of its `<Sequence>` and settles within `min(1 s, 60% of the sequence)`.
- `remotion/index.ts` exports `KT_COMPONENTS: Record<string, React.FC<KTProps>>`, keyed by menu id. It contains every id with `build === "component"`.

**Type script data** (director). Injected into the page as `window.TYPE_SCRIPT`:
```js
{ title, mode: "teaching"|"free", aspect: "16:9"|"9:16"|"1:1",
  houseOptions: [{ id, why }] /* exactly 3, all calm */, house: id,
  lines: [{ t: seconds, dur: seconds, text, key, style: "house"|id, suggest: [{ id, why }] }] }
```
Result, read back from `window.TYPE_SCRIPT_RESULT` (also in localStorage `kt-type-script:<title>`):
```js
{ mode, house, lines: [{ text, key, style, note }] }
```

---

### Task 1: Repo, plugin manifests, publish

**Files:**
- Create: `.claude-plugin/marketplace.json`, `.claude-plugin/plugin.json`, `README.md`, `LICENSE` (MIT, "Drico Snyman"), `.gitignore` (`node_modules/`, `out/`, `evals/results/`), `package.json`, `tsconfig.json`, `remotion.config.ts`
- Move: the spec and this plan into `docs/superpowers/`

**Interfaces:** Produces the repo at the path in Global Constraints, `npm test` (= `node --test tests/`), and `npm run lab` (= `remotion studio lab/index.ts`).

- [ ] **Step 1:** Create the folder, run `git init`, and write the manifests. Model them on `~/.claude/plugins/marketplaces/quick-bar/.claude-plugin/marketplace.json` (source `"./"`, owner "Drico"). `package.json` pins the Remotion packages at `4.0.536` and adds `@remotion/google-fonts`, `@remotion/transitions` and `@remotion/media`. Copy `tsconfig.json` and `remotion.config.ts` from `Testing stuff/kinetic-typography`.
- [ ] **Step 2: Validate.** Run `claude plugin validate . --strict`. Expected: no errors.
- [ ] **Step 3: Write the README.** Cover: what it is (two skills and the gallery, with a link to the GitHub Pages URL), install on a new PC, and update. Use exactly these commands, each in its own `bash` block:
  - `claude plugin marketplace add dricosnyman/kinetic-type-skills`
  - `claude plugin install kinetic-type@kinetic-type-skills`
  - `claude plugin marketplace update kinetic-type-skills`
  - `claude plugin update kinetic-type@kinetic-type-skills`
  
  Add a one-line note that updates need a restart of Claude Code. Use plain language throughout.
- [ ] **Step 4: Install and commit.** Run `npm i`, then commit with "chore: plugin scaffold".
- [ ] **Step 5: Create the public repo and push.** **Confirm with Drico first** (it publishes publicly). Then run `gh repo create dricosnyman/kinetic-type-skills --public --source . --push`.

### Task 2: The menu (single source of truth)

**Files:**
- Create: `skills/kinetic-type/assets/menu.js`, `scripts/build-menu.mjs`, `skills/kinetic-type/references/menu.md` (generated)
- Test: `tests/menu.test.mjs`

**Interfaces:**
- Produces `KT_MENU` and `KT_FAMILIES` (shape above).
- Produces `node scripts/build-menu.mjs` (writes `menu.md`) and `node scripts/build-menu.mjs --check` (exit 1 if `menu.md` is stale).

- [ ] **Step 1: Write the failing test.** `tests/menu.test.mjs` asserts:
  - ids are unique and kebab-case
  - every entry has non-empty `name`, `look` and `reachFor`
  - `family` is an integer from 0 to 17
  - `KT_FAMILIES` has 18 entries, and every family has at least one technique
  - family counts are exactly:

    `{0:12, 1:6, 2:4, 3:3, 4:4, 5:4, 6:3, 7:5, 8:4, 9:4, 10:5, 11:4, 12:3, 13:5, 14:3, 15:3, 16:4, 17:4}`

    Family 0 is the 11 part-1 scenes plus `marker-highlight`; family 1 is 5 plus `simple-fade`; family 13 is 4 plus `fit-to-box`.
  - `build === "example"` implies `example` is set
  - the `calm: true` ids are exactly `word-by-word-reveal`, `masking-and-reveals`, `typewriter`, `cascade`, `tracking-in` and `simple-fade`
  - the `teach: true` ids include `emphasis-scaling`, `marker-highlight`, `stomp`, `stroke-write-on`, `slice` and `scramble`, and no entry is both `calm` and `teach`
  - exactly one entry has `isNew: true` (`fit-to-box`)
  - no `look` or `reachFor` text contains "words per second", "reading time" or "readab"
- [ ] **Step 2: Run it.** `npm test`. Expected: FAIL (module not found).
- [ ] **Step 3: Write `menu.js`.**
  - Draw the content from each scene's on-screen title, note, gloss, goodFor and limit in the showcase source files. `reachFor` is a short "use it when…" written in the voice of the scene's goodFor line.
  - Also add `physics-based` and `light-sweep` to the `teach` set, alongside the ids the test requires.
  - Set `build` to `"component"` unless the technique needs a drawn scene (in-footage, chat, search bar, type chart, letters with eyes, text-as-image mug, camera-move spiral, generative flow) → `"example"`.
- [ ] **Step 4: Write the menu generator.** `build-menu.mjs` writes `menu.md` as one section per family: heading, gloss, then a table of name (aka) | look | reach for it when | build.
- [ ] **Step 5: Add a staleness test.** Add to `menu.test.mjs` a test that spawns `node scripts/build-menu.mjs --check` and expects exit 0.
- [ ] **Step 6: Run it.** `npm test`. Expected: PASS.
- [ ] **Step 7: Commit.** "feat: technique menu".

### Task 3: `kinetic-type` SKILL.md, catalogue, trigger evals

**Files:**
- Create: `skills/kinetic-type/SKILL.md`, `skills/kinetic-type/references/catalogue.md`, `evals/kinetic-type/…`

**Interfaces:**
- Consumes `references/menu.md`.
- Produces the skill `kinetic-type` that the director loads.

- [ ] **Step 1: Write the failing evals.** Look up the current `case.yaml` format first (ask the `claude-code-guide` agent about `claude plugin eval`). Three cases:
  - **(a) should load:** "Make a 10-second Remotion intro that shows the title 'Fractions are friends'". Graded by the skill being loaded and by more than one menu technique being named in the plan or code.
  - **(b) should load:** "Add on-screen captions to my video about photosynthesis".
  - **(c) should not load:** "Fix the TypeScript error in my React login form".
- [ ] **Step 2: Run them.** `claude plugin eval . --runs 1`. Expected: (a) and (b) fail (the skill doesn't exist yet).
- [ ] **Step 3: Write `SKILL.md`, kept under ~120 lines.**
  - The frontmatter `description` triggers whenever words will appear on screen in a video: titles, captions, labels, formulas, key terms, lyric or kinetic typography, in Remotion or elsewhere.
  - Body:
    - why it exists (defaults are basic; choose from the full range)
    - choose per moment by what the words mean
    - **Creative freedom first:** these are defaults; break them with a stated reason
    - teaching default: one house style plus a few accents for key terms, answers and warnings. Free rein when asked ("be creative", "go wild"); freedom ≠ using many
    - motion blur on fast moves as a finishing touch
    - joined-up scripts (Arabic, Persian) break letter-level effects; check the font has the accents you need
    - how to use `references/menu.md`
    - how to build: copy `remotion/` into the project's `src/kinetic-type/`, use `KT_COMPONENTS[id]` inside `<Sequence>`s, required packages
    - gallery link
    - pointer to the director skill for a reviewed, line-by-line type script
  - No readability rules.
- [ ] **Step 4: Copy the catalogue.** `Testing stuff/reports/Kinetic typography techniques catalogue.md` → `references/catalogue.md`, unchanged apart from a one-line header saying it's background reading.
- [ ] **Step 5: Run the evals.** `claude plugin eval . --runs 3`. Expected: (a) and (b) load the skill in at least 2 of 3 runs, (c) in 0. If not, tighten the `description` and repeat.
- [ ] **Step 6: Commit.** "feat: kinetic-type reminder skill".

### Task 4: Remotion lab, kit, types, registry, family 0–1 components

**Files:**
- Create: `skills/kinetic-type/remotion/kit.ts`, `types.ts`, `index.ts`, `families/f00-basics.tsx`, `families/f01-choreography.tsx`, `lab/index.ts`, `lab/Root.tsx`
- Test: `tests/components.test.mjs`

**Interfaces:**
- Produces `KTProps` and `KT_COMPONENTS` (above).
- Produces `kit.ts` exports: `useT(): number`, `prog(t, a, b, easing?)`, `pop(t, at, dur?, overshoot?)`, `mix(p, a, b)`, `easeOut`, `easeInOut`, `easeIn`, `poppins`, `C` (palette).
- Produces lab compositions `Library` (every registered component in sequence, 2.5 s each, sample text plus the menu name as a caption) and `EdgeCases`.

- [ ] **Step 1: Write the failing test.** `tests/components.test.mjs` asserts that, for every menu id with `build === "component"`, `remotion/index.ts` contains the registry key `"<id>":`. It also asserts that every key in `index.ts` exists in the menu. Parse the keys with a regex over the file text.

  Until Tasks 5–6 are done, filter to families listed in an `IMPLEMENTED_FAMILIES` array at the top of the test, starting with `[0, 1]`. Task 6 removes the filter.
- [ ] **Step 2: Run it.** `npm test`. Expected: FAIL.
- [ ] **Step 3: Write `kit.ts`.** Port the helpers from `Testing stuff/kinetic-typography/src/common.tsx` (no `SceneShell`, no `Sfx`).
- [ ] **Step 4: Write the family 0–1 components.**
  - Port each technique from `src/scenes/S01–S11` and `src/part2/F01Choreography.tsx` into a `React.FC<KTProps>` that renders the given `text`.
  - The key word gets the accent treatment where the technique has one.
  - Scene-specific copy ("Gerald", "MONDAY") becomes props-driven.
  - Wrap and fit text with `@remotion/layout-utils` `fitText` (add the package at 4.0.536), or flex-wrap with a measured font size.
- [ ] **Step 5: Write the lab.**
  - `Library` composition: 1920×1080, 30 fps.
  - `EdgeCases` composition renders three components (`word-reveal`, `emphasis`, `slice`) with:
    - a 24-word line
    - the text "Gerald sê: nee! a² + b² = c²" with `keyWord` "nee"
    - a missing key word
    - a 20-frame sequence

    Use the ids `word-by-word-reveal`, `emphasis-scaling` and `slice`.
- [ ] **Step 6: Typecheck and test.** `npx tsc --noEmit && npm test`. Expected: PASS.
- [ ] **Step 7: Render and inspect.**
  - Render a contact sheet of `Library` with `npx remotion render lab/index.ts Library out/lib.mp4 --scale=0.25`, then `ffmpeg -i out/lib.mp4 -vf "fps=2,tile=6x6" -frames:v 1 out/lib.png`. Inspect it: every technique is visible and recognisable.
  - Render `EdgeCases` the same way: nothing overflows the frame, and the 20-frame clips end settled.
- [ ] **Step 8: Commit.** "feat: remotion kit and families 0–1".

### Task 5: Components for families 2–8

**Files:**
- Create: `skills/kinetic-type/remotion/families/f02-cuts.tsx` … `f08-elements.tsx`
- Modify: `remotion/index.ts`, `tests/components.test.mjs` (`IMPLEMENTED_FAMILIES` += 2–8), `lab/Root.tsx` (`EdgeCases` adds `scramble`, `liquid-fill` and `stroke-write-on`)

**Interfaces:** Consumes Task 4's kit, types and registry.

- [ ] **Step 1: Make the test fail.** Extend `IMPLEMENTED_FAMILIES`; run `npm test`. Expected: FAIL, listing the missing ids.
- [ ] **Step 2: Port the components.** Port from `src/part2/F02…F08` following Task 4's rules. Components that need text sampling (`useTextGrid`) keep a system font for sampling, as in the source.
- [ ] **Step 3: Typecheck, test and render.** Run `npx tsc --noEmit && npm test` (expected: PASS), then render the contact sheets for `Library` and `EdgeCases`. Expected: every new technique recognisable, nothing overflowing.
- [ ] **Step 4: Commit.** "feat: components for families 2–8".

### Task 6: Components for families 9–17, plus examples

**Files:**
- Create: `families/f09-surfaces.tsx` … `f17-code.tsx`, `remotion/examples/*.tsx` (one per `build: "example"` id, each a scene component with a header comment on how to adapt it)
- Modify: `remotion/index.ts`, `tests/components.test.mjs` (remove the `IMPLEMENTED_FAMILIES` filter; add an assertion that each `example` path exists), `lab/Root.tsx` (add an `Examples` composition)

- [ ] **Step 1: Make the test fail.** Remove the filter and add the example-path assertion. Run `npm test`. Expected: FAIL.
- [ ] **Step 2: Port the rest.** Port families 9–17 from `src/part2/F09…F17`. Add `fit-to-box`: the text fills a given box, with its size (and weight, via the Roboto Flex variable font) solved per frame as the box's size animates.
- [ ] **Step 3: Typecheck, test and render.** Run `npx tsc --noEmit && npm test` (expected: PASS), then render the contact sheets for `Library` and `Examples`.
- [ ] **Step 4: Commit.** "feat: components for families 9–17 and examples".

### Task 7: Browser preview library

**Files:**
- Create: `skills/kinetic-type/assets/previews.js`
- Test: `tests/previews.test.mjs`

**Interfaces:**
- Consumes `KT_MENU`.
- Produces `KT_PREVIEWS`, `KT.fit` and `KT.keyMatch` (above).

- [ ] **Step 1: Write the failing test.** `tests/previews.test.mjs` (Node, no DOM) asserts:
  - every menu id has a `KT_PREVIEWS` entry
  - every entry has `build` and `tick`, or `static: true`
  - `build({text:"Gerald sê: nee! a² + b² = c²", key:"nee"})` returns a string containing `sê` and `²`
  - `build({text:"x", key:"missing"})` does not throw
  - `KT.keyMatch("secret.", "secret") === true`
  - `KT.keyMatch("Secrets", "secret") === false`
- [ ] **Step 2: Run it.** `npm test`. Expected: FAIL.
- [ ] **Step 3: Write `previews.js`.**
  - Port `TECH` from `type-script-v4.html`, renaming its keys to the menu ids (`wordreveal` → `word-by-word-reveal`, `maskrise` → `masking-and-reveals`, `fadein` → `simple-fade`, `emphasis` → `emphasis-scaling`, `highlight` → `marker-highlight`, `writeon` → `stroke-write-on`, `drop` → `physics-based`, `sweep` → `light-sweep`, `neon` → `neon-sign`, `shred` → `shred`, `tracking` → `tracking-in`), and add the remaining ids by imitating each Remotion component's look in CSS/JS.
  - Use `static: true` only where a moving preview isn't practical. The gallery then shows the menu's `look` text in the preview box.
  - Fix the two known mockup bugs:
    - emphasis previews must reserve space for the enlarged word (scale it inside an inline-block with a matching width), so it can't overlap its neighbours
    - the slice must clip the whole wrapped block, not each line
  - Highlight only the first key-word match.
- [ ] **Step 4: Run it.** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit.** "feat: browser preview library".

### Task 8: The gallery (`index.html`) and GitHub Pages

**Files:**
- Create: `index.html`

**Interfaces:** Consumes `menu.js` and `previews.js` via `<script src="skills/kinetic-type/assets/…">`.

- [ ] **Step 1: Build the page.**
  - A calm look matching `type-script-v4.html` (palette, Poppins with system fallback).
  - A sticky sidebar listing families 0–17 with counts; clicking scrolls to the family.
  - A search box that filters by name, aka, look and reachFor.
  - Each family section shows its gloss, then a card grid. Each card has:
    - a hover-to-play preview
    - the name, with a "✚ new" badge when `isNew`
    - `look` and "Reach for it when: …"
    - a build badge: Remotion / example / After Effects
  - A header line links to the repo and explains "point at a preview to play it".
  - The sample text on each card defaults to the technique's name. A text box at the top lets Drico type his own line, which re-renders every preview.
- [ ] **Step 2: Verify in the browser pane.**
  - Open `file:///C:/Users/drico/Claude/Projects/kinetic-type-skills/index.html`.
  - `read_console_messages` shows no errors.
  - Run `document.querySelectorAll('.card').length` with `javascript_tool`. It must equal `KT_MENU.length`.
  - Typing "a² + b² = c² sê" in the text box updates every card.
  - Searching "slice" leaves 1 or more cards.
- [ ] **Step 3: Check it offline.** Block `fonts.googleapis.com` (or open the page with network disabled), reload, confirm there are no console errors, and take a screenshot.
- [ ] **Step 4: Commit, push and publish.** Commit with "feat: gallery". Push, then enable GitHub Pages from `main` / root with `gh api -X POST repos/dricosnyman/kinetic-type-skills/pages -f "source[branch]=main" -f "source[path]=/"`. Wait for the build, then open `https://dricosnyman.github.io/kinetic-type-skills/` in the browser pane. It must match the local page.

### Task 9: Director page template and `make-page.mjs`

**Files:**
- Create: `skills/kinetic-type-director/assets/type-script.html`, `skills/kinetic-type-director/scripts/make-page.mjs`, `skills/kinetic-type-director/references/type-script-format.md`
- Test: `tests/make-page.test.mjs`

**Interfaces:**
- Consumes `menu.js` and `previews.js`.
- Produces `node make-page.mjs <data.json> <out.html>`. It writes one self-contained HTML file with the menu, previews and data inlined, and no `<script src`. It exits 1 with a clear message if the data is invalid:
  - not exactly 3 `houseOptions`
  - an unknown technique id
  - a house option that isn't calm
  - lines missing `text`, `t` or `dur`

- [ ] **Step 1: Write the failing test.** `tests/make-page.test.mjs`, using the Pythagoras sample as the fixture `tests/fixtures/pythagoras.json`, asserts:
  - the output exists
  - it contains `window.TYPE_SCRIPT =` and the title
  - it contains no `<script src`
  - it contains `KT_PREVIEWS`
  - invalid fixtures (2 house options; unknown id `"sparkle-unicorn"`) exit 1 and print the reason
- [ ] **Step 2: Run it.** `npm test`. Expected: FAIL.
- [ ] **Step 3: Write the template and the script.**
  - The template has every feature listed in the spec's "HTML type-script page" section, in the layout of `type-script-v4.html`. The Swap panel's families come from `KT_FAMILIES`. Teaching mode lists the `teach: true` entries; free rein lists everything, grouped by family.
  - On every change, write `window.TYPE_SCRIPT_RESULT` and localStorage `kt-type-script:<title>`. On load, restore from localStorage if present.
  - "Looks good" sets `window.TYPE_SCRIPT_RESULT.approved = true` and shows the summary.
- [ ] **Step 4: Run it.** `npm test`. Expected: PASS.
- [ ] **Step 5: Test it in the browser pane.**
  - Generate the page from the fixture and open it as `file:///…`. Check: no console errors; the player plays; Swap opens; picking an option changes the chip.
  - Change one line's style and the house style, then reload the page. `window.TYPE_SCRIPT_RESULT` still holds both changes.
  - Use a fixture with a 24-word line: the row preview stays inside its box.
  - Offline check as in Task 8.
- [ ] **Step 6: Document the format.** `type-script-format.md` documents both shapes with the Pythagoras example.
- [ ] **Step 7: Commit.** "feat: director page".

### Task 10: `kinetic-type-director` SKILL.md and an end-to-end run

**Files:**
- Create: `skills/kinetic-type-director/SKILL.md`, `evals/kinetic-type-director/…`

- [ ] **Step 1: Write the failing evals.** Use the same format as Task 3.
  - Should load: "Make a kinetic typography video for this script: …" and "Direct the typography for my lesson video, I want to approve each line".
  - Should not load: "Add captions to my clip". That's `kinetic-type`'s job only.
- [ ] **Step 2: Run them.** Expected: the should-load cases fail.
- [ ] **Step 3: Write `SKILL.md`.**
  - Frontmatter: triggers when Drico asks for a kinetic-typography video, or asks to direct, approve or plan the typography line by line.
  - Body: the 5-step workflow from the spec:
    - load `kinetic-type` first
    - gather the script; estimate timings, with no audio
    - the mode defaults to teaching, but creative freedom is the value: suggestions may break the defaults with a reason
    - draft three calm house options and per-line suggestions with one-line reasons
    - write the data to the project's `type-script/<slug>.json`; run `make-page.mjs`; open the HTML with the built-in browser
    - tell Drico to say "done"
    - read `window.TYPE_SCRIPT_RESULT` with the browser's `javascript_tool` (fallback: ask Drico to paste "Copy choices")
    - build with `KT_COMPONENTS` in `<Sequence>`s at the estimated times
    - preview, then render only when asked
  - No readability rules.
- [ ] **Step 4: Run the evals.** Expected: loads in at least 2 of 3 runs for the should-load cases, 0 for the should-not case.
- [ ] **Step 5: End-to-end run.**
  - In a scratch Remotion project created with `npx create-video@4.0.536 --yes --blank --no-tailwind` in the scratchpad, run the director on the Pythagoras sample. Generate and open the page; change line 7 to `slice` and set line 1's key word to "hides"; read the result back; build; render.
  - Check: line 7 renders as a slice, line 1 highlights "hides", and the house style matches the page.
- [ ] **Step 6: Release.**
  - Commit with "feat: director skill"; push; run `claude plugin tag .`.
  - On this PC, install from GitHub with the README commands. In a **new** Claude Code session, confirm both skills appear under `/` and that prompt (a) from Task 3 loads `kinetic-type`.
