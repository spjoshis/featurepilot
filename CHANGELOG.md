# Changelog

All notable changes to FeaturePilot are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.0] - 2026-09-24

### Added
- `/feature unblock <ID>` — diagnoses why a feature was marked `blocked` (reads the
  blocked task's attempts/max_retries from `tasks.yaml` and the last recorded failure
  from `implementation.md`/`test-results.md`) and, only on explicit confirmation, resets
  the blocked task's attempt budget and returns the feature to its prior phase. Until
  now `blocked` had no documented recovery path at all — `/feature resume` would try to
  "execute the current phase" with no phase actually defined for that status.
- `/feature resume` now explicitly detects `status: blocked` and points to
  `/feature unblock` instead of attempting an undefined phase.

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

[Unreleased]: https://github.com/spjoshis/featurepilot/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.4.0
[1.3.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.3.0
[1.2.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.2.0
[1.1.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.1.0
[1.0.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.0.0
