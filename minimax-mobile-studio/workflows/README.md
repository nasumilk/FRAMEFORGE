# Workflow installation

This directory intentionally does not contain guessed MiniMax H3 API workflows.

For each generation mode:

1. Open the working workflow in ComfyUI.
2. Use **Save (API Format)** / the developer-mode API export.
3. Save it here as `h3_t2v.json`, `h3_i2v.json`, `h3_reference_image.json`, or `h3_reference_video.json`.
4. Copy the matching file from `mappings/*.example.yaml` to a `.yaml` file without `.example`.
5. Run `python scripts/inspect_workflow.py workflows/h3_t2v.json`.
6. Replace the example node IDs and input names with the values reported for your workflow.
7. Run `python scripts/validate_workflows.py` before generation.

Editable ComfyUI graph JSON contains a top-level `nodes` array and is rejected. The backend accepts the object keyed by node IDs produced by API export.

