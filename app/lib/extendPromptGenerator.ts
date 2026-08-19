import type { PromptSnapshot, TimelineEvent } from "./types";
import { AUTO_POSE } from "./constants";

const clean = (value = "") => value.trim().replace(/[.\s]+$/, "");
const time = (value: number) => Number(value.toFixed(2)).toString();

const sourceLabel = (state: PromptSnapshot) => {
  if (state.basic.extendMethod === "last-frame") return "@Image 1";
  return "@Video 1";
};

const referenceLines = (state: PromptSnapshot, japanese: boolean) => {
  const { basic } = state;
  const lines: string[] = [];
  let nextImage = 1;

  if (basic.extendMethod === "last-frame") {
    lines.push(japanese
      ? "@Image 1 は前動画の正確な最終フレーム（これを新しい動画の0.00秒のフレームとして使用し、見た目を作り直さない）"
      : "@Image 1 is the exact final frame of the previous video (use it as the exact 0.00-second frame of this continuation; do not recreate its appearance)."
    );
    nextImage = 2;
  } else {
    lines.push(japanese
      ? "@Video 1 は動画延長用参照（このクリップの末尾から、目に見えるリセットやカットなしでシームレスに続ける）"
      : "@Video 1 is the video continuation reference (continue seamlessly from the end of this clip without any visible reset or cut)."
    );
    if (basic.extendMethod === "motion-context") {
      lines.push(japanese
        ? "ComfyUI Motion Context / latent tail context を同じ末尾コンテキストとして引き継ぐ。"
        : "Use the carried ComfyUI Motion Context / latent tail context as the same source ending state."
      );
    }
  }

  if (basic.extendUseIdentityImage) {
    lines.push(japanese
      ? `@Image ${nextImage} は人物同一性ロック（顔、髪、肌、体格、衣服の固有ディテールを維持）`
      : `@Image ${nextImage} is the character identity lock (preserve face, hair, skin, body proportions, and distinctive wardrobe details exactly).`
    );
    nextImage += 1;
  }
  if (basic.extendUseEnvironmentImage) {
    lines.push(japanese
      ? `@Image ${nextImage} は環境・照明ロック（背景構造、物体配置、照明方向、色温度を維持）`
      : `@Image ${nextImage} is the environment and lighting lock (preserve scene geometry, object placement, lighting direction, and color temperature exactly).`
    );
  }
  return lines.join("\n");
};

const poseTarget = (event: TimelineEvent, sceneType: PromptSnapshot["basic"]["sceneType"]) => {
  const pose = clean(event.pose);
  const position = sceneType === "solo" ? "" : clean(event.position);
  const target = [
    position ? `relative position ${position}` : "",
    pose && pose !== AUTO_POSE ? `pose ${pose}` : "",
    clean(event.bodyOrientation),
    clean(event.upperBodyOrientation),
    clean(event.hipOrientation),
  ].filter(Boolean);
  return target.length ? target.join("; ") : "the pose and relative arrangement at the source tail";
};

const cameraTarget = (event: TimelineEvent) => [
  clean(event.cameraMotion),
  event.cameraMotion !== "locked-off static" ? clean(event.motionSpeed) : "",
  event.cameraMotion !== "locked-off static" ? clean(event.motionAmplitude) : "",
  clean(event.cameraPlacement),
  clean(event.camera),
  clean(event.shotSize),
].filter(Boolean).join("; ");

const actionDetails = (state: PromptSnapshot, event: TimelineEvent, japanese: boolean) => {
  const { basic } = state;
  const parts = [
    clean(event.action),
    clean(event.expression) ? (japanese ? `表情は${clean(event.expression)}` : `expression ${clean(event.expression)}`) : "",
    clean(event.performanceTone) ? (japanese ? `演技は${clean(event.performanceTone)}` : `performance ${clean(event.performanceTone)}`) : "",
    basic.extendPosePolicy === "transition"
      ? (japanese ? `連続した重心移動で「${poseTarget(event, basic.sceneType)}」へ自然に移行する` : `transition naturally through continuous weight transfer into ${poseTarget(event, basic.sceneType)}`)
      : (japanese ? "延長元の末尾にあるポーズ・体位・人物間の位置関係を維持する" : "maintain the exact pose, position, and spatial relationship at the source tail"),
    basic.extendClothingPolicy === "transition"
      ? (japanese ? `衣服を瞬間置換せず、目に見える連続した動きで「${clean(event.clothingState || state.clothing)}」へ移行する` : `transition wardrobe through visible, continuous garment movement into ${clean(event.clothingState || state.clothing)}; no instant replacement`)
      : (japanese ? "延長元の末尾にある衣服と着用状態を正確に維持する" : "preserve the exact wardrobe and clothing state at the source tail"),
    clean(event.additionalDetails),
  ].filter(Boolean);
  return parts.join(japanese ? "。" : "; ");
};

