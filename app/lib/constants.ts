import type { MasterData } from "./types";
import { japaneseOption } from "./localization";

export const BODY_TYPES = [
  "slender",
  "petite adult",
  "glamorous",
  "curvy",
  "soft and plump",
  "athletic",
  "slim with wide hips",
];

export const BUST_SIZES = [
  "A-cup breasts",
  "B-cup breasts",
  "C-cup breasts",
  "D-cup breasts",
  "E-cup breasts",
  "F-cup breasts",
  "G-cup breasts",
  "H-cup breasts",
  "I-cup breasts",
];

// H3 tends to respond more reliably to relative visual descriptions than to
// Japanese cup labels. The UI keeps familiar A-I labels while prompt output
// uses these explicit size-and-shape descriptions.
export const BUST_PROMPT_DESCRIPTIONS: Record<string, string> = {
  A: "very small, petite natural breasts with subtle projection and a gently perky shape",
  B: "small, perky natural breasts with a compact rounded shape",
  C: "medium, average-sized natural breasts with a balanced rounded shape",
  D: "moderately large, full natural breasts with a clearly rounded shape",
  E: "large, full natural breasts with soft natural weight and a rounded shape",
  F: "very large, full natural breasts with soft weight and natural movement",
  G: "very large, heavy natural breasts with pronounced fullness and soft movement",
  H: "huge, heavy natural breasts with an extremely full rounded shape and soft movement",
  I: "massive, very heavy natural breasts with maximum fullness and visibly soft movement",
};

export const HAIR_STYLES = [
  "long straight black hair",
  "long wavy black hair",
  "shoulder-length black hair",
  "bob cut black hair",
  "long brown hair",
  "ponytail black hair",
  "messy long black hair",
  "elegant updo",
];

export const EYE_STYLES = [
  "large brown eyes",
  "dark brown eyes",
  "deep black eyes",
  "gentle brown eyes",
];

export const SKIN_OPTIONS = [
  "fair Japanese skin with realistic texture",
  "warm ivory Japanese skin with natural pores",
  "lightly tanned Japanese skin with a subtle sheen",
];

export const SITUATIONS = [
  "love hotel bedroom with soft lighting",
  "private apartment bedroom at night",
  "executive office after hours",
  "private spa suite",
  "hot spring private room",
  "bathroom with steam",
  "boutique fitting room after closing",
  "parked car interior at night",
  "apartment balcony at night",
  "adult cosplay photoshoot studio",
  "private massage room",
  "secluded night garden",
  "traditional Japanese room with tatami",
];

export const CLOTHINGS = [
  "tailored white blouse and tight black skirt",
  "French maid-inspired adult cosplay outfit",
  "medical-themed adult cosplay outfit",
  "lightly opened kimono or yukata",
  "tight knit sweater dress",
  "mini skirt with knee-high socks",
  "black lace lingerie",
  "white lace lingerie",
  "red lace lingerie",
  "competition swimsuit",
  "partially shifted clothing",
  "fully nude",
  "thigh-high stockings only",
];

export const POSITIONS = [
  "missionary position",
  "cowgirl position",
  "reverse cowgirl position",
  "rear-entry position",
  "standing rear-entry position",
  "sitting face-to-face",
  "spooning position",
  "standing embrace while being held",
  "prone position",
  "legs-raised missionary position",
  "mutual oral position",
  "oral stimulation",
  "breast stimulation",
  "manual stimulation while kissing",
  "from behind while standing against a wall",
];

export const PARTNER_ACTIONS = [
  "passionate kissing and caressing",
  "slowly undressing and shifting clothes",
  "intimate contact beginning",
  "slow rhythmic movement",
  "intense rhythmic movement",
  "changing position with continuous contact",
  "approaching climax with trembling",
  "shared climax",
  "external finish",
  "afterglow cuddling and kissing",
  "camera slowly pushing in",
  "close-up of intertwined bodies",
  "looking at the camera with an intense expression",
];

export const PARTNER_HAND_ACTIONS = [
  "both hands firmly supporting the adult woman's hips",
  "both hands kneading the adult woman's breasts with anatomically natural finger placement",
  "fingertips stimulating the adult woman's nipples while the palms support her breasts",
  "one hand kneading her breast while the other hand supports her hip",
  "one hand stimulating her nipple while the other hand holds her waist",
  "one hand caressing her chest while the other hand supports her lower back",
  "both hands holding her thighs in a stable and physically plausible grip",
  "one hand interlaced with hers while the other hand caresses her breast",
];

