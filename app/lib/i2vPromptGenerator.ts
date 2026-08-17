import type { BasicSettings, PromptSnapshot, SceneType, TimelineEvent } from "./types";
import { AUTO_POSE } from "./constants";
import { placementForT2VCameraAngle } from "./cameraConsistency";

const cleanSentence = (value = "") => value.trim().replace(/[.\s]+$/, "");
const formatTime = (value: number) => Number(value.toFixed(2)).toString();

const transitionWindow = (duration: number, timing: BasicSettings["i2vTransitionTiming"]) => {
  const ratios = timing === "slow" ? [0.15, 0.8] : timing === "fast" ? [0.05, 0.35] : [0.1, 0.6];
  const holdEnd = Math.max(0.2, Math.min(1.25, duration * ratios[0]));
  const targetReached = Math.max(holdEnd + 0.5, duration * ratios[1]);
  return { holdEnd: Math.min(holdEnd, duration), targetReached: Math.min(targetReached, duration) };
};

const motionDirection = (intensity: BasicSettings["i2vMotionIntensity"]) => {
  if (intensity === "strong") {
    return "Allow clearly visible full-body motion, but preserve identity, anatomy, garment continuity, and scene geometry on every frame; never regenerate the subject.";
  }
  if (intensity === "moderate") {
    return "Use controlled full-body motion with stable balance, continuous joint paths, and limited displacement inside the existing frame.";
  }
  return "Use restrained motion: breathing, blinking, gaze changes, small hand movement, and gentle weight shifts. Minimize silhouette and composition changes to maximize identity fidelity.";
};

const poseTarget = (event: TimelineEvent | undefined, sceneType: SceneType) => {
  if (!event) return "maintain the reference pose with only natural micro-movement";
  const pose = cleanSentence(event.pose) || "the pose already visible in the reference image";
  const orientation = [event.bodyOrientation, event.upperBodyOrientation, event.hipOrientation]
    .map((value) => cleanSentence(value))
    .filter(Boolean)
    .join("; ");
  const orientationText = orientation ? `; orientation targets: ${orientation}` : "";
  if (sceneType === "solo") return `${pose}${orientationText}`;
  const position = cleanSentence(event.position);
  const modifier = event.pose && event.pose !== AUTO_POSE ? `; primary pose modifier: ${pose}` : "";
  return `${position || "the relative arrangement already visible in the reference image"}${modifier}${orientationText}`;
};

const actionTarget = (event: TimelineEvent | undefined, sceneType: SceneType) => {
  if (!event) return "natural breathing, blinking, and subtle body movement";
  if (sceneType === "solo" && /fully nude/i.test(event.clothingState) && /undress|clothes|clothing/i.test(event.action)) {
    return "natural self-directed hand movement with stable fingers and no assistance from another person";
  }
  return cleanSentence(event.action);
};

const clothingControl = (basic: BasicSettings, event: TimelineEvent | undefined, fallback: string) => {
  const target = cleanSentence(event?.clothingState || fallback) || "the clothing state visible in the reference image";
  if (basic.i2vClothingStartSource === "prompt") {
    return `The exact first frame remains unchanged. Immediately afterward, prioritize the target clothing state "${target}", reached only through visible, continuous, physically plausible garment movement. No instant replacement, dissolve, body redraw, or cut.`;
  }
  return `Begin with the exact clothing and clothing state visible in the first frame. Then transition naturally into the target state "${target}" through visible, continuous, physically plausible garment movement. If the target already matches the image, keep it unchanged.`;
};

const poseControl = (basic: BasicSettings, event: TimelineEvent | undefined) => {
  const target = poseTarget(event, basic.sceneType);
  if (basic.i2vPoseStartSource === "prompt") {
    return `The exact first frame remains unchanged. Immediately afterward, prioritize the target pose/position "${target}" using continuous weight transfer and anatomically plausible joint paths. No pose snapping, teleportation, or limb regeneration.`;
  }
  return `Begin in the exact pose and relative spatial arrangement visible in the first frame. Then move naturally into the target pose/position "${target}" using continuous weight transfer and anatomically plausible joint paths.`;
};

const backgroundControl = (basic: BasicSettings, situation: string) => basic.i2vBackgroundSource === "prompt"
  ? `Start with the exact background and lighting in the first frame, then gradually move only the necessary environmental details toward "${cleanSentence(situation)}" with stable geometry. Never replace the subject while changing the environment.`
  : "Preserve the exact background, objects, lighting direction, shadows, color temperature, and spatial geometry from the first frame. Do not redesign, relocate, or restyle the scene.";

