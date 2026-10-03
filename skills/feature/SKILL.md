---
name: "feature"
description: "Feature Development Orchestrator — takes a requirement through explore, specify, design, plan, implement, test, review to completion via /feature."
status: active
version: "1.15.0"
date: "2026-10-03"
slug: feature
metadata:
  clawdbot:
    emoji: "🏗️"
    displayName: Feature
---

## Purpose

The Feature Development Orchestrator (FDO) transforms a high-level feature requirement into production-ready code through a structured, persistent, specification-driven workflow.

The primary abstraction is a **Development Change** — not a prompt or coding task.

The developer defines intent. The orchestrator manages the engineering workflow. Specialized agents perform the work. Verification proves the feature was delivered.

## When To Use

- Developer says "build this feature" or provides a feature requirement
- `/feature` command is invoked
- A multi-step development task needs structured orchestration
- Work needs to survive session restarts and be resumable

## Commands

Parse the user's input to determine the command:

| Command | Usage | Action |
|---|---|---|
| `/feature` | Start interactively | Prompt for requirement, create feature |
| `/feature "<requirement>"` | Start with requirement | Create feature and begin explore phase |
| `/feature "<req>" --auto` | Fast mode | Run explore→specify→design→plan→analyze, then ask for one approval |
| `/feature "<req>" --architecture=developer` | Expert mode | Developer provides architecture; Claude handles spec/LLD/plan/impl |
| `/feature list [--status=<s>] [--type=<t>] [--mode=<m>] [--sort=<f>]` | List features | Show features with status, filterable and sortable |
| `/feature status <ID>` | Show status | Detailed status of a feature |
| `/feature trace <ID>` | Traceability report | Show Requirement → Acceptance Criteria → Task → Test coverage (read-only) |
| `/feature impact <ID>` | Impact analysis | Show a change's blast radius: direct/indirect impact + other features affected (read-only) |
| `/feature evolve` | Portfolio graph | Show the cross-feature dependency/conflict/duplication graph over all active features (read-only) |
| `/feature simulate <ID>` | Dry-run projection | Project what implementation will produce — files, tests, execution shape, risks — without changing anything (read-only) |
| `/feature doctor` | Health check | Validate `.feature/` config, constitution, and changes (read-only) |
| `/feature resume <ID>` | Resume feature | Continue from last completed phase |
| `/feature unblock <ID>` | Diagnose/clear blocked | Show why a `blocked` feature/task stopped; retry only on confirmation |
| `/feature explore <ID>` | Run explore | Execute explore phase |
| `/feature specify <ID>` | Run specify | Execute specification phase |
| `/feature brainstorm <ID>` | Run brainstorm | Execute brainstorm phase |
| `/feature design <ID>` | Run design | Execute architecture/HLD/LLD phase |
| `/feature plan <ID>` | Run plan | Execute planning phase |
| `/feature analyze <ID>` | Run analyze | Execute consistency analysis |
| `/feature approve <ID>` | Approve plan | Mark plan as approved, enable implementation |
| `/feature implement <ID>` | Run implement | Execute implementation phase |
| `/feature test <ID>` | Run test | Execute testing phase |
| `/feature converge <ID>` | Run converge | Execute convergence check |
| `/feature review <ID>` | Run review | Execute code review |
| `/feature archive <ID>` | Archive feature | Move feature to `.feature/archive/`; warns first if not yet `complete` |
| `/feature learn <ID>` | Capture lessons | Distill a completed feature's durable lessons into `.feature/knowledge/` (append-only, asks first) |

## How This Skill Is Organized

`SKILL.md` (this file) is the lean control layer: command routing, the shared data
contracts (`.feature/` layout, `config.yaml`, `change.yaml`, lifecycle states) and the
cross-cutting rules that always apply (Git Safety, Constitution, Traceability, Task Status
Lifecycle). The detailed, step-by-step behavior lives in two reference files in this skill's
`reference/` directory — **read the relevant one before acting**:

