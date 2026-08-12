"use client";

import {
  Activity,
  ChevronDown,
  Clock3,
  Cpu,
  Download,
  Film,
  FolderHeart,
  ImagePlus,
  Library,
  LoaderCircle,
  Play,
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

type Mode = "t2v" | "i2v" | "reference_image" | "reference_video";
type View = "generate" | "history" | "library" | "settings";

interface WorkflowStatus { name: string; ready: boolean; template: string; message: string }
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

const MODES: { id: Mode; label: string; short: string; media: "none" | "image" | "video" }[] = [
  { id: "t2v", label: "Text to Video", short: "Text", media: "none" },
  { id: "i2v", label: "Image to Video", short: "Image", media: "image" },
  { id: "reference_image", label: "Reference Image", short: "Ref Image", media: "image" },
  { id: "reference_video", label: "Reference Video", short: "Ref Video", media: "video" },
];

const NAV = [
  { id: "generate" as const, label: "Generate", icon: WandSparkles },
  { id: "history" as const, label: "History", icon: Clock3 },
  { id: "library" as const, label: "Library", icon: Library },
  { id: "settings" as const, label: "Settings", icon: Settings },
];

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
  const [aspectRatio, setAspectRatio] = useState("9:16 (Portrait Widescreen)");
  const [megapixels, setMegapixels] = useState(0.4);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [health, setHealth] = useState<Health | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedUploadId, setSelectedUploadId] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const currentMode = MODES.find((item) => item.id === mode)!;
  const workflow = health?.workflows.find((item) => item.name === `h3_${mode}`);
  const canGenerate = health?.comfyui === "ok" && workflow?.ready && prompt.trim() && (currentMode.media === "none" || selectedFile || selectedUploadId);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const refresh = useCallback(async () => {
    const [healthResponse, jobsResponse] = await Promise.allSettled([
      fetch("/api/v1/system/health", { cache: "no-store" }),
      fetch("/api/v1/jobs", { cache: "no-store" }),
    ]);
    if (healthResponse.status === "fulfilled" && healthResponse.value.ok) setHealth(await healthResponse.value.json());
    else setHealth({ api: "offline", database: "unknown", comfyui: "offline", comfyui_url: "http://127.0.0.1:8188", workflows: [] });
    if (jobsResponse.status === "fulfilled" && jobsResponse.value.ok) setJobs(await jobsResponse.value.json());
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

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!canGenerate) return;
    setBusy(true);
    setNotice("");
    try {
      let mediaId: string | null = selectedUploadId;
      if (selectedFile && currentMode.media !== "none") {
        setNotice(`Uploading ${currentMode.media}…`);
        const form = new FormData();
        form.append("file", selectedFile);
        const uploadResponse = await fetch(`/api/v1/uploads/${currentMode.media}`, { method: "POST", body: form });
        const uploadPayload = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploadPayload.error?.message || "Upload failed.");
        mediaId = uploadPayload.id;
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
          image_id: currentMode.media === "image" ? mediaId : null,
          video_id: currentMode.media === "video" ? mediaId : null,
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

  async function cancel() {
    if (!activeJob) return;
    const response = await fetch(`/api/v1/jobs/${activeJob.id}/cancel`, { method: "POST" });
    if (response.ok) setActiveJob(await response.json());
  }

  function restoreSettings(job: Job) {
    const settings = job.generation.settings;
    setMode(job.generation.mode);
    setPrompt(job.generation.prompt);
    setSeedMode("fixed");
    setSeed(job.generation.seed);
    setDuration(Number(settings.duration ?? job.generation.duration ?? 6));
    setAspectRatio(String(settings.aspect_ratio ?? "9:16 (Portrait Widescreen)"));
    setMegapixels(Number(settings.megapixels ?? 0.4));
    setSelectedFile(null);
    setLocalPreview(null);
    const restoredMediaId = job.generation.mode === "reference_video" ? settings.video_id : settings.image_id;
    setSelectedUploadId(typeof restoredMediaId === "string" ? restoredMediaId : null);
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
                  <button type="button" key={item.id} onClick={() => { setMode(item.id); setSelectedFile(null); setSelectedUploadId(null); setLocalPreview(null); }} className={mode === item.id ? "active" : ""}>
                    {item.media === "image" ? <ImagePlus size={18} /> : item.media === "video" ? <Video size={18} /> : <Sparkles size={18} />}
                    <span>{item.short}</span>
                  </button>
                ))}
              </div>

              {currentMode.media !== "none" && (
                <label className="upload-zone">
                  {(localPreview || selectedUploadId) && currentMode.media === "image" && <NextImage src={localPreview || `/api/v1/uploads/${selectedUploadId}`} alt="Selected reference" width={640} height={360} unoptimized />}
                  {(localPreview || selectedUploadId) && currentMode.media === "video" && <video src={localPreview || `/api/v1/uploads/${selectedUploadId}`} muted playsInline />}
                  <Upload size={22} />
                  <strong>{selectedFile ? selectedFile.name : selectedUploadId ? "Saved reference restored" : `Choose reference ${currentMode.media}`}</strong>
                  <span>{selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB` : selectedUploadId ? "Tap to replace" : "Photos, Files, or Camera"}</span>
                  <input type="file" accept={currentMode.media === "image" ? "image/*" : "video/*"} onChange={(event) => { const file = event.target.files?.[0] || null; setSelectedFile(file); setSelectedUploadId(null); setLocalPreview(file ? URL.createObjectURL(file) : null); }} />
                </label>
              )}

              <div className="section-heading prompt-heading"><div><span>02</span><div><strong>Prompt</strong><small>Describe the shot and motion</small></div></div><span className="counter">{prompt.length.toLocaleString()}</span></div>
              <div className="prompt-wrap">
                <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Paste a FRAMEFORGE prompt or describe your target video…" />
                {prompt && <button type="button" className="clear-button" onClick={() => setPrompt("")} aria-label="Clear prompt"><X size={15} /></button>}
                {notice.includes("FRAMEFORGE") && <span className="source-badge"><Film size={12} /> FRAMEFORGE</span>}
              </div>

              <div className="quick-settings">
                <label><span>Duration</span><select value={duration} onChange={(event) => setDuration(Number(event.target.value))}><option value={5}>5 seconds</option><option value={6}>6 seconds</option><option value={10}>10 seconds</option><option value={15}>15 seconds</option></select></label>
                <label><span>Aspect ratio</span><select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)}><option>9:16 (Portrait Widescreen)</option><option>16:9 (Widescreen)</option><option>1:1 (Square)</option><option>3:4 (Portrait Standard)</option><option>4:3 (Standard)</option><option>21:9 (Ultrawide)</option></select></label>
              </div>

              <button type="button" className="advanced-toggle" onClick={() => setAdvancedOpen((value) => !value)}><SlidersHorizontal size={16} /> Advanced settings <ChevronDown size={16} className={advancedOpen ? "rotate" : ""} /></button>
              {advancedOpen && (
                <div className="advanced-panel">
                  <div className="segmented"><button type="button" className={seedMode === "random" ? "active" : ""} onClick={() => setSeedMode("random")}>Random seed</button><button type="button" className={seedMode === "fixed" ? "active" : ""} onClick={() => setSeedMode("fixed")}>Fixed seed</button></div>
                  {seedMode === "fixed" && <label><span>Seed</span><input type="number" min={0} value={seed} onChange={(event) => setSeed(Number(event.target.value))} /></label>}
                  <label><span>Target megapixels</span><input type="number" min={0.1} max={16} step={0.1} value={megapixels} onChange={(event) => setMegapixels(Number(event.target.value))} /></label>
                </div>
              )}

              {notice && <div className={`notice ${notice.includes("failed") || notice.includes("not installed") ? "error" : ""}`}>{notice}</div>}
              {!workflow?.ready && health?.comfyui === "ok" && <div className="notice warning">{workflow?.message || "Export and install the API workflow mapping to enable this mode."}</div>}
              {activeJob && (
                <div className="job-progress">
                  <div>{activeJob.status === "completed" ? <Play size={17} /> : <LoaderCircle size={17} className={activeJob.status === "running" ? "spin" : ""} />}<strong>{activeJob.status}</strong><span>{activeJob.stage}</span></div>
                  <div className="progress-track"><span style={{ width: `${activeJob.progress}%` }} /></div>
                  {!(["completed", "failed", "cancelled"].includes(activeJob.status)) && <button type="button" onClick={cancel}><Square size={13} /> Cancel</button>}
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

        {view === "history" && <HistoryView jobs={jobs} refresh={refresh} onOpen={openResult} onRestore={restoreSettings} onDelete={deleteHistory} />}
        {view === "library" && <LibraryView />}
        {view === "settings" && <SettingsView health={health} refresh={refresh} />}
      </main>

      <nav className="bottom-nav" aria-label="Primary navigation">
        {NAV.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><item.icon size={20} /><span>{item.label}</span></button>)}
      </nav>
    </div>
  );
}

function HistoryView({ jobs, refresh, onOpen, onRestore, onDelete }: { jobs: Job[]; refresh: () => void; onOpen: (job: Job) => void; onRestore: (job: Job) => void; onDelete: (job: Job) => void }) {
  return <section className="content-page"><div className="page-title"><div><span>GENERATIONS</span><h2>History</h2><p>Videos, prompts, seeds, and settings are saved locally.</p></div><button onClick={refresh}><RefreshCw size={16} /> Refresh</button></div>{jobs.length ? <div className="history-grid">{jobs.map((job) => { const media = job.media?.[0]; return <article className="history-card" key={job.id}>{media ? <video controls playsInline preload="metadata" src={`/api/v1/media/${media.id}`} /> : <div className={`history-placeholder ${job.status}`}><LoaderCircle className={job.status === "running" ? "spin" : ""} size={24} /><span>{job.progress}%</span></div>}<div className="history-body"><div className="history-meta"><span>{job.generation.mode.toUpperCase()}</span><time>{new Date(job.created_at).toLocaleString()}</time></div><p>{job.generation.prompt}</p><div className="history-facts"><span>Seed {job.generation.seed}</span><span>{job.generation.duration ?? "–"}s</span><span>{job.status}</span></div><div className="history-actions">{media && <button onClick={() => onOpen(job)}><Play size={14} /> Open</button>}<button onClick={() => onRestore(job)}><RotateCcw size={14} /> Use settings</button><button className="danger" onClick={() => onDelete(job)} aria-label="Delete history"><Trash2 size={14} /></button></div></div></article>; })}</div> : <EmptyState icon={Clock3} title="No generations yet" body="Your queued and completed videos will appear here." />}</section>;
}

function LibraryView() {
  return <section className="content-page"><div className="page-title"><div><span>ASSETS</span><h2>LoRA Library</h2><p>Metadata-driven models, ready for workflow mapping.</p></div></div><EmptyState icon={FolderHeart} title="Library framework ready" body="Run the LoRA scan script to create editable metadata drafts from your ComfyUI models folder." /></section>;
}

function SettingsView({ health, refresh }: { health: Health | null; refresh: () => void }) {
  return <section className="content-page"><div className="page-title"><div><span>SYSTEM</span><h2>Settings</h2><p>Local engine and workflow readiness.</p></div><button onClick={refresh}><RefreshCw size={16} /> Check</button></div><div className="settings-grid"><article><span>ComfyUI</span><strong className={health?.comfyui === "ok" ? "good" : "bad"}>{health?.comfyui === "ok" ? "Connected" : "Offline"}</strong><small>{health?.comfyui_url}</small></article><article><span>API</span><strong className={health?.api === "ok" ? "good" : "bad"}>{health?.api || "Checking"}</strong><small>FastAPI + SQLite</small></article></div><div className="workflow-list"><h3>Workflow templates</h3>{health?.workflows.map((workflow) => <div key={workflow.name}><span className={workflow.ready ? "ready-dot" : "missing-dot"} /><div><strong>{workflow.name.replace("h3_", "").replaceAll("_", " ").toUpperCase()}</strong><small>{workflow.message}</small></div><b>{workflow.ready ? "READY" : "SETUP"}</b></div>)}</div></section>;
}

function EmptyState({ icon: Icon, title, body }: { icon: typeof Clock3; title: string; body: string }) {
  return <div className="empty-state"><Icon size={30} /><strong>{title}</strong><p>{body}</p></div>;
}
