# FeaturePilot

**Feature Development Orchestrator for Claude Code**

FeaturePilot is a Claude Code plugin that transforms a high-level feature requirement into production-ready code through a structured, persistent, specification-driven development workflow.

## What It Does

Give it a feature requirement:

```
/feature "Add bulk document processing for up to 500 documents"
```

It orchestrates the complete lifecycle:

```
Requirement → Explore → Specify → Discover → Brainstorm →
Architecture (HLD/LLD) → Plan → Analyze → [Approval] →
Implement → Test → Converge → Code Review → Fix → Complete
```

You focus on **what** to build. FeaturePilot manages **how** it gets built.

## Installation

Copy the `skills/feature/` directory into your Claude Code project's `skills/` folder:

```bash
cp -r skills/feature /path/to/your/project/skills/
```

## Commands

| Command | Description |
|---|---|
| `/feature` | Start a new feature interactively |
| `/feature "requirement"` | Start with a requirement |
| `/feature "req" --auto` | Fast mode — auto-run to approval gate |
| `/feature "req" --architecture=developer` | Expert mode — you provide the architecture |
| `/feature list` | List all features |
| `/feature status <ID>` | Show feature status |
| `/feature resume <ID>` | Resume an interrupted feature |
| `/feature approve <ID>` | Approve plan for implementation |
| `/feature archive <ID>` | Archive a completed feature |

Run any phase directly with `/feature <phase> <ID>` (for example, `/feature explore FDO-001`). Available phases: `explore`, `specify`, `brainstorm`, `design`, `plan`, `analyze`, `implement`, `test`, `converge`, and `review`.

## Execution Modes

- **Guided** (default) — Interactive, asks for decisions at each phase
- **Fast** (`--auto`) — Runs explore through analyze automatically, asks for one approval
- **Expert** (`--architecture=developer`) — You provide the architecture, Claude handles everything else

## How It Works

### Governance Plane
Manages requirements, specifications, acceptance criteria, architecture (HLD/LLD), decisions, planning, traceability, and approval gates.

### Execution Plane
Coordinates skills, agents, implementation, testing, convergence verification, and code review.

### Persistence
All state is stored in `.feature/` at your project root. Features survive session restarts and can be resumed at any point.

```
.feature/
├── config.yaml
├── constitution.md          # Optional engineering principles
├── architecture/
│   └── adr/                 # Architecture Decision Records
└── changes/
    └── FDO-001-slug/
        ├── change.yaml      # Status and metadata
        ├── exploration.md
        ├── requirements.md
        ├── acceptance.yaml
        ├── hld.md / lld.md
        ├── tasks.yaml
        ├── convergence.md
        └── code-review.md
```

## Key Features

- **Specification-driven** — separates WHAT from HOW
- **Mandatory verification** — convergence checks implementation against acceptance criteria
- **Code review loop** — automated fix/test/review cycles
- **Traceability** — Requirement → AC → Task → Code → Test
- **Skill/agent orchestration** — discovers and uses existing project capabilities
- **Configurable guardrails** — approval gates, retry limits, review cycles
- **Git safety** — no silent commits or pushes

## Configuration

On first run, FeaturePilot creates `.feature/config.yaml` with sensible defaults. See `examples/config.yaml` for all options.

## License

MIT
