import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "skills/kinetic-type-director/scripts/make-page.mjs");
const fixture = path.join(root, "tests/fixtures/pythagoras.json");
const pythagoras = JSON.parse(fs.readFileSync(fixture, "utf8"));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kt-make-page-"));

/** Runs make-page.mjs from a different working directory, so paths can't lean on cwd. */
function run(dataPath, outPath) {
  return spawnSync(process.execPath, [script, dataPath, outPath], { encoding: "utf8", cwd: tmp });
}
/** Writes `data` to a temp JSON file and runs make-page on it. */
function runWith(name, data) {
  const dataPath = path.join(tmp, name + ".json");
  fs.writeFileSync(dataPath, JSON.stringify(data));
  const outPath = path.join(tmp, name + ".html");
  return { ...run(dataPath, outPath), outPath };
}
const copy = () => JSON.parse(JSON.stringify(pythagoras));
/** The contents of every inline <script> block. */
const scripts = (html) => [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);

test("make-page writes one self-contained page from the Pythagoras sample", () => {
  const out = path.join(tmp, "sub", "pythagoras.html");
  const r = run(fixture, out);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(fs.existsSync(out), "output file exists");
  const html = fs.readFileSync(out, "utf8");
  assert.ok(html.includes("window.TYPE_SCRIPT ="), "data is injected");
  assert.ok(html.includes("Pythagoras in 60 seconds"), "title is in the page");
  assert.doesNotMatch(html, /<script[^>]*\ssrc\s*=/i, "no <script src");
  assert.ok(html.includes("KT_PREVIEWS"), "previews are inlined");
  assert.ok(html.includes("KT_FAMILIES"), "menu is inlined");
  assert.doesNotMatch(html, /@KT_[A-Z]+@/, "no placeholders left");
});

test("every inline script in the page is valid JavaScript, and the data round-trips", () => {
  const out = path.join(tmp, "roundtrip.html");
  assert.equal(run(fixture, out).status, 0);
  const html = fs.readFileSync(out, "utf8");
  const blocks = scripts(html);
  assert.ok(blocks.length >= 4, "menu, previews, data and page scripts");
  blocks.forEach((src) => new vm.Script(src));
  const ctx = vm.createContext({ window: {} });
  vm.runInContext(blocks.find((s) => s.includes("window.TYPE_SCRIPT =")), ctx);
  const data = ctx.window.TYPE_SCRIPT;
  assert.equal(data.title, pythagoras.title);
  assert.equal(data.lines.length, 7);
  assert.equal(data.lines[5].text, "a² + b² = c²");
  assert.equal(data.lines[6].style, "stomp");
});

test("text that looks like HTML can't break out of the inlined script", () => {
  const data = copy();
  data.title = "Tags </script><b>bold</b> test";
  data.lines[0].text = "Close it early </script><script>alert(1)</script> and <!-- open a comment";
  data.lines[0].key = "early";
  const r = runWith("evil", data);
  assert.equal(r.status, 0, r.stderr);
  const html = fs.readFileSync(r.outPath, "utf8");
  assert.ok(!html.includes("<script>alert(1)"), "the line's tags stay inside the data");
  assert.ok(!html.includes("<!--"), "no raw comment opener anywhere");
  assert.ok(!html.includes("</script><b>"), "the title's tag is escaped everywhere");
  assert.equal((html.match(/<script>/g) || []).length, (html.match(/<\/script>/g) || []).length, "every script block closes once");
  const ctx = vm.createContext({ window: {} });
  vm.runInContext(scripts(html).find((s) => s.includes("window.TYPE_SCRIPT =")), ctx);
  assert.equal(ctx.window.TYPE_SCRIPT.lines[0].text, data.lines[0].text);
  assert.equal(ctx.window.TYPE_SCRIPT.title, data.title);
});

test("missing fields get their defaults", () => {
  const data = copy();
  delete data.mode;
  delete data.aspect;
  delete data.house;
  delete data.lines[2].key;
  delete data.lines[2].style;
  delete data.lines[2].suggest;
  const r = runWith("defaults", data);
  assert.equal(r.status, 0, r.stderr);
  const ctx = vm.createContext({ window: {} });
  vm.runInContext(scripts(fs.readFileSync(r.outPath, "utf8")).find((s) => s.includes("window.TYPE_SCRIPT =")), ctx);
  const d = ctx.window.TYPE_SCRIPT;
  assert.equal(d.mode, "teaching");
  assert.equal(d.aspect, "16:9");
  assert.equal(d.house, "word-by-word-reveal");
  assert.deepEqual([d.lines[2].key, d.lines[2].style, d.lines[2].suggest.length], ["", "house", 0]);
});

/** Asserts make-page refuses `data` with exit 1 and a message matching `reason`. */
function refuses(name, data, reason) {
  const r = runWith(name, data);
  assert.equal(r.status, 1, `exit code for ${name}: ${r.stderr}`);
  assert.match(r.stderr, reason);
  assert.ok(!fs.existsSync(r.outPath), "no page is written");
}

test("refuses a script without exactly 3 house options", () => {
  const data = copy();
  data.houseOptions.pop();
  refuses("two-houses", data, /exactly 3 house options \(found 2\)/);
});

test("refuses an unknown technique id, naming it", () => {
  const data = copy();
  data.lines[3].style = "sparkle-unicorn";
  refuses("unknown-style", data, /line 4.*"sparkle-unicorn" is not on the menu/i);
  const s = copy();
  s.lines[0].suggest[0].id = "sparkle-unicorn";
  refuses("unknown-suggest", s, /"sparkle-unicorn" is not on the menu/);
  const h = copy();
  h.houseOptions[1].id = "sparkle-unicorn";
  refuses("unknown-house-option", h, /"sparkle-unicorn" is not on the menu/);
});

test("refuses a house option that isn't calm", () => {
  const data = copy();
  data.houseOptions[2].id = "slice";
  refuses("not-calm", data, /"slice".*not calm/);
});

test("refuses a house that isn't one of the house options", () => {
  const data = copy();
  data.house = "simple-fade";
  refuses("house-not-offered", data, /house "simple-fade" is not one of the 3 house options/);
  const u = copy();
  u.house = "sparkle-unicorn";
  refuses("house-unknown", u, /"sparkle-unicorn" is not on the menu/);
});

test("refuses lines missing text, t or dur", () => {
  for (const field of ["text", "t", "dur"]) {
    const data = copy();
    delete data.lines[1][field];
    refuses("missing-" + field, data, new RegExp("line 2.*" + field));
  }
});

test("refuses unreadable input with a plain message", () => {
  const bad = path.join(tmp, "broken.json");
  fs.writeFileSync(bad, "{ not json");
  const r = run(bad, path.join(tmp, "broken.html"));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /isn't valid JSON/);
  const none = run(path.join(tmp, "nope.json"), path.join(tmp, "nope.html"));
  assert.equal(none.status, 1);
  assert.match(none.stderr, /can't read/i);
  const usage = spawnSync(process.execPath, [script], { encoding: "utf8" });
  assert.equal(usage.status, 1);
  assert.match(usage.stderr, /Usage: node make-page\.mjs <data\.json> <out\.html>/);
});

test("the long-line fixture builds", () => {
  const r = run(path.join(root, "tests/fixtures/long-line.json"), path.join(tmp, "long-line.html"));
  assert.equal(r.status, 0, r.stderr);
});
