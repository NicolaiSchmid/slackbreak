# Slackbreak Initial Architecture

Date: 2026-03-14

## Purpose

Slackbreak should capture Slack data outside Slack with as little interpretation as
possible. The first version is a hosted product operated by one person for one
workspace, but the architecture should support multi-tenancy from the start so
that additional workspaces can be onboarded later without a rewrite.

The product goal is not to recreate Slack. The goal is to preserve raw Slack
events, file binaries, and enough account metadata to let an operator browse,
search, and export their own archive without depending on Slack as the long-term
system of record.

## Product Positioning

Slackbreak is a raw archive and retrieval system for Slack workspaces.

What it should do:

- Receive Slack events and store the payloads exactly as Slack sent them.
- Mirror referenced file binaries into Convex blob storage.
- Let a workspace admin connect Slack to Slackbreak from a hosted Next.js app.
- Provide workspace-scoped browse, search, and export capabilities over the raw
  archive.
- Support public-channel search through an MCP endpoint in a later phase.

What it should not do in the first version:

- Normalize messages into a canonical schema.
- Rebuild Slack threads, reactions, or channel state as derived tables.
- Attempt compliance-grade eDiscovery workflows.
- Depend on background enrichment pipelines.

## Operating Assumptions

- Slackbreak is hosted by the project owner.
- The initial user is also the operator.
- Each customer workspace can bring its own Slack app configuration, either via
  an app manifest or a Slackbreak-managed app.
- Multi-tenancy is required at the data model and auth boundaries even if only a
  single tenant exists on day one.
- Convex is the primary backend for database, functions, scheduling, and file
  storage.
- Next.js is the product surface for sign-in, workspace setup, status pages,
  archive browsing, and export.

## Core Architectural Decision

Use Convex as the ingestion and storage backend, with Next.js acting as the
control plane UI.

Why this shape is correct:

- Slack event ingestion benefits from a single durable backend boundary.
- The archive model is append-only, which maps cleanly to Convex tables.
- File mirroring can use Convex blob storage directly, keeping metadata and
  binary references in one backend.
- Next.js can focus on auth, setup, and retrieval instead of sitting on the hot
  ingest path.

The ingest path should be:

1. Slack sends an HTTP request to a Convex `httpAction`.
2. Convex verifies the Slack signature.
3. Convex persists the raw request envelope.
4. Convex returns success to Slack quickly.
5. If files are referenced, Convex fetches the binaries from Slack and stores
   them in blob storage.
6. Next.js reads from Convex for all operator-facing workflows.

Next.js should not proxy Slack events in the first version. That would add an
unnecessary moving part to the one path where reliability matters most.

## Data Model

The data model should stay intentionally small and raw-first.

### `tenants`

Represents a Slackbreak customer account.

Suggested fields:

- `slug`
- `name`
- `createdAt`
- `createdByUserId`
- `plan`
- `status`

Notes:

- Even for one customer, this table establishes the tenancy boundary for all
  future records.
- A tenant may own multiple Slack workspaces later.

### `users`

Represents Slackbreak product users, not Slack users.

Suggested fields:

- `email`
- `name`
- `avatarUrl`
- `createdAt`
- `lastLoginAt`

### `memberships`

Maps product users to tenants with roles.

Suggested fields:

- `tenantId`
- `userId`
- `role`
- `createdAt`

Roles should start simple:

- `owner`
- `admin`
- `viewer`

### `workspaces`

Represents a Slack workspace connected to a tenant.

Suggested fields:

- `tenantId`
- `slackTeamId`
- `slackTeamName`
- `status`
- `createdAt`
- `connectedAt`
- `lastEventAt`
- `lastBackfillAt`

This table is the principal partition key for archive data.

### `slackInstallations`

Stores the Slack app installation and token material needed to access the
workspace.

Suggested fields:

- `workspaceId`
- `installationMode`
- `appId`
- `botUserId`
- `botAccessTokenEncrypted`
- `userAccessTokenEncrypted`
- `scopeSet`
- `installedBySlackUserId`
- `installedAt`
- `manifestSource`

Notes:

- Token storage must be encrypted at rest.
- Installation mode should distinguish between a Slackbreak-managed app and a
  customer-managed app.

