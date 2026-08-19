"use client";

import {
  Activity,
  BellRing,
  ChevronDown,
  Clock3,
  Cpu,
  Download,
  Film,
  FolderHeart,
  ImagePlus,
  Layers3,
  Library,
  LoaderCircle,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Square,
  Trash2,
  Upload,
  Video,
  WandSparkles,
  X,
} from "lucide-react";
import NextImage from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Mode = "t2v" | "i2v" | "reference_image" | "reference_video" | "character_motion";
type View = "generate" | "history" | "library" | "settings";

type LoraParameterValue = string | number | boolean;
interface LoraControl {
  key: string;
  input: string;
  label: string;
  type: "number" | "float" | "integer" | "int" | "boolean" | "bool" | "string" | "select";
  default?: LoraParameterValue;
  min?: number;
  max?: number;
  step?: number;
  options?: LoraParameterValue[];
}
interface WorkflowStatus {
  name: string;
  ready: boolean;
  template: string;
  message: string;
  lora_loader?: string | null;
  lora_has_clip?: boolean;
  lora_controls?: LoraControl[];
}
interface LoraMetadata {
  id: string;
  name: string;
  filename: string;
  category: string;
  default_strength: number;
  min_strength: number;
  max_strength: number;
  trigger_words: string[];
  available: boolean;
}
interface SelectedLora {
  id: string;
  strength: number;
  apply_activation_tags: boolean;
  activation_tags: string[];
  workflow_parameters: Record<string, LoraParameterValue>;
}
interface DiffusionModelMetadata {
  filename: string;
  name: string;
  family: "t2v" | "reference" | "h3" | "other";
  precision: string;
  size: number;
  native_modes: Mode[];
  experimental_modes: Mode[];
}
interface Health {
  api: string;
  database: string;
  comfyui: "ok" | "offline";
  comfyui_url: string;
  system?: { comfyui_version?: string; python_version?: string } | null;
  workflows: WorkflowStatus[];
}
interface Job {
  id: string;
  generation_id: string;
  comfy_prompt_id?: string | null;
  status: string;
  progress: number;
  stage?: string | null;
  error_message?: string | null;
  created_at: string;
  completed_at?: string | null;
  generation: {
    id: string;
    mode: Mode;
    prompt: string;
    negative_prompt?: string | null;
    seed: number;
    duration?: number | null;
    workflow_name: string;
    settings: Record<string, unknown>;
    created_at: string;
  };
  media: { id: string; type: string; filename: string; mime_type?: string | null; size?: number | null }[];
}

type NotificationStatus = NotificationPermission | "unsupported" | "install-required";
const COMPLETION_NOTIFICATION_KEY = "h3-studio-completion-notifications";
const MAX_RANDOM_SEED = 2_147_483_647;

function readNotificationStatus(): NotificationStatus {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  const isAppleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (isAppleMobile && !isStandalone) return "install-required";
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
  return Notification.permission;
}

function hasSavedCompletionNotifications(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(COMPLETION_NOTIFICATION_KEY) === "enabled";
  } catch {
    return false;
  }
}

function urlBase64ToArrayBuffer(value: string): ArrayBuffer {
  const padded = value.padEnd(value.length + (4 - value.length % 4) % 4, "=").replace(/-/g, "+").replace(/_/g, "/");
  const source = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  const output = new Uint8Array(source.byteLength);
  output.set(source);
  return output.buffer;
}

const MODES: { id: Mode; label: string; short: string; media: "none" | "image" | "video" | "character_motion" }[] = [
  { id: "t2v", label: "Text to Video", short: "Text", media: "none" },
  { id: "i2v", label: "Image to Video", short: "Image", media: "image" },
  { id: "reference_image", label: "Reference Image", short: "Ref Image", media: "image" },
  { id: "reference_video", label: "Reference Video", short: "Ref Video", media: "video" },
  { id: "character_motion", label: "Character Motion Trace", short: "Char+Motion", media: "character_motion" },
];

const NAV = [
  { id: "generate" as const, label: "Generate", icon: WandSparkles },
  { id: "history" as const, label: "History", icon: Clock3 },
  { id: "library" as const, label: "Library", icon: Library },
  { id: "settings" as const, label: "Settings", icon: Settings },
];

const ASPECT_RATIOS = [
  { label: "9:16 (Portrait Widescreen)", value: 9 / 16 },
  { label: "16:9 (Widescreen)", value: 16 / 9 },
  { label: "1:1 (Square)", value: 1 },
  { label: "3:4 (Portrait Standard)", value: 3 / 4 },
  { label: "4:3 (Standard)", value: 4 / 3 },
  { label: "21:9 (Ultrawide)", value: 21 / 9 },
] as const;

function closestAspectRatio(width: number, height: number): string {
  const sourceRatio = width / height;
  return ASPECT_RATIOS.reduce((closest, candidate) =>
    Math.abs(Math.log(sourceRatio / candidate.value)) < Math.abs(Math.log(sourceRatio / closest.value)) ? candidate : closest,
  ).label;
}