export const LESBIAN_POSITIONS = [
  "face-to-face embrace between two adult women",
  "side-by-side scissoring position",
  "face-to-face tribadism position",
  "mutual oral 69 position between two adult women",
  "one woman kneeling between the reclining woman's thighs",
  "one woman straddling the other woman's thigh",
  "spooning position with the second woman behind",
  "seated lap embrace between two adult women",
  "one woman reclining while the second woman leans over her",
  "standing face-to-face against a wall",
];

export const LESBIAN_ACTIONS = [
  "the two adult women kiss passionately and caress each other",
  "they slowly undress each other while maintaining eye contact",
  "the second woman massages and stimulates the first woman's breasts and nipples",
  "the second woman performs deliberate manual vulva stimulation",
  "the second woman performs oral stimulation on the reclining woman",
  "both women perform mutual oral stimulation",
  "the two women perform slow rhythmic tribadism",
  "the two women perform intense rhythmic scissoring",
  "the second woman uses a selected adult toy on the first woman",
  "the two women change positions while maintaining continuous intimate contact",
  "both women approach a shared climax with trembling",
  "the two women cuddle and kiss during the afterglow",
];

export const SOLO_ACTIONS = [
  "slowly undressing and caressing her body",
  "sensual self-touch while reclining",
  "slow rhythmic solo movement",
  "using an adult toy with deliberate movement",
  "approaching climax with trembling",
  "climax with a breathless expression",
  "afterglow while resting on the bed",
  "camera slowly pushing in",
  "looking at the camera with an intense expression",
];

export const MALE_POV_CAMERA = "male performer POV, first-person perspective";

export const CAMERAS = [
  "eye-level angle",
  "low angle",
  "slight high angle",
  "side profile",
  "over-the-shoulder",
  MALE_POV_CAMERA,
];

export const SHOT_SIZES = [
  "extreme close-up of the face, facial details fill the frame",
  "close-up of the face and shoulders",
  "medium close-up from the chest up",
  "medium shot from the waist up",
  "medium full shot from the knees up",
  "wide shot, full body visible with generous space around the subject",
  "wide establishing shot, full body visible with lots of environment",
];

export const VISUAL_RESULTS = [
  "natural perspective with a balanced relationship between subject and environment",
  "shallow depth of field with a softly blurred background",
  "background heavily blurred, isolating the subject",
  "long-lens look, background compressed and appearing close to the subject",
  "wide-angle look with generous environmental space and mild perspective expansion",
  "intimate close framing with the face and hands visually dominant",
];

export const CAMERA_MOTIONS = [
  "locked-off static",
  "pushes in toward the subject",
  "pulls back from the subject",
  "pans left",
  "pans right",
  "tracks beside the subject",
  "arcs around the subject",
  "tilts up",
  "tilts down",
];

export const MOTION_AMPLITUDES = ["small amplitude", "medium amplitude", "large amplitude"];
export const MOTION_SPEEDS = ["very slow speed", "slow speed", "medium speed", "fast speed"];

export const EXPRESSIONS = [
  "flushed cheeks, slightly open mouth, eyes half-closed",
  "intense pleasure expression with unfocused eyes",
  "shy but aroused expression",
  "looking directly at her partner with affection and desire",
  "biting her lip while breathing heavily",
  "moaning with her mouth open",
];

export const PERFORMANCE_TONES = [
  "openly enthusiastic, actively participating, and clearly enjoying every moment",
  "affectionate and emotionally connected with warm reciprocal reactions",
  "playful and teasing with confident eye contact and inviting body language",
  "confident and assertive while directing the pace of the encounter",
  "shy but clearly consenting, gradually becoming more expressive and engaged",
  "initially nervous but clearly consenting, relaxing after a reassuring check-in",
  "intensely submissive within mutually agreed boundaries while remaining responsive",
  "consensually dominant, confidently guiding her partner within agreed boundaries",
  "emotionally overwhelmed by pleasure while continuing clear affirmative participation",
  "quiet and sensual with subtle but unmistakably positive responses",
];

export const CONSENT_DIRECTIONS = [
  "continuous enthusiastic verbal and physical consent from both adult performers",
  "clear affirmative consent before each escalation in intensity",
  "the partner checks her comfort and she gives an unmistakably positive confirmation",
  "mutually agreed power-play with established boundaries and a safeword",
  "slow escalation only after explicit permission and positive reciprocal movement",
  "either adult performer can pause at any moment and the partner responds immediately",
];

