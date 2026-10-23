# Knowledge Studio Stage 1 — Verification report

Date: 2026-10-23

## Environment
- Node: 22.16.0
- npm: 10.9.2
- TypeScript CLI: globally available
- Chromium: `/usr/bin/chromium`
- FFmpeg: 7.1.5
- npm registry: **unreachable (EAI_AGAIN DNS for registry.npmjs.org)**

## Executed checks
| Check | Result | Evidence / notes |
|---|---|---|
| Six-scene JSON parses as JSON | PASS | `python -m json.tool examples/discuss-about.json` equivalent; six scene IDs, 19 objects |
| TypeScript syntactic transpilation | PASS | `node tools/static-audit.mjs`, 15 source/test TS files; 0 diagnostics |
| Compiler boundary lint | PASS | Same audit; no React/Remotion/LLM import inside `src/engine` |
| Renderer scenario-specific branching lint | PASS | Same audit; no `scene.id ===` branch |
| `npm test` Vitest | BLOCKED | `sh: vitest: not found` (cannot npm install) |
| `npm run typecheck` | BLOCKED | node/vitest/react/zod/etc type declarations unavailable |
| `npm run compile` in Chromium | BLOCKED | playwright-core/zod dependencies unavailable |
| `npm run still` with Remotion | BLOCKED | Remotion dependencies unavailable |
| `npm run render` MP4 | BLOCKED | Remotion dependencies unavailable |
| Render time at 720p | NOT MEASURED | No valid runtime benchmark possible until npm install |

This is **not a full acceptance pass**. Do not classify Phase 1 complete without running the user-facing commands below.

## Windows acceptance sequence (PowerShell)

```powershell
npm install
npm test
npm run typecheck
npm run compile
npm run still
npm run render
```

Inspect:
- `output/compiled-timeline.json` for six valid scenes, integer frame cues and `timingProvisional` (true for silent demo)
- `output/still.png` for Vietnamese diacritics and text collision
- `output/discuss-about.mp4` for all six scenes, no black frames or distorted font
- `tests/__snapshots__/` for first Vitest snapshot (review the generated snapshot before committing)

Measure with PowerShell `Measure-Command { npm run render }`; record the wall clock and peak memory locally.

## Likely fragile points

1. **Chromium text measurement:** the studio's system fonts may differ from those on the render machine. Inspect Vietnamese diacritics and wrapping on Windows.
2. **Hub diagrams and groups:** stage 1 intentionally uses basic layout relations, not a constraint solver. Some combinations are rejected with explicit layout errors.
3. **Animation quality:** SVG hand-drawn paths have deterministic stroke reveal; other objects use lightweight wrapper effects, not advanced handwriting animation.
4. **Performance:** bundling Remotion and rendering on a low-memory Windows PC is unbenchmarked. Start with concurrency 1. A Remotion update may affect memory usage.
5. **Schema evolution:** runtime plugin extension is local/build-time, not hot-pluggable. External plugin packages or untrusted code execution are not supported.
6. **Narration pacing:** default voice durations are estimated; final timing should be recompiled when audio is supplied.

## Scope completed in source
- One TypeScript package, Remotion 4.0.536 family version alignment, Zod, Vitest.
- Strict structural contracts; stable IDs, cues and reference validation.
- Visual registry with 6 object plugins, 6 technique plugins, two styles, fake-extension test.
- Pure layout/timing compiler with injectable text metrics and audio durations; deterministic frame-based cues.
- Six hand-authored scene JSON examples in a single video; generic renderer.
- Windows low-concurrency still/MP4 CLI and Remotion Studio entry point.

**Next action:** install dependencies where npm is accessible and run all tests before considering this a completed functional MVP.
