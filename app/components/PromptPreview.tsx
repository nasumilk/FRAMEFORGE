"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Copy, Save, Trash2 } from "lucide-react";
import { usePromptStore } from "../store/usePromptStore";
import { generateH3Prompt } from "../lib/promptGenerator";
import { UI_COPY } from "../lib/localization";

export function PromptPreview() {
  const state = usePromptStore();
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [presetName, setPresetName] = useState("");
  const language = usePromptStore((store) => store.uiLanguage);
  const t = UI_COPY[language];
  const prompt = useMemo(() => generateH3Prompt(state), [state]);

  const copy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const save = () => {
    const fallback = `${state.basic.mode} · ${new Date().toLocaleDateString()}`;
    state.savePreset(presetName || fallback);
    setPresetName("");
  };

  return (
    <section className={`preview ${collapsed ? "collapsed" : ""}`}>
      <div className="preview-top">
        <div>
          <span className="preview-kicker">{t.liveOutput}</span>
          <strong>{t.structuredPrompt}</strong>
        </div>
        <div className="preview-actions">
          <span>{prompt.length.toLocaleString()} {t.chars}</span>
          <button className="secondary-button" onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? t.copied : t.copy}</button>
          <button className="icon-button" onClick={() => setCollapsed((value) => !value)} aria-label={t.togglePreview}><ChevronDown size={17} /></button>
        </div>
      </div>
      {!collapsed && (
        <>
          <pre>{prompt}</pre>
          <div className="preset-bar">
            <div className="preset-save">
              <input value={presetName} onChange={(event) => setPresetName(event.target.value)} placeholder={t.presetName} />
              <button className="secondary-button" onClick={save}><Save size={15} /> {t.savePreset}</button>
            </div>
            {state.savedPresets.length > 0 && (
              <div className="preset-list">
                {state.savedPresets.slice(0, 4).map((preset) => (
                  <div className="preset-chip" key={preset.id}>
                    <button onClick={() => state.loadPreset(preset.id)}>{preset.name}</button>
                    <button aria-label={t.deletePreset.replace("{name}", preset.name)} onClick={() => state.deletePreset(preset.id)}><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
