# Spaceship X26 — Passenger Resource Management System (PRMS)

Earth → Mars settlement mission. Crew Leads manage passengers and ship resources; passengers access only what their membership allows, with usage tracked for reporting.

## Status

Scaffold in place. Domain features to follow (membership, Crew Leads, resources, usage, reporting).

## Stack

- TypeScript (Node ESM)
- Vitest (TDD)
- In-memory persistence (no database)
- CLI for demonstration

## Scripts

```bash
npm test          # run tests
npm run build     # compile TypeScript
npm start         # run CLI (after build; added later)
```

## Approach (to be expanded)

- Layered design: `domain` → `application` → `infrastructure` / `cli`
- Test-driven development for core rules
- README will document design decisions, assumptions, trade-offs, and AI usage disclosure before submission
