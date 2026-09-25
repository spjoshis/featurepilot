# Changelog

All notable changes to FeaturePilot are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/spjoshis/featurepilot/compare/v1.6.0...HEAD
[1.6.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.6.0
[1.3.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.3.0
[1.2.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.2.0
[1.1.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.1.0
[1.0.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.0.0
