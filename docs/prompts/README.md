# Life Simulator — Master Development Prompts

The canonical product brief, delivered in three parts. Each part defines a set of
sprints and the execution protocol: **exactly one sprint per development run**,
verified (lint / typecheck / tests / build), committed as `feat(sprint-N): …`,
pushed, then stopped for review before continuing.

| Part  | File | Sprints | Scope |
| ----- | ---- | ------- | ----- |
| 1 | [part-1-sprints-1-4.md](./part-1-sprints-1-4.md) | 1–4 | Foundation + design system + domain architecture → global character creation → deterministic simulation engine → first playable life |
| 2 | [part-2-sprints-5-7.md](./part-2-sprints-5-7.md) | 5–7 | Relationships / partners / children / household → career reinvention + Decision Lab → migration, country comparison, world dynamics |
| 3 | [part-3-sprints-8-10.md](./part-3-sprints-8-10.md) | 8–10 | Rewind / fork / butterfly / sensitivity → country-calibrated economics → Life Multiverse, explainability, chaos, production hardening |

Shared principles across all parts:

- Global-first domain model (no single country's assumptions encoded as universal).
- Deterministic, seeded simulation; same seed + profile + assumptions = same future.
- Possibility space, not destiny — distributions and explanations, never predictions.
- No single "life score"; multidimensional, user-goal-weighted outcomes.
- Explainability: every major transition records its contributing factors.
- Design guidance: [ibelick/ui-skills](https://github.com/ibelick/ui-skills) — studied for judgement, not copied.