export const PERSPIRATION_EFFECTS = [
  "no visible perspiration",
  "a subtle natural sweat sheen on her skin",
  "fine beads of perspiration on her forehead, neck, and upper chest",
  "moderate realistic perspiration glistening across her face and body",
  "heavy realistic perspiration with visible droplets running naturally along her skin",
];

export const LOTION_EFFECTS = [
  "no visible lotion",
  "a light transparent lotion sheen on selected areas of her skin",
  "a moderate layer of clear glossy lotion spread naturally across her body",
  "a generous coating of clear viscous lotion with realistic highlights and slow movement",
  "clear lotion applied mainly to her chest and upper body",
  "clear lotion applied mainly to her hips, thighs, and lower body",
];

export const LACTATION_EFFECTS = [
  "no visible lactation",
  "a subtle small amount of breast milk visible at her nipples",
  "small realistic droplets of breast milk forming at her nipples",
  "a moderate natural flow of breast milk from her nipples",
  "visible breast milk tracing naturally down the skin of her chest",
];

export const DIALOGUE_DELIVERIES = [
  "softly whispered in Japanese between breaths",
  "spoken clearly in natural Japanese",
  "breathlessly spoken in Japanese with short pauses",
  "playfully spoken in Japanese",
  "quietly murmured in Japanese",
  "spoken in Japanese with an affectionate tone",
];

export const SOUND_PRESETS = [
  "heavy breathing, intimate movement sounds, soft Japanese moans, rhythmic skin contact, and quiet bed creaking",
  "intense movement sounds, rhythmic skin contact, rising moans and gasps, and low male grunts",
  "soft sensual breathing, gentle fabric movement, and quiet whimpers and moans",
  "heavy breathing and close body movement with minimal vocalization",
];

export const MUSIC_OPTIONS = [
  "N/A",
  "soft sensual ambient",
  "slow rhythmic bass",
  "none",
];

export const STYLE_PRESETS = [
  "Photorealistic, highly detailed adult content, realistic Japanese skin texture with natural pores and subtle sweat sheen",
  "Photorealistic, soft cinematic treatment, highly detailed, realistic anatomy",
  "Photorealistic, dramatic cinematic treatment, highly detailed skin and natural movement",
];

export const LIGHTING_OPTIONS = [
  "soft warm bedside lighting",
  "low-key violet and amber lighting",
  "soft diffused window light",
  "dramatic side lighting",
  "warm practical lights with deep shadows",
];

export const MALE_BODY_TYPES = ["lean", "athletic", "muscular", "broad-shouldered"];
export const MALE_AGE_FEELS = ["early 20s adult", "late 20s", "early 30s", "mature 40s"];

export const AUTO_POSE = "automatically derived from the selected couple position";

export const POSES = [
  AUTO_POSE,
  "standing in a relaxed pose",
  "kneeling upright",
  "lying on her back",
  "lying on her side",
  "seated with legs crossed",
  "leaning forward naturally",
  "arching her back",
  "hands raised above her head",
  "seated M-shaped leg-spread pose",
  "kneeling with thighs spread apart",
  "reclining with both legs raised",
  "lying prone with hips elevated",
  "on all fours with an arched back",
  "bent forward while supported by a stable surface",
  "standing with one leg raised and supported",
  "deep squat with knees spread apart",
  "seated on the edge of the bed with legs apart",
  "side-lying with the upper leg raised",
  "standing against a wall with arms raised",
  "facing away while looking back over her shoulder",
  "kneeling while sitting back on her heels",
  "reclining with knees drawn toward her chest",
];

export const BODY_ORIENTATIONS = [
  "front-facing toward the camera with shoulders and hips squared to the lens",
  "front-facing toward the camera with a slight natural torso twist",
  "three-quarter view toward the camera",
  "facing the camera while the head and eyes look directly into the lens",
  "facing the partner while keeping the torso open toward the camera",
  "side profile to the camera",
  "back facing the camera while looking over her shoulder",
];

export const UPPER_BODY_ORIENTATIONS = [
  "face, shoulders, and chest oriented directly toward the camera",
  "head and eyes turned toward the camera while the shoulders follow the selected pose",
  "chest open toward the camera in a three-quarter view",
  "upper body oriented toward the partner",
];

