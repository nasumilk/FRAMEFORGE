"use client";

import { useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type WheelEvent } from "react";
import { Box, Camera, MousePointer2, RotateCcw } from "lucide-react";
import { CAMERA_POINTS, type RigPose, type VisualPosePreset } from "../lib/visualComposer";
import type { SceneType, UiLanguage } from "../lib/types";

type Vec3 = readonly [number, number, number];
type Point2 = readonly [number, number];
type JointName = "head" | "neck" | "shoulderL" | "shoulderR" | "elbowL" | "elbowR" | "handL" | "handR" | "hip" | "hipL" | "hipR" | "kneeL" | "kneeR" | "ankleL" | "ankleR";
type Rig2D = Record<JointName, Point2>;
type View3D = { yaw: number; pitch: number; zoom: number };
type Projected = { x: number; y: number; depth: number; scale: number };

const STAGE_WIDTH = 640;
const STAGE_HEIGHT = 520;
const DEFAULT_VIEW: View3D = { yaw: -28, pitch: 18, zoom: 1 };

const RIGS: Record<RigPose, Rig2D> = {
  standing: { head: [115, 22], neck: [115, 48], shoulderL: [84, 61], shoulderR: [146, 61], elbowL: [70, 103], elbowR: [160, 103], handL: [64, 145], handR: [166, 145], hip: [115, 125], hipL: [98, 130], hipR: [132, 130], kneeL: [94, 173], kneeR: [136, 173], ankleL: [88, 216], ankleR: [142, 216] },
  kneeling: { head: [115, 28], neck: [115, 54], shoulderL: [83, 67], shoulderR: [147, 67], elbowL: [70, 107], elbowR: [160, 107], handL: [82, 142], handR: [148, 142], hip: [115, 130], hipL: [96, 134], hipR: [134, 134], kneeL: [78, 178], kneeR: [152, 178], ankleL: [57, 207], ankleR: [173, 207] },
  seated: { head: [115, 28], neck: [115, 54], shoulderL: [84, 67], shoulderR: [146, 67], elbowL: [72, 108], elbowR: [158, 108], handL: [88, 139], handR: [142, 139], hip: [115, 128], hipL: [96, 132], hipR: [134, 132], kneeL: [58, 164], kneeR: [172, 164], ankleL: [35, 210], ankleR: [195, 210] },
  reclining: { head: [28, 117], neck: [54, 117], shoulderL: [62, 92], shoulderR: [62, 142], elbowL: [88, 77], elbowR: [88, 157], handL: [112, 69], handR: [112, 165], hip: [126, 117], hipL: [126, 101], hipR: [126, 133], kneeL: [169, 78], kneeR: [169, 156], ankleL: [211, 54], ankleR: [211, 180] },
  "all-fours": { head: [34, 62], neck: [62, 78], shoulderL: [67, 67], shoulderR: [67, 91], elbowL: [88, 119], elbowR: [101, 124], handL: [73, 181], handR: [109, 181], hip: [145, 103], hipL: [142, 90], hipR: [142, 116], kneeL: [133, 157], kneeR: [169, 154], ankleL: [107, 207], ankleR: [205, 198] },
  "side-lying": { head: [31, 110], neck: [58, 111], shoulderL: [65, 95], shoulderR: [65, 128], elbowL: [92, 84], elbowR: [92, 143], handL: [116, 80], handR: [117, 151], hip: [128, 116], hipL: [128, 103], hipR: [128, 131], kneeL: [168, 109], kneeR: [173, 145], ankleL: [213, 102], ankleR: [214, 164] },
};

const BONES: Array<readonly [JointName, JointName]> = [
  ["head", "neck"], ["neck", "shoulderL"], ["neck", "shoulderR"], ["shoulderL", "elbowL"], ["elbowL", "handL"], ["shoulderR", "elbowR"], ["elbowR", "handR"], ["neck", "hip"], ["hip", "hipL"], ["hip", "hipR"], ["hipL", "kneeL"], ["kneeL", "ankleL"], ["hipR", "kneeR"], ["kneeR", "ankleR"],
];

const CAMERA_COORDS: Record<string, readonly [number, number]> = {
  front: [0, 215], "front-left": [-152, 152], left: [-215, 0], "rear-left": [-152, -152], rear: [0, -215], "rear-right": [152, -152], right: [215, 0], "front-right": [152, 152],
};

