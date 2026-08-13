"use client";

import { useCallback, useEffect, useMemo, useRef, type PointerEvent as ReactPointerEvent, type WheelEvent } from "react";
import { Box, Camera, MousePointer2, RotateCcw } from "lucide-react";
import { CAMERA_POINTS, type RigPose, type VisualPosePreset } from "../lib/visualComposer";
import type { SceneType, UiLanguage } from "../lib/types";

type Vec3 = readonly [number, number, number];
type JointName = "head" | "neck" | "chest" | "shoulderL" | "shoulderR" | "elbowL" | "elbowR" | "handL" | "handR" | "hip" | "hipL" | "hipR" | "kneeL" | "kneeR" | "ankleL" | "ankleR";
type Rig3D = Record<JointName, Vec3>;
type View3D = { yaw: number; pitch: number; zoom: number };
type Projected = { x: number; y: number; depth: number; scale: number };
type Cast3D = { primary: Rig3D; partner?: Rig3D };

const STAGE_WIDTH = 640;
const STAGE_HEIGHT = 520;
const DEFAULT_VIEW: View3D = { yaw: -28, pitch: 18, zoom: 1 };

const BONES: Array<readonly [JointName, JointName]> = [
  ["head", "neck"], ["neck", "chest"], ["neck", "shoulderL"], ["neck", "shoulderR"],
  ["shoulderL", "elbowL"], ["elbowL", "handL"], ["shoulderR", "elbowR"], ["elbowR", "handR"],
  ["chest", "hip"], ["hip", "hipL"], ["hip", "hipR"], ["hipL", "kneeL"], ["kneeL", "ankleL"], ["hipR", "kneeR"], ["kneeR", "ankleR"],
];

const STANDING: Rig3D = {
  head: [0, 90, 0], neck: [0, 68, 0], chest: [0, 42, 0], shoulderL: [-27, 61, 0], shoulderR: [27, 61, 0],
  elbowL: [-36, 28, 7], elbowR: [36, 28, -7], handL: [-32, -4, 14], handR: [32, -4, -14],
  hip: [0, 0, 0], hipL: [-14, -2, 0], hipR: [14, -2, 0], kneeL: [-12, -42, 5], kneeR: [12, -42, -5], ankleL: [-12, -82, 8], ankleR: [12, -82, -8],
};

const KNEELING: Rig3D = {
  head: [0, 68, 0], neck: [0, 47, 0], chest: [0, 23, 0], shoulderL: [-27, 40, 0], shoulderR: [27, 40, 0],
  elbowL: [-34, 7, 8], elbowR: [34, 7, -8], handL: [-25, -20, 20], handR: [25, -20, -20],
  hip: [0, -22, 0], hipL: [-14, -24, 0], hipR: [14, -24, 0], kneeL: [-27, -67, 22], kneeR: [27, -67, 22], ankleL: [-30, -82, -8], ankleR: [30, -82, -8],
};

// Hip flexion, abduction and external rotation are made visible instead of keeping the legs on one 2D plane.
const SEATED_OPEN: Rig3D = {
  head: [0, 66, -8], neck: [0, 45, -5], chest: [0, 21, -2], shoulderL: [-27, 38, -3], shoulderR: [27, 38, -3],
  elbowL: [-37, 7, 14], elbowR: [37, 7, 14], handL: [-42, -34, 34], handR: [42, -34, 34],
  hip: [0, -26, 0], hipL: [-14, -28, 0], hipR: [14, -28, 0], kneeL: [-58, -51, 40], kneeR: [58, -51, 40], ankleL: [-42, -82, 73], ankleR: [42, -82, 73],
};

// Supine subject with flexed, abducted knees: the common high-hip-flexion pattern documented by motion-capture studies.
const SUPINE_FLEXED: Rig3D = {
  head: [0, -58, -78], neck: [0, -63, -57], chest: [0, -62, -32], shoulderL: [-27, -62, -47], shoulderR: [27, -62, -47],
  elbowL: [-47, -68, -27], elbowR: [47, -68, -27], handL: [-58, -72, -2], handR: [58, -72, -2],
  hip: [0, -65, 16], hipL: [-14, -65, 16], hipR: [14, -65, 16], kneeL: [-43, -7, 57], kneeR: [43, -7, 57], ankleL: [-44, -66, 91], ankleR: [44, -66, 91],
};

