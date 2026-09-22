# Changelog

All notable changes to FeaturePilot are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/spjoshis/featurepilot/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.1.0
[1.0.0]: https://github.com/spjoshis/featurepilot/releases/tag/v1.0.0
