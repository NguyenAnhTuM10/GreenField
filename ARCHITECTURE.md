# Architecture decisions — Stage 1

```
User-authored JSON
  -> Zod parse + reference validation
  -> registry per-plugin strict schema validation (normalizes defaults)
  -> compileTimeline(Video, injected TextMeasurer, audio durations)
       -> compileLayout (focus/stack/split/diagram)
       -> resolve audio/estimate speech, pause, hold
       -> resolve cue -> frame, assign absolute boxes
  -> CompiledTimeline (JSON; Remotion-independent)
  -> generic Remotion composition, one Sequence per scene
  -> MP4 H.264 / still PNG
```

## Purity boundary

`src/engine` imports only contracts/types and internal modules. Chromium is used through `src/cli/chromium-measurer.ts`, not inside the engine. Tests inject a fake measurer. No LLM is involved.

## Registry contract

`src/visual/registry.tsx` holds plugin references. A new technique adds `id`, a *strict Zod schema* and a React component to the registry. The generic renderer retrieves the registered component and wraps a target object. No `if(scene.id===...)` or per-scene renderer exists. `tests/registry.test.tsx` asserts that a fake `twinkle` technique is accepted when registered and rejected otherwise.

## JSON semantics

Cue is `onEnter`, `onNarrationEnd`, `afterObject:<id>`. For `afterObject`, the referenced entrance starts and then an entrance interval of 16 frames completes. Circular references are rejected. Scene duration is at least speech+pause+hold and extended if a later cue needs time. Video timeline frames are integers at 30fps.

## Known deliberate limits

- Layout is simple. `groupWith` requires the same group parent; `inside` requires an existing group parent. `annotates` is rejected in stage 1 rather than ignored; authors use free `path` objects and layout instead.
- Studio only previews the timeline emitted by `npm run compile`; it does not edit JSON interactively.
- This stage offers uploaded audio support plus provisional reading-time estimates, **not** actual TTS providers.
- Input images live under `public/assets/`; no asset search, licensing, generative image or upload API.
- Render is deterministic relative to resolved assets, fonts, and browser versions. A cross-platform byte-exact MP4 is not promised.