const cameraControl = (basic: BasicSettings, event: TimelineEvent | undefined) => {
  if (basic.i2vCameraSource !== "prompt" || !event) {
    return "Preserve the first frame's exact camera position, lens perspective, horizon, crop, shot size, and composition. No reframing, viewpoint jump, zoom, pan, tilt, dolly, orbit, or cut; allow only imperceptible breathing-level camera drift.";
  }
  const placement = placementForT2VCameraAngle(event.camera, event.cameraPlacement, basic.sceneType);
  return `Start from the first frame's exact camera and composition. Move continuously and conservatively toward this relative target: ${cleanSentence(event.cameraMotion)} at ${cleanSentence(event.motionSpeed)} with ${cleanSentence(event.motionAmplitude)}; target framing ${cleanSentence(event.shotSize)}; target visual result ${cleanSentence(event.visualResult)}; target angle ${cleanSentence(event.camera)}; target placement ${cleanSentence(placement)}; ${cleanSentence(event.depthOfField)}, focus on ${cleanSentence(event.focusTarget)} using ${cleanSentence(event.focusBehavior)}; motion rendering ${cleanSentence(event.frameRate)}. No cut, lens jump, teleportation, or abrupt reframing.`;
};

const eventTargets = (events: TimelineEvent[], sceneType: SceneType, holdEnd: number) => events.map((event, index) => {
  const partner = sceneType === "solo" ? "" : ` Partner interaction: ${cleanSentence(event.partnerHandAction)}.`;
  const effects = [
    event.perspirationEffect !== "no visible perspiration" ? cleanSentence(event.perspirationEffect) : "",
    event.lotionEffect !== "no visible lotion" ? cleanSentence(event.lotionEffect) : "",
    event.lactationEffect !== "no visible lactation" ? cleanSentence(event.lactationEffect) : "",
  ].filter(Boolean);
  const effectText = effects.length ? ` Visible effects: ${effects.join("; ")}.` : "";
  const prop = event.adultToy && event.adultToy !== "no adult toy" ? ` Prop target: ${cleanSentence(event.adultToy)}.` : "";
  const consent = sceneType === "solo" ? "" : ` Interaction direction: ${cleanSentence(event.consentDirection)}.`;
  const additionalDetails = cleanSentence(event.additionalDetails);
  const details = additionalDetails ? ` Additional motion detail: ${additionalDetails}.` : "";
  const start = Math.min(event.end, Math.max(event.start, index === 0 ? holdEnd : event.start));
  return `Motion phase ${index + 1} [${formatTime(start)}-${formatTime(event.end)}s]: pose/position target ${poseTarget(event, sceneType)}; clothing-state target ${cleanSentence(event.clothingState)}; action ${actionTarget(event, sceneType)}; expression ${cleanSentence(event.expression)}; performance ${cleanSentence(event.performanceTone)}.${partner}${consent}${prop}${effectText}${details}`;
}).join("\n");

const soundControl = (state: PromptSnapshot) => {
  const hasDialogue = state.events.some((event) => event.dialogueText.trim());
  const dialogue = hasDialogue
    ? state.events.filter((event) => event.dialogueText.trim()).map((event) => {
      const delivery = cleanSentence(event.dialogueDelivery);
      return `At ${formatTime(event.start)}-${formatTime(event.end)}s speak exactly ${JSON.stringify(event.dialogueText.trim())} in Japanese${delivery ? ` with ${delivery}` : ""}; add no other words.`;
    }).join(" ")
    : "No spoken words or intelligible dialogue; use only breathing, gasps, sighs, and nonverbal vocalization.";
  return `${cleanSentence(state.soundscape)}. ${dialogue}`;
};

