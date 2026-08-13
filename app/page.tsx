"use client";

import { useSyncExternalStore } from "react";
import { BasicSettings } from "./components/BasicSettings";
import { PromptPreview } from "./components/PromptPreview";
import { SelectorsPanel } from "./components/SelectorsPanel";
import { TimelineEditor } from "./components/TimelineEditor";
import { TopBar } from "./components/TopBar";

export default function Home() {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  if (!mounted) {
    return <div className="loading-shell"><div className="loading-mark" /><span>Preparing Frameforge…</span></div>;
  }

  return (
    <div className="app-shell">
      <TopBar />
      <div className="workspace-grid">
        <BasicSettings />
        <TimelineEditor />
        <SelectorsPanel />
      </div>
      <PromptPreview />
    </div>
  );
}
