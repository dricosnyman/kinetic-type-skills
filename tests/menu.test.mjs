import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { KT_MENU, KT_FAMILIES } = require(path.join(root, "skills/kinetic-type/assets/menu.js"));

const ids = (pred) => KT_MENU.filter(pred).map((e) => e.id).sort();

test("ids are unique and kebab-case", () => {
  const all = KT_MENU.map((e) => e.id);
  assert.equal(new Set(all).size, all.length, "duplicate ids");
  for (const id of all) assert.match(id, /^[a-z0-9]+(-[a-z0-9]+)*$/, `not kebab-case: ${id}`);
});

test("every entry has a name, look and reachFor", () => {
  for (const e of KT_MENU) {
    for (const key of ["name", "look", "reachFor"]) {
      assert.equal(typeof e[key], "string", `${e.id}.${key}`);
      assert.ok(e[key].trim().length > 0, `${e.id}.${key} is empty`);
    }
  }
});

test("family is an integer from 0 to 17", () => {
  for (const e of KT_MENU) {
    assert.ok(Number.isInteger(e.family) && e.family >= 0 && e.family <= 17, `${e.id}.family = ${e.family}`);
  }
});

test("there are 18 families and each has at least one technique", () => {
  assert.equal(KT_FAMILIES.length, 18);
  KT_FAMILIES.forEach((f, i) => {
    assert.equal(f.num, i);
    assert.ok(f.name && f.gloss, `family ${i} needs a name and gloss`);
    assert.ok(KT_MENU.some((e) => e.family === i), `family ${i} is empty`);
  });
});

test("family counts match the showcase plus the added entries", () => {
  // Family 0 = 11 part-1 scenes + marker-highlight; family 1 = 5 + simple-fade + stomp (ruling R1);
  // family 13 = 4 + fit-to-box.
  const expected = { 0: 12, 1: 7, 2: 4, 3: 3, 4: 4, 5: 4, 6: 3, 7: 5, 8: 4, 9: 4, 10: 5, 11: 4, 12: 3, 13: 5, 14: 3, 15: 3, 16: 4, 17: 4 };
  const counts = {};
  for (const e of KT_MENU) counts[e.family] = (counts[e.family] || 0) + 1;
  assert.deepEqual(counts, expected);
});

test('build is valid, and build "example" comes with an example path', () => {
  for (const e of KT_MENU) {
    assert.ok(["component", "example", "elsewhere"].includes(e.build), `${e.id}.build = ${e.build}`);
    if (e.build === "example") assert.ok(e.example, `${e.id} needs an example path`);
  }
});

test("the calm ids are exactly the six house styles", () => {
  assert.deepEqual(
    ids((e) => e.calm),
    ["cascade", "masking-and-reveals", "simple-fade", "tracking-in", "typewriter", "word-by-word-reveal"],
  );
});

test("the teach set includes the teaching accents, and nothing is both calm and teach", () => {
  const teach = ids((e) => e.teach);
  for (const id of ["emphasis-scaling", "marker-highlight", "stomp", "stroke-write-on", "slice", "scramble"]) {
    assert.ok(teach.includes(id), `${id} should be teach`);
  }
  assert.deepEqual(ids((e) => e.calm && e.teach), []);
});

test("exactly one entry is new: fit-to-box", () => {
  assert.deepEqual(ids((e) => e.isNew), ["fit-to-box"]);
});

test("no look or reachFor text talks about reading speed", () => {
  const banned = /words per second|reading time|readab/i;
  for (const e of KT_MENU) {
    assert.doesNotMatch(e.look, banned, `${e.id}.look`);
    assert.doesNotMatch(e.reachFor, banned, `${e.id}.reachFor`);
  }
});

test("references/menu.md is up to date with menu.js", () => {
  const r = spawnSync(process.execPath, [path.join(root, "scripts/build-menu.mjs"), "--check"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr || r.stdout);
});
