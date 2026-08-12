import type { AgeValue, BasicSettings, PromptSnapshot, SceneType, TimelineEvent } from "./types";
import { AUTO_POSE, CAPTURE_DEVICE_DESCRIPTIONS, FOCAL_LENGTH_VISUAL_RESULTS, SUBJECT_DISTANCE_VISUAL_RESULTS } from "./constants";

const cleanSentence = (value = "") => value.trim().replace(/[.\s]+$/, "");

const soloActionText = (event: TimelineEvent) => {
  if (/fully nude/i.test(event.clothingState) && /undress|clothes|clothing/i.test(event.action)) {
    return "slowly caresses her own body with both hands, with anatomically stable fingers and no assistance from another person";
  }
  return cleanSentence(event.action);
};

const soloSoundscape = (soundscape: string) => {
  const cleaned = cleanSentence(soundscape)
    .replace(/intimate movement sounds/gi, "solo body movement against the bedding")
    .replace(/rhythmic skin contact/gi, "subtle movement against the bedding")
    .replace(/low male grunts/gi, "")
    .replace(/,\s*,/g, ",")
    .replace(/,\s*and\s*,?/gi, ",")
    .replace(/\s{2,}/g, " ");
  return `${cleanSentence(cleaned)}. Only her breathing, voice, and solo body movement are audible; no other human voice, partner, skin-to-skin contact, or male sound`;
};

export function formatAge(age: AgeValue): string {
  if (age.kind === "range") return `${Math.max(18, age.min)} to ${Math.max(18, age.max)}-year-old`;
  return `${Math.max(18, age.value)}-year-old`;
}

export function supportedDurations(basic: Pick<BasicSettings, "mode" | "resolution">): number[] {
  if (basic.mode === "S2V" || basic.resolution === "1080P") return [6];
  return [6, 10];
}

const cameraMotionText = (event: TimelineEvent, basic: BasicSettings) => {
  if (event.cameraMotion === "locked-off static") {
    return `Locked-off static ${cleanSentence(event.shotSize)}. No push, no zoom, no dolly, no pan, no tilt, no reframing. The frame never moves`;
  }
  const handheld = basic.handheldShake
    ? `. Natural handheld character: ${cleanSentence(basic.handheldStyle)} with physically plausible operator drift and breathing-induced micro-movement, without synthetic jitter`
    : ". No additional handheld shake";
  return `Camera motion: the camera ${cleanSentence(event.cameraMotion)} at ${cleanSentence(event.motionSpeed)} with ${cleanSentence(event.motionAmplitude)}${handheld}`;
};

