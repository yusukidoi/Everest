# Spaceship X26 PRMS

Passenger Resource Management for the Earth→Mars run: Crew Leads administer people and ship resources; passengers only see and use what their membership allows; every successful or denied use is audited so leads can see demand and personal history.

Stack is TypeScript (Node ESM) + Vitest. State is in-memory. There is a small CLI so you can exercise the domain without standing up an API.

```bash
npm install
npm test
npm start                          # walks a short demo scenario
npm start -- discover p-silver
npm start -- use p-gold adv-medical
npm start -- upgrade lead-1 p-silver GOLD
npm start -- report-demand lead-1
```

Seeded IDs: leads `lead-1`–`lead-3` (Aiko, Ben, Cara); passengers `p-silver` / `p-gold` / `p-platinum` (Yuri, Mika, Nova).

---

## What it implements

Membership is a strict lattice: **Silver ⊂ Gold ⊂ Platinum**. Higher tiers inherit lower access.

| Tier | Resources in the seeded catalog |
| --- | --- |
| Silver | Food Supply Station, Sleeping Pod, Basic Hygiene Pod |
| Gold | Private Cabin, Advanced Medical Bay (+ Silver) |
| Platinum | Luxury Oxygen Pod, VIP Recreation Deck (+ Gold & Silver) |

Against the brief:

1. **Basics** — Exactly three Crew Leads. Resources carry a minimum membership. Passengers get a filtered discovery list.
2. **Operations** — Use is checked at call time. Leads can upgrade/downgrade. Allow and deny both land in an audit log.
3. **Insights** — Personal history, usage rolled up by current membership, high-demand ranking for leads.

---

## Layout

```
src/domain/            rules + persistence-like registries (no I/O)
src/application/       use cases (authz + orchestration)
src/infrastructure/    composition root + demo seed
src/cli/               thin command surface
```

I kept rules out of the CLI on purpose. `PrmsSystem.createPrmsSystem()` is the only place that wires collaborators; swapping the in-memory maps for a database later should not force rewriting use cases.

Registries (`PassengerRegistry`, `ResourceCatalog`, `UsageLog`, `CrewLeadRegistry`) hold state. Application services decide *who* may change it and *when* access is legal. That split is the main maintainability bet.

Notable entry points if you are reviewing code:

- `MembershipLevel.canAccess` — shared inheritance check
- `CrewLeadRegistry.register` — hard cap at three leads
- `ResourceUsageService.useResource` — validate, audit allow/deny, then succeed or throw
- `ReportingService` — history / by-tier summary / demand

Failures are `DomainError` with concrete messages (wrong tier, decommissioned resource, unauthorized actor, etc.).

---

## How I approached it

I built this commit-by-commit around invariants, with tests describing the rule before (or with) the implementation: membership order, the three-lead ceiling, discovery filtering, deny paths, tier direction checks, reporting.

I deliberately avoided a single “god” service. Passenger admin, resource provisioning, usage, discovery, and reporting change for different reasons; keeping them separate made the tests and the git history easier to follow.

I did **not** introduce a DB, HTTP layer, or real authentication. For an assessment I care more that another engineer can read the domain in an afternoon and trust the tests than that the demo looks like a product.

---

## Assumptions

- Process memory only; restart clears state.
- “Is this actor a Crew Lead?” is an id lookup on the registry—not sessions/JWT.
- Decommissioned resources remain addressable for administration but are excluded from discovery and blocked on use.
- Personal history defaults to allowed uses; denied events are opt-in (`--denied` / `{ includeDenied: true }`).
- “Usage by membership” uses each passenger’s **current** tier. Each audit row still stores `membershipLevelAtUse` if you want a historical rollup later.
- Unknown passenger/resource ids throw and are not written to the audit log (there was no valid pair to record).

---

## Trade-offs

In-memory maps keep the problem in the domain. Cost: no durability and no concurrency story.

A CLI was faster to review than REST. Cost: no HTTP contract.

An append-only usage log is enough for the reporting asked for here. Cost: no retention policy, no paging.

If I continued the work, I would put repositories behind ports, add capacity limits on contested resources (pods / O₂), and optionally aggregate reports by `membershipLevelAtUse` as well as current roster tier.

---

## Scripts

- `npm test` — Vitest
- `npm run typecheck` — `src` + `tests`
- `npm run build` — emit `dist/`
- `npm start` — build, then CLI (`demo` if no args)

---

## AI disclosure

I used **Cursor** while building this.

How: I drove the work in small slices (plan → implement one concern → run tests → review the diff → commit myself → move on). Cursor drafted a lot of the TypeScript, tests, CLI, and an earlier pass of this README. I set the structure, the invariants, and the commit boundaries, and I treated anything that landed in the repo as my responsibility.

Assisted: scaffolding and most module/test/CLI drafts.  
Owned by me: problem breakdown, layer boundaries, which edge cases mattered, accepting or rewriting AI output, and the final review.

Optional workflow note: prompts were scoped (“Crew Lead registry, exactly three, with Vitest”) rather than “build the whole challenge.” The commit log is the best picture of that rhythm.

Please judge the result the same way you would any senior submission: `npm test`, `npm start`, and whether the code is something you would maintain.