async function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  try {
    return { width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
}

function readFrameforgePrompt(): string {
  if (typeof window === "undefined") return "";
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const value = hash.get("frameforge_prompt");
  if (!value) return "";
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  return value;
}

export default function Home() {
  const [view, setView] = useState<View>("generate");
  const [mode, setMode] = useState<Mode>("t2v");
  const [prompt, setPrompt] = useState("");
  const [seedMode, setSeedMode] = useState<"random" | "fixed">("random");
  const [seed, setSeed] = useState(42);
  const [duration, setDuration] = useState(6);
  const [steps, setSteps] = useState(20);
  const [aspectRatio, setAspectRatio] = useState("9:16 (Portrait Widescreen)");
  const [matchInputAspect, setMatchInputAspect] = useState(true);
  const [inputImageDimensions, setInputImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [megapixels, setMegapixels] = useState(0.4);
  const [referenceSize, setReferenceSize] = useState<"match" | "max">("match");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [health, setHealth] = useState<Health | null>(null);
  const [loraCatalog, setLoraCatalog] = useState<LoraMetadata[]>([]);
  const [selectedLoras, setSelectedLoras] = useState<SelectedLora[]>([]);
  const [diffusionModels, setDiffusionModels] = useState<DiffusionModelMetadata[]>([]);
  const [diffusionModel, setDiffusionModel] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const [stoppingJobIds, setStoppingJobIds] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedUploadId, setSelectedUploadId] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [characterFiles, setCharacterFiles] = useState<File[]>([]);
  const [characterPreviews, setCharacterPreviews] = useState<string[]>([]);
  const [characterUploadIds, setCharacterUploadIds] = useState<string[]>([]);
  const [motionFile, setMotionFile] = useState<File | null>(null);
  const [motionPreview, setMotionPreview] = useState<string | null>(null);
  const [motionUploadId, setMotionUploadId] = useState<string | null>(null);
  const [completionNotifications, setCompletionNotifications] = useState(() => readNotificationStatus() === "granted" && hasSavedCompletionNotifications());
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>(readNotificationStatus);

  const currentMode = MODES.find((item) => item.id === mode)!;
  const workflow = health?.workflows.find((item) => item.name === `h3_${mode}`);
  const workflowLoraControls = workflow?.lora_controls ?? [];
  const extraLoraControls = workflowLoraControls.filter((control) => control.key !== "strength_model");
  const defaultDiffusionModel = useMemo(() => {
    const referenceMode = mode === "reference_image" || mode === "reference_video" || mode === "character_motion";
    const candidates = diffusionModels.filter((model) => model.family === (referenceMode ? "reference" : "t2v"));
    return candidates.find((model) => model.filename.toLowerCase().includes(referenceMode ? "int8_convrot" : "pinkcherry_h3_fl2va_int8_convrot"))?.filename || candidates[0]?.filename || diffusionModels[0]?.filename || "";
  }, [diffusionModels, mode]);
  const effectiveDiffusionModel = diffusionModel || defaultDiffusionModel;
  const hasRequiredMedia = currentMode.media === "none" || currentMode.media === "character_motion"
    ? currentMode.media === "none" || ((characterFiles.length > 0 || characterUploadIds.length > 0) && (motionFile || motionUploadId))
    : Boolean(selectedFile || selectedUploadId);
  const canGenerate = health?.comfyui === "ok" && workflow?.ready && prompt.trim() && hasRequiredMedia;

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
      characterPreviews.forEach((url) => URL.revokeObjectURL(url));
      if (motionPreview) URL.revokeObjectURL(motionPreview);
    };
  }, [localPreview, characterPreviews, motionPreview]);

  const refresh = useCallback(async () => {
    const [healthResponse, jobsResponse, lorasResponse, modelsResponse] = await Promise.allSettled([
      fetch("/api/v1/system/health", { cache: "no-store" }),
      fetch("/api/v1/jobs", { cache: "no-store" }),
      fetch("/api/v1/loras", { cache: "no-store" }),
      fetch("/api/v1/diffusion-models", { cache: "no-store" }),
    ]);
    if (healthResponse.status === "fulfilled" && healthResponse.value.ok) setHealth(await healthResponse.value.json());
    else setHealth({ api: "offline", database: "unknown", comfyui: "offline", comfyui_url: "http://127.0.0.1:8188", workflows: [] });
    if (jobsResponse.status === "fulfilled" && jobsResponse.value.ok) setJobs(await jobsResponse.value.json());
    if (lorasResponse.status === "fulfilled" && lorasResponse.value.ok) setLoraCatalog(await lorasResponse.value.json());
    if (modelsResponse.status === "fulfilled" && modelsResponse.value.ok) setDiffusionModels(await modelsResponse.value.json());
  }, []);

  useEffect(() => {
    const importTimer = window.setTimeout(() => {
      const imported = readFrameforgePrompt();
      if (imported) {
        setPrompt(imported);
        setNotice("FRAMEFORGE prompt imported.");
      }
    }, 0);
    const refreshTimer = window.setTimeout(refresh, 0);
    const timer = window.setInterval(refresh, 5000);
    return () => {
      window.clearTimeout(importTimer);
      window.clearTimeout(refreshTimer);
      window.clearInterval(timer);
    };
  }, [refresh]);

  useEffect(() => {
    if (!activeJob || ["completed", "failed", "cancelled"].includes(activeJob.status)) return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/v1/jobs/${activeJob.id}`, { cache: "no-store" });
      if (response.ok) setActiveJob(await response.json());
    }, 1500);
    return () => window.clearInterval(timer);
  }, [activeJob]);

  const workflowResolution = useMemo(() => ({ aspect_ratio: aspectRatio, megapixels }), [aspectRatio, megapixels]);

  async function choosePrimaryMedia(file: File | null) {
    setSelectedFile(file);
    setSelectedUploadId(null);
    setLocalPreview(file ? URL.createObjectURL(file) : null);
    setInputImageDimensions(null);
    if (!file || mode !== "i2v" || !file.type.startsWith("image/")) return;
    try {
      const dimensions = await readImageDimensions(file);
      setInputImageDimensions(dimensions);
      if (matchInputAspect) setAspectRatio(closestAspectRatio(dimensions.width, dimensions.height));
    } catch {
      setNotice("The image was selected, but its dimensions could not be read. Choose the output aspect ratio manually.");
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!canGenerate) return;
    setBusy(true);
    setNotice("");
    try {
      let mediaId: string | null = selectedUploadId;
      let characterIds = characterUploadIds;
      let traceVideoId = motionUploadId;
      if (selectedFile && (currentMode.media === "image" || currentMode.media === "video")) {
        setNotice(`Uploading ${currentMode.media}…`);
        const form = new FormData();
        form.append("file", selectedFile);
        const uploadResponse = await fetch(`/api/v1/uploads/${currentMode.media}`, { method: "POST", body: form });
        const uploadPayload = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploadPayload.error?.message || "Upload failed.");
        mediaId = uploadPayload.id;
      }
      if (mode === "character_motion") {
        if (characterFiles.length) {
          setNotice(`Uploading ${characterFiles.length} character reference images…`);
          characterIds = [];
          for (const file of characterFiles) {
            const form = new FormData();
            form.append("file", file);
            const uploadResponse = await fetch("/api/v1/uploads/image", { method: "POST", body: form });
            const uploadPayload = await uploadResponse.json();
            if (!uploadResponse.ok) throw new Error(uploadPayload.error?.message || "Character image upload failed.");
            characterIds.push(uploadPayload.id);
          }
        }
        if (motionFile) {
          setNotice("Uploading motion reference video…");
          const form = new FormData();
          form.append("file", motionFile);
          const uploadResponse = await fetch("/api/v1/uploads/video", { method: "POST", body: form });
          const uploadPayload = await uploadResponse.json();
          if (!uploadResponse.ok) throw new Error(uploadPayload.error?.message || "Motion video upload failed.");
          traceVideoId = uploadPayload.id;
        }
      }
      const response = await fetch("/api/v1/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          prompt,
          seed: seedMode === "random" ? null : seed,
          ...workflowResolution,
          duration,
          steps,
          diffusion_model: effectiveDiffusionModel || null,
          loras: selectedLoras.map((selection) => ({
            ...selection,
            workflow_parameters: Object.fromEntries(extraLoraControls.flatMap((control) => {
              const value = selection.workflow_parameters[control.key] ?? control.default;
              return value === undefined ? [] : [[control.key, value]];
            })),
          })),
          advanced: mode.startsWith("reference_") || mode === "character_motion" ? { reference_size: referenceSize } : {},
          image_id: currentMode.media === "image" ? mediaId : null,
          image_ids: mode === "character_motion" ? characterIds : [],
          video_id: mode === "character_motion" ? traceVideoId : currentMode.media === "video" ? mediaId : null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || payload.detail?.[0]?.msg || "Generation request failed.");
      setActiveJob(payload);
      setNotice("Queued in ComfyUI. You can leave this screen; the job will continue.");
      refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Generation request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function stopJob(job: Job) {
    if (["completed", "failed", "cancelled"].includes(job.status) || stoppingJobIds.includes(job.id)) return;
    if (!window.confirm(job.status === "running"
      ? "Stop this running generation? ComfyUI will interrupt the current workflow."
      : "Remove this generation from the ComfyUI queue?")) return;
    setStoppingJobIds((current) => [...current, job.id]);
    try {
      const response = await fetch(`/api/v1/jobs/${job.id}/cancel`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "The generation could not be stopped.");
      setJobs((current) => current.map((item) => item.id === payload.id ? payload : item));
      if (activeJob?.id === payload.id) setActiveJob(payload);
      setNotice(job.status === "running" ? "Generation stopped in ComfyUI." : "Generation removed from the ComfyUI queue.");
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The generation could not be stopped.");
    } finally {
      setStoppingJobIds((current) => current.filter((id) => id !== job.id));
    }
  }

  async function toggleCompletionNotifications() {
    const support = readNotificationStatus();
    setNotificationStatus(support);
    if (support === "install-required") {
      setNotice("On iPhone or iPad, add H3 Studio to the Home Screen and enable notifications from the installed app.");
      return;
    }
    if (support === "unsupported") {
      setNotice("This browser does not support Web Push notifications.");
      return;
    }
    if (completionNotifications) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await fetch("/api/v1/push/subscriptions", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
          await subscription.unsubscribe();
        }
      } catch {
        // The local preference is still respected if an old subscription cannot be removed immediately.
      }
      window.localStorage.setItem(COMPLETION_NOTIFICATION_KEY, "disabled");
      setCompletionNotifications(false);
      setNotice("Completion notifications turned off for this device.");
      return;
    }
    const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    setNotificationStatus(permission);
    if (permission !== "granted") {
      setCompletionNotifications(false);
      window.localStorage.setItem(COMPLETION_NOTIFICATION_KEY, "disabled");
      setNotice(permission === "denied" ? "Notifications are blocked in this browser. Allow them in browser settings to enable alerts." : "Notification permission was not granted.");
      return;
    }
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const keyResponse = await fetch("/api/v1/push/public-key", { cache: "no-store" });
      const keyPayload = await keyResponse.json();
      if (!keyResponse.ok || typeof keyPayload.public_key !== "string") throw new Error("Push key request failed.");
      const subscription = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToArrayBuffer(keyPayload.public_key),
      });
      const payload = subscription.toJSON();
      const subscribeResponse = await fetch("/api/v1/push/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!subscribeResponse.ok) throw new Error("Push subscription could not be saved.");
    } catch (error) {
      window.localStorage.setItem(COMPLETION_NOTIFICATION_KEY, "disabled");
      setCompletionNotifications(false);
      setNotice(error instanceof Error ? error.message : "Push notifications could not be enabled.");
      return;
    }
    window.localStorage.setItem(COMPLETION_NOTIFICATION_KEY, "enabled");
    setCompletionNotifications(true);
    setNotice("Completion notifications are on for this device.");
  }

  function restoreSettings(job: Job) {
    const settings = job.generation.settings;
    setMode(job.generation.mode);
    setPrompt(job.generation.prompt);
    setSeedMode("fixed");
    setSeed(job.generation.seed);
    setDuration(Number(settings.duration ?? job.generation.duration ?? 6));
    setSteps(Math.min(100, Math.max(1, Number(settings.steps ?? 20))));
    setAspectRatio(String(settings.aspect_ratio ?? "9:16 (Portrait Widescreen)"));
    setMatchInputAspect(false);
    setInputImageDimensions(null);
    setMegapixels(Number(settings.megapixels ?? 0.4));
    setDiffusionModel(typeof settings.diffusion_model === "string" ? settings.diffusion_model : "");
    const advanced = typeof settings.advanced === "object" && settings.advanced ? settings.advanced as Record<string, unknown> : {};
    setReferenceSize(advanced.reference_size === "max" ? "max" : "match");
    const restoredLoras = Array.isArray(settings.loras) ? settings.loras : [];
    setSelectedLoras(restoredLoras.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const value = item as Record<string, unknown>;
      if (typeof value.id !== "string" || typeof value.strength !== "number") return [];
      return [{
        id: value.id,
        strength: value.strength,
        apply_activation_tags: value.apply_activation_tags === true,
        activation_tags: Array.isArray(value.activation_tags) ? value.activation_tags.filter((tag): tag is string => typeof tag === "string") : [],
        workflow_parameters: value.workflow_parameters && typeof value.workflow_parameters === "object"
          ? Object.fromEntries(Object.entries(value.workflow_parameters as Record<string, unknown>).filter((entry): entry is [string, LoraParameterValue] => ["string", "number", "boolean"].includes(typeof entry[1])))
          : {},
      }];
    }).slice(0, 4));
    setSelectedFile(null);
    setLocalPreview(null);
    setCharacterFiles([]);
    setCharacterPreviews([]);
    setMotionFile(null);
    setMotionPreview(null);
    const restoredMediaId = job.generation.mode === "reference_video" ? settings.video_id : settings.image_id;
    setSelectedUploadId(typeof restoredMediaId === "string" ? restoredMediaId : null);
    setCharacterUploadIds(Array.isArray(settings.image_ids) ? settings.image_ids.filter((value): value is string => typeof value === "string") : []);
    setMotionUploadId(job.generation.mode === "character_motion" && typeof settings.video_id === "string" ? settings.video_id : null);
    setActiveJob(null);
    setView("generate");
    setNotice("Previous prompt, seed, and generation settings restored. Review them before generating again.");
  }

  function openResult(job: Job) {
    setActiveJob(job);
    setView("generate");
    setNotice("Completed generation loaded from history.");
  }

  async function deleteHistory(job: Job) {
    if (!window.confirm("Remove this item from Mobile Studio history? The ComfyUI output file will be preserved.")) return;
    const response = await fetch(`/api/v1/jobs/${job.id}`, { method: "DELETE" });
    if (response.ok) {
      if (activeJob?.id === job.id) setActiveJob(null);
      await refresh();
    }
  }

  function toggleLora(item: LoraMetadata) {
    setSelectedLoras((current) => {
      if (current.some((selection) => selection.id === item.id)) return current.filter((selection) => selection.id !== item.id);
      if (!item.available || current.length >= 4) return current;
      return [...current, {
        id: item.id,
        strength: item.default_strength,
        apply_activation_tags: false,
        activation_tags: item.trigger_words,
        workflow_parameters: Object.fromEntries(extraLoraControls.flatMap((control) => control.default === undefined ? [] : [[control.key, control.default]])),
      }];
    });
  }

  function updateLoraStrength(id: string, strength: number) {
    const metadata = loraCatalog.find((item) => item.id === id);
    if (!metadata) return;
    const clamped = Math.min(metadata.max_strength, Math.max(metadata.min_strength, strength));
    setSelectedLoras((current) => current.map((item) => item.id === id ? { ...item, strength: clamped } : item));
  }

  function updateLoraSettings(id: string, patch: Partial<SelectedLora>) {
    setSelectedLoras((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function updateLoraWorkflowParameter(id: string, key: string, value: LoraParameterValue) {
    setSelectedLoras((current) => current.map((item) => item.id === id ? {
      ...item,
      workflow_parameters: { ...item.workflow_parameters, [key]: value },
    } : item));
  }

  function parseActivationTags(value: string) {
    const seen = new Set<string>();
    return value.split(/[,\n]/).map((tag) => tag.trim()).filter((tag) => {
      if (!tag || seen.has(tag.toLowerCase())) return false;
      seen.add(tag.toLowerCase());
      return true;
    }).slice(0, 20);
  }

  function randomizeSeed() {
    setSeed(Math.floor(Math.random() * (MAX_RANDOM_SEED + 1)));
    setSeedMode("fixed");
  }

  function resetMedia() {
    setSelectedFile(null);
    setSelectedUploadId(null);
    setLocalPreview(null);
    setCharacterFiles([]);
    setCharacterPreviews([]);
    setCharacterUploadIds([]);
    setMotionFile(null);
    setMotionPreview(null);
    setMotionUploadId(null);
    setInputImageDimensions(null);
  }

  function chooseCharacterImages(files: FileList | null) {
    const selected = Array.from(files || []).slice(0, 9);
    setCharacterFiles(selected);
    setCharacterUploadIds([]);
    setCharacterPreviews(selected.map((file) => URL.createObjectURL(file)));
  }

  const selectedDiffusionMetadata = diffusionModels.find((model) => model.filename === effectiveDiffusionModel);
  const diffusionIsExperimental = Boolean(selectedDiffusionMetadata?.experimental_modes.includes(mode));

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark"><Film size={20} /></div>
        <div className="brand-copy"><strong>MINIMAX H3</strong><span>MOBILE STUDIO</span></div>
        <div className={`engine-pill ${health?.comfyui === "ok" ? "online" : "offline"}`}>
          <span />{health?.comfyui === "ok" ? "Engine online" : "Engine offline"}
        </div>
      </header>

      <main className="main-area">
        {view === "generate" && (
          <div className="generate-layout">
            <section className="hero-panel">
              <div className="eyebrow"><Sparkles size={14} /> LOCAL GPU VIDEO CREATION</div>
              <h1>From prompt to motion,<br /><em>without the node graph.</em></h1>
              <p>Build and queue MiniMax H3 generations from any device on your Tailscale network.</p>
              <div className="engine-summary">
                <Cpu size={18} />
                <div><strong>{health?.comfyui === "ok" ? "ComfyUI connected" : "ComfyUI unavailable"}</strong><span>{health?.comfyui_url || "Checking local engine…"}</span></div>
                <Activity size={16} className={health?.comfyui === "ok" ? "pulse" : ""} />
              </div>
            </section>

            <form className="composer-card" onSubmit={submit}>
              <div className="section-heading"><div><span>01</span><div><strong>Generation mode</strong><small>Select the workflow family</small></div></div></div>
              <div className="mode-grid">
                {MODES.map((item) => (
                  <button type="button" key={item.id} title={item.label} onClick={() => { setMode(item.id); setDiffusionModel(""); resetMedia(); }} className={mode === item.id ? "active" : ""}>
                    {item.media === "image" || item.media === "character_motion" ? <ImagePlus size={18} /> : item.media === "video" ? <Video size={18} /> : <Sparkles size={18} />}
                    <span>{item.short}</span>
                  </button>
                ))}
              </div>

              {(currentMode.media === "image" || currentMode.media === "video") && (
                <label className="upload-zone">
                  {(localPreview || selectedUploadId) && currentMode.media === "image" && <NextImage src={localPreview || `/api/v1/uploads/${selectedUploadId}`} alt="Selected reference" width={640} height={360} unoptimized />}
                  {(localPreview || selectedUploadId) && currentMode.media === "video" && <video src={localPreview || `/api/v1/uploads/${selectedUploadId}`} muted playsInline />}
                  <Upload size={22} />
                  <strong>{selectedFile ? selectedFile.name : selectedUploadId ? "Saved reference restored" : `Choose reference ${currentMode.media}`}</strong>
                  <span>{selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB${inputImageDimensions ? ` · ${inputImageDimensions.width}×${inputImageDimensions.height}` : ""}` : selectedUploadId ? "Tap to replace" : "Photos, Files, or Camera"}</span>
                  <input type="file" accept={currentMode.media === "image" ? "image/*" : "video/*"} onChange={(event) => void choosePrimaryMedia(event.target.files?.[0] || null)} />
                </label>
              )}

              {mode === "character_motion" && (
                <section className="character-motion-inputs">
                  <div className="reference-role-card identity-role">
                    <div className="reference-role-heading"><span>IDENTITY</span><div><strong>Character reference images</strong><small>1–9 angles of the same character</small></div></div>
                    {(characterPreviews.length > 0 || characterUploadIds.length > 0) && <div className="character-preview-grid">
                      {characterPreviews.map((url, index) => <NextImage key={url} src={url} alt={`Character reference ${index + 1}`} width={160} height={160} unoptimized />)}
                      {!characterPreviews.length && characterUploadIds.map((id, index) => <NextImage key={id} src={`/api/v1/uploads/${id}`} alt={`Saved character reference ${index + 1}`} width={160} height={160} unoptimized />)}
                    </div>}
                    <label className="compact-upload-zone"><ImagePlus size={20} /><strong>{characterFiles.length ? `${characterFiles.length} images selected` : characterUploadIds.length ? `${characterUploadIds.length} saved images restored` : "Choose character images"}</strong><span>Front, profile, and three-quarter views work well</span><input type="file" accept="image/*" multiple onChange={(event) => chooseCharacterImages(event.target.files)} /></label>
                  </div>
                  <div className="reference-role-card motion-role">
                    <div className="reference-role-heading"><span>MOTION</span><div><strong>Movement reference video</strong><small>Motion, timing, pose sequence, and camera path</small></div></div>
                    {(motionPreview || motionUploadId) && <video className="motion-preview" src={motionPreview || `/api/v1/uploads/${motionUploadId}`} muted controls playsInline />}
                    <label className="compact-upload-zone"><Video size={20} /><strong>{motionFile ? motionFile.name : motionUploadId ? "Saved motion video restored" : "Choose movement video"}</strong><span>2–15 seconds at 24 fps is recommended</span><input type="file" accept="video/*" onChange={(event) => { const file = event.target.files?.[0] || null; setMotionFile(file); setMotionUploadId(null); setMotionPreview(file ? URL.createObjectURL(file) : null); }} /></label>
                  </div>
                  <p className="trace-note">The pictures control identity. The video controls movement only; its performer’s appearance is explicitly excluded.</p>
                </section>
              )}

              <div className="section-heading prompt-heading"><div><span>02</span><div><strong>Prompt</strong><small>Describe the shot and motion</small></div></div><span className="counter">{prompt.length.toLocaleString()}</span></div>
              <div className="prompt-wrap">
                <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Paste a FRAMEFORGE prompt or describe your target video…" />
                {prompt && <button type="button" className="clear-button" onClick={() => setPrompt("")} aria-label="Clear prompt"><X size={15} /></button>}
                {notice.includes("FRAMEFORGE") && <span className="source-badge"><Film size={12} /> FRAMEFORGE</span>}
              </div>

              <div className="quick-settings">
                <label><span>Duration</span><select value={duration} onChange={(event) => setDuration(Number(event.target.value))}><option value={5}>5 seconds</option><option value={6}>6 seconds</option><option value={10}>10 seconds</option><option value={15}>15 seconds</option></select></label>
                <label><span>Aspect ratio</span><select value={aspectRatio} onChange={(event) => { setAspectRatio(event.target.value); if (mode === "i2v") setMatchInputAspect(false); }}>{ASPECT_RATIOS.map((item) => <option key={item.label}>{item.label}</option>)}</select></label>
              </div>
              <section className="seed-control" aria-label="Seed settings">
                <div><strong>Seed</strong><small>{seedMode === "random" ? "A new seed is chosen by the engine for every generation" : "Reuse this value to reproduce a result"}</small></div>
                <div className="seed-actions"><div className="segmented"><button type="button" className={seedMode === "random" ? "active" : ""} onClick={() => setSeedMode("random")}>Random</button><button type="button" className={seedMode === "fixed" ? "active" : ""} onClick={() => setSeedMode("fixed")}>Fixed</button></div>{seedMode === "fixed" && <><input aria-label="Fixed seed" type="number" min={0} max={MAX_RANDOM_SEED} value={seed} onChange={(event) => setSeed(Math.min(MAX_RANDOM_SEED, Math.max(0, Number(event.target.value) || 0)))} /><button type="button" className="seed-randomize" onClick={randomizeSeed}><RefreshCw size={14} /> New</button></>}</div>
              </section>
              {mode === "i2v" && <label className="i2v-aspect-lock"><input type="checkbox" checked={matchInputAspect} onChange={(event) => { const enabled = event.target.checked; setMatchInputAspect(enabled); if (enabled && inputImageDimensions) setAspectRatio(closestAspectRatio(inputImageDimensions.width, inputImageDimensions.height)); }} /><Square size={15} /><div><strong>Match output shape to the first frame</strong><small>{inputImageDimensions ? `${inputImageDimensions.width}×${inputImageDimensions.height} → ${aspectRatio}` : "Automatically chooses the nearest supported aspect ratio after upload."}</small></div></label>}

              <section className="model-selector-card">
                <div className="model-selector-heading"><Cpu size={16} /><div><strong>Diffusion model</strong><small>All model files installed in ComfyUI</small></div><span className={diffusionIsExperimental ? "experimental" : "native"}>{diffusionIsExperimental ? "EXPERIMENTAL" : "NATIVE"}</span></div>
                <select aria-label="Diffusion model" value={effectiveDiffusionModel} onChange={(event) => setDiffusionModel(event.target.value)}>
                  {diffusionModels.map((model) => <option key={model.filename} value={model.filename}>{model.name} · {model.precision}{model.experimental_modes.includes(mode) ? " · Experimental in this mode" : ""}</option>)}
                </select>
                <div className="model-facts"><span>{selectedDiffusionMetadata?.family === "t2v" ? "T2V / FL2VA" : selectedDiffusionMetadata?.family === "reference" ? "REFERENCE / REF2VA" : selectedDiffusionMetadata?.family === "h3" ? "H3 / UNCLASSIFIED" : "OTHER / UNVERIFIED"}</span><span>{selectedDiffusionMetadata ? `${(selectedDiffusionMetadata.size / 1024 / 1024 / 1024).toFixed(1)} GB` : "Scanning…"}</span><button type="button" onClick={refresh}><RefreshCw size={11} /> Rescan</button></div>
                {diffusionIsExperimental && <p>{selectedDiffusionMetadata?.family === "other"
                  ? "互換性未確認の拡散モデルです。現在のH3ワークフローで読み込めない場合や、期待した映像にならない可能性があります。"
                  : "T2VモデルをReference処理へ流用します。画質が向上する場合がありますが、参照画像・動作追従が弱くなる、またはモデル互換性エラーになる可能性があります。"}</p>}
              </section>

              <section className="lora-stack">
                <div className="lora-stack-heading">
                  <div><Layers3 size={16} /><div><strong>LoRA stack</strong><small>{workflow?.lora_loader || "No loader mapping"} · {workflow?.lora_has_clip ? "MODEL + CLIP" : "MODEL only"}</small></div></div>
                  <span>{selectedLoras.length}/4 selected</span>
                </div>
                <div className="lora-picker">
                  {loraCatalog.length ? loraCatalog.map((item) => {
                    const selected = selectedLoras.some((selection) => selection.id === item.id);
                    return <button type="button" key={item.id} className={selected ? "selected" : ""} disabled={!item.available || (!selected && selectedLoras.length >= 4)} onClick={() => toggleLora(item)} title={item.available ? item.filename : `${item.filename} is not installed`}><span>{selected ? <X size={13} /> : <Plus size={13} />}</span><div><strong>{item.name}</strong><small>{item.available ? item.category : "Not installed"}</small></div></button>;
                  }) : <p className="lora-empty">No H3 LoRAs found in the local library.</p>}
                </div>
                {selectedLoras.length > 0 && <div className="lora-strength-list">
                  {selectedLoras.map((selection, index) => {
                    const item = loraCatalog.find((candidate) => candidate.id === selection.id);
                    if (!item) return null;
                    return <div key={selection.id} className="lora-settings-card">
                      <div className="lora-strength-row"><span className="lora-order">{index + 1}</span><div><strong>{item.name}</strong><small>MODEL WEIGHT · {workflow?.lora_loader || "workflow loader"}</small><input aria-label={`${item.name} model strength`} type="range" min={item.min_strength} max={item.max_strength} step={0.05} value={selection.strength} onChange={(event) => updateLoraStrength(item.id, Number(event.target.value))} /></div><input aria-label={`${item.name} model strength value`} type="number" min={item.min_strength} max={item.max_strength} step={0.05} value={selection.strength} onChange={(event) => updateLoraStrength(item.id, Number(event.target.value))} /><button type="button" className="lora-reset" onClick={() => updateLoraStrength(item.id, item.default_strength)}>Reset</button></div>
                      {extraLoraControls.length > 0 && <div className="lora-workflow-parameters">
                        {extraLoraControls.map((control) => {
                          const value = selection.workflow_parameters[control.key] ?? control.default ?? ((control.type === "boolean" || control.type === "bool") ? false : "");
                          if (control.type === "boolean" || control.type === "bool") return <label key={control.key} className="lora-activation-toggle"><input type="checkbox" checked={Boolean(value)} onChange={(event) => updateLoraWorkflowParameter(item.id, control.key, event.target.checked)} /><span>{control.label}</span></label>;
                          if (control.type === "select" && control.options?.length) return <label key={control.key} className="lora-workflow-control"><span>{control.label}</span><select value={String(value)} onChange={(event) => { const selected = control.options?.find((option) => String(option) === event.target.value); updateLoraWorkflowParameter(item.id, control.key, selected ?? event.target.value); }}>{control.options.map((option) => <option key={String(option)} value={String(option)}>{String(option)}</option>)}</select></label>;
                          if (["number", "float", "integer", "int"].includes(control.type)) return <label key={control.key} className="lora-workflow-control"><span>{control.label}</span><div><input aria-label={`${item.name} ${control.label}`} type="range" min={control.min} max={control.max} step={control.step ?? (control.type === "integer" || control.type === "int" ? 1 : 0.05)} value={Number(value)} onChange={(event) => updateLoraWorkflowParameter(item.id, control.key, Number(event.target.value))} /><input aria-label={`${item.name} ${control.label} value`} type="number" min={control.min} max={control.max} step={control.step ?? (control.type === "integer" || control.type === "int" ? 1 : 0.05)} value={Number(value)} onChange={(event) => updateLoraWorkflowParameter(item.id, control.key, Number(event.target.value))} /></div></label>;
                          return <label key={control.key} className="lora-workflow-control"><span>{control.label}</span><input value={String(value)} onChange={(event) => updateLoraWorkflowParameter(item.id, control.key, event.target.value)} /></label>;
                        })}
                      </div>}
                      <label className="lora-activation-toggle"><input type="checkbox" checked={selection.apply_activation_tags} onChange={(event) => updateLoraSettings(item.id, { apply_activation_tags: event.target.checked })} /><span>Append this LoRA&apos;s activation tags to the prompt</span></label>
                      <label className="lora-activation-tags"><span>Activation tags (comma-separated)</span><input aria-label={`${item.name} activation tags`} value={selection.activation_tags.join(", ")} onChange={(event) => updateLoraSettings(item.id, { activation_tags: parseActivationTags(event.target.value) })} placeholder={item.trigger_words.length ? item.trigger_words.join(", ") : "Optional trigger words"} /></label>
                    </div>;
                  })}
                  <p>LoRAs are applied from top to bottom. Combining several models can increase VRAM use.</p>
                </div>}
                {mode === "i2v" && selectedLoras.length > 0 && <p className="i2v-risk-warning">I2V identity warning: LoRAs can override the face, body, clothing, or visual style in the first frame. Reduce strength or remove them when reference fidelity is the priority.</p>}
              </section>

              <button type="button" className="advanced-toggle" onClick={() => setAdvancedOpen((value) => !value)}><SlidersHorizontal size={16} /> Advanced settings <ChevronDown size={16} className={advancedOpen ? "rotate" : ""} /></button>
              {advancedOpen && (
                <div className="advanced-panel">
                  <label><span>Sampling steps</span><input type="number" min={1} max={100} step={1} value={steps} onChange={(event) => setSteps(Math.min(100, Math.max(1, Number(event.target.value) || 1)))} /><small>More steps can improve refinement but take longer. The workflow default is 20.</small></label>
                  <label><span>Target megapixels</span><input type="number" min={0.1} max={16} step={0.1} value={megapixels} onChange={(event) => setMegapixels(Number(event.target.value))} /></label>
                  {(mode.startsWith("reference_") || mode === "character_motion") && <label><span>Reference fidelity</span><select value={referenceSize} onChange={(event) => setReferenceSize(event.target.value as "match" | "max")}><option value="match">Match output size (faster)</option><option value="max">Maximum identity detail (slower)</option></select></label>}
                </div>
              )}

              {notice && <div className={`notice ${notice.includes("failed") || notice.includes("not installed") ? "error" : ""}`}>{notice}</div>}
              {!workflow?.ready && health?.comfyui === "ok" && <div className="notice warning">{workflow?.message || "Export and install the API workflow mapping to enable this mode."}</div>}
              {activeJob && (
                <div className="job-progress">
                  <div>{activeJob.status === "completed" ? <Play size={17} /> : <LoaderCircle size={17} className={activeJob.status === "running" ? "spin" : ""} />}<strong>{activeJob.status}</strong><span>{activeJob.stage}</span></div>
                  <div className="progress-track"><span style={{ width: `${activeJob.progress}%` }} /></div>
                  {!(["completed", "failed", "cancelled"].includes(activeJob.status)) && <button type="button" disabled={stoppingJobIds.includes(activeJob.id)} onClick={() => stopJob(activeJob)}><Square size={13} /> {stoppingJobIds.includes(activeJob.id) ? "Stopping…" : "Stop generation"}</button>}
                </div>
              )}
              {activeJob?.status === "completed" && activeJob.media?.[0] && (
                <div className="result-video">
                  <video controls playsInline preload="metadata" src={`/api/v1/media/${activeJob.media[0].id}`} />
                  <div className="result-actions">
                    <a href={`/api/v1/media/${activeJob.media[0].id}?download=true`} download><Download size={15} /> Download MP4</a>
                    <button type="button" onClick={() => restoreSettings(activeJob)}><RotateCcw size={15} /> Use settings</button>
                  </div>
                </div>
              )}
              <button className="generate-button" disabled={!canGenerate || busy}>
                {busy ? <LoaderCircle size={19} className="spin" /> : <Play size={19} fill="currentColor" />}
                {health?.comfyui !== "ok" ? "COMFYUI OFFLINE" : !workflow?.ready ? "WORKFLOW SETUP REQUIRED" : "GENERATE VIDEO"}
              </button>
              <p className="generate-note">Jobs run asynchronously on your local GPU.</p>
            </form>
          </div>
        )}

        {view === "history" && <HistoryView jobs={jobs} refresh={refresh} onOpen={openResult} onRestore={restoreSettings} onDelete={deleteHistory} onStop={stopJob} stoppingJobIds={stoppingJobIds} />}
        {view === "library" && <LibraryView loras={loraCatalog} />}
        {view === "settings" && <SettingsView health={health} refresh={refresh} notificationsEnabled={completionNotifications} notificationStatus={notificationStatus} onToggleNotifications={toggleCompletionNotifications} />}
      </main>

      <nav className="bottom-nav" aria-label="Primary navigation">
        {NAV.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><item.icon size={20} /><span>{item.label}</span></button>)}
      </nav>
    </div>
  );
}

