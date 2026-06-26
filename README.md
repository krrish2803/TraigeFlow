# TriageFlow

AI-powered bug triage and release operations platform. Ingest signals from Slack, Gmail, GitHub, and Jira — automatically classify, cluster, triage, and generate structured engineering issues with human-in-the-loop approval.

---

## Problem

Engineering teams drown in signals from multiple channels:
- Slack messages reporting bugs
- Support emails describing issues
- GitHub issues opened by users
- Jira tickets created ad-hoc

Without automation, every signal requires manual triage: reading, classifying, deduplicating, assessing severity, writing a structured bug report, routing to the right owner, and tracking through the release cycle. This takes hours of engineering time daily and lets critical issues slip through the cracks.

## Solution

TriageFlow is an AI operator that:

1. **Ingests** signals from 4 sources (Slack, Gmail, GitHub, Jira) into a unified normalized model
2. **Classifies** each signal as bug, feature, question, or noise with urgency and product area
3. **Clusters** related signals together to reduce noise and identify widespread issues
4. **Triages** clusters with severity scoring, root cause hypothesis, and release risk assessment
5. **Drafts** structured engineering issues with title, summary, repro steps, labels, and owner suggestions
6. **Reviews** drafts for quality before surfacing for approval
7. **Approves** via human-in-the-loop gate — then creates real GitHub/Jira issues and posts to Slack

---

## Features

- **Multi-source ingestion** — Slack webhook (real), Gmail (mock/demo), GitHub webhook (real), Jira webhook (real)
- **7 AI agents** — Intake, Classification, Similarity, Triage, Draft, Review, Release Risk
- **AI-first with heuristic fallback** — Uses NVIDIA API (`meta/llama-3.1-8b-instruct`) when available; falls back to deterministic rules
- **Human-in-the-loop approval** — Drafts require explicit approval before creating external issues
- **Downstream integrations** — Creates real issues on GitHub and Jira, posts Slack notifications
- **Release risk dashboard** — Aggregates pending work into Block/Caution/Safe risk levels
- **Persistent storage** — File-based JSON persistence (zero-dependency, survives restarts)
- **Polished UI** — Dashboard, Inbox, Clusters, Drafts, Releases pages with pagination and error states
- **189 unit tests** — All passing with full coverage of agents, parsers, store, and workflows

---

## Prerequisites

