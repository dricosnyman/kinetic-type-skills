// Generates skills/kinetic-type/references/menu.md from skills/kinetic-type/assets/menu.js.
//   node scripts/build-menu.mjs           write menu.md
//   node scripts/build-menu.mjs --check   exit 1 if menu.md is out of date (writes nothing)
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { KT_MENU, KT_FAMILIES } = require(path.join(root, "skills/kinetic-type/assets/menu.js"));
const outFile = path.join(root, "skills/kinetic-type/references/menu.md");

const cell = (s) => String(s).replace(/\|/g, "\\|");

function nameCell(e) {
  const tags = [e.isNew && "✚ new", e.calm && "calm", e.teach && "teach", e.exit && "exit"].filter(Boolean);
  let s = `**${e.name}** \`${e.id}\``;
  if (tags.length) s += ` · ${tags.join(" · ")}`;
  if (e.aka.length) s += `<br>also: ${e.aka.join(", ")}`;
  return cell(s);
}

const buildCell = (e) => (e.build === "example" ? `example: \`${e.example}\`` : e.build);

export function renderMenu() {
  const out = [
    "# Technique menu",
    "",
    "<!-- GENERATED from assets/menu.js by scripts/build-menu.mjs. Edit menu.js, then re-run the script. -->",
    "",
    "Every technique, grouped into families. Each name is followed by its id (the key used in `KT_COMPONENTS` and in type scripts).",
    "",
    "- **calm**: a good house style, used for most lines.",
    "- **teach**: a suggested accent in teaching mode, for key terms, answers and warnings.",
    "- **exit**: the technique ends with the words gone, so it suits the end of a line or scene. The words are readable first, then destroyed by the last frame; zoom through a letter ends on a full frame of the accent colour.",
    "- **✚ new**: added after the showcase videos.",
    "- **build**: `component` = ready-made in `remotion/index.ts`; `example` = an annotated scene to adapt; `elsewhere` = needs After Effects or 3D software.",
    "",
  ];
  for (const f of KT_FAMILIES) {
    out.push(`## ${f.num} · ${f.name}`, "", f.gloss, "");
    out.push("| Name (aka) | Look | Reach for it when | Build |", "|---|---|---|---|");
    for (const e of KT_MENU.filter((m) => m.family === f.num)) {
      out.push(`| ${nameCell(e)} | ${cell(e.look)} | ${cell(e.reachFor)} | ${cell(buildCell(e))} |`);
    }
    out.push("");
  }
  return out.join("\n");
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const fresh = renderMenu();
  if (process.argv.includes("--check")) {
    const current = existsSync(outFile) ? readFileSync(outFile, "utf8").replace(/\r\n/g, "\n") : null;
    if (current !== fresh) {
      console.error("references/menu.md is out of date. Run: node scripts/build-menu.mjs");
      process.exit(1);
    }
    console.log("references/menu.md is up to date.");
  } else {
    writeFileSync(outFile, fresh);
    console.log(`Wrote ${path.relative(root, outFile)} (${KT_MENU.length} techniques in ${KT_FAMILIES.length} families).`);
  }
}
