# Architecture

```text
iPhone / iPad / PC
  Next.js PWA :3300
        |
        | same-origin /api/v1 proxy
        v
  FastAPI :8000
  services -> repositories -> SQLite
        |
        | REST + WebSocket
        v
  ComfyUI :8188
  workflow template + YAML mapping
        |
        v
  MiniMax H3 / LoRA / GPU
```

## Boundaries

- Frontend does not know ComfyUI node IDs or connect to ComfyUI.
- API routes validate requests and delegate to services.
- Services orchestrate generation; repositories own persistence.
- `ComfyUIClient` owns HTTP transport.
- `WorkflowRegistry` loads and validates files.
- `WorkflowBuilder` injects semantic values into a deep copy.
- Node IDs are configuration data in mapping YAML, never Python constants.
- ComfyUI output and application-managed media use separate directories.

## FRAMEFORGE contract

FRAMEFORGE opens the local Studio with an encoded `frameforge_prompt` URL fragment. The Studio imports the value, removes the fragment with `history.replaceState`, and treats the result as an ordinary editable prompt. This is deliberately a narrow contract; the two applications remain independently deployable.

Future schema-based handoff can add mode, seed, and media references without changing the ComfyUI abstraction.