- **`reference/lifecycle.md` — Phase Execution Playbook.** The full workflow from intake to
  archive: Starting a Feature, then EXPLORE → SPECIFY → DISCOVER → BRAINSTORM → ARCHITECTURE
  (HLD/LLD) → PLAN → ANALYZE → APPROVAL → IMPLEMENT → TEST → CONVERGE → CODE REVIEW → FIX →
  COMPLETE → ARCHIVE — each phase's goal, process, outputs, and `change.yaml` transitions,
  plus Execution Modes, Error Recovery, and Sub-Agent Spawning. Read it before running
  `/feature` or any `/feature <phase> <ID>` subcommand.
- **`reference/commands.md` — Command Reference.** The detailed specs for the management and
  query commands: `resume`, `unblock`, `list`, `status`, `trace`, `impact`, `evolve`,
  `simulate`, `doctor`, `learn`. Read the relevant entry before running one.

The one-line descriptions in the command table above are routing hints; when you execute a
phase or command, load the matching reference file and follow it exactly.

## Directory Structure

All feature state lives in `.feature/` at the project root.

```
.feature/
├── constitution.md              # Project engineering principles (optional)
├── config.yaml                  # FDO configuration
├── architecture/
│   ├── overview.md              # Cross-feature architecture memory (see Phase 3 — DISCOVER)
│   └── adr/                     # Architecture Decision Records
│       └── ADR-NNN-title.md
├── knowledge/                   # Project engineering memory, distilled by /feature learn
│   ├── patterns.md              # Reusable patterns the codebase follows
│   ├── pitfalls.md              # Traps/gotchas discovered the hard way
│   ├── testing.md               # Testing rules that proved necessary
│   ├── architecture.md          # Durable architecture lessons
│   └── decisions.md             # Notable decisions and rationale (pointers to ADRs)
├── changes/
│   └── FDO-NNN-slug/
│       ├── change.yaml          # Feature metadata and status
│       ├── exploration.md       # Phase 2 output
│       ├── requirements.md      # Functional/non-functional requirements
│       ├── acceptance.yaml      # Acceptance criteria
│       ├── codebase-context.md  # Phase 4 output
│       ├── brainstorm.md        # Phase 6 output
│       ├── hld.md               # High-level design
│       ├── lld.md               # Low-level design
│       ├── decisions.md         # Architecture decisions for this feature
│       ├── plan.md              # Development plan
│       ├── tasks.yaml           # Task list with dependencies and status
│       ├── analysis.md          # Cross-artifact consistency analysis
│       ├── implementation.md    # Implementation log
│       ├── test-results.md      # Test execution results
│       ├── convergence.md       # Convergence report
│       └── code-review.md       # Code review findings
└── archive/
    └── FDO-NNN-slug/            # Same layout as changes/, moved here by /feature archive
```

## Configuration — `.feature/config.yaml`

```yaml
# Default configuration — created on first /feature if missing
id_prefix: FDO
next_id: 1

approval:
  architecture: true       # Require approval before implementation
  implementation: true      # Require approval of the plan
  production_changes: true
  git_push: true
  merge: true

code_review:
  required: true
  auto_fix: true            # Automatically fix review findings
  max_review_cycles: 3      # Max fix→test→review loops

execution:
  parallel: true            # Allow parallel task execution
  max_retries: 3            # Max retries per failed task

git:
  auto_commit: false        # Require explicit approval for commits
  auto_push: false          # Require explicit approval for pushes
```

## Feature Metadata — `change.yaml`

