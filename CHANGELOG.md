# Changelog

All notable changes to FeaturePilot are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.15.0] - 2026-10-03

### Changed
- **Progressive disclosure: `skills/feature/SKILL.md` restructured from one ~1,570-line file
  into a lean ~310-line control layer plus two on-demand reference files.** SKILL.md now keeps
  only what is always needed — purpose, the command routing table, the shared data contracts
  (`.feature/` layout, `config.yaml`, `change.yaml`, lifecycle states), and the always-on rules
  (Execution Modes, Git Safety, Error Recovery, Sub-Agent Spawning, Constitution, Traceability,
  Task Status Lifecycle) — and points to:
  - `skills/feature/reference/lifecycle.md` — the full phase-execution playbook (Starting a
    Feature → EXPLORE … → COMPLETE → ARCHIVE);
  - `skills/feature/reference/commands.md` — the detailed specs for the management/query
    commands (`resume`, `unblock`, `list`, `status`, `trace`, `impact`, `evolve`, `simulate`,
    `doctor`, `learn`).

  This follows Agent Skills best practice (keep SKILL.md lean; load detail on demand), cutting
  the tokens pulled into context when the skill triggers while keeping every command and phase
  one hop away. **No behavioral change:** all phase and command content was moved verbatim
  (byte-for-byte), not rewritten, and SKILL.md instructs reading the matching reference file
  before executing. The manual install path still works — `cp -r skills/feature …` copies the
  `reference/` directory with it.

## [1.14.0] - 2026-10-03

### Changed
- `/feature status <ID>` is now a fully specified, first-class command instead of a
  three-line stub. It renders a phase checklist (`✓` done / `▶` current / `·` pending) built
  from `change.yaml`'s per-phase sub-statuses, task progress (counts by task status, naming
  any blocked/failed task) once implementation has started, a one-line traceability summary
  when `acceptance.yaml` exists, and — most usefully — a **recommended next action** mapped
  from the current lifecycle state to a concrete command (`resume`/`simulate`/`approve`/
  `unblock`/`learn`/`archive`, plus an `impact` pointer while designing). This makes the
  most-used command the hub that answers "where is this, and what do I do next?", and brings
  it up to parity with the worked specs its sibling read-only commands (`list`/`trace`/
  `doctor`/`impact`/`evolve`/`simulate`) already had. Still strictly read-only.

## [1.13.0] - 2026-10-03

### Added
- `/feature learn <ID>` — distills a *completed* feature's durable lessons into project-level
  engineering memory under `.feature/knowledge/` (`patterns.md`, `pitfalls.md`, `testing.md`,
  `architecture.md`, `decisions.md`). It mines the feature's `code-review.md`, `convergence.md`,
  `test-results.md`, `decisions.md`/ADRs, `implementation.md`, and `codebase-context.md` for
  *generalizable* rules, phrases each as a short entry attributed to its source feature,
  de-duplicates against what's already recorded, and — crucially — **appends only, never
  overwrites, and asks before writing** (the same discipline DISCOVER uses for
  `architecture/overview.md`). This closes the loop
  Feature → Implementation → Review → Learn → Project memory → better next feature.
- DISCOVER (Phase 3) now reads `.feature/knowledge/*.md` alongside `architecture/overview.md`
  as baseline context, so distilled lessons actively shape future discovery and design instead
  of sitting inert.
- `doctor` gains a matching optional check for `.feature/knowledge/` (absent is fine; present
  warns on an empty knowledge file — same pattern as the `overview.md`/`constitution.md`
  checks).
- Directory Structure now documents the `.feature/knowledge/` store.

## [1.12.0] - 2026-10-03

### Added
- `/feature simulate <ID>` — a read-only pre-implementation dry run. It reads the same
  inputs IMPLEMENT consumes (`tasks.yaml`, `lld.md`, `plan.md`, `codebase-context.md`,
  `acceptance.yaml`) and projects what implementation *would* produce — expected file
  footprint (added/modified/deleted/unresolved), expected tests mapped to acceptance
  criteria, task execution shape (parallel groups and ordering), and risks/likely failure
  points (non-backward-compatible migrations, APIs with many existing consumers, tasks with
  missing dependencies, ACs with no implementing task) — ending in a `READY` /
  `READY WITH N WARNINGS` / `NOT READY` verdict. It changes no files, spawns no
  implementation sub-agent, and never alters the feature's `status`. The APPROVAL phase now
  points developers to it so the plan approval can be made after seeing a concrete
  projection of its output, not just the plan prose. Available from the PLAN phase onward.

