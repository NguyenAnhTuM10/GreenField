# Knowledge Studio — Stage 1 (greenfield)

Declarative 9:16 informational video engine. One TypeScript package: Zod contracts, registered React visual primitives/effects, deterministic layout/timing compiler, Remotion preview and H.264 export.

**Status**: Source implementation; npm packages cannot be installed in the supplied execution environment because `registry.npmjs.org` DNS fails. Do not treat the tests or MP4 render as verified until the commands below succeed on your Windows machine. This limitation is captured in `ASSUMPTIONS.md` and `TEST_REPORT.md`.

## Requirements

- Node.js 22+, npm, Chromium/Chrome available to Playwright and Remotion
- FFmpeg/ffprobe in PATH (only needed when an uploaded audio file is supplied)
- Windows fonts `Segoe UI` or `Arial` with Vietnamese diacritics
- At least 3–4 GB of free RAM recommended for render (not benchmarked)

## First run (PowerShell, from project root)

```powershell
npm install
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npm run test
npm run typecheck
npm run compile
npm run studio
```

`CHROME_PATH` is optional: the CLI automatically checks standard Chrome/Edge locations on Windows, then Playwright's installed Chromium. If you set it, it must point to an existing executable. The same browser is used for compilation and rendering.

If no browser is installed, run `npx playwright-core install chromium`, or install Chrome and rerun the command. For a custom location, set `CHROME_PATH` in the same PowerShell session before running compile/still/render.

**Render a still** (inspect before full render):

```powershell
npm run still
```

**Render H.264 MP4**:

```powershell
npm run render
```

The CLI writes `output/compiled-timeline.json`, `output/still.png` and `output/discuss-about.mp4`. Rendering defaults to concurrency=1 for a weak Windows PC.

## Commands

- `npm test`: schema, registry extension, compiler/timing, six-scene tests
- `npm run compile`: Zod parse -> registry parameter validation -> Chromium text measurement -> compiled timeline
- `npm run studio`: Remotion preview; **run `npm run compile` first**
- `npm run still`: same pipeline plus selected frame PNG (default 45, override `STILL_FRAME`)
- `npm run render`: same pipeline plus H.264 MP4
- `npm run typecheck`: TypeScript compilation check
- `NODE_PATH=$(npm root -g) node tools/static-audit.mjs` (Linux container only; on Windows after `npm install`, use `node tools/static-audit.mjs`): syntax and architectural boundary smoke check

## Audio in Stage 1

There is **no TTS service**. All scenes have narrated text with provisional estimated durations unless you supply an audio file. For uploaded audio, place the file in `public/audio` and add to scene `narration.audioSrc`, e.g. `/audio/voice.mp3`. The CLI reads actual duration using `ffprobe`. `timingProvisional` becomes `false` for those scenes. If audio is not supplied, MP4 is silent by design.

## Contract boundary

`parseVideo()` validates the outer JSON and ID references. `createDefaultRegistry().validate(video)` returns a normalized video after validating each object's `props` and each technique's `params` using its own strict Zod schema. **Both steps are mandatory** before compilation/render. Engine modules import no React, Remotion or LLM code. New visual effect: define Zod schema, effect React component, and register it; registry extension test demonstrates no compiler/renderer changes are necessary.

## Scope notes

- Four layout strategies; no general constraint solver.
- Two styles; object types: text/image/shape/path/arrow/group.
- Six techniques: draw/highlight/transform/compare/count/reveal.
- Relation support deliberately limited; unsupported relations throw explicit error codes.
- No AI planner, generative images, TTS API, workflow UI, quality gate, database or cloud render.
- Current SVG path symbols are a curated fixed library; the AI will not supply arbitrary SVG coordinates.

## Troubleshooting

- `TEXT_OVERFLOW`: text would be too small to read after allowed wrapping/downsizing. Shorten the text or split the scene.
- `LAYOUT_OVERFLOW`: objects do not fit permitted content region. Use another layout or fewer elements.
- `UNSUPPORTED_LAYOUT_RELATION`: supplied relation conflicts with layout strategy.
- `INVALID_OBJECT_PROPS` / `INVALID_TECHNIQUE_PARAMS`: schema validation rejects malformed plugin parameters.
- `CUE_UNRESOLVED`: afterObject reference cannot be resolved.
- Font glyphs missing: install standard Unicode font supporting Vietnamese, set font family accordingly and recompile.

`ASSUMPTIONS.md` lists decisions and scope assumptions.
