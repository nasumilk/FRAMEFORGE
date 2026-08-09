"use client";

import { Clapperboard, RotateCcw, Sparkles } from "lucide-react";
import { usePromptStore } from "../store/usePromptStore";
import { generateH3Prompt } from "../lib/promptGenerator";
import { MasterDataManager } from "./MasterDataManager";
import { UI_COPY } from "../lib/localization";

export function TopBar() {
  const mode = usePromptStore((state) => state.basic.mode);
  const setBasic = usePromptStore((state) => state.setBasic);
  const resetAll = usePromptStore((state) => state.resetAll);
  const language = usePromptStore((state) => state.uiLanguage);
  const setUiLanguage = usePromptStore((state) => state.setUiLanguage);
  const t = UI_COPY[language];

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
        <span className="top-label">{t.generationMode}</span>
        <div className="segmented">
          <button className={mode === "T2V" ? "active" : ""} onClick={() => setBasic({ mode: "T2V" })}>T2V</button>
          <button className={mode === "I2V" ? "active" : ""} onClick={() => setBasic({ mode: "I2V" })}>I2V</button>
        </div>
        <div className="segmented language-toggle" aria-label="Interface language">
          <button className={language === "ENG" ? "active" : ""} onClick={() => setUiLanguage("ENG")}>ENG</button>
          <button className={language === "JAP" ? "active" : ""} onClick={() => setUiLanguage("JAP")}>JAP</button>
        </div>
      </div>
      <div className="topbar-actions">
        <MasterDataManager label={t.editLists} />
        <button className="icon-button" aria-label={t.resetAll} onClick={() => window.confirm(t.resetPrompt) && resetAll()}><RotateCcw size={16} /></button>
        <button className="primary-button" onClick={generate}><Sparkles size={16} /> {t.generateCopy}</button>
      </div>
    </header>
  );
}
