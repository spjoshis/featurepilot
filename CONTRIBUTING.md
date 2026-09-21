# Contributing to FeaturePilot

Thanks for your interest in improving FeaturePilot. This project is a **Claude Code
plugin** — its product is the `/feature` skill defined in
[`skills/feature/SKILL.md`](skills/feature/SKILL.md), plus supporting docs and examples.
There is no application server or build step; contributions are mostly changes to the
skill instructions, the manifests, the docs, and the examples.

## Ways to contribute

- **Report a bug** — open an issue with the *Bug report* template. Include what you asked
  `/feature` to do, what happened, and what you expected.
- **Request a feature** — open an issue with the *Feature request* template. Describe the
  user problem, not just a solution.
- **Improve the skill or docs** — send a pull request (see below).

## Development setup

You only need [Claude Code](https://code.claude.com) and Node.js 20+ (for the validator).

```bash
git clone https://github.com/spjoshis/featurepilot.git
cd featurepilot
```

Install the plugin locally to try changes end to end:

```
/plugin marketplace add ./
/plugin install featurepilot@param-play
```

Iterate on `skills/feature/SKILL.md`, then re-run `/feature` in a scratch project to
exercise the workflow.

## Guidelines

- **Keep the skill focused.** `SKILL.md` is an instruction document; favor clarity and
  determinism over cleverness. Preserve the phase lifecycle and traceability contract.
- **Don't break the command surface.** The public commands are `/feature` and its
  subcommands (`/feature <phase> <ID>`). Changing or removing one is a breaking change and
  must be called out explicitly.
- **Match existing conventions** in headings, YAML shapes (`change.yaml`, `tasks.yaml`,
  `acceptance.yaml`), and file layout under `.feature/`.
- **Update the docs** (`README.md`, `examples/`) when behavior or configuration changes.
- **Backward compatibility** matters — existing `.feature/` projects should keep working.

## Before you open a pull request

Validate the plugin packaging (both commands are no-ops of risk and take seconds):

```bash
# Authoritative check via the Claude Code CLI:
claude plugin validate . --strict

# Repository validator (if present):
node scripts/validate-plugin.mjs
```

Then open a PR using the pull request template. Keep changes focused, describe the user
impact, and note any breaking changes or migration steps.

## Reporting security issues

Please do not file public issues for security problems. Instead, contact the maintainers
privately (see the repository owner profile) with details and reproduction steps.

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE).