const DEPTH_OFFSETS: Partial<Record<JointName, number>> = {
  shoulderL: -4, shoulderR: 4, elbowL: 12, elbowR: -12, handL: 22, handR: -22,
  hipL: -4, hipR: 4, kneeL: 12, kneeR: -12, ankleL: 21, ankleR: -21,
};

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }

function rotateY(point: Vec3, degrees: number): Vec3 {
  const angle = degrees * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [point[0] * cos - point[2] * sin, point[1], point[0] * sin + point[2] * cos];
}

function add(point: Vec3, offset: Vec3): Vec3 {
  return [point[0] + offset[0], point[1] + offset[1], point[2] + offset[2]];
}

function project(point: Vec3, view: View3D): Projected {
  const yaw = view.yaw * Math.PI / 180;
  const pitch = view.pitch * Math.PI / 180;
  const x1 = point[0] * Math.cos(yaw) - point[2] * Math.sin(yaw);
  const z1 = point[0] * Math.sin(yaw) + point[2] * Math.cos(yaw);
  const y2 = point[1] * Math.cos(pitch) - z1 * Math.sin(pitch);
  const z2 = point[1] * Math.sin(pitch) + z1 * Math.cos(pitch);
  const scale = (690 / (690 - z2)) * view.zoom;
  return { x: STAGE_WIDTH / 2 + x1 * scale, y: 270 - y2 * scale, depth: z2, scale };
}

function lineStyle(from: Projected, to: Projected): CSSProperties {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return {
    left: `${(from.x / STAGE_WIDTH) * 100}%`,
    top: `${(from.y / STAGE_HEIGHT) * 100}%`,
    width: `${(Math.sqrt(dx * dx + dy * dy) / STAGE_WIDTH) * 100}%`,
    transform: `rotate(${Math.atan2(dy, dx) * 180 / Math.PI}deg)`,
    zIndex: Math.round(500 + (from.depth + to.depth) / 2),
    opacity: clamp(.55 + (from.depth + to.depth + 300) / 900, .32, 1),
  };
}

function pointStyle(point: Projected): CSSProperties {
  return {
    left: `${(point.x / STAGE_WIDTH) * 100}%`,
    top: `${(point.y / STAGE_HEIGHT) * 100}%`,
    zIndex: Math.round(700 + point.depth),
    opacity: clamp(.58 + (point.depth + 250) / 750, .38, 1),
    transform: `translate(-50%, -50%) scale(${clamp(point.scale, .7, 1.35)})`,
  };
}

function toRig3D(pose: RigPose, offset: Vec3, rotation: number, mirrorX = false, scale = 1): Record<JointName, Vec3> {
  const rig = RIGS[pose];
  return Object.fromEntries((Object.entries(rig) as Array<[JointName, Point2]>).map(([joint, point]) => {
    const local: Vec3 = [((point[0] - 115) * .78 * (mirrorX ? -1 : 1)) * scale, ((120 - point[1]) * .82) * scale, (DEPTH_OFFSETS[joint] ?? 0) * scale];
    return [joint, add(rotateY(local, rotation), offset)];
  })) as Record<JointName, Vec3>;
}

function primaryRotation(direction: string) {
  if (direction === "three-quarter") return -38;
  if (direction === "profile") return -90;
  if (direction === "rear-look") return 168;
  return 0;
}

function partnerTransform(poseId: string): { offset: Vec3; rotation: number; scale: number } {
  if (poseId === "mf-rear-all-fours") return { offset: [102, 7, -32], rotation: 2, scale: .82 };
  if (poseId === "mf-standing-rear") return { offset: [18, 1, -48], rotation: 0, scale: .9 };
  if (poseId === "mf-missionary" || poseId === "ff-kneeling-reclining") return { offset: [58, 18, -24], rotation: 150, scale: .82 };
  if (poseId === "mf-spooning" || poseId === "ff-side-by-side") return { offset: [4, 11, -34], rotation: 0, scale: .93 };
  return { offset: [38, 0, -28], rotation: 170, scale: .9 };
}

function cameraHeightValue(height: string) {
  if (height === "low") return -54;
  if (height === "high") return 92;
  return 24;
}

function framingExtent(framing: string) {
  if (framing === "close") return 25;
  if (framing === "waist") return 52;
  if (framing === "knees") return 78;
  if (framing === "wide") return 145;
  return 108;
}

