# Worked example: a `/feature` run end to end

This is an **illustrative walkthrough** of a single FeaturePilot feature, from requirement to
completion. The artifacts below are representative examples of what FeaturePilot writes under
`.feature/` — they show the *shape* of each phase's output, not a transcript of a specific
project. Your real runs will contain project-specific detail discovered from your codebase.

The authoritative behavior is defined in [`../skills/feature/SKILL.md`](../skills/feature/SKILL.md).

---

## The requirement

```
/feature "Add bulk document processing for up to 500 documents"
```

FeaturePilot creates a feature, assigns an ID, and begins the lifecycle:

```
Created FDO-001. Starting exploration.
```

Everything for this feature now lives under `.feature/changes/FDO-001-bulk-document-processing/`.

---

## Phase 1 — Explore

FeaturePilot asks targeted clarification questions before designing. For example:

1. What document formats must be supported (PDF, DOCX, images)?
2. Is 500 a hard limit or a default batch size?
3. Should processing be synchronous, or queued/async with status polling?
4. What happens to the whole batch if one document fails?

**`exploration.md`** (excerpt)

```markdown
## Assumptions
- Async processing with per-document status; the API returns a batch handle immediately.
- Partial failure is allowed: a failed document does not fail the batch.

## Constraints
- 500 documents per batch (hard limit).
- Supported formats: PDF, DOCX, PNG/JPEG.
```

---

## Phase 2 — Specify

**`requirements.md`** captures behavior as scenarios; **`acceptance.yaml`** makes them testable.

```yaml
# acceptance.yaml
acceptance_criteria:
  - id: AC-001
    description: "A batch of up to 500 documents can be submitted and returns a batch ID."
    status: pending
    tasks: []
    tests: []
  - id: AC-002
    description: "Submitting more than 500 documents is rejected with a clear error."
    status: pending
  - id: AC-003
    description: "A single document failure does not fail the batch; its status is 'failed'."
    status: pending
```

---

## Phase 3 — Discover

An Explore agent scans the existing codebase and records what the feature must fit into.

**`codebase-context.md`** (excerpt)

```markdown
## Technology stack
- API: Node.js + Express; persistence: PostgreSQL; queue: Redis + BullMQ.

## Impacted components
- ADDED: batch submission endpoint, batch worker.
- MODIFIED: document service (reuse existing single-document pipeline).

## Existing patterns to follow
- Controllers delegate to services; repositories are not called from controllers.
```

---

## Phase 4–5 — Brainstorm & Architecture

`brainstorm.md` weighs options (e.g. synchronous vs. queued); the recommendation feeds the
HLD/LLD. **`hld.md`** and **`lld.md`** capture the design; significant choices become ADRs.

```markdown
# ADR-001: Queue batch processing with BullMQ
## Decision
Process batches asynchronously via a Redis-backed queue, reusing the existing
single-document pipeline per job.
## Consequences
Submission stays fast; per-document retries and status are natural; adds a Redis dependency
(already present).
```

---

## Phase 6–7 — Plan & Analyze

**`tasks.yaml`** decomposes the work with dependencies and traceability to acceptance criteria.

```yaml
tasks:
  - id: TASK-001
    description: "Add batch + batch_item tables (migration)"
    dependencies: []
    acceptance_criteria: [AC-001, AC-003]
    parallel_group: 1
  - id: TASK-002
    description: "Batch submission endpoint (validates <=500)"
    dependencies: [TASK-001]
    acceptance_criteria: [AC-001, AC-002]
    parallel_group: 2
  - id: TASK-003
    description: "Batch worker: per-document processing with partial-failure handling"
    dependencies: [TASK-001]
    acceptance_criteria: [AC-003]
    parallel_group: 2
```

`analysis.md` then checks that every acceptance criterion has a task and a test, and that the
design has no contradictions, before the approval gate.

---

## Phase 8 — Approval

FeaturePilot presents a summary and **waits** for your explicit approval:

```
Feature: FDO-001 — bulk-document-processing

Specification: ✓   HLD: ✓   LLD: ✓   Analysis: ✓ (0 warnings)
Implementation: 3 tasks, 2 components, 1 DB change, 1 API

Options: 1) Approve   2) Modify   3) Regenerate
```

```
/feature approve FDO-001
```

---

## Phase 9–11 — Implement, Test, Converge

Tasks execute in dependency order (parallel where safe). The project's own test commands run,
then convergence verifies each acceptance criterion against the code and tests.

**`convergence.md`** (excerpt)

```markdown
# Convergence Report
- AC-001: ✓ Implemented in src/api/batch.ts, tested in test/batch.submit.test.ts
- AC-002: ✓ Implemented in src/api/batch.ts (validation), tested in test/batch.limit.test.ts
- AC-003: ✓ Implemented in src/workers/batch.worker.ts, tested in test/batch.partial.test.ts

## Status: PASSED
```

---

## Phase 12–13 — Code review & fix

**`code-review.md`** categorizes findings (Critical/High/Medium/Low). High/Critical findings
are fixed, then tests and convergence re-run (bounded by `max_review_cycles` in config).

```markdown
# Code Review
## Summary — Critical: 0  High: 1  Medium: 1  Low: 0
## Status: CHANGES REQUIRED
### [HIGH] Unbounded concurrency in batch worker
- File: src/workers/batch.worker.ts:34
- Fix: cap concurrency; process in chunks to protect the DB pool.
```

After the fix cycle passes, the feature reaches **COMPLETE**, and FeaturePilot asks whether you
want to commit/push (never doing so without approval).

---

## Try it yourself

```
/plugin marketplace add spjoshis/featurepilot
/plugin install featurepilot@param-play
/feature "Add bulk document processing for up to 500 documents"
```

Or run it faster with a single approval gate:

```
/feature "Add bulk document processing for up to 500 documents" --auto
```
