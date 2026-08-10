import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the Frameforge application shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Frameforge — H3 Prompt Studio<\/title>/i);
  assert.match(html, /adult-only visual timeline editor/i);
  assert.match(html, /Preparing Frameforge/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("ships advanced H3 controls and API export", async () => {
  const [topBar, eventCard, generator, constants, store] = await Promise.all([
    readFile(new URL("../app/components/TopBar.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/EventCard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/promptGenerator.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/constants.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/store/usePromptStore.ts", import.meta.url), "utf8"),
  ]);
  assert.match(topBar, /T2V/);
  assert.match(topBar, /I2V/);
  assert.match(topBar, /FLF/);
  assert.match(topBar, /S2V/);
  assert.match(eventCard, /SUBJECT TRACK/);
  assert.match(eventCard, /CAMERA TRACK/);
  assert.match(constants, /OFFICIAL_CAMERA_COMMANDS/);
  assert.match(generator, /generateApiPayload/);
  assert.match(generator, /2,000-character limit/);
  assert.match(store, /version: 7/);
  assert.match(generator, /consenting adults aged 18 or older/);
});
