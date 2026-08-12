# MiniMax H3 Mobile Studio

A mobile-first PWA that controls MiniMax H3 workflows through a local FastAPI service and the official ComfyUI Server API. ComfyUI remains bound to localhost and is treated as a headless execution engine.

## Current milestone

Implemented:

- Next.js App Router PWA optimized for iPhone, iPad, and desktop
- T2V composer with FRAMEFORGE prompt handoff
- FastAPI health, generation, job, cancel, and workflow status endpoints
- SQLite generation/job/media schema
- ComfyUI client for `/system_stats`, `/prompt`, `/queue`, `/history`, `/history/{prompt_id}`, `/interrupt`, `/upload/image`, and `/view`
- WebSocket execution monitor module for `/ws?clientId=...`
- API-workflow registry, template/mapping builder, and startup-safe validation
- Workflow inspection and LoRA scan scripts
- Unit tests with ComfyUI mocked

Generation remains intentionally disabled until a working workflow is exported in **API format** and its mapping is installed. Editable graph JSON is rejected so the application never guesses node IDs.

## Requirements

- Windows 11
- Node.js 22+
- Python 3.11+
- ComfyUI listening only on `127.0.0.1:8188`
- Tailscale for mobile access
- A working MiniMax H3 workflow exported using ComfyUI's API-format export

## Installation

### Backend

```powershell
cd C:\Promptmaker\minimax-mobile-studio
python -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
Copy-Item .env.example .env
```

Do not commit `.env`; it is ignored.

### Frontend

```powershell
cd C:\Promptmaker\minimax-mobile-studio\frontend
npm install
npm run build
```

## ComfyUI setup

Run ComfyUI on localhost. The tested local installation reports ComfyUI `0.30.0` at `http://127.0.0.1:8188`.

The backend, not the browser, is the only component that communicates with port 8188.

## Workflow export and mapping

1. Open the known-good H3 workflow in ComfyUI.
2. Enable developer options if necessary and choose **Save (API Format)**.
3. Save the output as `workflows/h3_t2v.json`.
4. Inspect it:

```powershell
backend\.venv\Scripts\python.exe scripts\inspect_workflow.py workflows\h3_t2v.json
```

5. Copy `workflows/mappings/h3_t2v.example.yaml` to `h3_t2v.yaml`.
6. Replace every `REPLACE_ME` with the actual node ID and input name reported by the inspector.
7. Validate:

```powershell
backend\.venv\Scripts\python.exe scripts\validate_workflows.py
```

Repeat for I2V and reference workflows. Node IDs exist only in YAML mapping files; application code contains no workflow node IDs.

## Development startup

Terminal 1:

```powershell
cd C:\Promptmaker\minimax-mobile-studio\backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Terminal 2:

```powershell
cd C:\Promptmaker\minimax-mobile-studio\frontend
npm run dev -- --hostname 127.0.0.1 --port 3300
```

Open `http://127.0.0.1:3300`.

## Production startup

Run `scripts/run_mobile_studio.ps1`. It keeps both services on localhost:

- Frontend: `127.0.0.1:3300`
- FastAPI: `127.0.0.1:8000`
- ComfyUI: `127.0.0.1:8188`

The frontend proxies `/api/v1/*` to FastAPI, so mobile browsers never contact the backend or ComfyUI ports directly.

## Tailscale access

```powershell
tailscale serve --bg --https=8444 http://127.0.0.1:3300
```

Then open `https://daichinopc.tail9ad2a3.ts.net:8444` from a tailnet-connected iPhone or iPad and choose **Add to Home Screen** in Safari.

Do not use Tailscale Funnel. ComfyUI must not be directly exposed to the internet.

## FRAMEFORGE integration

FRAMEFORGE includes **Open in H3 Studio** in the prompt preview. The prompt is transferred in the URL fragment (`#frameforge_prompt=...`), which is not sent to the web server, and is removed from the address bar immediately after import.

## LoRA scan

```powershell
backend\.venv\Scripts\python.exe scripts\scan_loras.py C:\ComfyUI\models\loras
```

Review the generated YAML before replacing curated LoRA metadata.

## Testing

```powershell
backend\.venv\Scripts\python.exe -m pytest backend\tests -q
cd frontend
npm run lint
npm run build
```

## Troubleshooting

- **Engine offline:** verify `http://127.0.0.1:8188/system_stats` on the Windows machine.
- **Workflow setup required:** export API-format JSON, install its mapping YAML, and run the validation script.
- **Workflow invalid / top-level nodes:** this is editable graph JSON. Export again using API format.
- **Mapping error:** a node ID or input changed after editing the workflow; rerun the inspector and update only the YAML mapping.
- **Mobile page unavailable:** connect the device to the same tailnet and verify `tailscale serve status`.
- **History works but Generate is unavailable:** this is expected when ComfyUI is offline or the selected workflow is not ready.

## Official API basis

The integration follows ComfyUI's official [OpenAPI specification](https://github.com/Comfy-Org/ComfyUI/blob/master/openapi.yaml), [WebSocket API example](https://github.com/Comfy-Org/ComfyUI/blob/master/script_examples/websockets_api_example.py), and [MiniMax Hailuo node documentation](https://docs.comfy.org/built-in-nodes/MinimaxHailuoVideoNode).

