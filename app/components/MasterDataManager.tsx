"use client";

import { useEffect, useMemo, useState } from "react";
import { ListPlus, Plus, RotateCcw, Search, Trash2, X } from "lucide-react";
import type { MasterCategory } from "../lib/types";
import { usePromptStore } from "../store/usePromptStore";
import { UI_COPY } from "../lib/localization";

const CATEGORY_LABELS: Array<{ key: MasterCategory; label: [string, string]; group: [string, string] }> = [
  { key: "bodyTypes", label: ["Body types", "体型"], group: ["Character", "人物"] },
  { key: "hairStyles", label: ["Hair", "髪型"], group: ["Character", "人物"] },
  { key: "eyeStyles", label: ["Eyes", "目元"], group: ["Character", "人物"] },
  { key: "skinOptions", label: ["Skin", "肌"], group: ["Character", "人物"] },
  { key: "maleBodyTypes", label: ["Male builds", "男性の体格"], group: ["Character", "人物"] },
  { key: "maleAgeFeels", label: ["Male age feel", "男性の年齢感"], group: ["Character", "人物"] },
  { key: "situations", label: ["Situations", "状況"], group: ["Scene", "シーン"] },
  { key: "clothings", label: ["Clothing", "衣装"], group: ["Scene", "シーン"] },
  { key: "captureDevices", label: ["Camera types", "カメラの種類"], group: ["Capture", "撮影"] },
  { key: "focalLengths", label: ["Focal lengths", "焦点距離"], group: ["Capture", "撮影"] },
  { key: "subjectDistances", label: ["Subject distances", "被写体との距離"], group: ["Capture", "撮影"] },
  { key: "handheldStyles", label: ["Handheld styles", "手振れの種類"], group: ["Capture", "撮影"] },
  { key: "poses", label: ["Subject poses", "被写体ポーズ"], group: ["Timeline", "タイムライン"] },
  { key: "positions", label: ["Positions", "体位"], group: ["Timeline", "タイムライン"] },
  { key: "partnerActions", label: ["Partner actions", "相手ありのアクション"], group: ["Timeline", "タイムライン"] },
  { key: "soloActions", label: ["Solo actions", "ソロアクション"], group: ["Timeline", "タイムライン"] },
  { key: "cameras", label: ["Cameras", "カメラ"], group: ["Timeline", "タイムライン"] },
  { key: "expressions", label: ["Expressions", "表情"], group: ["Timeline", "タイムライン"] },
  { key: "soundPresets", label: ["Soundscapes", "サウンド"], group: ["Output", "出力"] },
  { key: "musicOptions", label: ["Music", "音楽"], group: ["Output", "出力"] },
  { key: "stylePresets", label: ["Styles", "スタイル"], group: ["Output", "出力"] },
  { key: "lightingOptions", label: ["Lighting", "ライティング"], group: ["Output", "出力"] },
];