export function buildTimelineSegment(event: TimelineEvent, basic: BasicSettings): string {
  const sceneType: SceneType = basic.sceneType;
  const primaryWoman = `${formatAge(basic.age)} Japanese woman`;
  const secondWoman = `${formatAge(basic.femalePartnerAge)} Japanese woman`;
  const roleDetails = sceneType === "male-female" && event.position
    ? [
      `Couple position: ${cleanSentence(event.position)}`,
      event.pose === AUTO_POSE
        ? `The ${primaryWoman}'s body pose is derived from her role in the selected couple position`
        : `Pose modifier for the ${primaryWoman} within this position: ${cleanSentence(event.pose)}`,
      "The adult male partner adopts the complementary role-specific posture required by the couple position; he must not mirror or copy the woman's pose or limb placement",
      `Male partner hand action: ${cleanSentence(event.partnerHandAction)}`,
      "Both of the male partner's hands remain visibly accounted for in this action with stable wrists, natural finger placement, and no idle or duplicated hands",
    ]
    : sceneType === "female-female" && event.position
      ? [
        `Two-woman position: ${cleanSentence(event.position)}`,
        event.pose === AUTO_POSE
          ? `The primary ${primaryWoman}'s body pose is derived from her role in the selected two-woman position`
          : `Pose modifier for the primary ${primaryWoman} within this position: ${cleanSentence(event.pose)}`,
        `The second ${secondWoman} adopts the complementary role-specific posture without mirroring or copying the primary woman's limb placement`,
        `Second ${secondWoman}'s hand action: ${cleanSentence(event.partnerHandAction)}`,
        `Both hands of the second ${secondWoman} remain visibly accounted for with stable wrists, natural finger placement, and no idle or duplicated hands`,
      ]
    : [
      event.pose === AUTO_POSE ? `The ${primaryWoman}'s full-body pose: standing in a relaxed pose` : `The ${primaryWoman}'s full-body pose: ${cleanSentence(event.pose)}`,
      `Exactly one ${primaryWoman} appears in this solo scene; no partner, second woman, duplicate person, or other human is visible or implied`,
    ];
  const clothingDirection = /fully nude/i.test(event.clothingState)
    ? `The ${primaryWoman} is fully nude`
    : `The ${primaryWoman} wears ${cleanSentence(event.clothingState)}`;
  const details = [
    `Shot size and framing: ${cleanSentence(event.shotSize)}`,
    `Visual result: ${cleanSentence(event.visualResult)}`,
    `Camera angle: ${cleanSentence(event.camera)}`,
    cameraMotionText(event, basic),
    `Camera placement relative to the primary ${primaryWoman}: ${cleanSentence(event.cameraPlacement)}`,
    `Body orientation for the primary ${primaryWoman}: ${cleanSentence(event.bodyOrientation)}. She holds the selected pose while keeping this orientation relative to the camera`,
    `Face and upper-body orientation for the primary ${primaryWoman}: ${cleanSentence(event.upperBodyOrientation)}`,
    `Hip orientation for the primary ${primaryWoman}: ${cleanSentence(event.hipOrientation)}. The face and upper body may face the camera independently while the hips remain aligned with the partner and selected position`,
    ...roleDetails,
    clothingDirection,
    sceneType === "male-female" && event.intimacyMode === "consensual anal intercourse" ? "Couple interaction mode: consensual anal intercourse" : "",
    `${sceneType === "female-female" ? `Two-woman action led by the primary ${primaryWoman}` : sceneType === "male-female" ? `Couple action involving the ${primaryWoman}` : `The ${primaryWoman}'s action`}: ${sceneType === "solo" ? soloActionText(event) : cleanSentence(event.action)}`,
    `The ${primaryWoman}'s expression: ${cleanSentence(event.expression)}`,
    `The ${primaryWoman}'s performance direction: ${cleanSentence(event.performanceTone)}`,
    sceneType !== "solo" ? `Consent direction: ${cleanSentence(event.consentDirection)}; all reactions and body language must remain clearly consensual` : "",
    event.perspirationEffect && event.perspirationEffect !== "no visible perspiration" ? `Perspiration on the ${primaryWoman}: ${cleanSentence(event.perspirationEffect)}; droplets follow gravity and body movement naturally` : "",
    event.lotionEffect && event.lotionEffect !== "no visible lotion" ? `Lotion on the ${primaryWoman}: ${cleanSentence(event.lotionEffect)}; preserve clear viscosity, coherent highlights, and physically plausible flow across the skin` : "",
    event.lactationEffect && event.lactationEffect !== "no visible lactation" ? `Lactation effect for the ${primaryWoman}: ${cleanSentence(event.lactationEffect)}; keep the fluid localized to her breasts with realistic gravity and continuity` : "",
    event.adultToy && event.adultToy !== "no adult toy" ? `The ${primaryWoman}'s toy: ${cleanSentence(event.adultToy)}` : "",
    `Depth of field: ${cleanSentence(event.depthOfField)}`,
    `Focus stays on ${cleanSentence(event.focusTarget)} using ${cleanSentence(event.focusBehavior)}`,
    `Motion rendering: ${cleanSentence(event.frameRate)}`,
    event.additionalDetails ? cleanSentence(event.additionalDetails) : "",
  ].filter(Boolean);
  return `[${event.start}-${event.end}s] ${details.join(". ")}.`;
}

