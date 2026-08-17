export type Mode = "T2V" | "I2V" | "FLF" | "S2V";
export type UiLanguage = "ENG" | "JAP";
export type SceneType = "solo" | "male-female" | "female-female";
export type I2VStartSource = "reference-image" | "prompt";
export type I2VMotionIntensity = "subtle" | "moderate" | "strong";
export type I2VTransitionTiming = "slow" | "balanced" | "fast";

export type AgeValue =
  | { kind: "exact"; value: number }
  | { kind: "range"; min: number; max: number };

export interface BasicSettings {
  mode: Mode;
  age: AgeValue;
  bodyType: string;
  bustSize: string;
  hair: string;
  eyes: string;
  skin: string;
  sceneType: SceneType;
  maleActor: boolean;
  maleBodyType: string;
  maleAgeFeel: string;
  maleFaceVisible: boolean;
  femalePartnerAge: AgeValue;
  femalePartnerBodyType: string;
  femalePartnerBustSize: string;
  femalePartnerHair: string;
  duration: number;
  style: string;
  lighting: string;
  captureDevice: string;
  focalLength: string;
  subjectDistance: string;
  useNumericCameraHints: boolean;
  includeReferenceVideoNote: boolean;
  handheldShake: boolean;
  handheldStyle: string;
  model: string;
  resolution: "512P" | "768P" | "1080P";
  promptOptimizer: boolean;
  fastPretreatment: boolean;
  firstFrameImage: string;
  i2vClothingStartSource: I2VStartSource;
  i2vPoseStartSource: I2VStartSource;
  i2vBackgroundSource: I2VStartSource;
  i2vCameraSource: I2VStartSource;
  i2vMotionIntensity: I2VMotionIntensity;
  i2vTransitionTiming: I2VTransitionTiming;
  lastFrameImage: string;
  subjectReferenceImage: string;
  preserveIdentity: boolean;
  preserveWardrobe: boolean;
  stabilizeAnatomy: boolean;
  stabilizeBackground: boolean;
  preserveLighting: boolean;
  preventCameraTeleport: boolean;
  continuousTake: boolean;
}

export interface TimelineEvent {
  id: string;
  start: number;
  end: number;
  position: string;
  action: string;
  clothingState: string;
  camera: string;
  bodyOrientation: string;
  upperBodyOrientation: string;
  hipOrientation: string;
  cameraPlacement: string;
  shotSize: string;
  visualResult: string;
  cameraMotion: string;
  motionAmplitude: string;
  motionSpeed: string;
  pose: string;
  expression: string;
  performanceTone: string;
  consentDirection: string;
  perspirationEffect: string;
  lotionEffect: string;
  lactationEffect: string;
  dialogueText: string;
  dialogueDelivery: string;
  adultToy: string;
  partnerHandAction: string;
  intimacyMode: "standard intimate contact" | "consensual anal intercourse";
  additionalDetails: string;
  shotNumber: number;
  transition: string;
  cameraCommands: string[];
  aperture: string;
  depthOfField: string;
  focusTarget: string;
  focusBehavior: string;
  frameRate: string;
  shutterAngle: string;
  /** Visual Composer metadata. Camera placement is authoritative for mapped body direction. */
  visualPosePreset?: string;
  visualCameraPoint?: string;
  visualBodyDirection?: string;
  visualCameraHeight?: string;
  visualFraming?: string;
}

export interface PromptSnapshot {
  basic: BasicSettings;
  situation: string;
  clothing: string;
  events: TimelineEvent[];
  soundscape: string;
  music: string;
  customNotes: string;
}

export interface SavedPreset {
  id: string;
  name: string;
  savedAt: string;
  snapshot: PromptSnapshot;
}

export interface MasterItem {
  value: string;
  japanese: string;
}

export interface MasterData {
  bodyTypes: MasterItem[];
  bustSizes: MasterItem[];
  hairStyles: MasterItem[];
  eyeStyles: MasterItem[];
  skinOptions: MasterItem[];
  situations: MasterItem[];
  clothings: MasterItem[];
  positions: MasterItem[];
  partnerActions: MasterItem[];
  lesbianPositions: MasterItem[];
  lesbianActions: MasterItem[];
  partnerHandActions: MasterItem[];
  soloActions: MasterItem[];
  cameras: MasterItem[];
  shotSizes: MasterItem[];
  visualResults: MasterItem[];
  cameraMotions: MasterItem[];
  motionAmplitudes: MasterItem[];
  motionSpeeds: MasterItem[];
  expressions: MasterItem[];
  performanceTones: MasterItem[];
  consentDirections: MasterItem[];
  perspirationEffects: MasterItem[];
  lotionEffects: MasterItem[];
  lactationEffects: MasterItem[];
  dialogueDeliveries: MasterItem[];
  adultToys: MasterItem[];
  soundPresets: MasterItem[];
  musicOptions: MasterItem[];
  stylePresets: MasterItem[];
  lightingOptions: MasterItem[];
  maleBodyTypes: MasterItem[];
  maleAgeFeels: MasterItem[];
  poses: MasterItem[];
  bodyOrientations: MasterItem[];
  upperBodyOrientations: MasterItem[];
  hipOrientations: MasterItem[];
  cameraPlacements: MasterItem[];
  captureDevices: MasterItem[];
  focalLengths: MasterItem[];
  subjectDistances: MasterItem[];
  handheldStyles: MasterItem[];
  apertures: MasterItem[];
  depthOfFieldOptions: MasterItem[];
  focusTargets: MasterItem[];
  focusBehaviors: MasterItem[];
  frameRates: MasterItem[];
  shutterAngles: MasterItem[];
  shotTransitions: MasterItem[];
}

export type MasterCategory = keyof MasterData;