export function generateI2VPrompt(state: PromptSnapshot): string {
  const { basic, clothing, events, situation } = state;
  const sortedEvents = [...events].sort((a, b) => a.start - b.start || (a.shotNumber || 1) - (b.shotNumber || 1));
  const firstEvent = sortedEvents[0];
  const { holdEnd, targetReached } = transitionWindow(basic.duration, basic.i2vTransitionTiming);
  const cast = basic.sceneType === "solo"
    ? "Preserve exactly the single consenting adult performer visible in the first frame. Do not add a partner, duplicate, extra body, or other person."
    : "Preserve exactly every consenting adult performer already visible in the first frame. Do not add, remove, duplicate, replace, or merge any person; interaction instructions apply only to adults already present.";

  return [
    "image_to_video_instruction:",
    "FIRST-FRAME AUTHORITY: The supplied input image is the exact 0.00-second frame and the sole authoritative source for all visible appearance. Animate this image; do not reinterpret it as a text-to-video scene.",
    `IDENTITY AND CAST LOCK: ${cast} Preserve exact facial geometry, eyes, hairstyle, skin tone, body proportions, silhouette, distinguishing details, and left/right orientation. Never generate a different person, beautified substitute, or redesigned body.`,
    `INITIAL HOLD [0.00-${formatTime(holdEnd)}s]: Hold the input composition and visible state nearly unchanged. Establish continuity with breathing, blinking, and tiny natural micro-motion only.`,
    `CONTROLLED TRANSITION [${formatTime(holdEnd)}-${formatTime(targetReached)}s]: ${clothingControl(basic, firstEvent, clothing)} ${poseControl(basic, firstEvent)} Action target: ${actionTarget(firstEvent, basic.sceneType)}.`,
    `TARGET CONTINUATION [${formatTime(targetReached)}-${formatTime(basic.duration)}s]: Continue the achieved motion naturally without resetting identity, anatomy, clothing continuity, background geometry, or camera continuity.`,
    `MOTION LIMIT: ${motionDirection(basic.i2vMotionIntensity)}`,
    `CAMERA CONTROL: ${cameraControl(basic, firstEvent)}`,
    `ENVIRONMENT CONTROL: ${backgroundControl(basic, situation)}`,
    sortedEvents.length ? `MOTION PHASE TARGETS:\n${eventTargets(sortedEvents, basic.sceneType, holdEnd)}` : "MOTION PHASE TARGET: Natural breathing, blinking, and minimal pose-preserving movement only.",
    state.customNotes.trim() ? `ADDITIONAL MOTION DIRECTION: ${cleanSentence(state.customNotes)}. This may refine motion only and must not override the first-frame identity, wardrobe, background, or camera locks selected above.` : "",
    "QUALITY LOCK: Maintain temporal coherence, stable hands and fingers, stable facial features, stable anatomy, and consistent texture. No morphing, flicker, warping, sudden crop, scene cut, or first-frame replacement.",
    `overall_soundscape: ${soundControl(state)}`,
    `non_diegetic_music: ${state.music || "N/A"}`,
  ].filter(Boolean).join("\n\n");
}

export interface I2VPromptDiagnostic { severity: "error" | "warning" | "info"; message: string }

export function diagnoseI2VPrompt(state: PromptSnapshot): I2VPromptDiagnostic[] {
  const diagnostics: I2VPromptDiagnostic[] = [];
  const prompt = generateI2VPrompt(state);
  if (prompt.length > 20000) diagnostics.push({ severity: "error", message: "I2V prompt exceeds the Mobile Studio 20,000-character request limit." });
  else if (prompt.length > 3500) diagnostics.push({ severity: "warning", message: "I2V prompt is unusually long; fewer target events usually preserve the reference image better." });
  if (!state.basic.firstFrameImage) diagnostics.push({ severity: "warning", message: "Add a first-frame image URL before using the API JSON." });
  if (state.basic.promptOptimizer) diagnostics.push({ severity: "info", message: "Prompt optimizer is disabled automatically in I2V so it cannot rewrite identity-preservation instructions." });
  if (state.basic.i2vMotionIntensity === "strong") diagnostics.push({ severity: "warning", message: "Strong I2V motion increases identity, anatomy, and background drift risk." });
  if (state.basic.i2vBackgroundSource === "prompt") diagnostics.push({ severity: "warning", message: "Changing the reference background can cause the model to reconstruct the entire frame." });
  if (state.basic.i2vCameraSource === "prompt") diagnostics.push({ severity: "warning", message: "Changing the reference camera or framing increases composition and identity drift risk." });
  if (state.events.length > 2) diagnostics.push({ severity: "warning", message: "More than two I2V target events may cause abrupt motion or subject drift; use one clear transition when possible." });
  if (state.basic.sceneType !== "solo") diagnostics.push({ severity: "info", message: "I2V preserves the people already visible in the image; it will not reliably create a missing partner." });
  return diagnostics;
}
