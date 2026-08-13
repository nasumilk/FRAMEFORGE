"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Camera, Crosshair, Eye, Scan, SlidersHorizontal } from "lucide-react";
import type { SceneType, TimelineEvent, UiLanguage } from "../lib/types";
import {
  BODY_DIRECTIONS,
  CAMERA_HEIGHTS,
  CAMERA_MOVES,
  CAMERA_POINTS,
  FRAMINGS,
  VISUAL_POSE_PRESETS,
  visualPoseForEvent,
  type RigPose,
  type VisualOption,
} from "../lib/visualComposer";

type Point = readonly [number, number];
type JointName = "head" | "neck" | "shoulderL" | "shoulderR" | "elbowL" | "elbowR" | "handL" | "handR" | "hip" | "hipL" | "hipR" | "kneeL" | "kneeR" | "ankleL" | "ankleR";
type Rig = Record<JointName, Point>;

const RIGS: Record<RigPose, Rig> = {
  standing: {
    head: [115, 22], neck: [115, 48], shoulderL: [84, 61], shoulderR: [146, 61], elbowL: [70, 103], elbowR: [160, 103], handL: [64, 145], handR: [166, 145], hip: [115, 125], hipL: [98, 130], hipR: [132, 130], kneeL: [94, 173], kneeR: [136, 173], ankleL: [88, 216], ankleR: [142, 216],
  },
  kneeling: {
    head: [115, 28], neck: [115, 54], shoulderL: [83, 67], shoulderR: [147, 67], elbowL: [70, 107], elbowR: [160, 107], handL: [82, 142], handR: [148, 142], hip: [115, 130], hipL: [96, 134], hipR: [134, 134], kneeL: [78, 178], kneeR: [152, 178], ankleL: [57, 207], ankleR: [173, 207],
  },
  seated: {
    head: [115, 28], neck: [115, 54], shoulderL: [84, 67], shoulderR: [146, 67], elbowL: [72, 108], elbowR: [158, 108], handL: [88, 139], handR: [142, 139], hip: [115, 128], hipL: [96, 132], hipR: [134, 132], kneeL: [58, 164], kneeR: [172, 164], ankleL: [35, 210], ankleR: [195, 210],
  },
  reclining: {
    head: [28, 117], neck: [54, 117], shoulderL: [62, 92], shoulderR: [62, 142], elbowL: [88, 77], elbowR: [88, 157], handL: [112, 69], handR: [112, 165], hip: [126, 117], hipL: [126, 101], hipR: [126, 133], kneeL: [169, 78], kneeR: [169, 156], ankleL: [211, 54], ankleR: [211, 180],
  },
  "all-fours": {
    head: [34, 62], neck: [62, 78], shoulderL: [67, 67], shoulderR: [67, 91], elbowL: [88, 119], elbowR: [101, 124], handL: [73, 181], handR: [109, 181], hip: [145, 103], hipL: [142, 90], hipR: [142, 116], kneeL: [133, 157], kneeR: [169, 154], ankleL: [107, 207], ankleR: [205, 198],
  },
  "side-lying": {
    head: [31, 110], neck: [58, 111], shoulderL: [65, 95], shoulderR: [65, 128], elbowL: [92, 84], elbowR: [92, 143], handL: [116, 80], handR: [117, 151], hip: [128, 116], hipL: [128, 103], hipR: [128, 131], kneeL: [168, 109], kneeR: [173, 145], ankleL: [213, 102], ankleR: [214, 164],
  },
};

const BONES: Array<readonly [JointName, JointName]> = [
  ["head", "neck"], ["neck", "shoulderL"], ["neck", "shoulderR"], ["shoulderL", "elbowL"], ["elbowL", "handL"], ["shoulderR", "elbowR"], ["elbowR", "handR"], ["neck", "hip"], ["hip", "hipL"], ["hip", "hipR"], ["hipL", "kneeL"], ["kneeL", "ankleL"], ["hipR", "kneeR"], ["kneeR", "ankleR"],
];

function boneStyle(from: Point, to: Point): CSSProperties {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  return {
    left: from[0],
    top: from[1],
    width: Math.sqrt(dx * dx + dy * dy),
    transform: `rotate(${Math.atan2(dy, dx) * (180 / Math.PI)}deg)`,
  };
}