### `slackEventReceipts`

Append-only store for inbound Slack request envelopes.

Suggested fields:

- `workspaceId`
- `eventId`
- `requestType`
- `headers`
- `rawBody`
- `signatureVerified`
- `receivedAt`
- `processedAt`
- `processingState`
- `retryCount`

Important behavior:

- `rawBody` should preserve the request payload exactly as received.
- `headers` should include only the headers needed for auditing and retry
  diagnosis.
- `eventId` should be unique per workspace when present so Slack retries can be
  deduplicated safely.

### `slackFileBlobs`

Stores references to mirrored Slack file binaries.

Suggested fields:

- `workspaceId`
- `sourceEventReceiptId`
- `slackFileId`
- `rawFileObject`
- `storageId`
- `filename`
- `mimetype`
- `size`
- `downloadState`
- `downloadedAt`
- `downloadError`

Notes:

- `rawFileObject` should be stored as the original JSON object from Slack.
- The binary itself should live in Convex blob storage and be referenced by
  `storageId`.

### Optional Later Tables

These should not exist in v1 unless a real need appears:

- `slackChannels`
- `slackUsers`
- `messageSearchDocuments`
- `exports`
- `auditLogs`

The first version should resist the urge to normalize.

## Authentication And Access Model

Two auth systems are needed and they must stay conceptually separate.

### Product Authentication

Users sign in to Slackbreak to manage tenants and workspaces.

Recommended approach:

- Use NextAuth or Auth.js in the Next.js app.
- Start with Slack sign-in because it reduces friction for the intended users.
- Store product identity separately from Slack archive data.

Why Slack sign-in is acceptable:

- It is only an admin login method for the Slackbreak UI.
- It does not force Slack to be the storage system.
- It aligns with the intended operator workflow.

### Workspace Connection Authentication

Separately from product sign-in, a tenant must connect a Slack workspace.

Two supported connection modes should be designed up front:

1. Slackbreak-managed app
2. Customer-managed app via Slack app manifest

Both modes should write into the same `slackInstallations` model so the archive
pipeline does not care how the credentials were obtained.

## Slack App Strategy

The system should support both of these modes:

### Mode A: Slackbreak-Managed App

Slackbreak owns a single Slack app used for hosted installs.

Benefits:

- Lowest-friction setup.
- Consistent permissions model.
- Simpler support and documentation.

Risks:

- Higher policy exposure if Slack objects to the product model.
- Tight coupling between all customers and one app.

### Mode B: Customer-Managed App

Each tenant creates its own Slack app using a published manifest and points the
request URL at Slackbreak.

Benefits:

- Better fit for self-serve and self-hosted users.
- Lower blast radius per customer.
- More credible when customers want control over their own Slack app.

Risks:

- More setup complexity.
- More support burden around app creation and scopes.

Architectural requirement:

The backend must not assume a single global Slack app. Installation data must be
scoped to each workspace.

## Slack Scope And Event Strategy

The product premise is raw archival, not a Slack clone. The scope set should be
kept to the minimum needed to collect future events and mirror files.

Expected capabilities:

- Receive message-related events for accessible conversations.
- Read workspace/channel history when backfill is explicitly added.
- Download file binaries.
- Identify the installing user and workspace.

Important limitation:

Slack will only deliver data the app is authorized to access. "All channels"
does not mean universal visibility. The true capture boundary is whatever the
workspace app installation and membership model allow.

This must be stated plainly in product copy and setup docs.

## Ingestion Pipeline

The ingest path must be optimized for correctness, not for transformation.

### Step 1: Receive Request

Convex `httpAction` receives requests from Slack.

Responsibilities:

- Read the raw body as bytes or exact text.
- Capture request headers required for signature verification and diagnostics.
- Handle Slack URL verification during app setup.

### Step 2: Verify Authenticity

Validate Slack request signatures using the workspace-specific signing secret.

If verification fails:

- Store a receipt if useful for audit.
- Mark `signatureVerified` as false.
- Return a non-success response.

### Step 3: Persist Raw Receipt

Store the inbound request in `slackEventReceipts` before any file processing.

