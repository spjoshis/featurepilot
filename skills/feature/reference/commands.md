# FeaturePilot — Command Reference

> On-demand reference for the `feature` skill (see `../SKILL.md`). Detailed behavior for the management and query commands. The command routing table and shared contracts live in `SKILL.md`; the phase lifecycle is in `lifecycle.md`.

## Resume Logic

When `/feature resume <ID>` is invoked:

1. Read `change.yaml` for the feature
2. Determine current `status`
3. Present summary:
   ```
   Feature: FDO-NNN — <name>
   Status: <current phase>
   Completed phases: [list]
   Remaining phases: [list]
   ```
4. If status is `implement`, also show task progress from `tasks.yaml`
5. If status is `blocked`, do not attempt to execute a phase — direct the developer to
   `/feature unblock <ID>` instead (see below) and stop.
6. Ask: "Continue from <current phase>?"
7. On confirmation, execute the current phase

## Unblock (`/feature unblock <ID>`)

**Goal:** Diagnose why a feature was marked `blocked` and — only on explicit
confirmation — give it a fresh attempt/cycle budget. `blocked` is set from four distinct
places, and each leaves a different trail. Diagnosis must identify which one applies
before proposing a fix — resetting the wrong counter (e.g. task `attempts` when the real
exhaustion was `code_review.cycle`) would silently fail to unblock anything.

| Origin | Set when | Trail | Reset on confirm |
|---|---|---|---|
| IMPLEMENT | a task's `attempts >= max_retries` | `tasks.yaml` task `status: blocked`; last error in `implementation.md` | task `attempts: 0`, `status: ready`/`pending`; feature `status: implement` |
| TEST | fix-cycle exhaustion during test remediation | last failure in `test-results.md` | feature `status: test` (task-level reset as above if a task is also `blocked`) |
| CONVERGE | `convergence.cycle >= 2` with unresolved criteria | unresolved ACs in `convergence.md`'s "Missing Implementation" | `convergence.cycle: 0`, `convergence.status: pending`; feature `status: converge` |
| CODE_REVIEW / FIX | `code_review.cycle >= max_review_cycles` with findings still open | open findings in `code-review.md` | `code_review.cycle: 0`, `code_review.status: pending`; feature `status: code_review` |

**Process:**
1. Read `change.yaml`. If the ID doesn't exist, report that and stop.
2. If `status` is not `blocked`, report `FDO-NNN is not blocked (status: <status>).` and
   stop — there is nothing to unblock.
3. Diagnose, checking each possible origin in turn (more than one can apply, e.g. a
   blocked task plus a separately exhausted review cycle — report all that apply):
   - **IMPLEMENT/TEST:** read `tasks.yaml` for every task with `status: blocked`
     (`description`, `attempts`/`max_retries`, `dependencies`), and the tail of
     `implementation.md` or `test-results.md` (whichever is more recent) for the last
     recorded failure.
   - **CONVERGE:** if `convergence.cycle >= 2`, read `convergence.md`'s "Missing
     Implementation" section for the acceptance criteria still unresolved.
   - **CODE_REVIEW/FIX:** if `code_review.cycle >= max_review_cycles`, read
     `code-review.md` for findings still open after the last fix cycle.
   - Best-effort throughout — if an expected file is missing or has no relevant entry,
     say so rather than guessing.
4. Present the diagnosis, naming the specific origin(s), e.g.:
   ```
   FDO-NNN is blocked.

   Blocked task: TASK-004 — Implement bulk upload API endpoint
     Attempts: 3 / 3 (max_retries exhausted)
     Last error: "ECONNRESET connecting to database in test environment"

   This looks like an environment/connectivity issue, not a code defect.
   ```
   or, for a cycle-exhaustion origin:
   ```
   FDO-NNN is blocked.

   Code review remediation exhausted its cycle budget: 3 / 3 fix→test→review cycles.
   Findings still open (from code-review.md):
     - [HIGH] Missing input validation on batch size — TASK-006

   This needs either a manual fix or a larger cycle budget before retrying.
   ```