export function MasterDataManager({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<MasterCategory>("situations");
  const [newValue, setNewValue] = useState("");
  const [newJapanese, setNewJapanese] = useState("");
  const [search, setSearch] = useState("");
  const master = usePromptStore((state) => state.masterData);
  const addMasterItem = usePromptStore((state) => state.addMasterItem);
  const updateMasterItem = usePromptStore((state) => state.updateMasterItem);
  const removeMasterItem = usePromptStore((state) => state.removeMasterItem);
  const resetMasterData = usePromptStore((state) => state.resetMasterData);
  const language = usePromptStore((state) => state.uiLanguage);
  const t = UI_COPY[language];
  const localeIndex = language === "JAP" ? 1 : 0;
  const activeMeta = CATEGORY_LABELS.find((item) => item.key === category)!;
  const visibleItems = useMemo(() => master[category]
    .map((value, index) => ({ value, index }))
    .filter((item) => `${item.value.value} ${item.value.japanese}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())), [master, category, search]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const add = () => {
    if (!newValue.trim()) return;
    addMasterItem(category, { value: newValue, japanese: newJapanese });
    setNewValue("");
    setNewJapanese("");
  };

  return (
    <>
      <button className="secondary-button master-trigger" onClick={() => setOpen(true)}><ListPlus size={15} /><span>{label}</span></button>
      {open && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
          <section className="master-modal" role="dialog" aria-modal="true" aria-labelledby="master-title">
            <header className="master-header">
              <div><span>{t.localMasterData}</span><h2 id="master-title">{t.dropdownLibrary}</h2><p>{t.masterDescription}</p></div>
              <button className="icon-button" onClick={() => setOpen(false)} aria-label={t.closeListEditor}><X size={17} /></button>
            </header>

            <div className="master-body">
              <nav className="master-nav" aria-label={t.masterCategories}>
                {CATEGORY_LABELS.map((item, index) => {
                  const showGroup = index === 0 || CATEGORY_LABELS[index - 1].group[localeIndex] !== item.group[localeIndex];
                  return (
                    <div key={item.key}>
                      {showGroup && <span className="master-group">{item.group[localeIndex]}</span>}
                      <button className={category === item.key ? "active" : ""} onClick={() => { setCategory(item.key); setSearch(""); }}>
                        <span>{item.label[localeIndex]}</span><i>{master[item.key].length}</i>
                      </button>
                    </div>
                  );
                })}
              </nav>

              <div className="master-content">
                <div className="master-content-head">
                  <div><span>{activeMeta.group[localeIndex]}</span><h3>{activeMeta.label[localeIndex]}</h3></div>
                  <label className="master-search"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.filterOptions} aria-label={t.filterOptions} /></label>
                </div>

                <div className="master-add">
                  <input value={newValue} onChange={(event) => setNewValue(event.target.value)} onKeyDown={(event) => event.key === "Enter" && add()} placeholder={t.englishPlaceholder} aria-label={t.addOption.replace("{category}", activeMeta.label[localeIndex])} />
                  <input value={newJapanese} onChange={(event) => setNewJapanese(event.target.value)} onKeyDown={(event) => event.key === "Enter" && add()} placeholder={t.japanesePlaceholder} aria-label={t.masterJapanese} />
                  <button className="primary-button" onClick={add}><Plus size={15} /> {t.add}</button>
                </div>

                <div className="master-list">
                  {visibleItems.length > 0 && <div className="master-row master-row-labels"><span>#</span><span>{t.masterEnglish}</span><span>{t.masterJapanese}</span><span /></div>}
                  {visibleItems.map((item) => (
                    <div className="master-row" key={`${category}-${item.index}`}>
                      <span>{String(item.index + 1).padStart(2, "0")}</span>
                      <input defaultValue={item.value.value} key={`${item.value.value}-english`} onBlur={(event) => updateMasterItem(category, item.index, { value: event.target.value })} onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()} aria-label={t.editOption.replace("{value}", item.value.value)} />
                      <input defaultValue={item.value.japanese} key={`${item.value.value}-japanese`} onBlur={(event) => updateMasterItem(category, item.index, { japanese: event.target.value })} onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()} aria-label={t.masterJapanese} placeholder={t.japanesePlaceholder} />
                      <button className="icon-button danger" disabled={master[category].length <= 1} onClick={() => removeMasterItem(category, item.index)} aria-label={t.deleteOption.replace("{value}", item.value.value)}><Trash2 size={14} /></button>
                    </div>
                  ))}
                  {!visibleItems.length && <div className="master-empty">{t.noMatching}</div>}
                </div>
              </div>
            </div>

            <footer className="master-footer">
              <span>{t.changesSaved}</span>
              <button className="text-button reset-master" onClick={() => window.confirm(t.restoreConfirm) && resetMasterData()}><RotateCcw size={13} /> {t.restoreDefaults}</button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
