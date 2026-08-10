export type Mode = "T2V" | "I2V" | "FLF" | "S2V";
export type UiLanguage = "ENG" | "JAP";

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
  maleActor: boolean;
  maleBodyType: string;
  maleAgeFeel: string;
  maleFaceVisible: boolean;
  duration: number;
  style: string;
  lighting: string;
  captureDevice: string;
  focalLength: string;
  subjectDistance: string;
  handheldShake: boolean;
  handheldStyle: string;
  model: string;
  resolution: "512P" | "768P" | "1080P";
  promptOptimizer: boolean;
  fastPretreatment: boolean;
  firstFrameImage: string;
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
  pose: string;
  expression: string;
  adultToy: string;
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
  soloActions: MasterItem[];
  cameras: MasterItem[];
  expressions: MasterItem[];
  adultToys: MasterItem[];
  soundPresets: MasterItem[];
  musicOptions: MasterItem[];
  stylePresets: MasterItem[];
  lightingOptions: MasterItem[];
  maleBodyTypes: MasterItem[];
  maleAgeFeels: MasterItem[];
  poses: MasterItem[];
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
