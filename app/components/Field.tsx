"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { japaneseOption } from "../lib/localization";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const displayOptions = options.includes(value) || !value ? [...options] : [value, ...options];

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const select = (option: string) => {
    onChange(option);
    setOpen(false);
  };

  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="translated-select" ref={rootRef}>
        <button
          type="button"
          className="translated-select-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={label}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); }
          }}
        >
          <span>{value || "—"}</span><ChevronDown size={15} />
        </button>
        {open && (
          <div id={listId} role="listbox" className="translated-select-menu" aria-label={label}>
            {displayOptions.map((option) => (
              <button
                type="button"
                role="option"
                aria-selected={option === value}
                className={`translated-select-option ${option === value ? "selected" : ""}`}
                key={option}
                onClick={() => select(option)}
              >
                <span>{option}</span>
                <span className="option-translation" role="tooltip">{japaneseOption(option)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
