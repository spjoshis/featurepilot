# FeaturePilot — Phase Execution Playbook

> On-demand reference for the `feature` skill (see `../SKILL.md`). Read this before executing any lifecycle phase. Shared data contracts (`config.yaml`, `change.yaml`, lifecycle states, `.feature/` layout) and the always-on rules (Git Safety, Constitution, Traceability, Task Status Lifecycle) live in `SKILL.md`; the management/query commands are in `commands.md`.

## Phase Execution

### Starting a Feature

1. Parse the command to extract requirement text and flags (`--auto`, `--architecture=developer`)
2. Read `.feature/config.yaml` — create with defaults if missing
3. Determine the next feature ID safely. `config.yaml`'s `next_id` can drift behind
   reality — concurrent `/feature` runs on the same project, a manually edited or
   restored `config.yaml`, or a feature directory created outside this flow can all
   leave it stale, and a stale counter means the new feature collides with (and can
   overwrite) an existing one:
   a. Scan `.feature/changes/` and `.feature/archive/` for existing `{id_prefix}-NNN`
      directories and find the highest existing `NNN`.
   b. Compute the candidate as `max(config.next_id, highest existing NNN + 1)`. If this
      is greater than the `next_id` currently in `config.yaml`, correct `config.yaml` to
      match — this is the same drift `doctor` check 2 detects after the fact; fixing it
      here prevents the collision instead of only reporting it later.
   c. Generate the ID: `{id_prefix}-{next_id}` (zero-padded to 3 digits).
   d. Final safety net: if `.feature/changes/{id}-*` or `.feature/archive/{id}-*` already
      exists for the computed ID (shouldn't happen after (b), but directories can be
      created outside this flow), increment and recheck until the ID is free.
4. Increment `next_id` in config past the ID just allocated
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
0. Read `.feature/architecture/overview.md` if it exists. This is durable,
   project-level architecture memory shared across every feature — unlike
   `codebase-context.md`, which is written fresh per feature. If it exists, give it to
   the Explore agent as known baseline context so discovery focuses on what's new or
   relevant to *this* feature instead of re-deriving fundamentals (tech stack, overall
   architecture) that are already documented and haven't changed.
   Also read `.feature/knowledge/*.md` if present — the patterns, pitfalls, testing rules,
   and decisions that prior completed features distilled via `/feature learn`. Give these to
   the Explore agent too, so discovery (and the design that follows) starts from hard-won
   lessons instead of rediscovering them.
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

**Maintain `.feature/architecture/overview.md`:**
- If it doesn't exist yet, create it from this discovery's durable, project-level
  findings only (architecture summary, tech stack, cross-cutting patterns) — not the
  feature-specific "impacted components" section, which belongs solely in
  `codebase-context.md`.
- If it already exists and this discovery surfaced something durable that isn't
  reflected in it (a new major component, a pattern change), propose the specific
  addition and **ask before writing** — this file is meant to stay a stable, curated
  summary, not be silently rewritten by every feature's discovery churn.
- If it exists and nothing new was found, leave it untouched.

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

Before approving, the developer can run `/feature simulate <ID>` to preview what
implementation will produce — expected files, tests, execution shape, and risks — without
changing anything (read-only). This makes the approval an informed one.

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
- Increment `convergence.cycle`
- Generate new tasks for missing criteria
- Add tasks to `tasks.yaml`
- Execute the new tasks (return to IMPLEMENT for those tasks)
- Re-run TEST
- Re-run CONVERGE
- If `convergence.cycle >= 2`: do not keep looping. Set `status: blocked` and
  `convergence.status: failed`, leaving the unresolved criteria recorded in
  `convergence.md`'s "Missing Implementation" section (this is the diagnosis
  `/feature unblock` reads). Report to the developer that convergence is blocked and
  point them to `/feature unblock <ID>` rather than silently retrying forever.

**Update on pass:** Set `status: code_review`, `convergence.status: passed`

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
7. If still CHANGES REQUIRED and `code_review.cycle < max_review_cycles`, repeat
8. If `code_review.cycle >= max_review_cycles`: do not keep looping. Set `status: blocked`
   and leave `code_review.status: changes_required`, with the remaining findings still in
   `code-review.md` (this is the diagnosis `/feature unblock` reads). Report to the
   developer that review remediation is blocked and point them to
   `/feature unblock <ID>`.

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

**Goal:** Move a finished feature out of the active list without losing its history.

**Process:**
1. Read `change.yaml` for the feature. If the ID doesn't exist, report that and stop.
2. If `status` is `complete` (the expected case): confirm normally — "Archive FDO-NNN —
   <name>? This moves its directory to `.feature/archive/`." — then proceed on
   confirmation.
3. If `status` is anything else (still in progress, or `blocked`): this is a guardrail
   case, not the normal path. Warn explicitly:
   ```
   FDO-NNN is not complete (status: <status>). Archiving now removes it from
   /feature list and .feature/ doctor checks while it's still in-progress work —
   it will not show up as something to resume.
   ```
   Ask for explicit confirmation before proceeding; do not archive automatically just
   because the developer typed the command. If the developer wants to abandon
   in-progress work, archiving is fine — this step exists only to prevent an
   *accidental* archive of something still being worked on.
4. On confirmation, move `.feature/changes/FDO-NNN-slug/` to
   `.feature/archive/FDO-NNN-slug/` and set `status: archive`.
5. Report the new location.

Archived features are intentionally excluded from `/feature list` (which only scans
`.feature/changes/`) and from `doctor`'s change validation — they are historical record,
not active work.