function BoneFigure({ pose, partner = false }: { pose: RigPose; partner?: boolean }) {
  const rig = RIGS[pose];
  return (
    <div className={`bone-figure ${partner ? "partner" : "primary"} rig-${pose}`} aria-hidden="true">
      {BONES.map(([from, to]) => <span className="bone-line" style={boneStyle(rig[from], rig[to])} key={`${from}-${to}`} />)}
      {(Object.entries(rig) as Array<[JointName, Point]>).map(([name, point]) => (
        <i className={`bone-joint joint-${name}`} key={name} style={{ left: point[0], top: point[1] }} />
      ))}
    </div>
  );
}

function OptionStrip({ title, icon, options, activeId, language, onSelect }: {
  title: string;
  icon: React.ReactNode;
  options: VisualOption[];
  activeId?: string;
  language: UiLanguage;
  onSelect: (option: VisualOption) => void;
}) {
  return (
    <div className="visual-control-group">
      <div className="visual-control-label">{icon}<span>{title}</span></div>
      <div className="visual-chip-row">
        {options.map((option) => (
          <button key={option.id} type="button" className={activeId === option.id ? "active" : ""} onClick={() => onSelect(option)}>
            {option.label[language]}
          </button>
        ))}
      </div>
    </div>
  );
}

export function VisualComposer({
  events,
  sceneType,
  language,
  onUpdate,
  onSwitchManual,
}: {
  events: TimelineEvent[];
  sceneType: SceneType;
  language: UiLanguage;
  onUpdate: (id: string, patch: Partial<TimelineEvent>) => void;
  onSwitchManual: () => void;
}) {
  const [selectedId, setSelectedId] = useState(events[0]?.id ?? "");
  const selected = events.find((event) => event.id === selectedId) ?? events[0];

  const poseOptions = useMemo(() => VISUAL_POSE_PRESETS.filter((preset) => preset.scenes.includes(sceneType)), [sceneType]);
  if (!selected) return null;
  const activePose = visualPoseForEvent(selected, sceneType);
  const storedCameraPoint = CAMERA_POINTS.find((option) => option.id === selected.visualCameraPoint && option.patch.cameraPlacement === selected.cameraPlacement)?.id;
  const cameraPoint = storedCameraPoint ?? (selected.cameraPlacement.includes("three-quarter front") ? "front-left" : selected.cameraPlacement.includes("behind") ? "rear" : selected.cameraPlacement.includes("beside") ? "left" : "front");
  const storedBodyDirection = BODY_DIRECTIONS.find((option) => option.id === selected.visualBodyDirection && option.patch.bodyOrientation === selected.bodyOrientation)?.id;
  const bodyDirection = storedBodyDirection ?? (selected.bodyOrientation.startsWith("three-quarter") ? "three-quarter" : selected.bodyOrientation.startsWith("side") ? "profile" : selected.bodyOrientation.startsWith("back") ? "rear-look" : "front");
  const storedCameraHeight = CAMERA_HEIGHTS.find((option) => option.id === selected.visualCameraHeight && option.patch.camera === selected.camera)?.id;
  const cameraHeight = storedCameraHeight ?? (selected.camera === "low angle" ? "low" : selected.camera === "slight high angle" ? "high" : "eye");
  const storedFraming = FRAMINGS.find((option) => option.id === selected.visualFraming && option.patch.shotSize === selected.shotSize)?.id;
  const framing = storedFraming ?? (selected.shotSize.startsWith("close") ? "close" : selected.shotSize.includes("waist") ? "waist" : selected.shotSize.includes("knees") ? "knees" : selected.shotSize.includes("establishing") ? "wide" : "full");
  const motion = CAMERA_MOVES.find((option) => option.patch.cameraMotion === selected.cameraMotion)?.id ?? "static";
  const update = (patch: Partial<TimelineEvent>) => onUpdate(selected.id, patch);
  const copy = language === "JAP" ? {
    event: "編集するイベント",
    pose: "姿勢・体位",
    cameraMap: "カメラ設置ポイント",
    front: "女性の正面",
    direction: "体の向き",
    height: "カメラ高",
    framing: "構図",
    motion: "カメラ移動",
    mapped: "プロンプトへ反映される内容",
    manual: "Manualで詳細調整",
    primary: "メイン女性",
    partner: sceneType === "female-female" ? "二人目の女性" : "相手役",
  } : {
    event: "EVENT TO EDIT",
    pose: "POSE / POSITION",
    cameraMap: "CAMERA PLACEMENT",
    front: "PRIMARY FRONT",
    direction: "BODY DIRECTION",
    height: "CAMERA HEIGHT",
    framing: "FRAMING",
    motion: "CAMERA MOTION",
    mapped: "MAPPED PROMPT DIRECTION",
    manual: "Fine-tune in Manual",
    primary: "Primary woman",
    partner: sceneType === "female-female" ? "Second woman" : "Partner",
  };

  return (
    <section className="visual-composer" aria-label={language === "JAP" ? "ビジュアル構図エディター" : "Visual composition editor"}>
      <div className="visual-event-picker">
        <span>{copy.event}</span>
        <div>
          {events.map((event, index) => (
            <button type="button" key={event.id} className={selected.id === event.id ? "active" : ""} onClick={() => setSelectedId(event.id)}>
              <b>{index + 1}</b><small>{event.start}–{event.end}s</small>
            </button>
          ))}
        </div>
      </div>

      <div className="visual-pose-picker">
        <div className="visual-section-heading"><Scan size={15} /><span>{copy.pose}</span></div>
        <div className="visual-preset-grid">
          {poseOptions.map((preset) => (
            <button key={preset.id} type="button" className={activePose.id === preset.id ? "active" : ""} onClick={() => update({ ...preset.patch, visualPosePreset: preset.id })}>
              <span>{preset.label[language]}</span><small>{preset.description[language]}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="visual-stage-grid">
        <div className={`bone-stage framing-${framing}`}>
          <div className="stage-title"><Crosshair size={14} /> {copy.cameraMap}</div>
          <div className="stage-front-marker">{copy.front}</div>
          <div className="stage-orbit" />
          <div className="stage-axis axis-x" /><div className="stage-axis axis-y" />
          <div className="bone-cast">
            <div className="cast-member primary-member">
              <BoneFigure pose={activePose.primaryRig} />
              <span>{copy.primary}</span>
            </div>
            {activePose.partnerRig && sceneType !== "solo" && (
              <div className={`cast-member partner-member pose-${activePose.id}`}>
                <BoneFigure pose={activePose.partnerRig} partner />
                <span>{copy.partner}</span>
              </div>
            )}
          </div>
          <div className="framing-window" aria-hidden="true"><span /><i /></div>
          {CAMERA_POINTS.map((point) => (
            <button
              type="button"
              key={point.id}
              className={`camera-point point-${point.id} ${cameraPoint === point.id ? "active" : ""}`}
              aria-pressed={cameraPoint === point.id}
              aria-label={`${copy.cameraMap}: ${point.label[language]}`}
              title={point.label[language]}
              onClick={() => update(point.patch)}
            >
              <Camera size={16} /><span>{point.label[language]}</span>
            </button>
          ))}
          <div className="stage-legend"><span><i className="legend-primary" />{copy.primary}</span>{sceneType !== "solo" && <span><i className="legend-partner" />{copy.partner}</span>}</div>
        </div>

        <div className="visual-controls">
          <OptionStrip title={copy.direction} icon={<Eye size={15} />} options={BODY_DIRECTIONS} activeId={bodyDirection} language={language} onSelect={(option) => update(option.patch)} />
          <OptionStrip title={copy.height} icon={<Camera size={15} />} options={CAMERA_HEIGHTS} activeId={cameraHeight} language={language} onSelect={(option) => update(option.patch)} />
          <OptionStrip title={copy.framing} icon={<Scan size={15} />} options={FRAMINGS} activeId={framing} language={language} onSelect={(option) => update(option.patch)} />
          <OptionStrip title={copy.motion} icon={<Crosshair size={15} />} options={CAMERA_MOVES} activeId={motion} language={language} onSelect={(option) => update(option.patch)} />
          <div className="visual-mapping-summary">
            <span>{copy.mapped}</span>
            <p><b>POSE</b>{selected.pose}</p>
            {selected.position && <p><b>POSITION</b>{selected.position}</p>}
            <p><b>CAMERA</b>{selected.cameraPlacement}</p>
            <p><b>FRAME</b>{selected.shotSize}</p>
          </div>
          <button type="button" className="visual-manual-link" onClick={onSwitchManual}><SlidersHorizontal size={15} />{copy.manual}</button>
        </div>
      </div>
    </section>
  );
}