5. Ask explicitly what to retry, naming the specific counter (e.g. "Retry TASK-004 with
   a fresh attempt budget?" or "Retry code review remediation with a fresh cycle
   budget?"). Do **not** change any file until the developer confirms.
6. On confirmation, apply only the reset(s) for the confirmed origin(s), per the table
   above, and set the feature's `status` back to the corresponding phase. Report what
   changed and that the developer can now `/feature resume <ID>`.
7. If the developer declines, or asks to investigate further first, make no changes —
   this command is safe to run repeatedly while diagnosing.

## List Features

When `/feature list` is invoked:

1. Scan `.feature/changes/` for all `change.yaml` files
2. If none exist, report: `No features yet. Run /feature "<requirement>" to start one.` and stop.
3. Apply filters, if given (all are optional and combine with AND):
   - `--status=<s>` — exact match against a valid lifecycle state (see Lifecycle States). Reject an unrecognized value with the list of valid states.
   - `--type=<t>` — exact match against a valid `type` (see Feature Metadata).
   - `--mode=<m>` — exact match against `guided|fast|expert`.
4. Sort, default `id` ascending:
   - `--sort=id` (default), `--sort=updated` (by `updated_at`, most recent first), `--sort=status` (lifecycle order, per Lifecycle States, earliest first)
5. Present table:
   ```
   ID        Name                          Type      Status
   FDO-001   bulk-document-processing      feature   implement
   FDO-002   search-improvements           feature   code_review
   FDO-003   notification-system           feature   plan
   ```
6. If filters matched zero features, report which filters were applied and that nothing matched — do not print an empty table.
7. End with a count: `3 features shown` (or `2 of 5 features shown` when filtered).

## Status (`/feature status <ID>`)

**Goal:** Give a complete, at-a-glance picture of one feature — where it is in the lifecycle,
the status of each phase, task progress while implementing, any blocking condition, a
traceability snapshot, and, most importantly, **the single recommended next action**.
`status` is the command a developer reaches for most often ("where is this, and what do I do
next?"), so it doubles as the hub that points to the right next command for the feature's
current state. It is **read-only** — it never changes state or requires approval.

**Process:**
1. Read `change.yaml`. If the ID doesn't exist, report that and stop.
2. Build the **phase checklist** across the lifecycle states, marking each `✓` done,
   `▶` current, or `·` pending from `status` and the per-phase sub-statuses in `change.yaml`
   (`specification.status`, `architecture.hld`/`lld`, `analysis.status`, `plan.status`,
   `implementation.status`, `testing.status`, `convergence.status`, `code_review.status`).
3. If implementation has started (`status: implement` or later), read `tasks.yaml` and
   summarize task progress: counts by task status
   (`pending`/`ready`/`in_progress`/`completed`/`validated`/`failed`/`blocked`), and name any
   `blocked` or `failed` task.
4. If `status: blocked`, identify the origin the same way `/feature unblock` does (which
   attempt budget or cycle is exhausted) and surface it in one line.
5. If `acceptance.yaml` exists, add a one-line **traceability summary** (N criteria, M fully
   traced, K gaps) — the headline numbers `/feature trace` would show, without reproducing the
   full report.
6. Determine the **recommended next action** from the current `status` and present it as a
   concrete command:
   - `new`/`explore`/`specify`/`discover`/`brainstorm`/`architecture`/`hld`/`lld` →
     `/feature resume <ID>` to continue the next phase (note `/feature impact <ID>` is
     available to preview blast radius while designing).
   - `plan`/`analyze` → `/feature simulate <ID>` to preview the plan, then
     `/feature approve <ID>`.
   - `approval` → `/feature approve <ID>` (suggest `/feature simulate <ID>` first if not yet run).
   - `implement`/`test`/`converge`/`code_review`/`fix` → `/feature resume <ID>`; if any task is
     blocked, `/feature unblock <ID>`.
   - `blocked` → `/feature unblock <ID>` (never `resume`).
   - `complete` → `/feature learn <ID>` to capture lessons, then `/feature archive <ID>`.
   - `archive` → none; it is historical.

**Output:**
```
FeaturePilot Status — FDO-002 search-improvements
Type: feature   Mode: guided   Status: analyze
Created 2026-10-01   Updated 2026-10-03

Phases
  ✓ explore   ✓ specify   ✓ discover   ✓ brainstorm
  ✓ architecture (hld ✓, lld ✓)   ✓ plan   ▶ analyze   · approval
  · implement   · test   · converge   · code_review   · complete

Traceability: 8 acceptance criteria — 6 fully traced, 2 gaps (/feature trace FDO-002)

Next action
  ▶ /feature simulate FDO-002   preview the files/tests/risks this plan will produce
    then /feature approve FDO-002 to start implementation
```

While implementing, replace the traceability line with task progress, e.g.:
```
Status: implement
Tasks: 8 total — 5 validated, 1 in_progress, 1 ready, 1 blocked
  ⚠ TASK-004 blocked (attempts 3/3)

Next action
  ▶ /feature unblock FDO-002   a task is blocked; diagnose and retry
```

Use `✓`/`▶`/`·`/`⚠` consistently with the other commands. `status` never changes state — it
only reports and points to the next step.

## Traceability (`/feature trace <ID>`)

**Goal:** Show the Requirement → Acceptance Criteria → Task → Test chain for a single
feature on demand, at any phase — not just the one-time snapshot `convergence.md`
produces after the CONVERGE phase runs. This operationalizes the project's traceability
requirement (Requirement → Acceptance Criteria → Task → Code → Test) as something a
developer can query at any point, not only after convergence. This is a **read-only**
report; it never modifies `acceptance.yaml`, `tasks.yaml`, or any other file.

**Process:**
1. Read `change.yaml`. If the ID doesn't exist, report that and stop.
2. Read `acceptance.yaml`. If missing (feature hasn't reached SPECIFY yet), report:
   `No acceptance criteria yet — traceability is available from the specify phase onward.`
3. Read `tasks.yaml` if present (empty/absent before the PLAN phase).
4. Read `convergence.md` if present, to show verified-by-test status instead of just
   linkage.
5. For each acceptance criterion, resolve its `tasks: []` IDs against `tasks.yaml` to get
   task descriptions and status, and list its `tests: []` entries directly.
6. Flag gaps that indicate incomplete traceability:
   - An acceptance criterion with an empty `tasks: []` — not yet planned.
   - An acceptance criterion with an empty `tests: []` after the feature has passed
     IMPLEMENT — not yet verified.
   - A task in `tasks.yaml` whose `acceptance_criteria: []` is empty — implementation
     with no traced requirement (possible scope creep).

**Output:**
```
FeaturePilot Traceability — FDO-002 search-improvements

AC-001: "Search returns results within 200ms for catalogs under 10k items"
  Tasks:  TASK-001 (completed) — Add search index
          TASK-003 (in_progress) — Add query caching layer
  Tests:  tests/search/index.test.js, tests/search/perf.test.js
  Status: ✓ implemented, ✓ tested

AC-002: "Search UI shows a loading state while a query is in flight"
  Tasks:  (none — not yet planned)
  Tests:  (none)
  Status: ⚠ no tasks linked

Untraced tasks (implement no acceptance criterion):
  TASK-004 — Refactor search result cache eviction

Summary: 2 acceptance criteria, 1 fully traced, 1 gap, 1 untraced task
```

Use `✓` for fully linked+verified, `⚠` for a gap (missing tasks or tests), consistent
with the symbols `doctor` uses. This command never blocks or requires approval — it is
purely informational.

## Change Impact Analysis (`/feature impact <ID>`)

**Goal:** Answer "what else could this change affect?" for a single feature — its blast
radius across the codebase *and* across FeaturePilot's own portfolio of other changes.
DISCOVER (Phase 3) already records the components *this* feature touches; `impact` extends
that into the existing components, cross-cutting concerns, and other in-flight or archived
features that touch the *same* surface and could therefore break or need coordination. Like
`trace` and `doctor`, this is a **read-only** report — it never modifies `codebase-context.md`,
`tasks.yaml`, `change.yaml`, `.feature/architecture/overview.md`, or any other file, even when
it surfaces a conflict. Resolving conflicts stays an architecture/developer decision.

**Availability:** Impact analysis derives from the feature's discovered and designed surface.
It becomes meaningful once DISCOVER (Phase 3) has written `codebase-context.md`, and sharper
after ARCHITECTURE (`lld.md`) and PLAN (`tasks.yaml`) add concrete APIs, data changes, and
per-task impacted components. If the feature has not reached DISCOVER yet, report:
`No discovered surface yet — impact analysis is available from the discover phase onward.`
and stop.

**Process:**
1. Read `change.yaml`. If the ID doesn't exist, report that and stop.
2. Gather this feature's **changed surface** from whatever artifacts exist (best-effort;
   skip and note any that are absent rather than guessing):
   - `codebase-context.md` — the Impacted components section
     (MODIFIED / ADDED / POTENTIALLY AFFECTED) and the existing patterns it depends on.
   - `lld.md` — concrete APIs, database/schema changes, events/messages, and configuration
     changes the design introduces or modifies.
   - `tasks.yaml` — each task's `impacted_components`.
   Normalize these into a deduplicated set of surface items, each tagged by kind
   (file/module, API, data/table, event/queue, config).
3. Classify impact into tiers:
   - **Direct** — surface items the feature explicitly adds or modifies (the MODIFIED/ADDED
     context entries, LLD changes, and task `impacted_components`).
   - **Indirect** — existing components that *depend on* a Direct item and are not themselves
     being changed: callers of a modified API, consumers of a changed event/queue, readers of
     a changed table, modules importing a modified file. Use `codebase-context.md`'s
     "POTENTIALLY AFFECTED" entries and the discovered dependency/pattern notes. Where the
     artifacts don't actually establish a dependency, mark it inferred rather than confirmed.
   - **Regression hotspots** — cross-cutting areas (auth/authz, input validation, rate
     limiting, migrations, shared middleware) that the Direct/Indirect sets touch and that
     carry outsized blast radius if they regress.
4. **Cross-feature impact** — scan `.feature/changes/*` (active) and `.feature/archive/*`
   (historical), excluding this feature, and flag overlaps where another feature's impacted
   components or LLD surface intersect this feature's Direct set (same file, API, table, or
   event). For active features, show their current `status` so the developer can tell live
   work apart from already-shipped or archived work. Best-effort: only assert an overlap the
   artifacts support; do not invent dependencies between features.
5. Rank findings by risk with a transparent heuristic, and count them:
   - **High** — a Direct change to a regression hotspot, or an overlap with another *active*
     feature.
   - **Medium** — Indirect impact, or an overlap with an archived feature.
   - **Low** — an isolated Direct change with no dependents or overlaps.

**Output:**
```
FeaturePilot Impact Analysis — FDO-002 search-improvements

Direct impact
  ✓ src/api/search.ts              (modified API)
  ✓ src/services/search-service.ts (modified module)
  ✓ search_index                   (schema change)

Indirect impact (depends on a direct change; inferred unless noted)
  ⚠ catalog API       — calls search-service
  ⚠ reporting job     — reads search_index
  ⚠ autocomplete      — downstream of search-service (inferred)

Regression hotspots
  ⚠ authentication middleware — on the search request path
  ⚠ rate limiting             — search is a known high-volume path

Other FeaturePilot features affected
  ⚠ FDO-001 bulk-document-processing (status: implement) — also modifies search-service.ts  [active — coordinate]
  ⚠ FDO-004 audit-export             (archived)          — also reads search_index

Risk summary: 3 high, 4 medium, 2 low
Missing inputs: lld.md not found (run /feature design FDO-002 for API/schema-level impact)
```

Use `✓` for a confirmed direct change and `⚠` for something to review (indirect impact, a
hotspot, or a cross-feature overlap), consistent with the symbols `trace` and `doctor` use.
This command never blocks or requires approval — it is purely informational.

## Cross-Feature Evolution (`/feature evolve`)

**Goal:** Give a portfolio-wide view of how all *active* features relate — the dependency,
conflict, and duplication graph across the whole set of in-flight changes, not one feature's
blast radius. Where `/feature impact <ID>` answers "what does *this* change affect?" (one
feature looking outward), `evolve` answers "how do all the in-flight features relate to *each
other*?" (the whole many-to-many graph). It is the natural tool when several features — often
several agents — are in flight at once and you need to see conflicts and shared surface before
they collide. It reuses the same per-feature changed-surface extraction `impact` uses, applied
across every active feature. Like `impact`, `trace`, and `doctor`, it is **read-only** — it
never modifies any `.feature/` file, and it surfaces conflicts without resolving them.

**Availability:** Operates over `.feature/changes/*` (active features; archived features are
historical and are only cross-checked in step 4, not treated as nodes). If there are fewer
than two active features, report that `evolve` needs at least two active features to show
relationships and stop. Features that haven't reached DISCOVER yet have no derivable surface;
list them as "not yet analyzable" rather than dropping them silently.

**Process:**
1. Enumerate every active feature under `.feature/changes/*`. For each, read `change.yaml`
   for `id`, `name`, and `status`.
2. For each feature, extract its **changed surface** exactly as `impact` does — from
   `codebase-context.md`, `lld.md`, and `tasks.yaml` — normalized and tagged by kind
   (file/module, API, data/table, event/queue, config). Keep a per-item note of whether the
   feature *adds/modifies* it (a write) or *reads/consumes* it (a read). Features with no
   derivable surface stay in the roster but contribute no edges.
3. Build the relationships across the active set:
   - **Shared components** — any surface item touched by 2+ features. This is the backbone of
     the graph.
   - **Conflicts** — two features that both *modify* the same item (not merely both read it):
     concurrent-modification risk, the highest-attention edges.
   - **Dependencies** — a directional edge from a feature that *reads/consumes* an item to the
     feature that *adds/modifies* it (the reader depends on the writer). Use the same
     inferred-vs-confirmed distinction as `impact`: only call it confirmed when the artifacts
     establish the link.
   - **Possible duplication** — two features whose *added* surface or stated requirement
     describes the same new capability (e.g. both introducing a `search_index` or the same
     endpoint). Flag for a human to deduplicate; never assert duplication as certain.
4. Cross-check each active feature's *modify* set against the **archived/completed** features'
   surface (shipped work): an active feature modifying something a shipped feature relied on is
   a regression-against-shipped signal. Use `.feature/architecture/overview.md` if present to
   anchor durable component names.
5. Rank edges and count them: a **conflict**, or an overlap with an active feature currently in
   `implement`/`fix` (live code work) → **High**; a **dependency** or a shared read → **Medium**;
   a regression-against-shipped (archived) overlap → noted separately.

**Output:**
```
FeaturePilot Evolution — 4 active features

Dependency graph
  FDO-007 add-search-service ──┐
                               ├──→ FDO-015 search-ranking   (depends on: search-service)
  FDO-009 search-index ────────┘

  FDO-015 search-ranking  ── conflicts ──  FDO-011 search-cache   (both modify search-service.ts)

Shared components
  src/services/search-service.ts  — FDO-011 (implement), FDO-015 (plan)   ⚠ conflict
  search_index (table)            — FDO-007 (plan), FDO-009 (plan)
  audit-event (queue)             — FDO-009, FDO-015

Possible duplication
  ⚠ FDO-007 and FDO-009 both introduce a search index — confirm these aren't the same work

Regression-against-shipped
  ⚠ FDO-011 modifies rate-limiting, relied on by archived FDO-004 audit-export

Not yet analyzable (pre-discover)
  FDO-016 search-synonyms (status: explore)

Risk summary: 2 high, 3 medium; 5 shared components across 4 features
```

Use `✓`/`⚠` consistent with the other read-only commands. `evolve` surfaces conflicts and
possible duplication but never resolves them or edits a feature — reconciliation stays an
architecture/developer decision, and is exactly the signal a multi-feature effort's
consistency/consensus step consumes before committing to parallel work.

## Implementation Simulation (`/feature simulate <ID>`)

**Goal:** Before approving a plan, show what IMPLEMENT (Phase 9) is *likely to produce* —
the expected files created/modified/deleted, the expected tests, the task execution shape
(parallel groups and ordering), and the risks or likely failure points — **without changing
a single file**. This turns the APPROVAL gate (Phase 8) into an informed decision: the
developer approves after seeing a concrete projection of the plan's output, not just the
plan's prose. Like `impact`, `evolve`, `trace`, and `doctor`, it is **read-only**; it is
**not** a lifecycle phase, it never spawns an implementation sub-agent, and it never touches
the working tree or changes the feature's `status`.

It reads the same inputs IMPLEMENT consumes — `tasks.yaml`, `lld.md`, `plan.md`,
`codebase-context.md`, `acceptance.yaml` — and projects the outcome rather than executing it.

**Availability:** Simulation needs a plan to project from. It is meaningful once PLAN
(Phase 6) has written `tasks.yaml`, and sharpest once ARCHITECTURE (`lld.md`) has concrete
files, APIs, and schema changes. If the feature has not reached PLAN, report:
`No plan yet — simulation is available from the plan phase onward (run /feature plan <ID> first).`
and stop. It is best run just before APPROVAL.

**Process:**
1. Read `change.yaml`. If the ID doesn't exist, report that and stop.
2. Read the plan inputs (best-effort; note any that are absent rather than guessing):
   `tasks.yaml` (tasks, `dependencies`, `parallel_group`, `testing`, `impacted_components`,
   `attempts`/`max_retries`), `lld.md` (files/modules, APIs, schema changes, config), `plan.md`,
   `codebase-context.md` (which files already exist vs. would be new), `acceptance.yaml`.
3. Project the **file footprint**: classify each expected path from the LLD and tasks as
   added (`+`), modified (`~`), or deleted (`−`). Decide modified-vs-added from whether
   `codebase-context.md` lists the file as already existing. Where a change is named but no
   concrete path can be resolved, count it as `?` unresolved rather than inventing a number.
4. Project the **test footprint**: from each task's `testing:` list and the LLD testing
   strategy, tally expected unit/integration/e2e tests, and map them back to acceptance
   criteria. An acceptance criterion with no projected test is a warning.
5. Project the **execution shape**: task count, parallel groups (from `parallel_group`), and
   the dependency-ordered sequence. Flag tasks whose dependencies are unmet or reference a
   task that does not exist, and tasks already at `attempts >= max_retries` from a prior run.
6. Detect **risks / likely failures** from the artifacts, e.g.: a migration not marked
   backward-compatible in the LLD; an API consumed by several existing modules (the same
   signal `/feature impact` surfaces); a task with a missing/unclear dependency; an acceptance
   criterion with no implementing task (reuse the ANALYZE checks); external calls with no
   timeout handling where the constitution requires it.
7. Produce a **verdict**: `READY` (no warnings), `READY WITH N WARNINGS`, or `NOT READY`
   (a critical gap such as an AC with no task, or a dependency on a nonexistent task). This
   mirrors the spirit of ANALYZE, but it is a projection, not a gate — it never changes
   `status` and never blocks.

**Output:**
```
Implementation Simulation — FDO-002 search-improvements  (status: analyze)

Expected file changes
  + 6 new       (e.g. src/services/search-service.ts, src/api/search.ts)
  ~ 9 modified
  − 1 deleted
  ? 2 unresolved (LLD names a change but no concrete path yet)

Expected tests
  + 14 unit, + 5 integration, + 2 e2e
  AC coverage: 7 / 8 criteria have a projected test
    ⚠ AC-006 "search telemetry recorded" — no test projected

Execution shape
  8 tasks across 3 parallel groups
    group 1: TASK-001, TASK-002            (no deps)
    group 2: TASK-003, TASK-004, TASK-005
    group 3: TASK-006, TASK-007, TASK-008
  ⚠ TASK-007 depends on TASK-009, which does not exist

Risks / likely failures
  ⚠ migration in lld.md is not marked backward-compatible
  ⚠ search-service API is consumed by 3 existing modules (see /feature impact FDO-002)
  ⚠ TASK-004 is already at attempts 3/3 from a prior run

Verdict: READY WITH 3 WARNINGS
(No files were changed — this is a projection of what /feature implement would do.)
```

Use `✓`/`⚠`/`✗` consistent with `doctor` and `analyze`. Simulation never modifies files,
never spawns implementation sub-agents, and never changes the feature's `status` — the
developer still runs `/feature approve` and `/feature implement` to actually proceed.

## Doctor (Health Check)

When `/feature doctor` is invoked, run a **read-only** diagnostic of the project's
`.feature/` setup and report findings. **Never modify or create files during doctor** —
if fixes are needed, propose them and ask before changing anything.

### Checks

1. **Structure**
   - `.feature/` exists. If not: report that FeaturePilot is not initialized here (running
     `/feature` will create it) and stop.
   - `.feature/config.yaml` exists. If missing: flag it (it is normally created on first
     `/feature`).

2. **`config.yaml`**
   - Parses as valid YAML.
   - Required keys present with correct types: `id_prefix` (non-empty string), `next_id`
     (integer ≥ 1), `approval` (`architecture`, `implementation`, `production_changes`,
     `git_push`, `merge` — all booleans), `code_review` (`required`, `auto_fix` booleans;
     `max_review_cycles` integer ≥ 1), `execution` (`parallel` boolean; `max_retries`
     integer ≥ 0), `git` (`auto_commit`, `auto_push` booleans).
   - `next_id` is greater than the highest existing feature ID (see check 4); otherwise the
     next feature would collide with an existing one — flag as an error. (Starting a
     Feature now self-corrects this at creation time; this check remains a backstop for
     drift introduced outside that flow, e.g. a hand-edited `config.yaml`.)

3. **`constitution.md`** (optional)
   - If `.feature/constitution.md` is absent: info only (it is optional).
   - If present: non-empty and contains at least one stated principle. Warn if it is empty
     or a placeholder.

4. **Changes** — for every `changes/<ID>-<slug>/change.yaml`:
   - Parses as valid YAML.
   - `status` is one of the valid lifecycle states (`new`, `explore`, `specify`, `discover`,
     `brainstorm`, `architecture`, `hld`, `lld`, `plan`, `analyze`, `approval`, `implement`,
     `test`, `converge`, `code_review`, `fix`, `complete`, `archive`, `blocked`).
   - `type` is one of `feature|bugfix|enhancement|refactoring|performance|security|architecture|tech-debt`.
   - `mode` is one of `guided|fast|expert`.
   - Required fields present: `id`, `name`, `requirement`, and the phase status sub-objects.
   - `id` matches the directory prefix (e.g. `FDO-001` in `FDO-001-slug/`); flag mismatches.
   - No duplicate IDs across `changes/`.
   - If `status: implement`, `tasks.yaml` exists and every task `status` is valid
     (`pending|ready|in_progress|completed|validated|failed|blocked`).

5. **Architecture** (optional)
   - If `.feature/architecture/adr/` exists, ADR files follow `ADR-NNN-title.md`. Warn on
     malformed names.
   - If `.feature/architecture/overview.md` is absent: info only (it's created
     automatically by the first DISCOVER phase that runs — see Phase 3).
   - If present: non-empty and not a placeholder. Warn if it is empty.
   - If `.feature/knowledge/` is absent: info only (it's created by the first
     `/feature learn` that runs — see "Feature Learning"). If present, each `*.md` in it is
     non-empty; warn on an empty knowledge file.

### Output

Present a concise report and an overall verdict:

```
FeaturePilot Doctor — .feature/ health check

Structure
  ✓ .feature/ present
  ✓ config.yaml present

Configuration
  ✓ Required keys present and well-typed
  ✗ next_id (3) is not greater than the highest existing ID (FDO-003) — next feature would collide

Constitution
  ⚠ .feature/constitution.md not found (optional)

Changes (3)
  ✓ FDO-001-bulk-document-processing — status: complete
  ✗ FDO-002-search — status: "reviewing" is not a valid lifecycle state
  ✓ FDO-003-notifications — status: plan

Summary: 2 errors, 1 warning
Status: ISSUES FOUND
```

Use `✓` (ok), `⚠` (warning, non-blocking), `✗` (error). End with
`Status: HEALTHY` (no errors) or `Status: ISSUES FOUND`. For each `✗`/`⚠`, give a one-line
suggested fix. If issues are found, offer to fix them and **wait for confirmation** before
making any change.

## Feature Learning (`/feature learn <ID>`)

**Goal:** Turn a *completed* feature's accumulated knowledge — the review findings,
convergence results, architecture decisions, failed attempts, and testing lessons that
otherwise stay buried in `.feature/changes/FDO-NNN/` — into durable, project-level
engineering memory under `.feature/knowledge/`, so future features' DISCOVER and ARCHITECTURE
phases start from hard-won lessons instead of rediscovering them. This closes the loop:

```
Feature → Implementation → Review → Learn → Project memory → better next feature
```

Unlike the read-only report commands (`impact`/`evolve`/`simulate`/`trace`/`doctor`), `learn`
*writes* — but conservatively. It only **appends** curated entries to `.feature/knowledge/*.md`,
never overwrites or rewrites an existing entry, and it **asks before writing** (the same
discipline DISCOVER uses before touching `architecture/overview.md`). Every entry is attributed
to its source feature, so project memory stays traceable rather than becoming anonymous
folklore.

**Availability:** You learn from finished work. `learn` expects `status: complete` (or an
archived feature). If the feature is not complete, report:
`FDO-NNN is not complete (status: <status>) — learn captures lessons from finished features.`
and ask for explicit confirmation before capturing lessons from an unfinished feature; make no
changes unless the developer confirms.

**Knowledge store** (`.feature/knowledge/`, created on first `learn`):

| File | Holds |
|---|---|
| `patterns.md` | Reusable patterns the codebase follows |
| `pitfalls.md` | Traps / gotchas discovered the hard way |
| `testing.md` | Testing rules and conventions that proved necessary |
| `architecture.md` | Durable architecture lessons |
| `decisions.md` | Notable decisions and their rationale (pointers to ADRs) |

**Process:**
1. Read `change.yaml`. If the ID doesn't exist, report that and stop. Check completeness per
   Availability above.
2. Mine the feature's artifacts for durable, *generalizable* lessons — rules that will hold for
   future features, not facts true only of this one (best-effort; skip absent artifacts):
   - `code-review.md` — recurring finding categories → `pitfalls.md` / `patterns.md`.
   - `convergence.md` + `test-results.md` — what had to be tested, what nearly slipped →
     `testing.md`.
   - `decisions.md` and `.feature/architecture/adr/` — decisions with lasting rationale →
     `decisions.md` / `architecture.md`.
   - `implementation.md` — failed attempts/retries and how they were resolved → `pitfalls.md`.
   - `codebase-context.md` — existing patterns the feature had to follow → `patterns.md`.
3. Phrase each candidate as a short, reusable rule (one or two lines) tagged with the source
   feature, e.g. `- All external API calls use a 5s timeout + exponential retry. (FDO-012)`.
   Discard anything that is only true for this single feature.
4. De-duplicate against what the knowledge files already contain. If an equivalent rule is
   already recorded, do not re-add it (you may note it is now reinforced by another feature).
   Never edit or delete an existing entry.
5. Present the proposed additions grouped by target file and **wait for confirmation**. On
   confirmation, create `.feature/knowledge/` if needed and **append** the confirmed entries
   under the right files; then report exactly what was written. If the developer declines,
   write nothing — `learn` is safe to run repeatedly while deciding.

**Output (proposal — nothing is written yet):**
```
Feature Learning — FDO-012 bulk-upload-hardening (status: complete)

Proposed additions to .feature/knowledge/ (nothing written yet):

patterns.md
  + All external API calls use a 5s timeout + exponential retry.  (FDO-012)

pitfalls.md
  + Direct writes to document_jobs bypass audit events — always go through
    document-service.  (FDO-012)

testing.md
  + Integration tests are required when modifying a queue consumer.  (FDO-012)

Already recorded (skipped): "Search indexing must be asynchronous" — present from FDO-008.

Write these 3 entries? (y / n)
```

After writing, confirm concretely, e.g.:
`Appended 3 entries to .feature/knowledge/ (patterns.md, pitfalls.md, testing.md).`

These files then feed DISCOVER (Phase 3), which reads `.feature/knowledge/` as baseline
context on every subsequent feature — so the lessons actively shape future discovery and
design rather than sitting inert.

