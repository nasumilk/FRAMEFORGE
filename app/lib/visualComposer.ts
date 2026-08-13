import type { SceneType, TimelineEvent, UiLanguage } from "./types";

export type RigPose = "standing" | "kneeling" | "seated" | "reclining" | "all-fours" | "side-lying";

export interface VisualPosePreset {
  id: string;
  label: Record<UiLanguage, string>;
  description: Record<UiLanguage, string>;
  scenes: SceneType[];
  primaryRig: RigPose;
  partnerRig?: RigPose;
  patch: Partial<TimelineEvent>;
}

export interface VisualOption<T extends string = string> {
  id: string;
  label: Record<UiLanguage, string>;
  patch: Partial<TimelineEvent>;
  value?: T;
}

const frontPatch: Partial<TimelineEvent> = {
  bodyOrientation: "front-facing toward the camera with shoulders and hips squared to the lens",
  upperBodyOrientation: "face, shoulders, and chest oriented directly toward the camera",
  hipOrientation: "hips squared toward the camera",
};

export const VISUAL_POSE_PRESETS: VisualPosePreset[] = [
  {
    id: "solo-standing",
    label: { ENG: "Standing", JAP: "立ち姿" },
    description: { ENG: "Relaxed full-body stance", JAP: "自然な全身の立ち姿" },
    scenes: ["solo"],
    primaryRig: "standing",
    patch: { position: "", pose: "standing in a relaxed pose", ...frontPatch },
  },
  {
    id: "solo-kneeling",
    label: { ENG: "Kneeling", JAP: "膝立ち" },
    description: { ENG: "Upright kneeling pose", JAP: "上体を起こした膝立ち" },
    scenes: ["solo"],
    primaryRig: "kneeling",
    patch: { position: "", pose: "kneeling upright", ...frontPatch },
  },
  {
    id: "solo-seated",
    label: { ENG: "M-shape seated", JAP: "M字座り" },
    description: { ENG: "Seated with knees apart", JAP: "膝を開いた着座ポーズ" },
    scenes: ["solo"],
    primaryRig: "seated",
    patch: { position: "", pose: "seated M-shaped leg-spread pose", ...frontPatch },
  },
  {
    id: "solo-reclining",
    label: { ENG: "Reclining", JAP: "仰向け" },
    description: { ENG: "Reclining with raised knees", JAP: "膝を上げた仰向け" },
    scenes: ["solo"],
    primaryRig: "reclining",
    patch: { position: "", pose: "reclining with knees drawn toward her chest", ...frontPatch },
  },
  {
    id: "solo-all-fours",
    label: { ENG: "All fours", JAP: "四つん這い" },
    description: { ENG: "Stable all-fours pose", JAP: "安定した四つん這い" },
    scenes: ["solo"],
    primaryRig: "all-fours",
    patch: { position: "", pose: "on all fours with an arched back", ...frontPatch },
  },
  {
    id: "mf-missionary",
    label: { ENG: "Face-to-face reclined", JAP: "対面・仰向け" },
    description: { ENG: "Primary woman reclined, partner above", JAP: "女性が仰向け、相手が上側" },
    scenes: ["male-female"],
    primaryRig: "reclining",
    partnerRig: "kneeling",
    patch: { position: "missionary position", pose: "lying on her back", ...frontPatch },
  },
  {
    id: "mf-rear-all-fours",
    label: { ENG: "Rear / all fours", JAP: "後方・四つん這い" },
    description: { ENG: "Partner behind, primary face visible", JAP: "相手は後方、女性の顔は正面に見せる" },
    scenes: ["male-female"],
    primaryRig: "all-fours",
    partnerRig: "kneeling",
    patch: {
      position: "doggy style",
      pose: "on all fours with an arched back",
      bodyOrientation: "facing the camera while the head and eyes look directly into the lens",
      upperBodyOrientation: "face, shoulders, and chest oriented directly toward the camera",
      hipOrientation: "hips directed away from the camera toward the partner behind her",
      cameraPlacement: "camera positioned directly in front of the primary woman at her eye level while she is on all fours",
    },
  },
  {
    id: "mf-seated",
    label: { ENG: "Seated face-to-face", JAP: "対面座位" },
    description: { ENG: "Close seated embrace", JAP: "密着した対面の着座姿勢" },
    scenes: ["male-female"],
    primaryRig: "seated",
    partnerRig: "seated",
    patch: {
      position: "sitting face-to-face (lotus)",
      pose: "seated on the edge of the bed with legs apart",
      bodyOrientation: "facing the partner while keeping the torso open toward the camera",
      upperBodyOrientation: "upper body oriented toward the partner",
      hipOrientation: "hips follow the selected pose naturally",
    },
  },
  {
    id: "mf-spooning",
    label: { ENG: "Side-by-side", JAP: "横向き密着" },
    description: { ENG: "Both performers lying on their sides", JAP: "二人とも横向きに寝た姿勢" },
    scenes: ["male-female"],
    primaryRig: "side-lying",
    partnerRig: "side-lying",
    patch: {
      position: "spooning position",
      pose: "lying on her side",
      bodyOrientation: "side profile to the camera",
      upperBodyOrientation: "head and eyes turned toward the camera while the shoulders follow the selected pose",
      hipOrientation: "hips side-on to the camera",
    },
  },
  {
    id: "mf-standing-rear",
    label: { ENG: "Standing rear", JAP: "立位・後方" },
    description: { ENG: "Primary supported, partner behind", JAP: "女性を支え、相手は後方" },
    scenes: ["male-female"],
    primaryRig: "standing",
    partnerRig: "standing",
    patch: {
      position: "from behind while standing against wall",
      pose: "bent forward while supported by a stable surface",
      bodyOrientation: "three-quarter view toward the camera",
      upperBodyOrientation: "head and eyes turned toward the camera while the shoulders follow the selected pose",
      hipOrientation: "hips directed away from the camera toward the partner behind her",
    },
  },
  {
    id: "ff-standing-embrace",
    label: { ENG: "Standing embrace", JAP: "立位で抱擁" },
    description: { ENG: "Two women facing each other", JAP: "女性二人が向かい合う" },
    scenes: ["female-female"],
    primaryRig: "standing",
    partnerRig: "standing",
    patch: {
      position: "standing face-to-face embrace",
      pose: "standing in a relaxed pose",
      bodyOrientation: "facing the partner while keeping the torso open toward the camera",
      upperBodyOrientation: "upper body oriented toward the partner",
      hipOrientation: "hips at a three-quarter angle to the camera",
    },
  },
  {
    id: "ff-seated-embrace",
    label: { ENG: "Seated embrace", JAP: "対面座位" },
    description: { ENG: "Close lap-height composition", JAP: "膝上で密着する構図" },
    scenes: ["female-female"],
    primaryRig: "seated",
    partnerRig: "seated",
    patch: {
      position: "seated lap-to-lap embrace",
      pose: "seated on the edge of the bed with legs apart",
      bodyOrientation: "facing the partner while keeping the torso open toward the camera",
      upperBodyOrientation: "upper body oriented toward the partner",
      hipOrientation: "hips follow the selected pose naturally",
    },
  },
  {
    id: "ff-side-by-side",
    label: { ENG: "Side-by-side", JAP: "横並び" },
    description: { ENG: "Both women visible in profile", JAP: "二人の横姿が見える構図" },
    scenes: ["female-female"],
    primaryRig: "side-lying",
    partnerRig: "side-lying",
    patch: {
      position: "side-by-side intimate position",
      pose: "lying on her side",
      bodyOrientation: "side profile to the camera",
      upperBodyOrientation: "head and eyes turned toward the camera while the shoulders follow the selected pose",
      hipOrientation: "hips side-on to the camera",
    },
  },
  {
    id: "ff-kneeling-reclining",
    label: { ENG: "Kneeling / reclined", JAP: "膝立ち・仰向け" },
    description: { ENG: "One kneeling, one reclined", JAP: "一人が膝立ち、もう一人が仰向け" },
    scenes: ["female-female"],
    primaryRig: "reclining",
    partnerRig: "kneeling",
    patch: { position: "one woman kneeling between the other woman's legs", pose: "lying on her back", ...frontPatch },
  },
];

