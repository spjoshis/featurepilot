---
name: "feature"
description: "Feature Development Orchestrator — takes a requirement through explore, specify, design, plan, implement, test, review to completion via /feature."
status: active
version: "1.2.0"
date: "2026-09-24"
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
| `/feature doctor` | Health check | Validate `.feature/` config, constitution, and changes (read-only) |
| `/feature resume <ID>` | Resume feature | Continue from last completed phase |
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
| `/feature archive <ID>` | Archive feature | Move feature to archived state |

## Directory Structure

All feature state lives in `.feature/` at the project root.

```
.feature/
├── constitution.md              # Project engineering principles (optional)
├── config.yaml                  # FDO configuration
├── architecture/
│   ├── overview.md              # Project architecture overview
│   └── adr/                     # Architecture Decision Records
│       └── ADR-NNN-title.md
└── changes/
    └── FDO-NNN-slug/
        ├── change.yaml          # Feature metadata and status
        ├── exploration.md       # Phase 2 output
        ├── requirements.md      # Functional/non-functional requirements
        ├── acceptance.yaml      # Acceptance criteria
        ├── codebase-context.md  # Phase 4 output
        ├── brainstorm.md        # Phase 6 output
        ├── hld.md               # High-level design
        ├── lld.md               # Low-level design
        ├── decisions.md         # Architecture decisions for this feature
        ├── plan.md              # Development plan
        ├── tasks.yaml           # Task list with dependencies and status
        ├── analysis.md          # Cross-artifact consistency analysis
        ├── implementation.md    # Implementation log
        ├── test-results.md      # Test execution results
        ├── convergence.md       # Convergence report
        └── code-review.md       # Code review findings
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

## Phase Execution

### Starting a Feature

1. Parse the command to extract requirement text and flags (`--auto`, `--architecture=developer`)
2. Read `.feature/config.yaml` — create with defaults if missing
3. Generate the next feature ID: `{id_prefix}-{next_id}` (zero-padded to 3 digits)
4. Increment `next_id` in config
5. Create the slug from the requirement (kebab-case, max 50 chars)
6. Create `.feature/changes/FDO-NNN-slug/`
7. Write `change.yaml` with initial metadata
8. Announce: `Created FDO-NNN. Starting exploration.`
9. Proceed to EXPLORE phase

### Phase 1 — EXPLORE

**Goal:** Understand the requirement before designing.

**Process:**
1. Read the requirement text
2. Analyze for ambiguities, assumptions, unknowns
3. Identify relevant domain concepts
4. Generate 3-8 targeted clarification questions
5. Present questions to the developer
6. Record answers
7. Identify relevant constraints (performance, security, compliance)

**Output:** Write `exploration.md` with:
- Original requirement
- Clarification questions and answers
- Identified assumptions
- Identified constraints
- Domain concepts
- Unknowns requiring further investigation

**Update:** Set `status: specify` in `change.yaml`

**Developer interaction:** Ask clarification questions. Wait for answers before proceeding. If the developer says "skip" or "continue", proceed with noted assumptions.

### Phase 2 — SPECIFY

**Goal:** Define WHAT the system should do, independent of HOW.

**Process:**
1. Read `exploration.md`
2. Write functional requirements as user scenarios (Given/When/Then)
3. Write non-functional requirements
4. Define business rules
5. Define constraints
6. Generate acceptance criteria

**Output:** Write `requirements.md` with:
- Functional requirements (scenarios)
- Non-functional requirements
- Business rules
- Constraints

Write `acceptance.yaml` with:
```yaml
acceptance_criteria:
  - id: AC-001
    description: "<specific, testable criterion>"
    status: pending    # pending|implemented|tested|passed|failed
    tasks: []          # linked task IDs
    tests: []          # linked test descriptions