const endFrame = (state: PromptSnapshot, lastEvent: TimelineEvent | undefined, japanese: boolean) => {
  const explicit = clean(state.basic.extendEndingFrame);
  if (explicit) return explicit;
  if (!lastEvent) return japanese ? "動きが次の延長へ自然につながる安定した構図" : "a stable composition whose motion can continue naturally into the next extension";
  const clothing = state.basic.extendClothingPolicy === "transition" ? clean(lastEvent.clothingState || state.clothing) : (japanese ? "延長元から維持した衣服状態" : "the wardrobe state preserved from the source");
  const pose = state.basic.extendPosePolicy === "transition" ? poseTarget(lastEvent, state.basic.sceneType) : (japanese ? "末尾から維持したポーズ・体位" : "the pose and position preserved from the source tail");
  return japanese
    ? `${clean(lastEvent.shotSize)}、${clean(lastEvent.cameraPlacement)}、${pose}、${clothing}で、動きが次へ続けられる状態`
    : `${clean(lastEvent.shotSize)}, ${clean(lastEvent.cameraPlacement)}, ${pose}, ${clothing}, with motion left in a state that can continue into another extension`;
};

const sound = (state: PromptSnapshot, japanese: boolean) => {
  const dialogue = state.events.filter((event) => event.dialogueText.trim()).map((event) => japanese
    ? `${time(event.start)}–${time(event.end)}秒では「${event.dialogueText.trim()}」だけを${clean(event.dialogueDelivery)}で発話し、他の言葉を追加しない。`
    : `At ${time(event.start)}–${time(event.end)}s, speak exactly ${JSON.stringify(event.dialogueText.trim())} with ${clean(event.dialogueDelivery)}; add no other words.`
  ).join(" ");
  const noDialogue = japanese
    ? "指定された台詞以外の言葉や会話を追加しない。台詞がない区間は呼吸、息をのむ声、ため息、非言語の声だけにする。"
    : "Do not add spoken words or dialogue beyond the exact timeline dialogue. Where no line is specified, use only breathing, gasps, sighs, and nonverbal vocalization.";
  const timelineSound = state.events.length
    ? [...state.events].sort((a, b) => a.start - b.start).slice(0, 2).map((event) => `[${time(event.start)}–${time(event.end)}${japanese ? "秒" : "s"}] ${clean(event.soundscape || state.soundscape)}`).join(" ")
    : clean(state.soundscape);
  return [clean(state.basic.extendSoundContinuity), timelineSound, dialogue, noDialogue].filter(Boolean).join(" ");
};

const music = (state: PromptSnapshot, japanese: boolean) => state.events.length
  ? [...state.events].sort((a, b) => a.start - b.start).slice(0, 2).map((event) => `[${time(event.start)}–${time(event.end)}${japanese ? "秒" : "s"}] ${event.music || state.music || "N/A"}`).join(" ")
  : state.music || "N/A";

const englishPrompt = (state: PromptSnapshot, events: TimelineEvent[]) => {
  const { basic } = state;
  const source = sourceLabel(state);
  const sourceSummary = clean(basic.extendSourceSummary);
  const previousAction = clean(basic.extendPreviousAction);
  const camera = basic.extendCameraSource === "continue"
    ? `Continue the exact camera movement from ${source} at the same direction, speed, amplitude, lens perspective, horizon, and motion energy. Do not stop or restart the move.`
    : events[0]
      ? `Continue from the exact source camera path, then move smoothly without a cut toward this relative target: ${cameraTarget(events[0])}. Never jump lenses, viewpoint, horizon, or framing.`
      : `Continue the exact camera movement from ${source} at the same direction, speed, amplitude, lens perspective, horizon, and motion energy.`;
  const timeline = events.length
    ? events.map((event) => `[${time(event.start)}–${time(event.end)}s]: ${actionDetails(state, event, false)}.`).join("\n")
    : `[0–${time(basic.duration)}s]: Continue the source-tail motion with one natural next beat, stable anatomy, and no reset.`;
  const notes = events.some((event) => event.additionalDetails?.trim()) ? "" : clean(state.customNotes);

  return `[References]\n${referenceLines(state, false)}\n\n[Core idea]\nContinue directly from ${source} without a visible reset or cut. Continue the previous scene seamlessly. Preserve the exact adult cast already present, facial identity, hair, body proportions, wardrobe continuity, environment, lighting, lens, color grade, spatial relationships, sound character, and motion energy from the source tail. Do not recreate or redesign the scene.${sourceSummary ? ` Source-tail state: ${sourceSummary}.` : ""}\n\n[Process]\n${camera}\n${timeline}${notes ? `\nAdditional continuation direction: ${notes}. This may refine the next motion only and must not override the source locks.` : ""}\nEnd with ${endFrame(state, events.at(-1), false)}.\n\nDo not repeat any previous action${previousAction ? `, especially: ${previousAction}` : ""}.\nDo not introduce new characters, objects, extra limbs, duplicate people, abrupt setting changes, pose snapping, instant clothing replacement, scene cuts, or impossible camera jumps.\nPreserve every identity and environmental detail from the continuation source.\n\noverall_soundscape: ${sound(state, false)}\n\nnon_diegetic_music: ${music(state, false)}`;
};

