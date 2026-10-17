import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "skills/kinetic-type-director/scripts/serve.mjs");

/** Starts serve.mjs on a random port; resolves with { url, port, child } once it prints its URL. */
function start(dir) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, dir, "0"], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", (d) => {
      out += d;
      const m = out.match(/http:\/\/127\.0\.0\.1:(\d+)\//);
      if (m) resolve({ url: m[0], port: Number(m[1]), child });
    });
    child.on("exit", (code) => reject(new Error("server exited " + code + ": " + out)));
  });
}
/** A raw GET, so the path is sent exactly as written (fetch would tidy "../" away). */
function rawGet(port, p) {
  return new Promise((resolve, reject) => {
    http.get({ host: "127.0.0.1", port, path: p }, (res) => {
      let body = "";
      res.on("data", (d) => (body += d));
      res.on("end", () => resolve({ status: res.statusCode, type: res.headers["content-type"], body }));
    }).on("error", reject);
  });
}

test("serve.mjs serves files from its folder and nothing outside it", async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kt-serve-"));
  const site = path.join(tmp, "site");
  fs.mkdirSync(site);
  fs.writeFileSync(path.join(site, "page.html"), "<!doctype html><p>hello sê</p>");
  fs.writeFileSync(path.join(tmp, "secret.txt"), "do not serve");

  const { url, port, child } = await start(site);
  try {
    const ok = await fetch(url + "page.html");
    assert.equal(ok.status, 200);
    assert.match(ok.headers.get("content-type"), /^text\/html; charset=utf-8/);
    assert.equal(await ok.text(), "<!doctype html><p>hello sê</p>");

    assert.equal((await fetch(url + "missing.html")).status, 404);

    for (const p of ["/../secret.txt", "/..%2fsecret.txt", "/..%5csecret.txt", "/%2e%2e/secret.txt"]) {
      const r = await rawGet(port, p);
      assert.ok(r.status === 403 || r.status === 404, `${p} gave ${r.status}`);
      assert.ok(!r.body.includes("do not serve"), `${p} leaked the file`);
    }
  } finally {
    child.kill();
  }
});