```

**Update:** Set `status: discover`, `specification.status: draft`

**Developer interaction:** Present specification for review. Proceed on confirmation or adjust.

### Phase 3 — DISCOVER (Codebase Discovery)

**Goal:** Understand the existing codebase before designing.

**Process:**
1. Spawn an Explore agent to scan the codebase:
   - Application architecture and patterns
   - Relevant modules and services
   - Existing APIs
   - Database structures
   - Messaging/queue infrastructure
   - Authentication/authorization patterns
   - Existing test patterns and frameworks
   - Existing libraries and dependencies
   - Available skills and agents (check `.claude/` and `skills/`)
   - Configuration patterns
2. Identify components impacted by this feature
3. Flag existing patterns the feature should follow
4. Flag potential architectural conflicts

**Output:** Write `codebase-context.md` with:
- Project architecture summary
- Technology stack
- Relevant existing components
- Impacted components (MODIFIED / ADDED / POTENTIALLY AFFECTED)
- Existing patterns to follow
- Available skills and agents
- Available test commands

**Update:** Set `status: brainstorm`

### Phase 4 — BRAINSTORM

**Goal:** Generate and evaluate solution alternatives.

**Process:**
1. Read `exploration.md`, `requirements.md`, `codebase-context.md`
2. Generate 2-4 solution approaches
3. For each: list pros, cons, effort, risk
4. Provide a recommendation with rationale

**Output:** Write `brainstorm.md` with:
- Solution options with pros/cons/effort/risk
- Recommendation and rationale
- Key trade-offs

**Update:** Set `status: architecture`

**Developer interaction:** Present options. Ask which to proceed with, or accept recommendation.

### Phase 5 — ARCHITECTURE

**Goal:** Design the architecture (HLD + LLD).

**Architecture Mode Selection:**

If `--architecture=developer` was set, enter **Expert Mode**:
- Ask the developer to provide their architecture
- Validate it against existing architecture and requirements
- Identify risks and gaps
- Accept it and proceed to LLD

If developer chooses collaborative, enter **Collaborative Mode**:
- Present alternatives with trade-offs
- Ask for decisions on key points
- Record each decision in `decisions.md`
- Build architecture from decisions

Otherwise, enter **AI Mode** (default):
- Select architecture based on brainstorm recommendation
- Generate HLD and LLD
- Explain major decisions

#### HLD Generation

Write `hld.md` with:
- System context (major components)
- Component architecture (services, APIs, workers, databases, queues)
- Data flow diagrams (text-based)
- Integration points (internal and external)
- Security design (auth, authz, data protection)
- Non-functional design (performance, scalability, availability, observability)
- Architecture decisions (decision, reason, alternatives, trade-offs)

#### Architecture Validation

Before proceeding, validate against:
- Existing project architecture (from `codebase-context.md`)
- Project constitution (`.feature/constitution.md` if exists)
- Existing ADRs (`.feature/architecture/adr/`)
- Security requirements
- Performance requirements
- Technology constraints

Report validation as:
```
✓ Compatible items
⚠ Warnings requiring attention
✗ Violations requiring resolution
```

If violations exist, resolve them before proceeding.

#### LLD Generation

Write `lld.md` with:
- Classes/modules/interfaces
- API specifications (endpoints, request/response models)
- Database changes (schema, migrations)
- Events/messages
- Error handling strategy
- Retry behavior
- Validation rules
- Configuration changes
- Logging and metrics
- Security implementation details
- Testing strategy

The LLD must be detailed enough that implementation agents can build the feature without redesigning it.

#### Architecture Decision Records

For significant decisions, create ADR files in `.feature/architecture/adr/`:
```
ADR-NNN-short-title.md
```

Format:
```markdown
# ADR-NNN: Title

## Status
Accepted

## Context
Why this decision was needed.

## Decision
What was decided.

## Alternatives Considered
What else was considered and why it was rejected.

## Consequences
What follows from this decision.
```

**Update:** Set `status: plan`, `architecture.hld: draft`, `architecture.lld: draft`

**Developer interaction:** Present HLD/LLD for review. In guided mode, wait for approval before proceeding. In fast mode, continue to plan.

### Phase 6 — PLAN

**Goal:** Create a dependency-aware implementation plan.

**Process:**
1. Read `requirements.md`, `acceptance.yaml`, `hld.md`, `lld.md`, `codebase-context.md`
2. Decompose into implementation tasks
3. Define dependencies between tasks
4. Map each task to acceptance criteria
5. Identify required skills/agents for each task
6. Identify tasks safe for parallel execution

**Output:** Write `plan.md` with:
- Task summary and dependency overview
- Execution order (with parallel groups)
- Estimated scope

Write `tasks.yaml` with:
```yaml
tasks:
  - id: TASK-001
    description: "Add database schema for batch processing"
    status: pending       # pending|ready|in_progress|completed|validated|failed|blocked
    dependencies: []      # task IDs this depends on
    acceptance_criteria:  # AC IDs this implements
      - AC-001
    impacted_components:
      - database
    required_capabilities:
      - database-development
    recommended_agent: null
    testing:
      - unit
      - integration
    parallel_group: 1     # Tasks in same group can run in parallel
    attempts: 0
    max_retries: 3

  - id: TASK-002
    description: "Implement bulk upload API endpoint"
    status: pending
    dependencies: [TASK-001]
    acceptance_criteria: [AC-001, AC-002]
    impacted_components: [api]
    required_capabilities: [api-development]
    recommended_agent: null
    testing: [unit, integration]
    parallel_group: 2
    attempts: 0
    max_retries: 3