export const CAMERA_POINTS: VisualOption[] = [
  { id: "front", label: { ENG: "Front", JAP: "正面" }, patch: { visualCameraPoint: "front", cameraPlacement: "camera positioned directly in front of the primary woman at her eye level" } },
  { id: "front-left", label: { ENG: "Front L", JAP: "左斜め前" }, patch: { visualCameraPoint: "front-left", cameraPlacement: "camera positioned at a three-quarter front view of the primary woman" } },
  { id: "front-right", label: { ENG: "Front R", JAP: "右斜め前" }, patch: { visualCameraPoint: "front-right", cameraPlacement: "camera positioned at a three-quarter front view of the primary woman" } },
  { id: "left", label: { ENG: "Left", JAP: "左側面" }, patch: { visualCameraPoint: "left", cameraPlacement: "camera positioned directly beside the primary woman" } },
  { id: "right", label: { ENG: "Right", JAP: "右側面" }, patch: { visualCameraPoint: "right", cameraPlacement: "camera positioned directly beside the primary woman" } },
  { id: "rear-left", label: { ENG: "Rear L", JAP: "左斜め後ろ" }, patch: { visualCameraPoint: "rear-left", cameraPlacement: "camera positioned behind the primary woman at a three-quarter rear view" } },
  { id: "rear", label: { ENG: "Rear", JAP: "背面" }, patch: { visualCameraPoint: "rear", cameraPlacement: "camera positioned behind the primary woman" } },
  { id: "rear-right", label: { ENG: "Rear R", JAP: "右斜め後ろ" }, patch: { visualCameraPoint: "rear-right", cameraPlacement: "camera positioned behind the primary woman at a three-quarter rear view" } },
];

