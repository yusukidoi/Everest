# Spaceship X26 — Passenger Resource Management System (PRMS)

In-memory TypeScript system for managing Spaceship X26 passengers, membership-gated ship resources, usage audit trails, and Crew Lead reporting.

## Requirements covered

| Level | Capability |
| --- | --- |
| **1** | Exactly three Crew Leads; resources tagged by minimum membership; passengers discover allowed resources |
| **2** | Real-time use validation; upgrade/downgrade tiers; audit log of allowed and denied interactions |
| **3** | Personal usage history; usage summaries by membership; high-demand resource analytics |

**Membership inheritance:** Silver ⊂ Gold ⊂ Platinum.

**Base inventory seed**

| Resource | Minimum tier |
| --- | --- |
| Food Supply Station, Sleeping Pod, Basic Hygiene Pod | Silver |
| Private Cabin, Advanced Medical Bay | Gold |
| Luxury Oxygen Pod, VIP Recreation Deck | Platinum |

## Quick start

```bash
npm install
npm test
npm start                 # scripted demo
npm start -- discover p-silver
npm start -- use p-gold adv-medical
npm start -- upgrade lead-1 p-silver GOLD
npm start -- report-demand lead-1
```

Demo actors after seed: Crew Leads `lead-1`/`lead-2`/`lead-3` (Aiko, Ben, Cara); passengers `p-silver` (Yuri), `p-gold` (Mika), `p-platinum` (Nova).

## Architecture

```
src/
  domain/           # entities, registries, membership rules, usage log
  application/      # use-case services (authorization + orchestration)
  infrastructure/   # composition root + demo seed
  cli/              # command-line demonstration
```

**Design choices**

- **Layered OOP:** domain types stay free of CLI/IO; application services enforce Crew Lead authorization and membership checks.
- **TDD:** behavior was grown from Vitest cases around rules (inheritance, headcount, denial auditing, reporting).
- **SOLID leanings:** single-purpose services; registries depend on abstractions of data; composition root wires concrete collaborators; open for new report strategies without changing domain models.
- **Errors:** domain failures raise `DomainError` with actionable messages.

## Assumptions

1. Persistence is in-memory for the process lifetime (suitable for challenge scope).
2. Crew Lead authorization is by registered id string (no auth protocol/JWT).
3. Decommissioned resources stay in catalog for history but cannot be used or discovered.
4. Personal history defaults to **allowed** uses; pass `--denied` (CLI) or `{ includeDenied: true }` for full audit.
5. Membership summary groups by a passenger’s **current** tier, not historical tier at time of use (`membershipLevelAtUse` is retained on each audit record for deeper analysis later).
6. Unknown passenger/resource ids fail fast and are **not** audited (no valid interaction parties).

## Trade-offs

| Choice | Why | Cost |
| --- | --- | --- |
| In-memory maps | Focus on domain clarity and tests | No durability / concurrency story |
| CLI instead of HTTP API | Fastest path to a reviewable demo | No REST contract |
| Append-only usage log | Simple audit trail | No pagination/archival policy |
| Sync services | Readable, testable | Would need ports/adapters for async I/O later |

## What I would improve next

- Persist inventory/passengers/usage (SQLite or Postgres) behind repository ports
- Soft auth (roles/sessions) and stronger id generation
- Capacity limits / queues per resource (pods, O₂ stations)
- Report grouping option: by `membershipLevelAtUse` vs current roster tier
- Property-based tests for membership lattice invariants

## Project scripts

| Script | Purpose |
| --- | --- |
| `npm test` | Vitest suite |
| `npm run typecheck` | Strict TypeScript check (src + tests) |
| `npm run build` | Emit `dist/` |
| `npm start` | Build + CLI (`demo` by default) |

## AI disclosure

Per the hiring brief, AI tools were used as follows:

| Question | Answer |
| --- | --- |
| **Which AI tool(s)?** | Cursor (Composer agent) |
| **How were they used?** | Step-by-step implementation with human review between git commits; AI drafted domain/application code, tests, CLI, and README from the PRMS challenge PDF and agreed commit plan. |
| **What was AI-assisted?** | Project scaffold, membership/Crew Lead/passenger/resource/usage/reporting modules, Vitest coverage, CLI demo wiring, and documentation. |
| **Workflow** | Explain plan → implement one commit worth → human commits locally → continue on `next`. Human owns final review of production-quality correctness and clarity. |

I remain responsible for everything submitted; treat the suite (`npm test`) and demo (`npm start`) as the acceptance check for this delivery.