function HistoryView({ jobs, refresh, onOpen, onRestore, onDelete, onStop, stoppingJobIds }: { jobs: Job[]; refresh: () => void; onOpen: (job: Job) => void; onRestore: (job: Job) => void; onDelete: (job: Job) => void; onStop: (job: Job) => void; stoppingJobIds: string[] }) {
  return <section className="content-page"><div className="page-title"><div><span>GENERATIONS</span><h2>History & Queue</h2><p>Stop queued or running generations, or reopen completed videos.</p></div><button onClick={refresh}><RefreshCw size={16} /> Refresh</button></div>{jobs.length ? <div className="history-grid">{jobs.map((job) => { const media = job.media?.[0]; const isActive = !["completed", "failed", "cancelled"].includes(job.status); const isStopping = stoppingJobIds.includes(job.id); return <article className="history-card" key={job.id}>{media ? <video controls playsInline preload="metadata" src={`/api/v1/media/${media.id}`} /> : <div className={`history-placeholder ${job.status}`}><LoaderCircle className={job.status === "running" ? "spin" : ""} size={24} /><span>{job.progress}%</span></div>}<div className="history-body"><div className="history-meta"><span>{job.generation.mode.toUpperCase()}</span><time>{new Date(job.created_at).toLocaleString()}</time></div><p>{job.generation.prompt}</p><div className="history-facts"><span>Seed {job.generation.seed}</span><span>{job.generation.duration ?? "–"}s</span><span>{job.status}</span></div><div className="history-actions">{media && <button onClick={() => onOpen(job)}><Play size={14} /> Open</button>}{isActive && <button className="danger" disabled={isStopping} onClick={() => onStop(job)}><Square size={14} /> {isStopping ? "Stopping…" : job.status === "running" ? "Stop running" : "Remove queue"}</button>}<button onClick={() => onRestore(job)}><RotateCcw size={14} /> Use settings</button>{!isActive && <button className="danger" onClick={() => onDelete(job)} aria-label="Delete history"><Trash2 size={14} /></button>}</div></div></article>; })}</div> : <EmptyState icon={Clock3} title="No generations yet" body="Your queued and completed videos will appear here." />}</section>;
}