function SceneLine({ from, to, view, className }: { from: Vec3; to: Vec3; view: View3D; className: string }) {
  return <span aria-hidden="true" className={`scene-3d-line ${className}`} style={lineStyle(project(from, view), project(to, view))} />;
}

function RigFigure3D({ rig, view, partner = false }: { rig: Record<JointName, Vec3>; view: View3D; partner?: boolean }) {
  return <>
    {BONES.map(([from, to]) => <SceneLine key={`${from}-${to}`} from={rig[from]} to={rig[to]} view={view} className={`rig-bone ${partner ? "partner" : "primary"}`} />)}
    {(Object.entries(rig) as Array<[JointName, Vec3]>).map(([joint, point]) => <i aria-hidden="true" key={joint} className={`scene-3d-joint ${partner ? "partner" : "primary"} ${joint === "head" ? "head" : ""}`} style={pointStyle(project(point, view))} />)}
  </>;
}

function ringSegments(radius: number, y: number, count = 40): Array<readonly [Vec3, Vec3]> {
  return Array.from({ length: count }, (_, index) => {
    const a = index / count * Math.PI * 2;
    const b = (index + 1) / count * Math.PI * 2;
    return [[Math.sin(a) * radius, y, Math.cos(a) * radius], [Math.sin(b) * radius, y, Math.cos(b) * radius]] as const;
  });
}