export const HIP_ORIENTATIONS = [
  "hips directed away from the camera toward the partner behind her",
  "hips squared toward the camera",
  "hips at a three-quarter angle to the camera",
  "hips side-on to the camera",
  "hips follow the selected pose naturally",
];

export const CAMERA_PLACEMENTS = [
  "camera positioned directly in front of the primary woman at her eye level",
  "camera positioned directly in front of the primary woman at her eye level while she is on all fours",
  "camera positioned at a three-quarter front view of the primary woman",
  "camera positioned directly beside the primary woman",
  "camera positioned behind the primary woman",
  "camera positioned over the partner's shoulder toward the primary woman",
];

export const ADULT_TOYS = [
  "no adult toy",
  "small handheld vibrator",
  "full-size wand vibrator",
  "smooth insertable dildo",
  "suction-cup mounted dildo fixed securely to a stable surface",
  "remote-controlled wearable vibrator",
  "compact thrusting machine with a secured dildo attachment",
];

export const CAPTURE_DEVICES = [
  "consumer camcorder",
  "iPhone camera",
  "professional cinema camera",
  "compact CCD camera",
];

export const FOCAL_LENGTHS = ["18mm ultra-wide", "24mm wide-angle", "35mm natural wide", "50mm standard", "85mm portrait", "120mm telephoto"];
export const SUBJECT_DISTANCES = ["0.3m extreme close distance", "0.6m close distance", "1.5m medium distance", "3m full-body distance", "5m or more distant view"];
export const HANDHELD_STYLES = ["subtle micro-shake", "natural documentary shake", "pronounced handheld shake"];

export const VIDEO_MODELS = ["MiniMax-Hailuo-2.3", "MiniMax-Hailuo-2.3-Fast", "MiniMax-Hailuo-02", "S2V-01"];
export const RESOLUTIONS = ["512P", "768P", "1080P"] as const;
export const OFFICIAL_CAMERA_COMMANDS = [
  "Truck left", "Truck right", "Pan left", "Pan right", "Push in", "Pull out",
  "Pedestal up", "Pedestal down", "Tilt up", "Tilt down", "Zoom in", "Zoom out",
  "Shake", "Tracking shot", "Static shot",
];
export const APERTURES = ["f/1.4", "f/2", "f/2.8", "f/4", "f/5.6", "f/8", "f/11"];
export const DEPTH_OF_FIELD_OPTIONS = ["very shallow depth of field", "shallow depth of field", "moderate depth of field", "deep depth of field"];
export const FOCUS_TARGETS = ["eyes", "face", "hands", "upper body", "full body", "nearest subject", "background detail"];
export const FOCUS_BEHAVIORS = ["locked manual focus", "continuous subject-tracking autofocus", "natural rack focus", "subtle focus breathing", "brief realistic focus hunting"];
export const FRAME_RATES = ["24 fps cinematic motion", "30 fps natural video motion", "60 fps crisp fluid motion"];
export const SHUTTER_ANGLES = ["90-degree shutter", "180-degree shutter", "270-degree shutter", "360-degree shutter"];
export const SHOT_TRANSITIONS = ["continuous cut-free movement", "hard cut", "match cut", "soft dissolve", "whip-pan transition"];

export const CAPTURE_DEVICE_DESCRIPTIONS: Record<string, string> = {
  "consumer camcorder": "consumer-grade digital camcorder footage with modest dynamic range, visible electronic sharpening, responsive auto-exposure, slight white-balance drift, and practical home-video clarity",
  "iPhone camera": "modern iPhone video with computational HDR, crisp micro-detail, controlled highlights, smartphone color science, mild digital sharpening, and stabilized rolling-shutter motion",
  "professional cinema camera": "professional cinema-camera footage with high dynamic range, organic highlight roll-off, rich color depth, clean low-light detail, natural skin tones, and cinematic motion rendering",
  "compact CCD camera": "compact CCD-camera footage with lower resolution, direct contrast, slight color bleed, pronounced luminance noise, harder highlights, and an authentic small-sensor electronic-video texture",
};

