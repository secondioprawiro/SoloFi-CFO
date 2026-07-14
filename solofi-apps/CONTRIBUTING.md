# Contributing to SoloFi CFO

## Local Setup

```bash
git clone <repo-url>
cd solofi-apps
npm install
cp .env.example .env      # fill in your own keys, never commit .env
npm run dev
```

Node.js 18+ recommended (native `--watch` and test runner used in `npm run dev` / `npm test`).

## Git Workflow

- **Branch naming:** `feature/<short-desc>`, `fix/<short-desc>`, `chore/<short-desc>`
- **Commit messages:** [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- Open a PR against `main`, keep PRs scoped to one concern
- Do not commit `.env`, private keys, or `node_modules/`

## Code Style

- ES Modules (`import`/`export`), no CommonJS `require`
- One class per file, matching filename (`InvoiceService.js` → `class InvoiceService`)
- Business logic lives in `src/domain/`, external integrations in `src/infrastructure/`
- Leave `// TODO:` comments for anything blocked on a team decision (tech stack TBD items) — don't hardcode a library choice without discussion

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