```

Write `dependency-graph.md` with a text-based dependency visualization.

**Update:** Set `status: analyze`, `plan.status: draft`

### Phase 7 — ANALYZE

**Goal:** Validate all artifacts for consistency before implementation.

**Checks:**

1. **Requirement gaps:** Every AC has at least one implementation task
2. **Architecture contradictions:** HLD and LLD are consistent
3. **Task gaps:** Every component in LLD has a development task
4. **Missing tests:** Every AC has a test strategy
5. **Requirement contradictions:** Numbers/limits/behaviors are consistent across all artifacts
6. **Architecture violations:** New components don't duplicate existing functionality
7. **Constitution violations:** Design respects project engineering principles

**Output:** Write `analysis.md` with:
```markdown
# Consistency Analysis

## Requirement Coverage
- AC-001: TASK-001, TASK-002 ✓
- AC-002: TASK-003 ✓
- AC-003: ✗ NO IMPLEMENTATION TASK

## Architecture Consistency
- HLD ↔ LLD: ✓ consistent
- Existing architecture: ✓ compatible

## Task Coverage
- All LLD components have tasks: ✓

## Test Coverage
- AC-001: unit + integration ✓
- AC-002: unit ✓, integration ✗ MISSING

## Contradictions
- None found ✓

## Constitution Compliance
- All principles respected ✓

## Status: PASSED / FAILED
## Critical Issues: [list]
## Warnings: [list]
```

If FAILED with critical issues:
- Present issues to developer
- Propose fixes (add missing tasks, resolve contradictions)
- Apply fixes
- Re-run analysis
- Do NOT proceed to approval with unresolved critical issues

**Update:** Set `status: approval`, `analysis.status: passed|failed`

### Phase 8 — APPROVAL

**Goal:** Get explicit developer approval before implementation.

**Present:**
```
Feature: FDO-NNN — <name>

Specification: ✓/✗
HLD: ✓/✗
LLD: ✓/✗
Architecture validation: ✓/✗
Analysis: ✓/✗ (N warnings)

Implementation:
  N tasks
  N components
  N database changes
  N APIs

Ready for implementation.

Options:
1. Approve — proceed to implementation
2. Modify — specify what to change
3. Regenerate — redo from a specific phase
```

**Wait for explicit approval.** Do not proceed without it.

In `--auto` mode: present this summary after running explore→analyze automatically, then wait for approval.

**Update on approve:** Set `status: implement`, `plan.status: approved`

### Phase 9 — IMPLEMENT

**Goal:** Execute implementation tasks in dependency order.

**Process:**

1. Read `tasks.yaml` to find all tasks with `status: pending`
2. Identify tasks whose dependencies are all `completed` or `validated` → mark them `ready`
3. Group ready tasks by `parallel_group`
4. For each task (or parallel group):

   a. **Resolve capability:** Check available skills (`skills/` directory) and agents. Match task `required_capabilities` against available skills. Select the best match. If no specific skill matches, use the general-purpose agent.

   b. **Prepare context:** Assemble only relevant context for the task:
      - Feature requirement (brief)
      - Relevant sections of requirements.md
      - Relevant sections of HLD/LLD
      - Relevant ADRs
      - Task definition
      - Relevant existing files (from codebase-context.md)
      - Project constitution rules (if any)

   c. **Execute:** Spawn a sub-agent with the assembled context and implementation instructions. The sub-agent should:
      - Implement the code changes described in the task
      - Follow existing project patterns
      - Follow the LLD specification
      - Write tests as specified in the task

   d. **Validate:** After the sub-agent completes:
      - Verify the expected files were created/modified
      - Run relevant tests if possible
      - Mark task `completed`

   e. **Handle failure:**
      - If the task fails, increment `attempts`
      - If `attempts < max_retries`, retry with error context
      - If `attempts >= max_retries`, mark task `blocked`, set feature status to `blocked`
      - Report the failure to the developer

5. After each task completes, update `tasks.yaml` and write progress to `implementation.md`
6. After all tasks complete, update `status: test`

**Parallel execution rules:**
- Only tasks in the same `parallel_group` with all dependencies met run in parallel
- Use `sessions_spawn` for parallel task execution
- Monitor for file conflicts between parallel tasks
- If a conflict is detected, serialize the conflicting tasks

**Update:** Set `status: test`, `implementation.status: completed`

### Phase 10 — TEST

**Goal:** Run project test suite and validate implementation.

**Process:**
1. Read `codebase-context.md` for available test commands
2. Discover test commands (look for `package.json` scripts, `Makefile`, `pytest`, `mvn test`, `go test`, etc.)
3. Run appropriate test suites:
   - Unit tests
   - Integration tests
   - Type checking (if applicable)
   - Linting (if applicable)
   - Build validation
4. Capture results

**Output:** Write `test-results.md` with:
- Commands executed
- Pass/fail results
- Failure details (if any)

If tests fail:
- Analyze failures
- Create fix tasks
- Execute fixes
- Re-run tests
- Max 3 fix cycles before marking `blocked`

**Update:** Set `status: converge`, `testing.status: passed|failed`

### Phase 11 — CONVERGE

**Goal:** Verify the implementation satisfies all acceptance criteria.

**Process:**
1. Read `acceptance.yaml`
2. For each acceptance criterion:
   - Find the implementing code (from task → files mapping)
   - Verify the implementation matches the criterion
   - Find relevant tests
   - Verify tests cover the criterion
3. Report coverage

**Output:** Write `convergence.md` with:
```markdown
# Convergence Report