export const FOCAL_LENGTH_VISUAL_RESULTS: Record<string, string> = {
  "18mm ultra-wide": "very wide-angle look with strong environmental presence and noticeable perspective expansion",
  "24mm wide-angle": "wide-angle look with the full body visible and generous space around the subject",
  "35mm natural wide": "natural wide view balancing the subject with the surrounding environment",
  "50mm standard": "natural perspective with balanced proportions and minimal visual distortion",
  "85mm portrait": "tight portrait look with shallow depth of field and a strongly blurred background",
  "120mm telephoto": "long-lens look with a compressed background appearing close to the subject",
};

export const SUBJECT_DISTANCE_VISUAL_RESULTS: Record<string, string> = {
  "0.3m extreme close distance": "extreme close framing with facial details filling most of the frame",
  "0.6m close distance": "intimate close framing focused on the face and upper body",
  "1.5m medium distance": "medium framing showing the subject from approximately the waist up",
  "3m full-body distance": "wide framing with the full body visible and clear space around the subject",
  "5m or more distant view": "wide establishing composition with extensive environment visible",
};
const asMasterItems = (values: string[]) => values.map((value) => ({ value, japanese: japaneseOption(value) }));

export const DEFAULT_MASTER_DATA: MasterData = {
  bodyTypes: asMasterItems(BODY_TYPES),
  bustSizes: asMasterItems(BUST_SIZES),
  hairStyles: asMasterItems(HAIR_STYLES),
  eyeStyles: asMasterItems(EYE_STYLES),
  skinOptions: asMasterItems(SKIN_OPTIONS),
  situations: asMasterItems(SITUATIONS),
  clothings: asMasterItems(CLOTHINGS),
  positions: asMasterItems(POSITIONS),
  partnerActions: asMasterItems(PARTNER_ACTIONS),
  lesbianPositions: asMasterItems(LESBIAN_POSITIONS),
  lesbianActions: asMasterItems(LESBIAN_ACTIONS),
  partnerHandActions: asMasterItems(PARTNER_HAND_ACTIONS),
  soloActions: asMasterItems(SOLO_ACTIONS),
  cameras: asMasterItems(CAMERAS),
  shotSizes: asMasterItems(SHOT_SIZES),
  visualResults: asMasterItems(VISUAL_RESULTS),
  cameraMotions: asMasterItems(CAMERA_MOTIONS),
  motionAmplitudes: asMasterItems(MOTION_AMPLITUDES),
  motionSpeeds: asMasterItems(MOTION_SPEEDS),
  expressions: asMasterItems(EXPRESSIONS),
  performanceTones: asMasterItems(PERFORMANCE_TONES),
  consentDirections: asMasterItems(CONSENT_DIRECTIONS),
  perspirationEffects: asMasterItems(PERSPIRATION_EFFECTS),
  lotionEffects: asMasterItems(LOTION_EFFECTS),
  lactationEffects: asMasterItems(LACTATION_EFFECTS),
  dialogueDeliveries: asMasterItems(DIALOGUE_DELIVERIES),
  adultToys: asMasterItems(ADULT_TOYS),
  soundPresets: asMasterItems(SOUND_PRESETS),
  musicOptions: asMasterItems(MUSIC_OPTIONS),
  stylePresets: asMasterItems(STYLE_PRESETS),
  lightingOptions: asMasterItems(LIGHTING_OPTIONS),
  maleBodyTypes: asMasterItems(MALE_BODY_TYPES),
  maleAgeFeels: asMasterItems(MALE_AGE_FEELS),
  poses: asMasterItems(POSES),
  bodyOrientations: asMasterItems(BODY_ORIENTATIONS),
  upperBodyOrientations: asMasterItems(UPPER_BODY_ORIENTATIONS),
  hipOrientations: asMasterItems(HIP_ORIENTATIONS),
  cameraPlacements: asMasterItems(CAMERA_PLACEMENTS),
  captureDevices: asMasterItems(CAPTURE_DEVICES),
  focalLengths: asMasterItems(FOCAL_LENGTHS),
  subjectDistances: asMasterItems(SUBJECT_DISTANCES),
  handheldStyles: asMasterItems(HANDHELD_STYLES),
  apertures: asMasterItems(APERTURES),
  depthOfFieldOptions: asMasterItems(DEPTH_OF_FIELD_OPTIONS),
  focusTargets: asMasterItems(FOCUS_TARGETS),
  focusBehaviors: asMasterItems(FOCUS_BEHAVIORS),
  frameRates: asMasterItems(FRAME_RATES),
  shutterAngles: asMasterItems(SHUTTER_ANGLES),
  shotTransitions: asMasterItems(SHOT_TRANSITIONS),
};