const continuityText = (basic: BasicSettings) => {
  const rules = [
    basic.preserveIdentity && "preserve facial identity and body proportions across every frame",
    basic.preserveWardrobe && "maintain exact wardrobe continuity",
    basic.stabilizeAnatomy && "keep hands, fingers, limbs, and anatomy stable",
    basic.stabilizeBackground && "prevent background warping or object morphing",
    basic.preserveLighting && "preserve the established lighting direction and color temperature",
    basic.preventCameraTeleport && "avoid camera teleportation and impossible perspective jumps",
    basic.continuousTake && "render as a continuous take without unintended cuts",
  ].filter(Boolean);
  return rules.length ? `Continuity constraints: ${rules.join(", ")}.` : "";
};

export function generateH3Prompt(state: PromptSnapshot): string {
  const { basic, situation, clothing, events, soundscape, music, customNotes } = state;
  const sortedEvents = [...events].sort((a, b) => (a.shotNumber || 1) - (b.shotNumber || 1) || a.start - b.start);
  const primaryWoman = `${formatAge(basic.age)} Japanese woman`;

  let subject = `${cleanSentence(basic.style)}, ${cleanSentence(basic.lighting)}. `;
  if (basic.sceneType === "solo") {
    subject += `Exactly one consenting adult ${primaryWoman} is present throughout the entire video. She is the sole performer. No other person is visible or implied. Do not introduce a partner, second woman, duplicate person, extra body, or extra limbs. `;
  } else {
    subject += "All depicted performers are consenting adults aged 18 or older. ";
  }
  subject += `The primary performer is a ${formatAge(basic.age)} Japanese woman, ${cleanSentence(basic.bodyType)}, ${cleanSentence(basic.bustSize)}, ${cleanSentence(basic.hair)}, ${cleanSentence(basic.eyes)}, ${cleanSentence(basic.skin)}.`;
  if (basic.maleActor) {
    subject += ` A ${cleanSentence(basic.maleBodyType)}, ${cleanSentence(basic.maleAgeFeel)} Japanese man`;
    subject += basic.maleFaceVisible ? "." : ", with his face kept out of clear view.";
  }
  if (basic.sceneType === "female-female") {
    subject += ` A second consenting ${formatAge(basic.femalePartnerAge)} Japanese woman, ${cleanSentence(basic.femalePartnerBodyType)}, ${cleanSentence(basic.femalePartnerBustSize)}, ${cleanSentence(basic.femalePartnerHair)}, with a clearly distinct identity from the first woman.`;
  }

  const device = CAPTURE_DEVICE_DESCRIPTIONS[basic.captureDevice] ?? cleanSentence(basic.captureDevice);
  const hintText = basic.useNumericCameraHints
    ? ` Optional visual look converted from numeric hints: ${cleanSentence(FOCAL_LENGTH_VISUAL_RESULTS[basic.focalLength] ?? basic.focalLength)}; ${cleanSentence(SUBJECT_DISTANCE_VISUAL_RESULTS[basic.subjectDistance] ?? basic.subjectDistance)}.`
    : "";
  const capture = `Capture profile: ${cleanSentence(device)}.${hintText}`;

  const shotNumbers = [...new Set(sortedEvents.map((event) => event.shotNumber || 1))];
  const shots = shotNumbers.length
    ? shotNumbers.map((shotNumber, index) => {
      const shotEvents = sortedEvents.filter((event) => (event.shotNumber || 1) === shotNumber);
      const transition = index > 0 ? ` Transition: ${cleanSentence(shotEvents[0]?.transition || "hard cut")}.` : "";
      return `${index > 0 ? ` [Shot ${shotNumber}]${transition}` : ""} ${shotEvents.map((event) => buildTimelineSegment(event, basic)).join(" ")}`;
    }).join("")
    : ` [0-${basic.duration}s] Medium shot. She is ${cleanSentence(clothing)} in a ${cleanSentence(situation)}. ${basic.sceneType === "female-female" ? "Two consenting adult women share a sensual intimate moment" : basic.sceneType === "male-female" ? "A consenting adult couple shares a sensual intimate moment" : "She performs a sensual solo scene"}.`;

  const notes = customNotes.trim() ? ` ${cleanSentence(customNotes)}.` : "";
  const referenceVideoNote = basic.includeReferenceVideoNote ? " For more precise camera choreography, use a Reference Video to guide camera motion." : "";
  const integrated = `[Shot 1] ${subject} ${capture} ${continuityText(basic)} Location: ${cleanSentence(situation)}.${shots}${notes}${referenceVideoNote}`;
  let referencePrefix = "";
  if (basic.mode === "I2V" || basic.mode === "FLF") {
    referencePrefix += `For the target video, at 0.00 seconds into the target video, <Picture 1> is fully referenced as the starting appearance and identity of the ${primaryWoman}.\n`;
  }
  if (basic.mode === "FLF") referencePrefix += "The final target frame fully references <Picture 2> as the ending composition, pose, and camera destination.\n";
  if (basic.mode === "S2V") referencePrefix += `<Picture 1> is fully referenced as the ${primaryWoman}'s facial identity throughout the target video.\n`;
  if (referencePrefix) referencePrefix += "\n";

  const finalSoundscape = basic.sceneType === "solo" ? soloSoundscape(soundscape) : cleanSentence(soundscape);
  return `${referencePrefix}integrated_multimodal_description: ${integrated}\n\noverall_soundscape: ${finalSoundscape}\n\nnon_diegetic_music: ${music || "N/A"}`;
}

