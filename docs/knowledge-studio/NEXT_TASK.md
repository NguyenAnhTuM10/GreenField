# Task for the next Codex local session

Goal: validate the existing Stage 1 engine and try a *new topic* without changing engine code.

1. Inspect project structure, `package.json`, available examples, CLI and tests.
2. Run the baseline checks, reporting observed results and blockers.
3. Inspect the six-scene example for **"Vì sao nước đá nổi trên nước?"** and the four SVG assets. Use only registered objects/layouts/techniques and valid Zod contracts. No topic-specific engine branches.
4. Validate and compile both the original `discuss about` example and the ice example with the same engine.
5. If the environment permits, render stills and MP4s, measure elapsed time and note layout/timing problems. Keep concurrency low on Windows.
6. If the JSON cannot express the topic using existing primitives, DO NOT silently modify the engine. Describe the missing capability, propose the smallest change and stop for approval.

Not in scope: AI planner, model service, asset search, generative video, major architecture refactor.

Delivery: changed-file list, actual commands/results, output paths if created, and evidence-based verdict on support for the second topic.