This creates a durable audit trail even if later steps fail.

### Step 4: Fast Acknowledgement

Return a success response to Slack as quickly as possible to avoid retries.

### Step 5: File Mirroring

Inspect the raw payload for file objects or file references.

For each file reference:

- Fetch the file binary from Slack using the installation token.
- Upload the bytes to Convex blob storage.
- Store the raw file object and resulting `storageId` in `slackFileBlobs`.

This is still raw ingestion, not post-processing. The file is being mirrored,
not transformed.

### Step 6: Retry Handling

Slack can retry event delivery. The system should support idempotency.

Expected controls:

- Unique constraint or logical uniqueness on `workspaceId + eventId`.
- Safe reprocessing behavior when a file download fails after the receipt is
  stored.
- Download state tracking for file retries without duplicating event receipts.

## Search And Retrieval

Search should operate over archived raw content, but it still requires an access
path suitable for operators.

### V1 Retrieval Goals

- List events by workspace and time range.
- Inspect the stored raw payload for any event receipt.
- Download mirrored file binaries.
- Filter by high-signal top-level fields such as event type or channel id if
  those can be read directly from the raw JSON.

### Search Strategy

There are two valid approaches:

1. Keep search minimal and query the raw archive directly.
2. Build a lightweight search index that is explicitly treated as a retrieval
   aid, not as the source of truth.

Given the "raw only" requirement, v1 should prefer option 1.

If search quality later becomes unacceptable, add a separate search document
table or external index with this rule:

- The raw event receipt remains authoritative.
- Search documents are disposable derivations.

### MCP Surface

The hosted product can later expose an MCP search tool restricted to public
channels or other explicitly allowed subsets.

That should be delayed until:

- tenancy boundaries are proven,
- archive retrieval works,
- query authorization is fully enforced.

## Export Model

The product promise includes data portability, so export must be treated as a
first-class workflow.

Initial export formats:

- raw event receipts as JSONL or NDJSON
- raw file metadata as JSONL
- file binaries as direct downloads or a packaged archive

Exports should be tenant-scoped and workspace-scoped. They should not depend on
Slack remaining available once the archive has been mirrored.

## Multi-Tenancy Requirements

Even though the first real user is a single operator, the system should enforce
tenant boundaries everywhere.

Required tenancy rules:

- Every workspace belongs to one tenant.
- Every event receipt belongs to one workspace and therefore one tenant.
- Every file blob reference belongs to one workspace and therefore one tenant.
- All UI queries must filter by tenant membership.
- All exports must be tenant-scoped.
- No Convex function should accept a workspace identifier without verifying the
  caller belongs to the owning tenant.

Recommended tenancy posture:

- Design row ownership first.
- Add convenience queries later.
- Never rely on client-side filtering.

## Security Model

The system will store potentially sensitive company communication. Security
controls should be part of the initial design, not a later hardening pass.

### Required Controls

- Encrypt Slack tokens at rest.
- Verify every inbound Slack request signature.
- Restrict archive access to authenticated tenant members.
- Log administrative actions such as workspace connect, token rotation, and
  export.
- Keep the ingest endpoint isolated from the end-user web app where possible.

### Data Handling Notes

- Treat raw event payloads as sensitive.
- Treat mirrored files as sensitive.
- Avoid logging raw payloads or tokens into app logs.
- Keep retention configurable in case a tenant wants bounded storage later.

## Reliability And Failure Modes

Slackbreak does not need to be fancy in v1, but it does need to fail in a way
that preserves data and makes recovery possible.

### Expected Failure Cases

- Slack sends duplicate deliveries.
- File download fails because the token expired or the URL is stale.
- Workspace configuration is incomplete.
- Convex storage write succeeds but metadata write fails, or vice versa.
- A tenant disconnects Slack but historical data should remain available.

### Required Behaviors

- Never discard a verified raw event because downstream file mirroring failed.
- Track file mirroring state explicitly.
- Make retries safe and observable.
- Preserve archive readability even when a workspace is later disconnected.

## Product UX Plan

The initial UX should optimize for a single admin accomplishing setup alone.

### V1 Screens