```yaml
id: FDO-001
name: bulk-document-processing
type: feature                    # feature|bugfix|enhancement|refactoring|performance|security|architecture|tech-debt
status: new                      # Lifecycle state
mode: guided                     # guided|fast|expert

requirement:
  text: "Add bulk document processing for up to 500 documents"
  status: draft                  # draft|clarified|approved

specification:
  status: pending                # pending|draft|approved

architecture:
  mode: claude                   # developer|collaborative|claude
  hld: pending                   # pending|draft|approved
  lld: pending

analysis:
  status: pending                # pending|passed|failed

plan:
  status: pending                # pending|draft|approved

implementation:
  status: pending                # pending|in_progress|completed

testing:
  status: pending

convergence:
  status: pending                # pending|passed|failed
  cycle: 0

code_review:
  status: pending                # pending|passed|changes_required
  cycle: 0

created_at: ""
updated_at: ""
```

## Lifecycle States

```
NEW → EXPLORE → SPECIFY → DISCOVER → BRAINSTORM → ARCHITECTURE →
HLD → LLD → PLAN → ANALYZE → APPROVAL → IMPLEMENT → TEST →
CONVERGE → CODE_REVIEW → FIX → COMPLETE → ARCHIVE
```

Valid status values for `change.yaml` status field:
`new`, `explore`, `specify`, `discover`, `brainstorm`, `architecture`, `hld`, `lld`, `plan`, `analyze`, `approval`, `implement`, `test`, `converge`, `code_review`, `fix`, `complete`, `archive`, `blocked`

## Execution Modes

### Guided Mode (default)
- Walk through each phase interactively
- Ask for decisions and confirmation at each step
- Present artifacts for review before proceeding

### Fast Mode (`--auto`)
- Run explore → specify → discover → brainstorm → design → plan → analyze automatically
- Present combined summary
- Wait for one approval before implementation
- Implementation through completion runs automatically (with review gates)

### Expert Mode (`--architecture=developer`)
- Ask developer to provide architecture (paste or point to files)
- Claude handles: specification, LLD, planning, implementation, testing, review
- Developer controls: HLD, architecture decisions

## Git Safety

**Allowed automatically:**
- `git status`, `git diff`, `git log`, `git branch`

**Require developer approval:**
- `git commit`, `git push`, `git merge`, `git rebase`

Never perform externally visible or destructive git operations without explicit approval.

## Error Recovery

If a phase fails:
1. Persist all progress so far
2. Update `change.yaml` with the failure state
3. Report the failure clearly
4. The feature remains resumable from the failed phase — unless the failure exhausted
   retries and the feature is now `blocked`, in which case use `/feature unblock <ID>`
   to diagnose and, on confirmation, retry (see "Unblock" above).

## Sub-Agent Spawning

When spawning sub-agents for implementation tasks, provide:

```
[Subagent Task]
Feature: FDO-NNN — <name>
Task: TASK-NNN — <description>

## Context
<relevant requirement sections>
<relevant HLD/LLD sections>
<relevant ADRs>
<existing patterns to follow>

## Instructions
<specific implementation instructions from LLD>

## Files to modify/create
<list from LLD>

## Testing
<test requirements for this task>

## Constraints
<project constitution rules if any>
<existing patterns to follow>
```

Use `sessions_spawn` with `mode: "run"` for implementation tasks. Use `context: "isolated"` (not fork) to keep context focused.

## Constitution

If `.feature/constitution.md` exists, it contains project engineering principles that ALL designs and implementations must respect. Check it during architecture validation and analysis.

Example constitution:
```markdown
# Engineering Principles
1. Reuse existing libraries where possible.
2. All APIs require integration tests.
3. Database changes must be backward compatible.
4. External calls require timeout handling.
```

## Traceability

Maintain explicit links throughout:
```
Requirement → Acceptance Criteria → Tasks → Code → Tests
```

The system should be able to answer:
- Which requirement does this code implement?
- Which tasks implement this acceptance criterion?
- Which tests validate this requirement?
- Which requirements are not yet implemented?
- Which requirements lack tests?

## Task Status Lifecycle

```
PENDING → READY → IN_PROGRESS → COMPLETED → VALIDATED
                        ↓
                      FAILED → RETRY → IN_PROGRESS
                        ↓
                      BLOCKED (after max retries)
```

A task becomes `ready` when all its dependencies are `completed` or `validated`.