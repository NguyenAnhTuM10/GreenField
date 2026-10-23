# Architecture contract (approved direction)

## Pipeline (future architecture)
Idea -> external research -> Content Brief -> Narrative Planner -> Visual Planner -> versioned Scene JSON + Zod -> Asset & Audio resolution -> pure Layout/Timing compiler -> Compiled Timeline -> Remotion -> MP4 -> quality review.

Stage 1 deliberately excludes the planners, asset resolver, real TTS, automated QA, studio UI, databases, queues and render-lock manifest.

## Stage 1 capabilities
- One TypeScript package; Remotion + Zod + Vitest.
- Video, Scene, Object, Technique, Relation, Cue schemas. `schemaVersion: "1.0"`. Stable IDs.
- Cues: `onEnter`, `afterObject:<id>`, `onNarrationEnd`. Cues become concrete frame numbers only in compiler output.
- Object registry: `text`, `image`, `shape`, `path`, `arrow`, `group`; each object kind has a props schema + renderer.
- Technique registry: `draw`, `highlight`, `transform`, `compare`, `count`, `reveal`; each has parameter schema + behavior.
- Styles: `whiteboard`, `darkEditorial`.
- Layout strategies: `focus`, `stack`, `split`, `diagram` (basic row, center + satellites, two columns). Relationship-based rather than raw coordinates. No general-purpose constraint solver.
- Text measurement through injected `measureText` interface (real Chromium adapter; fake in unit tests). Overflow fallback: wrap, reduce spacing, shrink within minimum, then report error.
- Scene duration = narration audio or marked provisional reading estimate + pause by intent + visual hold. Output frames at 30 FPS.
- Deterministic render from compiled timeline and pinned input/assets; never use clock/random without deterministic seed.

## Interface boundaries
`contracts` and `engine` must not import React, Remotion or LLM packages. Renderer receives only compiled scene/timeline. Extend registry by adding a schema + rendering/behavior component + registration; avoid editing compiler core for a new technique.

## Acceptance of Stage 1
1. JSON hand-authored six scenes of `discuss about` (hook/predict/correction/build sentence/variations/recall) rendered using ONE generic engine, without per-scene conditional code.
2. Tests: schemas; valid/invalid relations; text wrapping and overflow; cues -> frames, pause intents; deterministic snapshot; custom synthetic technique registration.
3. Still preview and 720p H.264 MP4 after runtime dependencies installed. Measure time and bottlenecks on the user's Windows machine.
4. Never conflate syntax checks with actual Vitest/typecheck/render passes.

## Stage 2 acceptance (not to implement yet)
With unchanged engine code, render `discuss about`, `1 mol là gì?`, `vì sao nước đá nổi` from distinct JSON inputs. Compare narrative beat chains, layouts and visual techniques; correctness is more important than artificial variety.
