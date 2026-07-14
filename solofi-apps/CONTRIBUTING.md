# Contributing to SoloFi CFO

## Local Setup

```bash
git clone <repo-url>
cd solofi-apps
npm install
cp .env.example .env      # fill in your own keys, never commit .env
npm run dev
```

Node.js 18+ required. `npm run dev` runs the TypeScript server via `tsx watch`; `npm run build` compiles to `dist/`; `npm run typecheck` runs `tsc --noEmit`.

## Git Workflow

- **Branch naming:** `feature/<short-desc>`, `fix/<short-desc>`, `chore/<short-desc>`
- **Commit messages:** [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- Open a PR against `main`, keep PRs scoped to one concern
- Do not commit `.env`, private keys, or `node_modules/`

## Code Style

- TypeScript, ES Modules (`import`/`export`, NodeNext resolution — local imports need a `.js` extension even though the source is `.ts`)
- One class per file, matching filename (`InvoiceService.ts` → `class InvoiceService`)
- Clean Architecture layering: `src/controllers/` (parse OKX.AI webhook payloads) → `src/services/` (`AiService`, `Web3Service`, and domain services `InvoiceService`/`PocketService`/`AdvisorService`) → `src/repositories/` (Supabase persistence)
- Leave `// TODO:` comments for anything blocked on an external unknown (e.g. confirming the exact OKX ASP payload contract) — don't guess and hardcode silently

## Running Tests

```bash
npm test
```

Unit tests go in `tests/unit/`, integration tests (hitting Supabase/X Layer test infra) go in `tests/integration/`.

## Graphify

After any significant change to folder structure or file layout, re-run the knowledge graph:

```bash
/graphify .
git add graphify-out/
git commit -m "chore: update graphify knowledge graph"
```

Query it before adding new features: `/graphify query "..."`, `/graphify path "A" "B"`, `/graphify explain "X"`.
