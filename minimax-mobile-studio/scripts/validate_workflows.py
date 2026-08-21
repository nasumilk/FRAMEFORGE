from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.comfy.workflow_registry import WorkflowRegistry  # noqa: E402


def main() -> int:
    registry = WorkflowRegistry(ROOT / "workflows")
    names = registry.names()
    if not names:
        print("No installed mappings. Copy a *.example.yaml file to *.yaml after exporting your API workflow.")
        return 1
    failed = False
    for name in names:
        status = registry.status(name)
        print(f"{'OK' if status['ready'] else 'ERROR'} {name}: {status['message']}")
        failed = failed or not bool(status["ready"])
    return int(failed)


if __name__ == "__main__":
    raise SystemExit(main())
