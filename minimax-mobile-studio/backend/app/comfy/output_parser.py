from __future__ import annotations

from typing import Any


def parse_output_files(history: dict[str, Any], prompt_id: str) -> list[dict[str, str]]:
    entry = history.get(prompt_id, history)
    outputs = entry.get("outputs", {}) if isinstance(entry, dict) else {}
    found: list[dict[str, str]] = []
    for node_output in outputs.values():
        if not isinstance(node_output, dict):
            continue
        for collection_name, collection in node_output.items():
            if not isinstance(collection, list):
                continue
            for item in collection:
                if isinstance(item, dict) and item.get("filename"):
                    found.append(
                        {
                            "filename": str(item["filename"]),
                            "subfolder": str(item.get("subfolder", "")),
                            "type": str(item.get("type", "output")),
                            "collection": str(collection_name),
                        }
                    )
    return found

