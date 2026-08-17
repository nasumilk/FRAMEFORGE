import type { SceneType, TimelineEvent } from "./types";
import {
  MALE_POV_CAMERA,
  MALE_POV_CAMERA_PLACEMENT,
  PARTNER_OTS_CAMERA_PLACEMENT,
  PRIMARY_OTS_CAMERA_PLACEMENT,
  SIDE_CAMERA_PLACEMENT,
} from "./constants";

const directionalCamera = (camera: string) =>
  camera === "side profile" || camera === "over-the-shoulder" || camera === MALE_POV_CAMERA;

export function placementForT2VCameraAngle(camera: string, currentPlacement: string, sceneType: SceneType): string {
  if (camera === "side profile") return SIDE_CAMERA_PLACEMENT;
  if (camera === "over-the-shoulder") {
    return sceneType === "solo" ? PRIMARY_OTS_CAMERA_PLACEMENT : PARTNER_OTS_CAMERA_PLACEMENT;
  }
  if (camera === MALE_POV_CAMERA) return MALE_POV_CAMERA_PLACEMENT;
  return currentPlacement;
}

export function angleForT2VCameraPlacement(placement: string, currentCamera: string): string {
  if (placement === SIDE_CAMERA_PLACEMENT) return "side profile";
  if (placement === PRIMARY_OTS_CAMERA_PLACEMENT || placement === PARTNER_OTS_CAMERA_PLACEMENT) return "over-the-shoulder";
  if (placement === MALE_POV_CAMERA_PLACEMENT) return MALE_POV_CAMERA;
  return directionalCamera(currentCamera) ? "eye-level angle" : currentCamera;
}

export function normalizeT2VCamera(event: TimelineEvent, sceneType: SceneType): TimelineEvent {
  return {
    ...event,
    cameraPlacement: placementForT2VCameraAngle(event.camera, event.cameraPlacement, sceneType),
  };
}
