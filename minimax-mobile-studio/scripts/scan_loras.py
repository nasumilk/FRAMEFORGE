from __future__ import annotations

import argparse
from pathlib import Path

import yaml


def main() -> None:
    parser = argparse.ArgumentParser(description="Scan a ComfyUI LoRA directory and emit metadata drafts.")
    parser.add_argument("directory", nargs="?", type=Path, default=Path(r"C:\ComfyUI\models\loras"))
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "config/loras.generated.yaml")
    args = parser.parse_args()
    entries = []
    for path in sorted(args.directory.rglob("*.safetensors")):
        identifier = path.stem.lower().replace(" ", "_")
        entries.append({"id": identifier, "name": path.stem, "filename": path.relative_to(args.directory).as_posix(), "category": "other", "default_strength": 0.8, "min_strength": 0, "max_strength": 1.5, "trigger_words": [], "thumbnail": None, "enabled": True})
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(yaml.safe_dump({"loras": entries}, allow_unicode=True, sort_keys=False), encoding="utf-8")
    print(f"Wrote {len(entries)} LoRA drafts to {args.output}")


if __name__ == "__main__":
    main()

