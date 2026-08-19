import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { runnerImport } from "vite";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const modulePath = fileURLToPath(new URL("../app/lib/extendPromptGenerator.ts", import.meta.url));
const { module: extendModule } = await runnerImport(modulePath, { root: projectRoot, logLevel: "silent" });
const { generateExtendPrompt, diagnoseExtendPrompt } = extendModule;

const event = {
  id: "extend-1", start: 0, end: 10, shotNumber: 1,
  position: "standing face-to-face position", pose: "standing in a relaxed pose",
  bodyOrientation: "front-facing toward the camera", upperBodyOrientation: "face oriented toward the camera", hipOrientation: "hips follow the selected pose naturally",
  action: "turns toward the window and gives a restrained smile", clothingState: "white shirt worn loosely",
  expression: "a restrained smile", performanceTone: "quiet and natural", additionalDetails: "one continuous motion",
  cameraMotion: "pushes in toward the subject", motionSpeed: "slow speed", motionAmplitude: "small amplitude",
  cameraPlacement: "camera positioned directly in front of the primary woman", camera: "eye-level angle", shotSize: "medium full shot",
  dialogueText: "", dialogueDelivery: "softly", partnerHandAction: "",
};

const snapshot = {
  basic: {
    mode: "EXTEND", duration: 10, sceneType: "solo",
    extendMethod: "video-reference", extendSourceSummary: "one adult woman is seated at the end of the clip while the camera slowly moves forward",
    extendPreviousAction: "she has just looked down", extendPromptLanguage: "english",
    extendUseIdentityImage: true, extendUseEnvironmentImage: true,
    extendClothingPolicy: "transition", extendPosePolicy: "transition", extendCameraSource: "continue",
    extendEndingFrame: "a stable medium full shot by the window", extendSoundContinuity: "continue the same room tone and breathing cadence",
  },
  situation: "unused", clothing: "unused", events: [event],
  soundscape: "quiet room tone and soft breathing", music: "N/A", customNotes: "keep the motion restrained",
};

test("EXTEND emits a seamless local video-reference prompt with controlled state changes", () => {
  const prompt = generateExtendPrompt(snapshot);
  assert.match(prompt, /\[References\]/);
  assert.match(prompt, /@Video 1 is the video continuation reference/);
  assert.match(prompt, /@Image 1 is the character identity lock/);
  assert.match(prompt, /@Image 2 is the environment and lighting lock/);
  assert.match(prompt, /Continue directly from @Video 1 without a visible reset or cut/);
  assert.match(prompt, /transition naturally through continuous weight transfer/);
  assert.match(prompt, /transition wardrobe through visible, continuous garment movement/);
  assert.match(prompt, /same direction, speed, amplitude/);
  assert.match(prompt, /End with a stable medium full shot by the window/);
  assert.match(prompt, /Do not repeat any previous action, especially: she has just looked down/);
  assert.match(prompt, /one continuous motion/);
  assert.doesNotMatch(prompt, /Additional continuation direction: keep the motion restrained/);
  assert.match(prompt, /overall_soundscape:/);
});

test("EXTEND can emit Japanese structure and a final-frame chain", () => {
  const prompt = generateExtendPrompt({ ...snapshot, basic: { ...snapshot.basic, extendMethod: "last-frame", extendPromptLanguage: "japanese", extendUseIdentityImage: false } });
  assert.match(prompt, /\[参照\]/);
  assert.match(prompt, /@Image 1 は前動画の正確な最終フレーム/);
  assert.match(prompt, /\[中心アイデア\]/);
  assert.match(prompt, /\[展開\]/);
  assert.match(prompt, /前の動作を繰り返さない/);
});

test("EXTEND diagnostics enforce 4–15 seconds and one or two beats", () => {
  const diagnostics = diagnoseExtendPrompt({ ...snapshot, basic: { ...snapshot.basic, duration: 16 }, events: [event, { ...event, id: "2" }, { ...event, id: "3" }] });
  const messages = diagnostics.map((item) => item.message).join(" ");
  assert.match(messages, /integer from 4 to 15 seconds/);
  assert.match(messages, /Only the first two continuation beats are emitted/);
});