export function Interactive3DStage({
  pose,
  sceneType,
  language,
  cameraPoint,
  cameraHeight,
  framing,
  bodyDirection,
  labels,
  onSelectCamera,
}: {
  pose: VisualPosePreset;
  sceneType: SceneType;
  language: UiLanguage;
  cameraPoint: string;
  cameraHeight: string;
  framing: string;
  bodyDirection: string;
  labels: { title: string; primary: string; partner: string; drag: string; reset: string; front: string; viewOnly: string };
  onSelectCamera: (id: string) => void;
}) {
  const [view, setView] = useState<View3D>(DEFAULT_VIEW);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ pointerId: number; x: number; y: number; yaw: number; pitch: number } | null>(null);
  const cameraY = cameraHeightValue(cameraHeight);
  const primaryRig = useMemo(() => toRig3D(pose.primaryRig, [0, 2, 0], primaryRotation(bodyDirection)), [pose.primaryRig, bodyDirection]);
  const partnerRig = useMemo(() => {
    if (!pose.partnerRig || sceneType === "solo") return null;
    const transform = partnerTransform(pose.id);
    return toRig3D(pose.partnerRig, transform.offset, transform.rotation, true, transform.scale);
  }, [pose, sceneType]);
  const cameraPositions = useMemo(() => Object.fromEntries(Object.entries(CAMERA_COORDS).map(([id, [x, z]]) => [id, [x, cameraY, z] as Vec3])), [cameraY]);
  const selectedCamera = cameraPositions[cameraPoint] ?? cameraPositions.front;
  const target: Vec3 = [0, 18, 0];
  const extent = framingExtent(framing);
  const horizontalLength = Math.hypot(selectedCamera[0], selectedCamera[2]) || 1;
  const right: Vec3 = [selectedCamera[2] / horizontalLength, 0, -selectedCamera[0] / horizontalLength];
  const coneTargets: Vec3[] = [
    [target[0] + right[0] * extent, target[1] + extent * .68, target[2] + right[2] * extent],
    [target[0] - right[0] * extent, target[1] + extent * .68, target[2] - right[2] * extent],
    [target[0] + right[0] * extent, target[1] - extent * .68, target[2] + right[2] * extent],
    [target[0] - right[0] * extent, target[1] - extent * .68, target[2] - right[2] * extent],
  ];

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, yaw: view.yaw, pitch: view.pitch };
    setDragging(true);
  };
  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    setView((current) => ({ ...current, yaw: drag.current!.yaw + dx * .42, pitch: clamp(drag.current!.pitch - dy * .36, -68, 72) }));
  };
  const stopDragging = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
    setDragging(false);
  };
  const handleWheel = (event: WheelEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setView((current) => ({ ...current, zoom: clamp(current.zoom - event.deltaY * .0008, .72, 1.38) }));
  };

  const floorSegments = [70, 140, 215].flatMap((radius) => ringSegments(radius, -82));
  const cameraRing = ringSegments(215, cameraY);
  const projectedFront = project([0, -82, 235], view);
  const projectedPrimaryLabel = project([0, -102, 0], view);
  const projectedPartnerLabel = partnerRig ? project(partnerTransform(pose.id).offset, view) : null;

  return (
    <div
      className={`bone-stage bone-stage-3d ${dragging ? "dragging" : ""}`}
    >
      <div className="stage-title"><Box size={14} /> {labels.title}</div>
      <div className="stage-3d-toolbar">
        <span><MousePointer2 size={13} />{labels.drag}</span>
        <button type="button" onClick={() => setView(DEFAULT_VIEW)} title={labels.reset}><RotateCcw size={14} />{labels.reset}</button>
      </div>
      <div className="orbit-canvas">
        <button
          type="button"
          className="stage-drag-surface"
          aria-label={`${labels.title}. ${labels.drag}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          onWheel={handleWheel}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") setView((current) => ({ ...current, yaw: current.yaw - 8 }));
            if (event.key === "ArrowRight") setView((current) => ({ ...current, yaw: current.yaw + 8 }));
            if (event.key === "ArrowUp") setView((current) => ({ ...current, pitch: clamp(current.pitch + 6, -68, 72) }));
            if (event.key === "ArrowDown") setView((current) => ({ ...current, pitch: clamp(current.pitch - 6, -68, 72) }));
          }}
        />
        {floorSegments.map(([from, to], index) => <SceneLine key={`floor-${index}`} from={from} to={to} view={view} className="floor-grid-line" />)}
        <SceneLine from={[-235, -82, 0]} to={[235, -82, 0]} view={view} className="world-axis axis-x-3d" />
        <SceneLine from={[0, -82, -235]} to={[0, -82, 235]} view={view} className="world-axis axis-z-3d" />
        <SceneLine from={[0, -82, 0]} to={[0, 145, 0]} view={view} className="world-axis axis-y-3d" />
        {cameraRing.map(([from, to], index) => <SceneLine key={`orbit-${index}`} from={from} to={to} view={view} className="camera-orbit-line" />)}
        {CAMERA_POINTS.map((point) => {
          const projected = project(cameraPositions[point.id], view);
          return <button
            type="button"
            key={point.id}
            className={`camera-point camera-point-3d ${cameraPoint === point.id ? "active" : ""}`}
            style={pointStyle(projected)}
            aria-pressed={cameraPoint === point.id}
            aria-label={`${labels.title}: ${point.label[language]}`}
            title={point.label[language]}
            onClick={(event) => { event.stopPropagation(); onSelectCamera(point.id); }}
          ><Camera size={16} /><span>{point.label[language]}</span></button>;
        })}
        <SceneLine from={selectedCamera} to={target} view={view} className="selected-camera-ray" />
        {coneTargets.map((corner, index) => <SceneLine key={`cone-${index}`} from={selectedCamera} to={corner} view={view} className="camera-cone-line" />)}
        <SceneLine from={coneTargets[0]} to={coneTargets[1]} view={view} className="camera-framing-plane" />
        <SceneLine from={coneTargets[1]} to={coneTargets[3]} view={view} className="camera-framing-plane" />
        <SceneLine from={coneTargets[3]} to={coneTargets[2]} view={view} className="camera-framing-plane" />
        <SceneLine from={coneTargets[2]} to={coneTargets[0]} view={view} className="camera-framing-plane" />
        <RigFigure3D rig={primaryRig} view={view} />
        {partnerRig && <RigFigure3D rig={partnerRig} view={view} partner />}
        <span className="world-front-label" style={pointStyle(projectedFront)}>{labels.front}</span>
        <span className="cast-label primary" style={pointStyle(projectedPrimaryLabel)}>{labels.primary}</span>
        {projectedPartnerLabel && <span className="cast-label partner" style={pointStyle(projectedPartnerLabel)}>{labels.partner}</span>}
      </div>
      <div className="stage-3d-status">
        <span><i className="legend-primary" />{labels.primary}</span>
        {sceneType !== "solo" && <span><i className="legend-partner" />{labels.partner}</span>}
        <em>{labels.viewOnly}</em>
        <b>YAW {Math.round(view.yaw)}°</b><b>PITCH {Math.round(view.pitch)}°</b>
      </div>
    </div>
  );
}
