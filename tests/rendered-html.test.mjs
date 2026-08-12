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
  const [topBar, eventCard, generator, constants, store, promptPreview] = await Promise.all([
    readFile(new URL("../app/components/TopBar.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/EventCard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/promptGenerator.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/constants.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/store/usePromptStore.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/PromptPreview.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(topBar, /T2V/);
  assert.match(topBar, /I2V/);
  assert.match(topBar, /FLF/);
  assert.match(topBar, /S2V/);
  assert.match(eventCard, /SUBJECT TRACK/);
  assert.match(eventCard, /CAMERA TRACK/);
  assert.match(constants, /OFFICIAL_CAMERA_COMMANDS/);
  assert.match(constants, /seated M-shaped leg-spread pose/);
  assert.match(constants, /suction-cup mounted dildo/);
  assert.match(generator, /generateApiPayload/);
  assert.match(generator, /2,000-character limit/);
  assert.match(store, /version: 18/);
  assert.match(generator, /consenting adults aged 18 or older/);
  assert.match(generator, /must not mirror or copy the woman's pose/);
  assert.match(generator, /Both of the male partner's hands remain visibly accounted for/);
  assert.match(generator, /Two-woman action/);
  assert.match(generator, /basic\.femalePartnerAge/);
  assert.match(constants, /LESBIAN_POSITIONS/);
  assert.match(constants, /PARTNER_HAND_ACTIONS/);
  assert.match(constants, /SHOT_SIZES/);
  assert.match(constants, /FOCAL_LENGTH_VISUAL_RESULTS/);
  assert.match(eventCard, /Camera motion \(one only\)/);
  assert.match(generator, /No push, no zoom, no dolly, no pan, no tilt, no reframing/);
  assert.match(generator, /Optional visual look converted from numeric hints/);
  assert.match(generator, /performance direction/);
  assert.match(generator, /all reactions and body language must remain clearly consensual/);
  assert.match(constants, /PERFORMANCE_TONES/);
  assert.match(constants, /CONSENT_DIRECTIONS/);
  assert.match(generator, /Exactly one consenting adult \$\{primaryWoman\} is present throughout the entire video/);
  assert.match(generator, /no partner, second woman, duplicate person/);
  assert.match(generator, /Only her breathing, gasps, nonverbal moans, solo body movement/);
  assert.match(generator, /automatically converts this to self-caressing/);
  assert.match(generator, /Body orientation for the primary \$\{primaryWoman\}/);
  assert.match(generator, /front-facing body with a side-profile camera angle/);
  assert.match(constants, /BODY_ORIENTATIONS/);
  assert.match(constants, /UPPER_BODY_ORIENTATIONS/);
  assert.match(constants, /HIP_ORIENTATIONS/);
  assert.match(constants, /CAMERA_PLACEMENTS/);
  assert.match(eventCard, /Apply front-camera rear-entry setup/);
  assert.match(generator, /face and upper body may face the camera independently while the hips remain aligned/);
  assert.match(constants, /PERSPIRATION_EFFECTS/);
  assert.match(constants, /LOTION_EFFECTS/);
  assert.match(constants, /LACTATION_EFFECTS/);
  assert.match(generator, /Lactation effect for the \$\{primaryWoman\}/);
  assert.match(constants, /DIALOGUE_DELIVERIES/);
  assert.match(constants, /BUST_PROMPT_DESCRIPTIONS/);
  assert.match(constants, /very small, petite natural breasts/);
  assert.match(constants, /massive, very heavy natural breasts/);
  assert.match(eventCard, /Exact Japanese dialogue \(optional\)/);
  assert.match(promptPreview, /frameforge_prompt/);
  assert.match(promptPreview, /Open in H3 Studio/);
  assert.match(generator, /No spoken words or intelligible dialogue in any language/);
  assert.match(generator, /Speak this exact quoted line only/);
  assert.match(generator, /basic\.bustSize/);
  assert.match(generator, /describeBustForH3/);
  assert.match(generator, /Breast size and shape/);
  assert.match(generator, /Preserve this relative breast volume, projection, and shape consistently/);
  assert.doesNotMatch(generator, /\$\{cleanSentence\(basic\.bustSize\)\}/);
});
