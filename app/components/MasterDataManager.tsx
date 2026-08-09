"use client";

import { useEffect, useMemo, useState } from "react";
import { ListPlus, Plus, RotateCcw, Search, Trash2, X } from "lucide-react";
import type { MasterCategory } from "../lib/types";
import { usePromptStore } from "../store/usePromptStore";

const CATEGORY_LABELS: Array<{ key: MasterCategory; label: string; group: string }> = [
  { key: "bodyTypes", label: "Body types", group: "Character" },
  { key: "hairStyles", label: "Hair", group: "Character" },
  { key: "eyeStyles", label: "Eyes", group: "Character" },
  { key: "skinOptions", label: "Skin", group: "Character" },
  { key: "maleBodyTypes", label: "Male builds", group: "Character" },
  { key: "maleAgeFeels", label: "Male age feel", group: "Character" },
  { key: "situations", label: "Situations", group: "Scene" },
  { key: "clothings", label: "Clothing", group: "Scene" },
  { key: "positions", label: "Positions", group: "Timeline" },
  { key: "partnerActions", label: "Partner actions", group: "Timeline" },
  { key: "soloActions", label: "Solo actions", group: "Timeline" },
  { key: "cameras", label: "Cameras", group: "Timeline" },
  { key: "expressions", label: "Expressions", group: "Timeline" },
  { key: "soundPresets", label: "Soundscapes", group: "Output" },
  { key: "musicOptions", label: "Music", group: "Output" },
  { key: "stylePresets", label: "Styles", group: "Output" },
  { key: "lightingOptions", label: "Lighting", group: "Output" },
];

export function MasterDataManager() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<MasterCategory>("situations");
  const [newValue, setNewValue] = useState("");
  const [search, setSearch] = useState("");
  const master = usePromptStore((state) => state.masterData);
  const addMasterItem = usePromptStore((state) => state.addMasterItem);
  const updateMasterItem = usePromptStore((state) => state.updateMasterItem);
  const removeMasterItem = usePromptStore((state) => state.removeMasterItem);
  const resetMasterData = usePromptStore((state) => state.resetMasterData);
  const activeMeta = CATEGORY_LABELS.find((item) => item.key === category)!;
  const visibleItems = useMemo(() => master[category]
    .map((value, index) => ({ value, index }))
    .filter((item) => item.value.toLocaleLowerCase().includes(search.toLocaleLowerCase())), [master, category, search]);

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
    addMasterItem(category, newValue);
    setNewValue("");
  };

  return (
    <>
      <button className="secondary-button master-trigger" onClick={() => setOpen(true)}><ListPlus size={15} /><span>Edit lists</span></button>
      {open && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
          <section className="master-modal" role="dialog" aria-modal="true" aria-labelledby="master-title">
            <header className="master-header">
              <div><span>LOCAL MASTER DATA</span><h2 id="master-title">Dropdown library</h2><p>Add, rename, or remove the options used throughout the studio.</p></div>
              <button className="icon-button" onClick={() => setOpen(false)} aria-label="Close list editor"><X size={17} /></button>
            </header>

            <div className="master-body">
              <nav className="master-nav" aria-label="Master data categories">
                {CATEGORY_LABELS.map((item, index) => {
                  const showGroup = index === 0 || CATEGORY_LABELS[index - 1].group !== item.group;
                  return (
                    <div key={item.key}>
                      {showGroup && <span className="master-group">{item.group}</span>}
                      <button className={category === item.key ? "active" : ""} onClick={() => { setCategory(item.key); setSearch(""); }}>
                        <span>{item.label}</span><i>{master[item.key].length}</i>
                      </button>
                    </div>
                  );
                })}
              </nav>

              <div className="master-content">
                <div className="master-content-head">
                  <div><span>{activeMeta.group}</span><h3>{activeMeta.label}</h3></div>
                  <label className="master-search"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter options" aria-label="Filter options" /></label>
                </div>

                <div className="master-add">
                  <input value={newValue} onChange={(event) => setNewValue(event.target.value)} onKeyDown={(event) => event.key === "Enter" && add()} placeholder={`Add to ${activeMeta.label.toLocaleLowerCase()}`} aria-label={`Add ${activeMeta.label} option`} />
                  <button className="primary-button" onClick={add}><Plus size={15} /> Add</button>
                </div>

                <div className="master-list">
                  {visibleItems.map((item) => (
                    <div className="master-row" key={`${category}-${item.index}`}>
                      <span>{String(item.index + 1).padStart(2, "0")}</span>
                      <input defaultValue={item.value} key={item.value} onBlur={(event) => updateMasterItem(category, item.index, event.target.value)} onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()} aria-label={`Edit ${item.value}`} />
                      <button className="icon-button danger" disabled={master[category].length <= 1} onClick={() => removeMasterItem(category, item.index)} aria-label={`Delete ${item.value}`}><Trash2 size={14} /></button>
                    </div>
                  ))}
                  {!visibleItems.length && <div className="master-empty">No matching options.</div>}
                </div>
              </div>
            </div>

            <footer className="master-footer">
              <span>Changes are saved automatically on this device.</span>
              <button className="text-button reset-master" onClick={() => window.confirm("Restore every dropdown list to its original values?") && resetMasterData()}><RotateCcw size={13} /> Restore all defaults</button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
