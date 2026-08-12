"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Braces, Check, ChevronDown, Copy, ExternalLink, Info, Save, Trash2 } from "lucide-react";
import { usePromptStore } from "../store/usePromptStore";
import { diagnosePrompt, generateApiPayload, generateH3Prompt } from "../lib/promptGenerator";
import { UI_COPY } from "../lib/localization";

export function PromptPreview() {
  const state = usePromptStore();
  const [copied, setCopied] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [presetName, setPresetName] = useState("");
  const language = usePromptStore((store) => store.uiLanguage);
  const t = UI_COPY[language];
  const prompt = useMemo(() => generateH3Prompt(state), [state]);
  const diagnostics = useMemo(() => diagnosePrompt(state), [state]);

  const copy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const copyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(generateApiPayload(state), null, 2));
    setJsonCopied(true);
    window.setTimeout(() => setJsonCopied(false), 1600);
  };

  const openMobileStudio = () => {
    const localHost = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
    const studioUrl = localHost ? "http://127.0.0.1:3300" : "https://daichinopc.tail9ad2a3.ts.net:8444";
    const target = `${studioUrl}/#frameforge_prompt=${encodeURIComponent(prompt)}`;
    window.open(target, "_blank", "noopener,noreferrer");
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
          <button className="secondary-button" onClick={openMobileStudio}><ExternalLink size={15} />{language === "JAP" ? "H3 Studioで開く" : "Open in H3 Studio"}</button>
          <button className="secondary-button" onClick={copyJson}>{jsonCopied ? <Check size={15} /> : <Braces size={15} />}{jsonCopied ? t.copied : "API JSON"}</button>
          <button className="secondary-button" onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? t.copied : t.copy}</button>
          <button className="icon-button" onClick={() => setCollapsed((value) => !value)} aria-label={t.togglePreview}><ChevronDown size={17} /></button>
        </div>
      </div>
      {!collapsed && (
        <>
          <div className={`diagnostic-strip ${diagnostics.some((item) => item.severity === "error") ? "has-error" : ""}`}>
            <div><strong>{language === "JAP" ? "プロンプト診断" : "PROMPT DIAGNOSTICS"}</strong><span>{diagnostics.length ? `${diagnostics.length} ${language === "JAP" ? "件" : "issues"}` : language === "JAP" ? "問題なし" : "Ready"}</span></div>
            <div className="diagnostic-items">
              {diagnostics.slice(0, 3).map((item, index) => <span className={item.severity} key={`${item.message}-${index}`}>{item.severity === "info" ? <Info size={11} /> : <AlertTriangle size={11} />}{item.message}</span>)}
            </div>
          </div>
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