function LibraryView({ loras }: { loras: LoraMetadata[] }) {
  return <section className="content-page"><div className="page-title"><div><span>ASSETS</span><h2>LoRA Library</h2><p>Local models registered for the H3 workflow stack.</p></div></div>{loras.length ? <div className="library-grid">{loras.map((item) => <article key={item.id}><div><FolderHeart size={21} /></div><span>{item.category}</span><strong>{item.name}</strong><small>{item.filename}</small><b className={item.available ? "good" : "bad"}>{item.available ? "Installed" : "Missing"}</b></article>)}</div> : <EmptyState icon={FolderHeart} title="No LoRAs registered" body="Add model metadata to config/loras.yaml, then refresh this page." />}</section>;
}

function SettingsView({ health, refresh, notificationsEnabled, notificationStatus, onToggleNotifications }: { health: Health | null; refresh: () => void; notificationsEnabled: boolean; notificationStatus: NotificationStatus; onToggleNotifications: () => Promise<void> }) {
  const notificationMessage = notificationStatus === "unsupported"
    ? "This browser does not support notifications."
    : notificationStatus === "install-required"
      ? "On iPhone or iPad, install H3 Studio to the Home Screen first."
    : notificationStatus === "denied"
      ? "Blocked by browser settings."
      : notificationsEnabled
        ? "Enabled for completed generations on this device."
        : "Allow notifications to receive completion alerts.";
  return <section className="content-page"><div className="page-title"><div><span>SYSTEM</span><h2>Settings</h2><p>Local engine and workflow readiness.</p></div><button onClick={refresh}><RefreshCw size={16} /> Check</button></div><div className="settings-grid"><article><span>ComfyUI</span><strong className={health?.comfyui === "ok" ? "good" : "bad"}>{health?.comfyui === "ok" ? "Connected" : "Offline"}</strong><small>{health?.comfyui_url}</small></article><article><span>API</span><strong className={health?.api === "ok" ? "good" : "bad"}>{health?.api || "Checking"}</strong><small>FastAPI + SQLite</small></article></div><section className="notification-card"><div><BellRing size={19} /><div><strong>Generation completion notifications</strong><small>{notificationMessage}</small></div></div><button type="button" className={notificationsEnabled ? "enabled" : ""} disabled={notificationStatus === "unsupported" || notificationStatus === "denied" || notificationStatus === "install-required"} onClick={() => void onToggleNotifications()}>{notificationsEnabled ? "ON" : notificationStatus === "denied" ? "BLOCKED" : notificationStatus === "install-required" ? "INSTALL" : "ENABLE"}</button><p>{notificationStatus === "install-required" ? "Safari Share → Add to Home Screen → open H3 Studio from its icon → enable notifications here." : "Works even after the Mobile Studio tab is closed, as long as this machine is online."}</p></section><div className="workflow-list"><h3>Workflow templates</h3>{health?.workflows.map((workflow) => <div key={workflow.name}><span className={workflow.ready ? "ready-dot" : "missing-dot"} /><div><strong>{workflow.name.replace("h3_", "").replaceAll("_", " ").toUpperCase()}</strong><small>{workflow.message}</small></div><b>{workflow.ready ? "READY" : "SETUP"}</b></div>)}</div></section>;
}

function EmptyState({ icon: Icon, title, body }: { icon: typeof Clock3; title: string; body: string }) {
  return <div className="empty-state"><Icon size={30} /><strong>{title}</strong><p>{body}</p></div>;
}
