from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def inspect_api_workflow(payload: dict[str, Any]) -> None:
    for node_id, node in payload.items():
        print(f"NODE {node_id}")
        print(f"Class: {node.get('class_type', '<missing>')}")
        print("Inputs:")
        for input_name in node.get("inputs", {}):
            print(f"  {input_name}")
        print()


def inspect_graph_workflow(payload: dict[str, Any]) -> None:
    print("WARNING: this is editable graph JSON, not API-format JSON. Export with Save (API Format).\n")
    for node in payload.get("nodes", []):
        print(f"NODE {node.get('id')}")
        print(f"Class: {node.get('type', '<missing>')}")
        print("Inputs:")
        for item in node.get("inputs", []):
            print(f"  {item.get('name')}")
        print()


def main() -> None:
    parser = argparse.ArgumentParser(description="Inspect a ComfyUI workflow and list mappable nodes/inputs.")
    parser.add_argument("workflow", type=Path)
    args = parser.parse_args()
    payload = json.loads(args.workflow.read_text(encoding="utf-8"))
    inspect_graph_workflow(payload) if "nodes" in payload else inspect_api_workflow(payload)


if __name__ == "__main__":
    main()
