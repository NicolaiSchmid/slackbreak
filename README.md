# Slackbreak

Slackbreak is an open source Slack archive built around one idea: your company
messages should not be trapped inside Slack.

The project captures raw Slack event payloads, mirrors file binaries into your
own storage, and gives you a workspace-scoped archive you can browse, export,
and eventually query through MCP.

## Status

Slackbreak is in the initial architecture stage.

What exists today:

- a Next.js codebase scaffold
- an architecture plan for the first implementation
- repository-level agent instructions

What is planned next:

- Convex integration
- Slack sign-in for the product UI
- multi-tenant workspace setup
- raw Slack event ingestion
- file mirroring into Convex blob storage
- archive browsing and export

This repository does not yet contain the ingestion pipeline or archive UI.

## Why Slackbreak

Slack is a useful interface, but it is a poor long-term boundary for data you
care about.

Slackbreak is being built to solve that in a pragmatic way:

- keep the raw event stream
- keep the file binaries
- keep the archive under your control
- avoid premature normalization
- make exit and export straightforward

The goal is not to rebuild Slack. The goal is to preserve your data outside it.

## Product Direction

Slackbreak is intended to support two deployment models:

- hosted: Slackbreak runs the application and tenants connect their workspace
- self-hosted: a company runs Slackbreak for its own workspace and can supply
  its own Slack app

The architecture is multi-tenant from the start, even though the current
implementation is still at day-zero.

## Design Principles

### Raw First

Slackbreak stores inbound Slack payloads as received. It should not invent a
canonical message model before there is a real need for one.

### Append-Only Archive

The raw event receipt is the source of truth. If a search index or retrieval
aid exists later, it should be disposable and rebuildable.

### Separate Control Plane And Ingest Path

Next.js should handle sign-in, setup, archive browsing, and exports. Convex
should handle ingestion, persistence, scheduling, and file storage.

### Tenant Boundaries Matter Early

Every workspace, event, file blob, and export must be scoped to a tenant from
the beginning. Multi-tenancy should not be bolted on later.

## Planned Architecture

The current architecture plan is documented in
[`.plans/2026-03-14-initial-architecture.md`](.plans/2026-03-14-initial-architecture.md).

The intended request flow is:

1. Slack sends events to a Convex `httpAction`.
2. Convex verifies the Slack signature.
3. Convex stores the raw request envelope.
4. Convex acknowledges Slack quickly.
5. Convex mirrors referenced file binaries into blob storage.
6. Next.js reads archived data for UI and export workflows.

Initial durable concepts:

- tenants
- users and memberships
- workspaces
- Slack installations
- raw event receipts
- mirrored file blobs

## Planned Stack

- Next.js for the app shell and operator-facing UI
- Convex for backend functions, database, scheduling, and blob storage
- Slack OAuth and Events API for workspace connection and event delivery
- Slack app manifests for tenant-managed app setup

The repository currently starts from a T3-style Next.js scaffold and will be
trimmed toward the architecture above as implementation begins.

## What Slackbreak Will Not Try To Be

At least in the first versions, Slackbreak is not trying to be:

- a Slack clone
- a compliance-certified archive
- a heavy post-processing pipeline
- a normalized chat database
- a polished end-user collaboration product

That restraint is intentional. The first job is to capture and preserve data
reliably.

## Roadmap

### Phase 0

- add Convex
- add product authentication
- define the tenant and workspace schema

### Phase 1

- implement the Slack webhook endpoint
- verify request signatures
- persist raw event receipts

### Phase 2

- detect Slack file references
- mirror binaries into Convex blob storage
- track file download state

### Phase 3

- build archive browsing pages
- support raw payload inspection
- add basic filtering by workspace, event type, and time range

### Phase 4

- add export flows for event receipts and mirrored files

### Phase 5

- publish a customer-managed Slack app manifest flow
- support self-serve workspace onboarding

### Phase 6

- add search
- add MCP support for explicitly allowed archive scopes

## Local Development

The implementation is still early, but the current project can be started as a
standard Node.js app.

Requirements:

- Node.js 20+
- pnpm 10+

Install dependencies:

```bash
pnpm install
```

Run the app:

```bash
pnpm dev
```

Other useful commands:

```bash
pnpm typecheck
pnpm check
```

## Repository Conventions

- Commit messages use Conventional Commits.
- Architecture notes live in [`.plans/`](.plans/).
- The project should favor raw archival correctness over convenience features.

## Contributing

Contributions are welcome, but the project should stay aligned with the core
constraint: capture Slack data with minimal interpretation and make it portable.

Useful contributions will likely be:

- Slack ingestion implementation
- Convex schema and backend functions
- auth and tenant management
- archive browsing and export UX
- documentation and operational guides

If you are proposing a feature that adds normalization, enrichment, or deep
message modeling, the bar should be high and the source-of-truth model should
remain the raw archive.

## License

No license has been added yet.
