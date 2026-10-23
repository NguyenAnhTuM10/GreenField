# Knowledge Studio — Codex repository instructions

This is a greenfield TypeScript knowledge-video engine for 9:16 short-form educational videos. It is NOT the old Vocab Studio.

## Non-negotiable design rules
- The creative source of truth is validated, versioned Scene JSON. It has NO absolute pixel positions or timestamps.
- The pure Layout & Timing compiler must NOT depend on React, Remotion, LLM services, or planners.
- Remotion only renders the compiled timeline; animations must be deterministic from frame, compiled data, and seed.
- Every imported/API/LLM boundary uses Zod; object/technique props are checked by their registered schemas.
- Reuse object/technique registries and composition primitives, NOT hard-coded per-video scene functions or `if (scene.id === ...)` branches.
- User-supplied images + text + animated SVG are first priority; no generative video, LLM planner, asset resolver, database, or heavy dependencies in Stage 1.
- Keep 720x1280, 30 FPS previews feasible on low-spec Windows, concurrency 1–2.
- Implement only the requested stage. Run focused tests, then typecheck and render checks when possible. Never claim a pass you did not observe.

## Context to consult only when relevant
- Architecture and contracts: `docs/knowledge-studio/ARCHITECTURE.md`
- Product direction and educational goals: `docs/knowledge-studio/PRODUCT.md`
- Current status, assumptions and next task: `docs/knowledge-studio/STATUS.md` and `docs/knowledge-studio/NEXT_TASK.md`

Before changing code: briefly list planned files. After changing code: list changed paths, tests actually run, their results, known issues, and the next decision point. Avoid unnecessary refactors.