- Landing page explaining what Slackbreak does.
- Sign-in with Slack.
- Tenant dashboard.
- Workspace connect/setup page.
- Ingestion status page showing recent event receipts and file mirroring health.
- Archive browser with raw JSON inspection.
- Export page.

### Setup Flow

1. User signs in to Slackbreak.
2. User creates or enters a tenant.
3. User chooses Slackbreak-managed app or customer-managed app.
4. User completes the Slack install flow or follows the app manifest setup.
5. Slack sends a test event.
6. Slackbreak shows a healthy ingestion status.

This setup flow should be documented before implementation starts.

## Delivery Phases

### Phase 0: Foundation

- Replace starter copy and define product language in the app.
- Add Convex to the project.
- Add product auth.
- Add multi-tenant core tables.
- Add encrypted secret storage for Slack installation credentials.

Exit criteria:

- A signed-in user can exist inside a tenant.
- A workspace record and installation record can be created safely.

### Phase 1: Raw Event Ingestion

- Implement the Convex Slack webhook endpoint.
- Verify Slack signatures.
- Persist raw event receipts.
- Handle URL verification and retry-safe event storage.

Exit criteria:

- Slack can send events to the hosted endpoint.
- Verified events are durably stored with no normalization.

### Phase 2: File Mirroring

- Detect file references in raw events.
- Download binaries from Slack.
- Store binaries in Convex blob storage.
- Track mirroring state and failures.

Exit criteria:

- File-backed events produce durable mirrored binaries and metadata references.

### Phase 3: Archive Retrieval

- Build tenant-scoped archive pages in Next.js.
- Add event list, raw JSON viewer, and file download access.
- Add basic filtering by workspace, event type, and time range.

Exit criteria:

- An operator can inspect archived events and retrieve mirrored files.

### Phase 4: Export

- Add workspace-scoped JSONL export.
- Add file metadata export.
- Add packaged binary export or batch download support.

Exit criteria:

- A tenant can leave with their data in a usable format.

### Phase 5: Self-Serve Workspace Onboarding

- Publish customer-managed app manifest flow.
- Add workspace setup validation.
- Add docs for tenant-owned Slack app creation.

Exit criteria:

- A non-operator admin can connect their own workspace without manual database
  intervention.

### Phase 6: Search And MCP

- Add retrieval-oriented search over the raw archive.
- Add an MCP interface for explicitly allowed search scopes.
- Keep authorization rules strict and workspace-aware.

Exit criteria:

- Public-channel or otherwise approved archive search works without weakening
  tenancy isolation.

## Recommended Immediate Decisions

These decisions should be made now to avoid churn:

1. Convex owns the Slack webhook endpoint.
2. The source of truth is append-only raw receipts plus mirrored file blobs.
3. Multi-tenancy is part of the first schema, not an afterthought.
4. Product sign-in and Slack workspace connection are separate concerns.
5. The codebase should support both Slackbreak-managed and customer-managed app
   installs.

## Open Questions

These should be resolved before implementation moves beyond Phase 1:

1. Will the hosted product support only public channels at first, or all
   accessible conversations?
2. Will backfill exist in the first release, or is the product strictly
   forward-only initially?
3. What retention default should apply for raw receipts and mirrored files?
4. Is Slack sign-in sufficient for product auth, or should a second auth method
   exist for non-Slack operators later?
5. How should installation secrets be encrypted and rotated in the hosted
   environment?

## Recommended Next Work Items

The next concrete implementation tasks should be:

1. Add Convex to the project and establish local development wiring.
2. Define the initial Convex schema for tenants, memberships, workspaces,
   installations, event receipts, and file blobs.
3. Replace the starter UI with a minimal Slackbreak landing page and signed-in
   app shell.
4. Implement Slack product sign-in.
5. Implement the Convex Slack webhook endpoint with signature verification and
   raw event persistence.

## Bottom Line

Slackbreak should start as a hosted, multi-tenant, raw archive system with a
very small number of durable concepts: tenants, workspaces, installations, raw
event receipts, and mirrored file blobs.

That architecture keeps the first release simple, aligns with the raw-storage
goal, and leaves room for later retrieval, export, and MCP features without
forcing an early normalization layer.