export function generateApiPayload(state: PromptSnapshot) {
  const { basic } = state;
  const payload: Record<string, unknown> = {
    model: basic.model,
    prompt: generateH3Prompt(state),
    duration: basic.duration,
    resolution: basic.resolution,
    prompt_optimizer: basic.promptOptimizer,
  };
  if (basic.fastPretreatment && basic.model.includes("Hailuo")) payload.fast_pretreatment = true;
  if (basic.mode === "I2V" || basic.mode === "FLF") payload.first_frame_image = basic.firstFrameImage || "<FIRST_FRAME_IMAGE_URL_OR_DATA_URI>";
  if (basic.mode === "FLF") payload.last_frame_image = basic.lastFrameImage || "<LAST_FRAME_IMAGE_URL_OR_DATA_URI>";
  if (basic.mode === "S2V") {
    payload.subject_reference = [{ type: "character", image: [basic.subjectReferenceImage || "<SUBJECT_REFERENCE_IMAGE_URL>"] }];
  }
  return payload;
}

export interface TimelineIssue {
  type: "gap" | "overlap" | "bounds" | "range";
  message: string;
}

export function validateTimeline(events: TimelineEvent[], duration: number): TimelineIssue[] {
  const sorted = [...events].sort((a, b) => a.start - b.start);
  const issues: TimelineIssue[] = [];
  sorted.forEach((event, index) => {
    if (event.start < 0 || event.end > duration) issues.push({ type: "bounds", message: `Event ${index + 1} extends outside 0-${duration}s.` });
    if (event.end <= event.start) issues.push({ type: "range", message: `Event ${index + 1} needs an end time after its start.` });
    const previous = sorted[index - 1];
    if (previous) {
      const delta = event.start - previous.end;
      if (delta > 0.5) issues.push({ type: "gap", message: `${delta.toFixed(1)}s gap before event ${index + 1}.` });
      if (delta < -0.5) issues.push({ type: "overlap", message: `${Math.abs(delta).toFixed(1)}s overlap at event ${index + 1}.` });
    }
  });
  return issues;
}

export interface PromptDiagnostic { severity: "error" | "warning" | "info"; message: string }

