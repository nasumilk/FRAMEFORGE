import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { runnerImport } from "vite";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const promptPath = fileURLToPath(new URL("../app/lib/promptGenerator.ts", import.meta.url));
const { module: promptModule } = await runnerImport(promptPath, { root: projectRoot, logLevel: "silent" });
const { generateH3Prompt } = promptModule;

const baseEvent = {
  id: "shot-a", start: 0, end: 3, shotNumber: 1, transition: "continuous cut-free movement",
  location: "warm bedroom", captureDevice: "compact CCD camera", handheldShake: false, handheldStyle: "subtle micro-shake",
  soundscape: "quiet room tone", music: "N/A", clothingState: "black lace lingerie",
  position: "", action: "slowly turns toward the window", pose: "standing in a relaxed pose",
  bodyOrientation: "front-facing toward the camera with shoulders and hips squared to the lens",
  upperBodyOrientation: "face, shoulders, and chest oriented directly toward the camera", hipOrientation: "hips follow the selected pose naturally",
  cameraPlacement: "camera positioned directly in front of the primary woman at her eye level", camera: "eye-level angle",
  shotSize: "medium shot from the waist up", visualResult: "natural perspective", cameraMotion: "locked-off static",
  motionAmplitude: "small amplitude", motionSpeed: "slow speed", expression: "calm expression", performanceTone: "quiet and natural",
  consentDirection: "continuous enthusiastic consent", perspirationEffect: "no visible perspiration", lotionEffect: "no visible lotion",
  lactationEffect: "no visible lactation", dialogueText: "", dialogueDelivery: "softly", adultToy: "no adult toy", partnerHandAction: "",
  intimacyMode: "standard intimate contact", additionalDetails: "keep this shot restrained", cameraCommands: [], aperture: "f/2.8",
  depthOfField: "shallow depth of field", focusTarget: "face", focusBehavior: "continuous subject-tracking autofocus",
  frameRate: "24 fps cinematic motion", shutterAngle: "180-degree shutter",
};

const snapshot = {
  basic: {
    mode: "T2V", duration: 6, sceneType: "solo", age: { kind: "exact", value: 26 }, style: "photorealistic", lighting: "warm practical lighting",
    bodyType: "slender", hair: "black hair", eyes: "brown eyes", skin: "natural skin", bustSize: "B-cup breasts", maleActor: false,
    femalePartnerAge: { kind: "exact", value: 26 }, preserveIdentity: true, preserveWardrobe: false, stabilizeAnatomy: true,
    stabilizeBackground: true, preserveLighting: true, preventCameraTeleport: true, continuousTake: false,
  },
  situation: "legacy global location", clothing: "legacy global clothing", soundscape: "legacy global sound", music: "legacy global music", customNotes: "legacy global note",
  events: [
    baseEvent,
    { ...baseEvent, id: "shot-b", start: 3, end: 6, shotNumber: 2, transition: "hard cut", location: "cool hallway", captureDevice: "professional cinema camera", clothingState: "white blouse", soundscape: "distant rain", music: "soft ambient score", additionalDetails: "increase the pace" },
  ],
};

test("T2V emits direction, capture, wardrobe, sound, and music per timeline shot", () => {
  const prompt = generateH3Prompt(snapshot);
  assert.match(prompt, /\[0-3s\] Location for this timeline segment: warm bedroom/);
  assert.match(prompt, /Capture profile for this timeline segment: compact CCD/);
  assert.match(prompt, /black lace lingerie/);
  assert.match(prompt, /\[3-6s\] Location for this timeline segment: cool hallway/);
  assert.match(prompt, /professional cinema-camera footage/);
  assert.match(prompt, /white blouse/);
  assert.match(prompt, /overall_soundscape: \[0-3s\] quiet room tone/);
  assert.match(prompt, /\[3-6s\] distant rain/);
  assert.match(prompt, /non_diegetic_music: \[0-3s\] N\/A \[3-6s\] soft ambient score/);
  assert.doesNotMatch(prompt, /legacy global location|legacy global clothing|legacy global sound|legacy global music|legacy global note/);
});