## Acceptance Criteria Verification

- AC-001: ✓ Implemented in [files], tested in [tests]
- AC-002: ✓ Implemented in [files], tested in [tests]
- AC-003: ✗ NOT IMPLEMENTED — partial failure handling missing
- AC-004: ✓ Implemented in [files], tested in [tests]

## Status: PASSED / FAILED

## Missing Implementation:
- AC-003: Generate TASK-009 to implement partial failure handling
```

If FAILED:
- Generate new tasks for missing criteria
- Add tasks to `tasks.yaml`
- Execute the new tasks (return to IMPLEMENT for those tasks)
- Re-run TEST
- Re-run CONVERGE
- Max 2 convergence cycles before requesting developer help

**Update:** Set `status: code_review`, `convergence.status: passed|failed`

### Phase 12 — CODE REVIEW

**Goal:** Verify the code was built correctly and safely.

**Process:**
1. Use the project's existing code review capability if available (check for `/code-review` skill)
2. If no existing review capability, perform review covering:
   - Functional correctness (requirement compliance, business logic, edge cases)
   - Architecture compliance (HLD/LLD adherence, project architecture)
   - Code quality (maintainability, complexity, duplication, naming)
   - Security (auth, authz, input validation, data exposure)
   - Performance (queries, memory, network, concurrency)
   - Testing (coverage, missing scenarios, regression risks)
3. Categorize findings: Critical, High, Medium, Low
4. Map findings back to tasks and acceptance criteria where possible

**Output:** Write `code-review.md` with:
```markdown
# Code Review

## Summary
- Critical: N
- High: N
- Medium: N
- Low: N

## Status: PASSED / CHANGES REQUIRED

## Findings

### [CRITICAL/HIGH] Finding title
- **File:** path/to/file.ts:42
- **Issue:** Description
- **Task:** TASK-NNN
- **Fix:** Suggested fix
```

**Update:** Set `code_review.status: passed|changes_required`, increment `code_review.cycle`

### Phase 13 — FIX (Review Remediation)

**Goal:** Fix code review findings and re-validate.

**Process:**
1. Read `code-review.md` for findings
2. For Critical and High findings:
   - Create fix tasks
   - Implement fixes
3. For Medium findings:
   - Auto-fix if `auto_fix: true` in config
   - Otherwise present to developer
4. Re-run tests (Phase 10)
5. Re-run convergence (Phase 11)
6. Re-run code review (Phase 12)
7. If still CHANGES REQUIRED and `cycle < max_review_cycles`, repeat
8. If `cycle >= max_review_cycles`, present remaining findings to developer

**Update on pass:** Set `status: complete`

### COMPLETE

**Goal:** Mark the feature as done.

**Process:**
1. Verify all completion criteria:
   - ✓ Requirement finalized
   - ✓ Specification completed
   - ✓ Acceptance criteria defined
   - ✓ Codebase discovery completed
   - ✓ Architecture approved
   - ✓ HLD completed
   - ✓ LLD completed
   - ✓ Development plan approved
   - ✓ Analysis passed
   - ✓ Implementation completed
   - ✓ Tests passed
   - ✓ Convergence passed
   - ✓ Code review passed
   - ✓ Critical/high findings resolved
2. Present completion summary
3. Update `status: complete`
4. Ask if the developer wants to commit/push

### ARCHIVE

Archive moves a completed feature's directory to `.feature/archive/`.

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
5. Ask: "Continue from <current phase>?"
6. On confirmation, execute the current phase

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

## Status

When `/feature status <ID>` is invoked:

1. Read `change.yaml`
2. If status is `implement`, read `tasks.yaml` for task progress
3. Present detailed status with all phase statuses

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
     next feature would collide with an existing one — flag as an error.

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
4. The feature remains resumable from the failed phase

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