- Node.js 18+
- npm
- (Optional) A [ngrok](https://ngrok.com) account for webhook tunneling
- API keys for the integrations you want to use (see below)

---

## Getting Started

### 1. Clone and Install

```bash
git clone <repo-url>
cd TriageFlow
npm install
```

### 2. Configure Environment Variables

Copy the template and fill in your keys:

```bash
cp .env.example .env.local
```

**Required for any AI functionality:**

| Variable | Description |
|----------|-------------|
| `NVIDIA_API_KEY` | NVIDIA API key for AI agents (get at [build.nvidia.com](https://build.nvidia.com)) |
| `AUTH_SECRET` | A random 64-char hex string (`openssl rand -hex 32`) |

**Slack integration (real):**

| Variable | Description |
|----------|-------------|
| `SLACK_SIGNING_SECRET` | From Slack App settings → Basic Information |
| `SLACK_BOT_TOKEN` | `xoxb-*` token from Slack App → OAuth & Permissions |
| `SLACK_SUPPORT_CHANNEL_IDS` | Comma-separated channel IDs to monitor |

**GitHub integration (real):**

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | Personal access token with `repo` scope |
| `GITHUB_OWNER` | Repository owner (user or org) |
| `GITHUB_REPO` | Repository name |

**GitHub OAuth (for login):**

| Variable | Description |
|----------|-------------|
| `AUTH_GITHUB_ID` | GitHub OAuth App client ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App client secret |

**Jira integration (real):**

| Variable | Description |
|----------|-------------|
| `JIRA_INSTANCE_URL` | Your Atlassian instance URL |
| `JIRA_EMAIL` | Your Atlassian account email |
| `JIRA_API_TOKEN` | Atlassian API token |
| `JIRA_PROJECT_KEY` | Target project key (e.g., `DRLOCURY`) |
| `JIRA_WEBHOOK_SECRET` | Secret for Jira webhook signature verification |

### 3. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. (Optional) Expose with ngrok

```bash
npm run dev:tunnel
```

This starts both the dev server and an ngrok tunnel. Use the ngrok URL to configure webhooks in Slack, GitHub, and Jira.

---

## End-to-End Usage Walkthrough

### 1. Sign In

Open the app and sign in with any email (credentials mode) or GitHub OAuth. You'll land on the Dashboard.

### 2. Inject a Signal (Demo)

Navigate to **Settings** and click one of the demo signal cards (e.g., "Login Crash on iOS"). This injects a signal into the system and runs the full pipeline: Intake → Classification → Similarity → Triage → Draft → Review.

### 3. View the Signal

Go to **Inbox** to see the ingested signal. Use the source filter to narrow by Slack/Gmail/GitHub/Jira. Click a signal to see its details and extracted metadata.

### 4. Check Clusters

Go to **Clusters** to see how signals are grouped. Click **Run Triage** on a cluster to generate a draft.

### 5. Review the Draft

Go to **Drafts** to see the AI-generated engineering issue. The draft includes:
- Title with product area prefix (e.g., `[Auth] Login crash on iOS`)
- Summary synthesizing all user reports
- Reproduction steps
- Expected vs actual behavior
- Suggested owner area
- Labels (severity, release risk)
- Confidence scores

### 6. Approve or Reject

- **Approve** — Creates real issues on GitHub and Jira, posts a Slack notification, and updates the draft status
- **Reject** — Logs the rejection reason and returns the draft to needs-review state

### 7. Monitor Release Risk

Go to **Releases** to see an aggregated view of all pending work:
- **Block** — Critical items that must be fixed before release
- **Caution** — High-severity items that need close monitoring
- **Safe** — Low-risk items that can ship

Click **Generate Digest** to recompute the release summary.

### 8. Send Real Signals via Webhooks

Configure your Slack, GitHub, and Jira webhooks to point at your ngrok URL:

| Source | Webhook URL |
|--------|-------------|
| Slack | `https://<ngrok>.ngrok-free.app/api/webhooks/slack` |
| GitHub | `https://<ngrok>.ngrok-free.app/api/webhooks/github` |
| Jira | `https://<ngrok>.ngrok-free.app/api/webhooks/jira` |

Real signals will flow through the same pipeline as demo signals.

---

## Project Structure

```
src/
├── app/
│   ├── (app)/                         # Authenticated pages
│   │   ├── dashboard/                 # Dashboard with metrics & chart
│   │   ├── inbox/                     # Signals list with detail panel
│   │   ├── clusters/                  # Signal clusters with triage action
│   │   ├── drafts/                    # Drafts with approve/reject
│   │   ├── releases/                  # Release risk dashboard
│   │   └── settings/                  # Demo injection, integration status
│   ├── api/
│   │   ├── signals/                   # GET/POST signals
│   │   ├── clusters/                  # GET/POST clusters
│   │   ├── drafts/                    # GET/POST drafts
│   │   ├── activity/                  # GET activity feed
│   │   ├── dashboard/                 # GET dashboard metrics
│   │   ├── releases/                  # GET/POST release digests
│   │   ├── webhooks/
│   │   │   ├── slack/                 # Slack event ingestion
│   │   │   ├── github/                # GitHub webhook ingestion
│   │   │   ├── jira/                  # Jira webhook ingestion
│   │   │   └── gmail/                 # Gmail push notification (mock)
│   │   ├── demo/                      # Demo signal injection
│   │   ├── seed/                      # Seed data
│   │   └── auth/                      # NextAuth route handler
│   ├── login/                         # Login page
│   └── page.tsx                       # Landing page
├── lib/
│   ├── lemma/                         # Core engine (the "Lemma" layer)
│   │   ├── types.ts                   # All data types & interfaces
│   │   ├── store.ts                   # In-memory + persistent data store
│   │   ├── persist.ts                 # JSON file persistence (atomic writes)
│   │   ├── workflows.ts              # 5 durable workflows + full pipeline
│   │   ├── client.ts                  # Facade for store + workflows
│   │   ├── hooks.ts                   # React hooks for workflows
│   │   ├── agents/
│   │   │   ├── intake-agent.ts        # Clean, classify (bug/noise/etc.)
│   │   │   ├── classification-agent.ts # Label, urgency, product area
│   │   │   ├── similarity-agent.ts    # Cluster similar signals
│   │   │   ├── triage-agent.ts        # Severity, root cause, release risk
│   │   │   ├── draft-agent.ts         # Generate structured issue draft
│   │   │   ├── review-agent.ts        # Quality gate for draft fields
│   │   │   └── release-risk-agent.ts  # Aggregate release risk assessment
│   │   └── surfaces/
│   │       ├── github.ts              # Create GitHub issues
│   │       ├── jira.ts                # Create Jira issues
│   │       ├── slack.ts               # Post Slack messages
│   │       └── gmail.ts              # Placeholder (mock only)
│   ├── ai.ts                          # NVIDIA API wrapper
│   ├── auth.ts                        # NextAuth configuration
│   ├── ingestion/                     # Source-specific parsers
│   │   ├── normalize.ts              # Unified signal normalization
│   │   ├── router.ts                  # Route webhook payloads to pipelines
│   │   ├── slack.ts                   # Slack payload parser
│   │   ├── github.ts                  # GitHub payload parser
│   │   ├── jira.ts                    # Jira payload parser
│   │   └── gmail.ts                   # Gmail message parser (mock)
│   └── use-data.ts                    # Client-side data fetching hooks
├── components/
│   └── ui/
│       ├── Pagination.tsx             # Reusable pagination component
│       ├── StatusBadge.tsx            # Status display badges
│       └── ...
├── middleware.ts                      # Auth middleware (protects /app routes)
└── ...
```

---

## Agents

All agents are AI-first: they attempt to call the NVIDIA API with structured JSON prompts. If the API is unavailable (no key, network error, rate limit), they fall back to deterministic heuristic rules.

| Agent | Purpose | AI Fallback? | Input | Output |
|-------|---------|:---:|-------|--------|
| **Intake** | Clean raw text, classify type (bug/feature/question/noise), extract product area and platform | Yes | `{ source, body, author }` | `{ type, productArea, affectedPlatform, urgencySignals, hasErrorDetails }` |
| **Classification** | Assign label (bug/feature/question), urgency (critical/high/medium/low), product area, key phrases | Yes | `{ cleanedText, source }` | `{ label, urgency, productArea, keyPhrases, severityBoostReason }` |
| **Similarity** | Compare signal against existing signals, find matching clusters or create new ones | No (deterministic) | `{ signal, allSignals }` | `{ existingClusterId?, matches[], similarityScores }` |
| **Triage** | Score severity, hypothesize root cause, identify affected modules, assess release risk | Yes | `{ signalCount, sourceTypes, allText }` | `{ severity, severityScore, rootCauseHypothesis, affectedModules, releaseRisk, confidence }` |
| **Draft** | Generate structured engineering issue (title, summary, repro steps, labels, customer reply) | Yes | `{ signals, rootCauseHypothesis, severity, affectedModules }` | `{ issue, identifier, customerReply, slackSummary, confidenceScores }` |
| **Review** | Quality gate: verify all required draft fields are present before approval | No (deterministic) | `{ draft }` | `{ approved, reviewReason, missingFields }` |
| **Release Risk** | Aggregate all drafts into release risk summary with highlights | No (deterministic) | `{ drafts, blockCount, cautionCount, safeCount }` | `{ riskLevel, riskScore, highlights }` |

---

## Workflows

| Workflow | Steps | Entry Point |
|----------|-------|-------------|
| `ingestSignalWorkflow` | Intake Agent → store signal | Webhook handler, seed/demo |
| `triageSignalWorkflow` | Classification → Similarity → Triage → Draft → Review | After ingestion, manual "Run Triage" |
| `approveDraftWorkflow` | Create Approval entity → Create GitHub issue → Create Jira issue → Post Slack | Drafts page "Approve" button |
| `rejectDraftWorkflow` | Create Approval entity (rejected) → Update draft state | Drafts page "Reject" button |
| `recomputeReleaseSummaryWorkflow` | Release Risk Agent → store summary | Releases page "Generate Digest" button |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Auth | NextAuth v5 (GitHub OAuth + Credentials) |
| Styling | TailwindCSS |
| AI | NVIDIA API (`meta/llama-3.1-8b-instruct`) |
| Persistence | File-based JSON (zero-dependency) |
| State | In-memory Map store + atomic JSON snapshots |
| Testing | Vitest (189 tests) |
| Tunneling | ngrok |

---

## License

MIT