export const BODY_DIRECTIONS: VisualOption[] = [
  { id: "front", label: { ENG: "Face camera", JAP: "カメラへ正面" }, patch: { visualBodyDirection: "front", ...frontPatch } },
  { id: "three-quarter", label: { ENG: "3/4 toward camera", JAP: "カメラへ斜め" }, patch: { visualBodyDirection: "three-quarter", bodyOrientation: "three-quarter view toward the camera", upperBodyOrientation: "chest open toward the camera in a three-quarter view", hipOrientation: "hips at a three-quarter angle to the camera" } },
  { id: "profile", label: { ENG: "Profile", JAP: "側面" }, patch: { visualBodyDirection: "profile", bodyOrientation: "side profile to the camera", upperBodyOrientation: "head and eyes turned toward the camera while the shoulders follow the selected pose", hipOrientation: "hips side-on to the camera" } },
  { id: "rear-look", label: { ENG: "Back / look over", JAP: "背面・振り向き" }, patch: { visualBodyDirection: "rear-look", bodyOrientation: "back facing the camera while looking over her shoulder", upperBodyOrientation: "head and eyes turned toward the camera while the shoulders follow the selected pose", hipOrientation: "hips directed away from the camera toward the partner behind her" } },
];

export const CAMERA_HEIGHTS: VisualOption[] = [
  { id: "low", label: { ENG: "Low", JAP: "ロー" }, patch: { visualCameraHeight: "low", camera: "low angle" } },
  { id: "eye", label: { ENG: "Eye level", JAP: "アイレベル" }, patch: { visualCameraHeight: "eye", camera: "eye-level angle" } },
  { id: "high", label: { ENG: "High", JAP: "ハイ" }, patch: { visualCameraHeight: "high", camera: "slight high angle" } },
];

export const FRAMINGS: VisualOption[] = [
  { id: "close", label: { ENG: "Close", JAP: "クローズ" }, patch: { visualFraming: "close", shotSize: "close-up of the face and shoulders", visualResult: "shallow depth of field with a softly blurred background" } },
  { id: "waist", label: { ENG: "Waist up", JAP: "腰上" }, patch: { visualFraming: "waist", shotSize: "medium shot from the waist up", visualResult: "natural perspective with a balanced relationship between subject and environment" } },
  { id: "knees", label: { ENG: "Knees up", JAP: "膝上" }, patch: { visualFraming: "knees", shotSize: "medium full shot from the knees up", visualResult: "natural perspective with a balanced relationship between subject and environment" } },
  { id: "full", label: { ENG: "Full body", JAP: "全身" }, patch: { visualFraming: "full", shotSize: "wide shot, full body visible with generous space around the subject", visualResult: "wide-angle look with generous environmental space and mild perspective expansion" } },
  { id: "wide", label: { ENG: "Environment", JAP: "環境込み" }, patch: { visualFraming: "wide", shotSize: "wide establishing shot, full body visible with lots of environment", visualResult: "wide-angle look with generous environmental space and mild perspective expansion" } },
];

export const CAMERA_MOVES: VisualOption[] = [
  { id: "static", label: { ENG: "Static", JAP: "固定" }, patch: { cameraMotion: "locked-off static", motionAmplitude: "small amplitude", motionSpeed: "very slow speed" } },
  { id: "push", label: { ENG: "Push in", JAP: "寄る" }, patch: { cameraMotion: "pushes in toward the subject", motionAmplitude: "small amplitude", motionSpeed: "slow speed" } },
  { id: "track", label: { ENG: "Track", JAP: "並走" }, patch: { cameraMotion: "tracks beside the subject", motionAmplitude: "medium amplitude", motionSpeed: "medium speed" } },
  { id: "arc", label: { ENG: "Arc", JAP: "回り込み" }, patch: { cameraMotion: "arcs around the subject", motionAmplitude: "small amplitude", motionSpeed: "slow speed" } },
];

export function visualPoseForEvent(event: TimelineEvent, sceneType: SceneType): VisualPosePreset {
  const available = VISUAL_POSE_PRESETS.filter((preset) => preset.scenes.includes(sceneType));
  return available.find((preset) => preset.id === event.visualPosePreset)
    ?? available.find((preset) => preset.patch.position === event.position)
    ?? available[0];
}