// Hand-supported quadruped variation (mQUAD2): shoulders over hands, knees under/behind hips, near-neutral trunk.
const QUADRUPED_HANDS: Rig3D = {
  head: [0, 16, 78], neck: [0, 2, 57], chest: [0, -3, 30], shoulderL: [-24, -8, 41], shoulderR: [24, -8, 41],
  elbowL: [-25, -44, 52], elbowR: [25, -44, 52], handL: [-25, -82, 67], handR: [25, -82, 67],
  hip: [0, 6, -25], hipL: [-15, 4, -24], hipR: [15, 4, -24], kneeL: [-23, -63, -31], kneeR: [23, -63, -31], ankleL: [-24, -82, -66], ankleR: [24, -82, -66],
};

// Both partners lie on the same side with flexed hips and knees, matching the mSIDE support pattern.
const SIDE_LYING: Rig3D = {
  head: [0, -54, -79], neck: [0, -61, -57], chest: [0, -62, -30], shoulderL: [-7, -70, -42], shoulderR: [15, -47, -42],
  elbowL: [-12, -73, -8], elbowR: [28, -48, -10], handL: [6, -74, 18], handR: [40, -49, 15],
  hip: [0, -66, 19], hipL: [-7, -70, 19], hipR: [11, -52, 19], kneeL: [-4, -70, 61], kneeR: [20, -48, 58], ankleL: [-3, -72, 92], ankleR: [23, -54, 89],
};

const BENT_STANDING: Rig3D = {
  head: [0, 32, 79], neck: [0, 29, 58], chest: [0, 24, 32], shoulderL: [-27, 28, 47], shoulderR: [27, 28, 47],
  elbowL: [-31, 5, 72], elbowR: [31, 5, 72], handL: [-26, -8, 98], handR: [26, -8, 98],
  hip: [0, 4, -13], hipL: [-14, 2, -12], hipR: [14, 2, -12], kneeL: [-13, -41, -5], kneeR: [13, -41, -5], ankleL: [-14, -82, 2], ankleR: [14, -82, 2],
};

// Hand-supported upper partner for the lower-flexion missionary variation (mMISS1).
const MISSIONARY_PARTNER: Rig3D = {
  head: [0, 50, -51], neck: [0, 39, -32], chest: [0, 24, -9], shoulderL: [-27, 32, -20], shoulderR: [27, 32, -20],
  elbowL: [-37, -10, -27], elbowR: [37, -10, -27], handL: [-40, -66, -34], handR: [40, -66, -34],
  hip: [0, -11, 33], hipL: [-14, -13, 33], hipR: [14, -13, 33], kneeL: [-35, -65, 58], kneeR: [35, -65, 58], ankleL: [-38, -82, 89], ankleR: [38, -82, 89],
};

const KNEELING_BEHIND: Rig3D = {
  head: [0, 67, -35], neck: [0, 48, -43], chest: [0, 26, -51], shoulderL: [-27, 41, -45], shoulderR: [27, 41, -45],
  elbowL: [-34, 16, -30], elbowR: [34, 16, -30], handL: [-20, 4, -21], handR: [20, 4, -21],
  hip: [0, -13, -68], hipL: [-14, -15, -68], hipR: [14, -15, -68], kneeL: [-29, -67, -91], kneeR: [29, -67, -91], ankleL: [-30, -82, -120], ankleR: [30, -82, -120],
};

