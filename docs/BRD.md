# Business Requirements Document (BRD)

## Feature Development Orchestrator for Claude Code

**Working name:** Feature Development Orchestrator (FDO) / FeaturePilot
**Version:** 1.0
**Status:** Baseline
**Product type:** Claude Code plugin
**Primary objective:** Feature-driven, specification-driven software development

> This document is a condensed, repository-grounded reference. The authoritative
> behavioral specification is the skill definition in
> [`../skills/feature/SKILL.md`](../skills/feature/SKILL.md); where the two differ, the
> skill wins.

## 1. Problem statement

Turning a high-level feature requirement into production-ready code inside an AI coding
assistant is ad hoc: requirements are implicit, architecture is skipped, verification is
inconsistent, and work does not survive session restarts. There is no durable record
linking *what* was asked to *how* it was built and *whether* it was actually delivered.

## 2. Objective

Provide a structured, persistent, specification-driven workflow that takes a developer's
intent from requirement to completed, reviewed implementation — while keeping the developer
in control at explicit approval gates.

## 3. Users

- **Primary:** software developers using Claude Code who want repeatable, reviewable
  feature delivery rather than one-shot prompting.
- **Secondary:** teams that want a shared engineering process (constitution, approval
  gates, traceability) enforced consistently across features.

## 4. Scope

**In scope**

- A `/feature` command that orchestrates the full lifecycle: explore → specify → discover →
  brainstorm → architecture (HLD/LLD) → plan → analyze → approval → implement → test →
  converge → code review → fix → complete → archive.
- Persistent state under a project's `.feature/` directory so work is resumable.
- Per-phase subcommands (`/feature <phase> <ID>`), status/list/resume/approve/archive.
- Three execution modes: guided (default), fast (`--auto`), and expert
  (`--architecture=developer`).
- Configurable guardrails via `.feature/config.yaml` (approval gates, review cycles, retries)
  and optional engineering principles via `.feature/constitution.md`.

**Out of scope**

- Executing production deployments, or performing git push/merge without explicit approval.
- Replacing a project's existing test framework, CI, or code-review tooling — FeaturePilot
  uses what the project already has.

## 5. Key requirements

- **Specification-driven:** separate WHAT (requirements, acceptance criteria) from HOW
  (architecture, plan, code).
- **Traceability:** maintain Requirement → Acceptance Criteria → Task → Code → Test links.
- **Mandatory verification:** a convergence phase checks the implementation against every
  acceptance criterion before completion.
- **Review loop:** an automated test → converge → code-review → fix cycle with a bounded
  number of iterations.
- **Approval gates:** the developer approves the plan before implementation, and any
  externally visible or destructive git operation.
- **Persistence & resumability:** every phase writes artifacts so a feature can resume after
  a session restart.

## 6. Success criteria

- A feature requirement can be taken from intake to a reviewed implementation without losing
  state across sessions.
- Every acceptance criterion is traceable to implementing tasks and validating tests.
- No externally visible git action occurs without explicit developer approval.

## 7. Assumptions & constraints

- Runs inside Claude Code with permission to read/write the project workspace.
- The consuming project supplies its own tech stack, tests, and conventions; FeaturePilot
  adapts to them during the discovery phase.
- Configuration and engineering principles are project-local (`.feature/`).

## 8. References

- Skill definition: [`../skills/feature/SKILL.md`](../skills/feature/SKILL.md)
- Configuration example: [`../examples/config.yaml`](../examples/config.yaml)
- Constitution example: [`../examples/constitution.md`](../examples/constitution.md)