const japanesePrompt = (state: PromptSnapshot, events: TimelineEvent[]) => {
  const { basic } = state;
  const source = sourceLabel(state);
  const sourceSummary = clean(basic.extendSourceSummary);
  const previousAction = clean(basic.extendPreviousAction);
  const camera = basic.extendCameraSource === "continue"
    ? `${source}のカメラ移動を、同じ方向・速度・振幅・レンズ感・水平線・動きの勢いのまま継続する。カメラの動きを停止や再開させない。`
    : events[0]
      ? `延長元のカメラ軌道から、カットを入れず「${cameraTarget(events[0])}」へ滑らかに移行する。レンズ、視点、水平線、構図を瞬間的に変えない。`
      : `${source}のカメラ移動を同じ方向・速度・振幅のまま継続する。`;
  const timeline = events.length
    ? events.map((event) => `[${time(event.start)}–${time(event.end)}秒]: ${actionDetails(state, event, true)}。`).join("\n")
    : `[0–${time(basic.duration)}秒]: 延長元の末尾の動きから自然な次の1ビートだけを続け、人体を安定させ、リセットを入れない。`;
  const notes = events.some((event) => event.additionalDetails?.trim()) ? "" : clean(state.customNotes);

  return `[参照]\n${referenceLines(state, true)}\n\n[中心アイデア]\n${source}から目に見えるリセットやカットなしで直接続ける。前のシーンをシームレスに延長する。延長元にいる成人の人物構成、顔、髪、体格、衣服の連続性、環境、照明、レンズ、色調、人物間の位置関係、音の特徴、動きの勢いを正確に維持し、作り直さない。${sourceSummary ? ` 延長元の末尾状態: ${sourceSummary}。` : ""}\n\n[展開]\n${camera}\n${timeline}${notes ? `\n追加の延長指示: ${notes}。この指示は次の動きだけを補足し、参照元の維持ロックを上書きしない。` : ""}\n最後は「${endFrame(state, events.at(-1), true)}」で終わる。\n\n前の動作を繰り返さない${previousAction ? `。特に「${previousAction}」を繰り返さない` : ""}。\n新しい人物・物体・余分な手足・人物複製・急な場所変更・ポーズの瞬間切替・衣服の瞬間置換・場面カット・不可能なカメラ移動を入れない。\n延長元の人物同一性と環境ディテールをすべて維持する。\n\noverall_soundscape: ${sound(state, true)}\n\nnon_diegetic_music: ${music(state, true)}`;
};

export function generateExtendPrompt(state: PromptSnapshot): string {
  const events = [...state.events].sort((a, b) => a.start - b.start).slice(0, 2);
  return state.basic.extendPromptLanguage === "japanese" ? japanesePrompt(state, events) : englishPrompt(state, events);
}

export interface ExtendPromptDiagnostic { severity: "error" | "warning" | "info"; message: string }

export function diagnoseExtendPrompt(state: PromptSnapshot): ExtendPromptDiagnostic[] {
  const diagnostics: ExtendPromptDiagnostic[] = [];
  const prompt = generateExtendPrompt(state);
  if (state.basic.duration < 4 || state.basic.duration > 15 || !Number.isInteger(state.basic.duration)) diagnostics.push({ severity: "error", message: "Extension duration must be an integer from 4 to 15 seconds." });
  if (prompt.length > 7000) diagnostics.push({ severity: "error", message: `Extension prompt is ${prompt.length - 7000} characters over the 7,000-character target.` });
  else if (prompt.length > 5000) diagnostics.push({ severity: "warning", message: "The extension prompt is long; one or two clear beats usually preserve continuity better." });
  if (!state.basic.extendSourceSummary.trim()) diagnostics.push({ severity: "info", message: "Describe the source clip's final state so the next action can avoid repeating it." });
  if (!state.basic.extendPreviousAction.trim()) diagnostics.push({ severity: "info", message: "Add the action already completed in the source clip to make the no-repeat rule more precise." });
  if (!state.basic.extendEndingFrame.trim()) diagnostics.push({ severity: "info", message: "The ending frame is inferred from the final beat; specify it explicitly for easier chaining." });
  if (state.events.length > 2) diagnostics.push({ severity: "warning", message: "Only the first two continuation beats are emitted. Keep a 4–15 second extension to one or two beats." });
  if (state.basic.extendMethod === "last-frame") diagnostics.push({ severity: "info", message: "Last-frame chaining preserves appearance but carries less motion information than a video reference." });
  if (state.basic.extendCameraSource === "prompt") diagnostics.push({ severity: "warning", message: "A new camera target can drift from the source; use Continue source movement for maximum continuity." });
  return diagnostics;
}