export function diagnosePrompt(state: PromptSnapshot): PromptDiagnostic[] {
  const { basic, events, customNotes, soundscape } = state;
  const diagnostics: PromptDiagnostic[] = [];
  const prompt = generateH3Prompt(state);
  if (prompt.length > 2000) diagnostics.push({ severity: "error", message: `Prompt is ${prompt.length - 2000} characters over the official 2,000-character limit.` });
  else if (prompt.length > 1800) diagnostics.push({ severity: "warning", message: "Prompt is close to the 2,000-character limit." });
  if (!supportedDurations(basic).includes(basic.duration)) diagnostics.push({ severity: "error", message: `${basic.resolution} does not support a ${basic.duration}s generation.` });
  if (basic.mode === "FLF" && basic.model !== "MiniMax-Hailuo-02") diagnostics.push({ severity: "error", message: "First/last-frame mode requires MiniMax-Hailuo-02." });
  if (basic.mode === "S2V" && basic.model !== "S2V-01") diagnostics.push({ severity: "error", message: "Subject-reference mode requires S2V-01." });
  if (basic.mode === "I2V" && !basic.firstFrameImage) diagnostics.push({ severity: "warning", message: "Add a first-frame image URL before using the API JSON." });
  if (basic.mode === "FLF" && (!basic.firstFrameImage || !basic.lastFrameImage)) diagnostics.push({ severity: "warning", message: "First/last-frame mode needs both image URLs." });
  if (basic.mode === "S2V" && !basic.subjectReferenceImage) diagnostics.push({ severity: "warning", message: "Add a subject-reference image URL before using the API JSON." });
  events.forEach((event, index) => {
    if ((event.cameraCommands?.length || 0) > 1) diagnostics.push({ severity: "warning", message: `Event ${index + 1} contains legacy camera commands; only one camera motion is used per shot.` });
    const explicitPose = event.pose && event.pose !== AUTO_POSE;
    const likelyConflict = explicitPose && basic.sceneType !== "solo" && event.position && (
      (/standing|M-shaped|deep squat/i.test(event.pose) && /missionary|cowgirl|spooning|prone|oral|sitting/i.test(event.position))
      || (/lying on her back/i.test(event.pose) && /standing|rear-entry/i.test(event.position))
    );
    if (likelyConflict) diagnostics.push({ severity: "warning", message: `Event ${index + 1} combines a woman-only pose with a conflicting couple position; use Auto pose or change one selection.` });
    if (basic.sceneType === "solo" && /second woman|two women|both women|partner|couple|mutual|each other|male/i.test(event.additionalDetails)) diagnostics.push({ severity: "warning", message: `Event ${index + 1} additional direction may imply another person in Solo mode.` });
    if (basic.sceneType === "solo" && /fully nude/i.test(event.clothingState) && /undress|clothes|clothing/i.test(event.action)) diagnostics.push({ severity: "info", message: `Event ${index + 1} says fully nude and undressing; Solo output automatically converts this to self-caressing.` });
    if (/^front-facing/i.test(event.bodyOrientation) && /side profile/i.test(event.camera)) diagnostics.push({ severity: "warning", message: `Event ${index + 1} requests a front-facing body with a side-profile camera angle; change one setting to avoid conflicting directions.` });
    if (/rear-entry/i.test(event.position) && /directly in front/i.test(event.cameraPlacement) && /hips squared toward the camera/i.test(event.hipOrientation)) diagnostics.push({ severity: "warning", message: `Event ${index + 1} places the camera in front for rear-entry but points the hips toward the camera; direct the hips toward the partner behind her.` });
    if (/rear-entry/i.test(event.position) && /on all fours/i.test(event.pose) && !/partner behind|follow the selected pose/i.test(event.hipOrientation)) diagnostics.push({ severity: "warning", message: `Event ${index + 1} rear-entry pose may need the hips directed toward the partner behind her.` });
    if (event.lactationEffect !== "no visible lactation" && !/nude|open|shifted|lingerie/i.test(event.clothingState)) diagnostics.push({ severity: "warning", message: `Event ${index + 1} enables lactation, but the selected clothing may hide the chest.` });
  });
  if (basic.sceneType === "solo" && /second woman|two women|both women|partner|couple|mutual|each other|male/i.test(customNotes)) diagnostics.push({ severity: "warning", message: "Global notes may imply another person in Solo mode." });
  if (basic.sceneType === "solo" && /male|partner|two women|both women/i.test(soundscape)) diagnostics.push({ severity: "info", message: "Partner-like audio is automatically converted to a Solo-only soundscape." });
  if (!events.length) diagnostics.push({ severity: "info", message: "Add timeline events for precise shot and focus control." });
  return diagnostics;
}
