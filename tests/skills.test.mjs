import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(path.join(root, rel), "utf8");
const frontmatter = (md) => {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(m, "SKILL.md starts with a frontmatter block");
  return Object.fromEntries(
    m[1].split(/\r?\n/).map((l) => l.match(/^(\w+):\s*(.*)$/)).filter(Boolean).map((x) => [x[1], x[2]]),
  );
};

for (const name of ["kinetic-type", "kinetic-type-director"]) {
  test(`${name}: SKILL.md has its name and a description`, () => {
    const fm = frontmatter(read(`skills/${name}/SKILL.md`));
    assert.equal(fm.name, name);
    assert.ok(fm.description && fm.description.length > 40, "description is missing or too short");
  });

  test(`${name}: SKILL.md sets no reading-speed rules`, () => {
    assert.doesNotMatch(read(`skills/${name}/SKILL.md`), /words per second|reading time|readab|per minute|wpm/i);
  });
}

test("kinetic-type-director: every skill file the SKILL.md names exists", () => {
  const md = read("skills/kinetic-type-director/SKILL.md");
  // Paths written as `<skill>/...` or as a backticked `scripts|references|assets/...` belong to this skill
  // (kinetic-type's own files are named as "its `references/...`" and are skipped).
  const named = new Set([
    ...[...md.matchAll(/<skill>\/((?:scripts|references|assets)\/[\w./-]+)/g)].map((m) => m[1]),
    ...[...md.matchAll(/(?<!its )`((?:scripts|references|assets)\/[\w./-]+)`/g)].map((m) => m[1]),
  ]);
  for (const rel of ["scripts/make-page.mjs", "scripts/serve.mjs", "references/type-script-format.md"]) {
    assert.ok(named.has(rel), `SKILL.md should name ${rel}`);
  }
  for (const rel of named) assert.ok(existsSync(path.join(root, "skills/kinetic-type-director", rel)), `missing: ${rel}`);
});

test("kinetic-type-director: the SKILL.md covers the R10 safeguards", () => {
  const md = read("skills/kinetic-type-director/SKILL.md");
  assert.match(md, /TYPE_SCRIPT_RESULT/);
  assert.match(md, /approved/);
  assert.match(md, /same port/i);
  assert.match(md, /Copy choices/);
});
