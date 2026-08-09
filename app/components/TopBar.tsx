"use client";

import { Clapperboard, RotateCcw, Sparkles } from "lucide-react";
import { usePromptStore } from "../store/usePromptStore";
import { generateH3Prompt } from "../lib/promptGenerator";
import { MasterDataManager } from "./MasterDataManager";

export function TopBar() {
  const mode = usePromptStore((state) => state.basic.mode);
  const setBasic = usePromptStore((state) => state.setBasic);
  const resetAll = usePromptStore((state) => state.resetAll);

  const generate = () => {
    const prompt = generateH3Prompt(usePromptStore.getState());
    navigator.clipboard.writeText(prompt);
    document.querySelector(".preview")?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark"><Clapperboard size={20} /></div>
        <div><strong>FRAMEFORGE</strong><span>H3 PROMPT STUDIO</span></div>
      </div>
      <div className="topbar-center">
        <span className="top-label">GENERATION MODE</span>
        <div className="segmented">
          <button className={mode === "T2V" ? "active" : ""} onClick={() => setBasic({ mode: "T2V" })}>T2V</button>
          <button className={mode === "I2V" ? "active" : ""} onClick={() => setBasic({ mode: "I2V" })}>I2V</button>
        </div>
      </div>
      <div className="topbar-actions">
        <MasterDataManager />
        <button className="icon-button" aria-label="Reset all" onClick={() => window.confirm("Reset the current prompt?") && resetAll()}><RotateCcw size={16} /></button>
        <button className="primary-button" onClick={generate}><Sparkles size={16} /> Generate & copy</button>
      </div>
    </header>
  );
}