## [1.11.0] - 2026-10-03

### Added
- `/feature evolve` — a read-only, portfolio-wide cross-feature graph. Where
  `/feature impact <ID>` looks outward from one feature (its blast radius, including which
  other features it overlaps), `evolve` steps up a level and correlates *all* active features
  under `.feature/changes/` with each other: it reuses the same changed-surface extraction
  (`codebase-context.md`, `lld.md`, `tasks.yaml`) across every active feature and reports
  **shared components** (any surface item touched by 2+ features), **conflicts** (two features
  that both *modify* the same item), **dependencies** (a feature that reads an item another
  feature writes), and **possible duplication** (two features introducing the same new
  capability). It also cross-checks active features' modifications against archived/shipped
  features to flag regression-against-shipped risk. Findings are risk-ranked (high/medium/low).
  This is the tool for seeing conflicts before they collide when several features — often
  several agents — are in flight at once. Strictly read-only; it surfaces conflicts but never
  resolves them or edits a feature.

### Docs
- README command table now lists `/feature evolve` and the previously-omitted
  `/feature unblock` (shipped in v1.7.0 but never added to the README).

## [1.10.0] - 2026-10-03

### Added
- `/feature impact <ID>` — a read-only change-impact (blast-radius) report. DISCOVER
  already records the components a feature touches; `impact` turns that into an explicit
  answer to "what else could this change break or require coordination with?" It reads the
  feature's `codebase-context.md`, `lld.md`, and `tasks.yaml` to assemble the changed
  surface, then classifies it into **direct** impact, **indirect** impact (existing
  dependents of a direct change — callers, consumers, readers), and **regression hotspots**
  (cross-cutting concerns like auth, validation, rate limiting, migrations). It also scans
  the other features under `.feature/changes/` and `.feature/archive/` and flags overlaps
  where another feature touches the same file, API, table, or event — surfacing conflicts
  and coordination needs across FeaturePilot's own change portfolio, not just one feature at
  a time. Findings are risk-ranked (high/medium/low) with a transparent heuristic. Like
  `trace` and `doctor`, it is strictly read-only and never modifies any `.feature/` file,
  even when it surfaces a conflict — resolution stays an architecture/developer decision.

## [1.9.0] - 2026-09-26

### Fixed
- `blocked` status is now set consistently across every phase that has a retry/cycle
  limit. Previously only IMPLEMENT (task `attempts >= max_retries`) and the informal
  TEST/FIX path set `status: blocked`; CONVERGE (`convergence.cycle >= 2` with
  unresolved acceptance criteria) and CODE_REVIEW/FIX (`code_review.cycle >=
  max_review_cycles` with findings still open) instead left the feature "presented to
  the developer" with no state change and no recorded way forward. Both now formally
  set `status: blocked`, and `/feature unblock` is extended to diagnose and — on
  confirmation — recover from all four origins (reading `convergence.md` or
  `code-review.md` in addition to `tasks.yaml`/`implementation.md`/`test-results.md`,
  and resetting the correct counter: task `attempts`, or the new `convergence.cycle` /
  existing `code_review.cycle`).
- `change.yaml` gains `convergence.cycle` (mirroring the existing `code_review.cycle`)
  so convergence retries are tracked the same way review cycles already are.

## [1.8.0] - 2026-09-26

### Added
- Feature ID allocation (`/feature "<requirement>"` creation) is now collision-safe:
  before generating an ID, it scans `.feature/changes/` and `.feature/archive/` for the
  highest existing ID and self-corrects `config.yaml`'s `next_id` if it has drifted
  behind reality, instead of trusting a counter that could be stale (concurrent
  `/feature` runs on the same project, a hand-edited or restored `config.yaml`, or a
  feature directory created outside the normal flow could all previously cause two
  features to collide on the same ID). `doctor` check 2 (stale `next_id`) remains as a
  backstop for drift introduced outside the creation flow.

## [1.7.0] - 2026-09-26

### Added
- `/feature unblock <ID>` — diagnoses why a feature was marked `blocked` (reads the
  blocked task's attempts/max_retries from `tasks.yaml` and the last recorded failure
  from `implementation.md`/`test-results.md`) and, only on explicit confirmation, resets
  the blocked task's attempt budget and returns the feature to its prior phase. Until
  now `blocked` had no documented recovery path at all — `/feature resume` would try to
  "execute the current phase" with no phase actually defined for that status.
