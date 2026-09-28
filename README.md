# PulseOps

AI-Powered Security Operations Center

**Status: requirements and architecture defined. Application implementation has not started.**

PulseOps is a planned full-stack portfolio application for investigating simulated security telemetry, reviewing evidence-based alerts, and managing incidents with structured AI assistance.

## Current deliverables

- [Product requirements](docs/REQUIREMENTS.md)
- [Architecture and engineering decisions](docs/ARCHITECTURE.md)
- [Proposed database model](docs/DATA_MODEL.md)
- [Implementation phases and planned commits](docs/IMPLEMENTATION_PLAN.md)

Phases 1 and 2 are complete as design work. Runtime initialization begins in phase 3. There is currently no live demo, screenshot, installed dependency, running database, or passing application test to advertise.

## Intended stack

Next.js App Router · React · TypeScript · Tailwind CSS · shadcn/ui · Lucide · PostgreSQL · Prisma · Auth.js · Zod · SSE · Recharts · Vitest · Testing Library · Playwright · Docker · GitHub Actions.

## Delivery principles

- One modular application with a shared TypeScript domain layer.
- Reproducible simulated telemetry and verifiable detection rules.
- Server-side permissions for every sensitive operation.
- AI recommendations grounded in linked events, never executed automatically.
- Visible demo labels and honest implementation status.
- Incremental, tested changes that a solo developer can explain.

The final README will include verified setup instructions, screenshots from the running application, deployment instructions, and actual CI badges. Its required sections are tracked in the implementation plan.

## Disclaimer

This project uses simulated security telemetry and is designed for defensive cybersecurity education and portfolio demonstration.