const STANDING_BEHIND: Rig3D = {
  ...STANDING,
  head: [0, 87, -47], neck: [0, 66, -43], chest: [0, 41, -37], shoulderL: [-27, 59, -40], shoulderR: [27, 59, -40],
  elbowL: [-31, 30, -25], elbowR: [31, 30, -25], handL: [-18, 8, -14], handR: [18, 8, -14],
  hip: [0, 0, -52], hipL: [-14, -2, -52], hipR: [14, -2, -52], kneeL: [-12, -42, -50], kneeR: [12, -42, -54], ankleL: [-12, -82, -48], ankleR: [12, -82, -56],
};

const STANDING_EMBRACE: Rig3D = {
  ...STANDING,
  elbowL: [-24, 34, 20], elbowR: [24, 34, 20], handL: [-15, 27, 39], handR: [15, 27, 39],
};

const SEATED_EMBRACE: Rig3D = {
  ...SEATED_OPEN,
  elbowL: [-22, 21, 18], elbowR: [22, 21, 18], handL: [-14, 16, 40], handR: [14, 16, 40],
  kneeL: [-38, -54, 42], kneeR: [38, -54, 42], ankleL: [-27, -82, 72], ankleR: [27, -82, 72],
};

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }

function rotateY(point: Vec3, degrees: number): Vec3 {
  const angle = degrees * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [point[0] * cos - point[2] * sin, point[1], point[0] * sin + point[2] * cos];
}

function transformRig(rig: Rig3D, offset: Vec3 = [0, 0, 0], rotation = 0, scale = 1): Rig3D {
  return Object.fromEntries((Object.entries(rig) as Array<[JointName, Vec3]>).map(([joint, point]) => {
    const rotated = rotateY([point[0] * scale, point[1] * scale, point[2] * scale], rotation);
    return [joint, [rotated[0] + offset[0], rotated[1] + offset[1], rotated[2] + offset[2]] as Vec3];
  })) as Rig3D;
}

const GENERIC_RIGS: Record<RigPose, Rig3D> = {
  standing: STANDING, kneeling: KNEELING, seated: SEATED_OPEN, reclining: SUPINE_FLEXED, "all-fours": QUADRUPED_HANDS, "side-lying": SIDE_LYING,
};

const POSE_CASTS: Record<string, Cast3D> = {
  "solo-standing": { primary: STANDING },
  "solo-kneeling": { primary: KNEELING },
  "solo-seated": { primary: SEATED_OPEN },
  "solo-reclining": { primary: SUPINE_FLEXED },
  "solo-all-fours": { primary: QUADRUPED_HANDS },
  "mf-missionary": { primary: SUPINE_FLEXED, partner: MISSIONARY_PARTNER },
  "mf-rear-all-fours": { primary: QUADRUPED_HANDS, partner: KNEELING_BEHIND },
  "mf-seated": { primary: transformRig(SEATED_EMBRACE, [0, 0, -19]), partner: transformRig(SEATED_EMBRACE, [0, 0, 26], 180, .94) },
  "mf-spooning": { primary: transformRig(SIDE_LYING, [11, 0, 0]), partner: transformRig(SIDE_LYING, [-18, 9, -8], 0, .96) },
  "mf-standing-rear": { primary: BENT_STANDING, partner: STANDING_BEHIND },
  "ff-standing-embrace": { primary: transformRig(STANDING_EMBRACE, [0, 0, -23]), partner: transformRig(STANDING_EMBRACE, [0, 0, 37], 180, .96) },
  "ff-seated-embrace": { primary: transformRig(SEATED_EMBRACE, [0, 0, -17]), partner: transformRig(SEATED_EMBRACE, [0, 0, 30], 180, .96) },
  "ff-side-by-side": { primary: transformRig(SIDE_LYING, [17, 0, 0]), partner: transformRig(SIDE_LYING, [-18, 10, -7], 0, .96) },
  "ff-kneeling-reclining": { primary: SUPINE_FLEXED, partner: transformRig(KNEELING, [0, 1, 62], 180, .94) },
};

const CAMERA_COORDS: Record<string, readonly [number, number]> = {
  front: [0, 215], "front-left": [-152, 152], left: [-215, 0], "rear-left": [-152, -152], rear: [0, -215], "rear-right": [152, -152], right: [215, 0], "front-right": [152, 152],
};