- `/feature resume` now explicitly detects `status: blocked` and points to
  `/feature unblock` instead of attempting an undefined phase.
- `/feature archive <ID>` now warns and requires explicit confirmation before archiving
  a feature that isn't `status: complete` — previously it would silently move an
  in-progress or `blocked` feature's directory out of `/feature list` and `doctor`'s
  checks with no guardrail at all. Archiving a genuinely `complete` feature is
  unaffected (still a normal one-step confirmation).
- Directory Structure now documents `.feature/archive/` (it existed in behavior via
  `/feature archive` but was never shown in the directory tree).

## [1.6.0] - 2026-09-24

### Added
- DISCOVER (Phase 3) now reads and maintains `.feature/architecture/overview.md` — a
  durable, cross-feature architecture summary. Previously this file was listed in the
  Directory Structure but nothing ever created, read, or updated it: every feature's
  DISCOVER phase re-derived the whole codebase from scratch with no reuse or
  consistency across features. It's now seeded from the first DISCOVER that runs, given
  to later DISCOVER phases as known baseline context, and only updated (with
  confirmation) when a discovery surfaces something durable not already reflected in it.
- `doctor` gains a matching optional check for `architecture/overview.md` (same pattern
  as the existing `constitution.md` check: absent is fine, present-but-empty warns).

## [1.3.0] - 2026-09-24

### Added
- `/feature trace <ID>` — a read-only Requirement → Acceptance Criteria → Task → Test
  traceability report, queryable at any phase (not just the one-time snapshot
  `convergence.md` produces after CONVERGE). Resolves each acceptance criterion's linked
  tasks and tests, flags criteria with no tasks or no tests, and flags tasks with no
  linked acceptance criterion (possible scope creep). Never modifies `acceptance.yaml` or
  `tasks.yaml`.

## [1.2.0] - 2026-09-24

### Added
- `/feature list` filtering and sorting — `--status=<s>`, `--type=<t>`, `--mode=<m>`
  narrow the table (combined with AND); `--sort=id|updated|status` controls ordering
  (default `id`). Reports a clear empty state (`No features yet...`) when
  `.feature/changes/` has nothing, and distinguishes "no features exist" from "filters
  matched none" instead of printing a blank table either way. Ends with a
  `N features shown` / `N of M features shown` count.

## [1.1.0] - 2026-09-21

### Added
- `/feature doctor` — a read-only health check for a project's `.feature/` setup. It
  validates `config.yaml` (required keys, types, and `next_id` consistency), the optional
  `constitution.md`, and every `change.yaml` / `tasks.yaml` (valid lifecycle/type/mode
  values, `id` ↔ directory match, no duplicate IDs). Reports `✓`/`⚠`/`✗` with suggested
  fixes and never modifies files without confirmation.

## [1.0.0] - 2026-09-21

First installable release.

### Added
- `/feature` — the Feature Development Orchestrator skill (`skills/feature/SKILL.md`):
  a structured, persistent, specification-driven workflow that takes a requirement
  through explore → specify → discover → brainstorm → architecture → plan → analyze →
  approval → implement → test → converge → review → complete.
- Claude Code plugin packaging: `.claude-plugin/plugin.json` and
  `.claude-plugin/marketplace.json`, enabling installation via
  `/plugin marketplace add spjoshis/featurepilot` and
  `/plugin install featurepilot@param-play`.
- `scripts/validate-plugin.mjs` — zero-dependency validator for the plugin and
  marketplace manifests and the skill's frontmatter.
- CI workflow (`.github/workflows/validate.yml`) that runs the validator on push and PR.

### Notes
- The manual install path (`cp -r skills/feature /path/to/project/skills/`) remains
  fully supported for backward compatibility.

[Unreleased]: https://github.com/spjoshis/featurepilot/compare/v1.15.0...HEAD
[1.15.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.15.0
[1.14.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.14.0
[1.13.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.13.0
[1.12.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.12.0
[1.11.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.11.0
[1.10.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.10.0
[1.9.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.9.0
[1.8.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.8.0
[1.7.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.7.0
[1.6.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.6.0
[1.3.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.3.0
[1.2.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.2.0
[1.1.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.1.0
[1.0.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.0.0
