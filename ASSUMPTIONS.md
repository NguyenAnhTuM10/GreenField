# Assumptions — Stage 1

- The accepted architecture from the conversation is the specification; no legacy Vocab Studio code is reused.
- A *single package* hosts all code, without a server, database, login or GUI application. Remotion Studio is only a preview tool.
- Resolution is 720x1280 at 30 fps; H.264 MP4 on Windows with one rendering worker by default.
- `narration.audioSrc` references manually supplied `/audio/...` files, not synthetic TTS. No live TTS in stage 1. The duration resolver probes an existing file with `ffprobe` and otherwise uses a reading-time estimate (provisional).
- Engine stores relative, symbolic cues; compiled timeline contains integer frames. `onNarrationEnd` is relative to the end of narration, before interaction pause.
- `afterObject:<id>` means after that object's entrance interval (not the full scene); chains and cycles are checked.
- Visual technique registry remains extensible at build time; new plugins can be registered without modifying the compiler or generic renderer.
- Layout uses a few flow/graph rules; unsupported or contradictory relations are rejected instead of being silently ignored.
- `group` is a simple parent for other objects (`parentId`) with stack/split internal positioning; no arbitrary nesting or constraint solver.
- Visual techniques in v1 are lightweight, deterministic wrappers. They are not video-generation models.
- System fonts are used; Windows Segoe UI/Arial and Linux DejaVu Sans/Noto Sans generally support Vietnamese. No font binaries are distributed.
- No asset resolver: user must put existing local image resources in `public/assets` and reference them directly; no remote URLs.
- Estimated reading speed and hold/pause defaults are editorial placeholders, not calibrated pedagogy.
- Stable identity refers to IDs supplied in JSON; exact MP4 binary identity is not guaranteed across codec/platform versions.
- No network access to npm registry in the current execution environment; runtime tests and Remotion render must not be reported as passed until dependencies are installed successfully.