function bodyRotation(direction: string) {
  if (direction === "three-quarter") return -38;
  if (direction === "profile") return -90;
  if (direction === "rear-look") return 168;
  return 0;
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

function ringPoints(radius: number, y: number, count = 42): Vec3[] {
  return Array.from({ length: count + 1 }, (_, index) => {
    const angle = index / count * Math.PI * 2;
    return [Math.sin(angle) * radius, y, Math.cos(angle) * radius] as Vec3;
  });
}

function drawPolyline(context: CanvasRenderingContext2D, points: Vec3[], view: View3D, color: string, width = 1, dash: number[] = []) {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = width;
  context.setLineDash(dash);
  context.beginPath();
  points.forEach((point, index) => {
    const projected = project(point, view);
    if (index === 0) context.moveTo(projected.x, projected.y);
    else context.lineTo(projected.x, projected.y);
  });
  context.stroke();
  context.restore();
}

function drawLine(context: CanvasRenderingContext2D, from: Vec3, to: Vec3, view: View3D, color: string, width = 1, dash: number[] = []) {
  drawPolyline(context, [from, to], view, color, width, dash);
}

function drawRig(context: CanvasRenderingContext2D, rig: Rig3D, view: View3D, partner: boolean) {
  const boneColor = partner ? "rgba(125, 190, 207, .9)" : "rgba(185, 151, 248, .96)";
  const glowColor = partner ? "rgba(88, 178, 203, .2)" : "rgba(157, 111, 238, .28)";
  const sortedBones = BONES.map(([from, to]) => ({ from, to, depth: (project(rig[from], view).depth + project(rig[to], view).depth) / 2 })).sort((a, b) => a.depth - b.depth);
  context.save();
  context.lineCap = "round";
  context.shadowColor = glowColor;
  context.shadowBlur = 8;
  sortedBones.forEach(({ from, to }) => drawLine(context, rig[from], rig[to], view, boneColor, 3));
  const joints = (Object.entries(rig) as Array<[JointName, Vec3]>).map(([joint, point]) => ({ joint, point, projected: project(point, view) })).sort((a, b) => a.projected.depth - b.projected.depth);
  joints.forEach(({ joint, projected }) => {
    context.beginPath();
    context.fillStyle = partner ? "#102329" : "#1c1429";
    context.strokeStyle = partner ? "#9bcbd7" : "#d0b7ff";
    context.lineWidth = 2;
    context.arc(projected.x, projected.y, (joint === "head" ? 11 : 4) * clamp(projected.scale, .75, 1.35), 0, Math.PI * 2);
    context.fill();
    context.stroke();
  });
  context.restore();
}

function labelPoint(rig: Rig3D): Vec3 {
  const points = Object.values(rig);
  const minY = Math.min(...points.map((point) => point[1]));
  return [points.reduce((sum, point) => sum + point[0], 0) / points.length, minY - 15, points.reduce((sum, point) => sum + point[2], 0) / points.length];
}

function drawLabel(context: CanvasRenderingContext2D, point: Vec3, view: View3D, text: string, color: string) {
  const projected = project(point, view);
  context.save();
  context.font = "600 8px ui-monospace, SFMono-Regular, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  const width = context.measureText(text).width + 14;
  context.fillStyle = "rgba(14, 13, 18, .88)";
  context.strokeStyle = color;
  context.lineWidth = 1;
  context.beginPath();
  context.rect(projected.x - width / 2, projected.y - 10, width, 20);
  context.fill();
  context.stroke();
  context.fillStyle = color;
  context.fillText(text, projected.x, projected.y);
  context.restore();
}

export function Interactive3DStage({
  pose, sceneType, language, cameraPoint, cameraHeight, framing, bodyDirection, labels, onSelectCamera,
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
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const yawRef = useRef<HTMLElement>(null);
  const pitchRef = useRef<HTMLElement>(null);
  const viewRef = useRef<View3D>({ ...DEFAULT_VIEW });
  const dragRef = useRef<{ pointerId: number; x: number; y: number; yaw: number; pitch: number } | null>(null);
  const frameRef = useRef<number | null>(null);

  const cast = useMemo(() => {
    const source = POSE_CASTS[pose.id] ?? { primary: GENERIC_RIGS[pose.primaryRig], partner: pose.partnerRig ? GENERIC_RIGS[pose.partnerRig] : undefined };
    const rotation = bodyRotation(bodyDirection);
    return {
      primary: transformRig(source.primary, [0, 0, 0], rotation),
      partner: source.partner && sceneType !== "solo" ? transformRig(source.partner, [0, 0, 0], rotation) : undefined,
    };
  }, [pose, sceneType, bodyDirection]);

  const cameraY = cameraHeightValue(cameraHeight);
  const cameraPositions = useMemo(() => Object.fromEntries(Object.entries(CAMERA_COORDS).map(([id, [x, z]]) => [id, [x, cameraY, z] as Vec3])) as Record<string, Vec3>, [cameraY]);

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(rect.width * ratio);
    const height = Math.round(rect.height * ratio);
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(width / STAGE_WIDTH, 0, 0, height / STAGE_HEIGHT, 0, 0);
    context.clearRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
    const view = viewRef.current;

    [70, 140, 215].forEach((radius) => drawPolyline(context, ringPoints(radius, -82), view, "rgba(132, 102, 177, .14)"));
    drawLine(context, [-235, -82, 0], [235, -82, 0], view, "rgba(113, 81, 144, .24)");
    drawLine(context, [0, -82, -235], [0, -82, 235], view, "rgba(69, 101, 142, .24)");
    drawLine(context, [0, -82, 0], [0, 145, 0], view, "rgba(82, 157, 164, .28)");
    drawPolyline(context, ringPoints(215, cameraY), view, "rgba(90, 167, 199, .34)", 1, [5, 5]);

    const selectedCamera = cameraPositions[cameraPoint] ?? cameraPositions.front;
    const target: Vec3 = [0, 16, 0];
    const extent = framingExtent(framing);
    const length = Math.hypot(selectedCamera[0], selectedCamera[2]) || 1;
    const right: Vec3 = [selectedCamera[2] / length, 0, -selectedCamera[0] / length];
    const corners: Vec3[] = [
      [right[0] * extent, target[1] + extent * .68, right[2] * extent], [-right[0] * extent, target[1] + extent * .68, -right[2] * extent],
      [right[0] * extent, target[1] - extent * .68, right[2] * extent], [-right[0] * extent, target[1] - extent * .68, -right[2] * extent],
    ];
    drawLine(context, selectedCamera, target, view, "rgba(193, 237, 255, .86)", 2, [7, 6]);
    corners.forEach((corner) => drawLine(context, selectedCamera, corner, view, "rgba(91, 184, 221, .25)"));
    drawPolyline(context, [corners[0], corners[1], corners[3], corners[2], corners[0]], view, "rgba(137, 213, 242, .7)", 2);

    const rigs = [{ rig: cast.primary, partner: false }, ...(cast.partner ? [{ rig: cast.partner, partner: true }] : [])]
      .sort((a, b) => project(a.rig.hip, view).depth - project(b.rig.hip, view).depth);
    rigs.forEach(({ rig, partner }) => drawRig(context, rig, view, partner));
    drawLabel(context, labelPoint(cast.primary), view, labels.primary, "rgba(190, 159, 242, .8)");
    if (cast.partner) drawLabel(context, labelPoint(cast.partner), view, labels.partner, "rgba(123, 192, 210, .8)");
    drawLabel(context, [0, -82, 236], view, labels.front, "rgba(145, 116, 187, .62)");

    CAMERA_POINTS.forEach((point) => {
      const button = cameraButtonRefs.current[point.id];
      if (!button) return;
      const projected = project(cameraPositions[point.id], view);
      button.style.left = `${(projected.x / STAGE_WIDTH) * 100}%`;
      button.style.top = `${(projected.y / STAGE_HEIGHT) * 100}%`;
      button.style.zIndex = String(Math.round(900 + projected.depth));
      button.style.opacity = String(clamp(.55 + (projected.depth + 260) / 760, .38, 1));
      button.style.transform = `translate(-50%, -50%) scale(${clamp(projected.scale, .72, 1.32)})`;
    });
    if (yawRef.current) yawRef.current.textContent = `YAW ${Math.round(view.yaw)}°`;
    if (pitchRef.current) pitchRef.current.textContent = `PITCH ${Math.round(view.pitch)}°`;
  }, [cameraPoint, cameraPositions, cameraY, cast, framing, labels.front, labels.partner, labels.primary]);

  const scheduleDraw = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => { frameRef.current = null; drawScene(); });
  }, [drawScene]);

  useEffect(() => {
    scheduleDraw();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(scheduleDraw);
    observer.observe(canvas);
    return () => { observer.disconnect(); if (frameRef.current !== null) cancelAnimationFrame(frameRef.current); frameRef.current = null; };
  }, [scheduleDraw]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, yaw: viewRef.current.yaw, pitch: viewRef.current.pitch };
    stageRef.current?.classList.add("dragging");
  };
  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    viewRef.current.yaw = drag.yaw + (event.clientX - drag.x) * .42;
    viewRef.current.pitch = clamp(drag.pitch - (event.clientY - drag.y) * .36, -68, 72);
    scheduleDraw();
  };
  const stopDragging = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
    stageRef.current?.classList.remove("dragging");
  };
  const handleWheel = (event: WheelEvent<HTMLButtonElement>) => {
    event.preventDefault();
    viewRef.current.zoom = clamp(viewRef.current.zoom - event.deltaY * .0008, .72, 1.38);
    scheduleDraw();
  };
  const resetView = () => { viewRef.current = { ...DEFAULT_VIEW }; scheduleDraw(); };

  return (
    <div ref={stageRef} className="bone-stage bone-stage-3d">
      <div className="stage-title"><Box size={14} /> {labels.title}</div>
      <div className="stage-3d-toolbar">
        <span><MousePointer2 size={13} />{labels.drag}</span>
        <button type="button" onClick={resetView} title={labels.reset}><RotateCcw size={14} />{labels.reset}</button>
      </div>
      <div className="orbit-canvas">
        <button
          type="button" className="stage-drag-surface" aria-label={`${labels.title}. ${labels.drag}`}
          onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={stopDragging} onPointerCancel={stopDragging} onWheel={handleWheel}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") viewRef.current.yaw -= 8;
            if (event.key === "ArrowRight") viewRef.current.yaw += 8;
            if (event.key === "ArrowUp") viewRef.current.pitch = clamp(viewRef.current.pitch + 6, -68, 72);
            if (event.key === "ArrowDown") viewRef.current.pitch = clamp(viewRef.current.pitch - 6, -68, 72);
            if (event.key.startsWith("Arrow")) { event.preventDefault(); scheduleDraw(); }
          }}
        />
        <canvas ref={canvasRef} className="stage-3d-canvas" aria-hidden="true" />
        {CAMERA_POINTS.map((point) => <button
          type="button" key={point.id} ref={(node) => { cameraButtonRefs.current[point.id] = node; }}
          className={`camera-point camera-point-3d ${cameraPoint === point.id ? "active" : ""}`}
          aria-pressed={cameraPoint === point.id} aria-label={`${labels.title}: ${point.label[language]}`} title={point.label[language]}
          onClick={(event) => { event.stopPropagation(); onSelectCamera(point.id); }}
        ><Camera size={16} /><span>{point.label[language]}</span></button>)}
      </div>
      <div className="stage-3d-status">
        <span><i className="legend-primary" />{labels.primary}</span>
        {sceneType !== "solo" && <span><i className="legend-partner" />{labels.partner}</span>}
        <em>{labels.viewOnly}</em><b ref={yawRef}>YAW</b><b ref={pitchRef}>PITCH</b>
      </div>
    </div>
  );
}
