# Contributing to Elbudget

Thanks for your interest in contributing to Elbudget.

## Ground Rules

- Keep changes focused and easy to review.
- Prefer small pull requests over large multi-feature PRs.
- Match existing code style and project conventions.
- Add or update tests when behavior changes.

## Prerequisites

- Node.js 20+
- npm 10+

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

3. Set up database:

```bash
npm run db:generate
npm run db:push
```

4. Start the app:

```bash
npm run dev
```

## Quality Checks

Run these before opening a PR:

```bash
npm run lint
npm run type-check
npm run test
```

If you are changing browser flows, also run:

```bash
npm run test:e2e
```

## Branch and Commit Guidance

- Branch naming suggestion: `feature/<short-name>`, `fix/<short-name>`, `docs/<short-name>`.
- Use clear commit messages in imperative mood.
- Keep unrelated refactors out of feature/fix PRs.

## Pull Request Checklist

- The change solves one clear problem.
- The app runs locally with no new errors.
- Lint, type-check, and tests pass locally.
- New behavior is documented in README when needed.
- PR description includes:
  - What changed
  - Why it changed
  - How it was tested
  - Screenshots for UI changes

## Reporting Bugs

When filing a bug, include:

- Expected behavior
- Actual behavior
- Steps to reproduce
- Environment (OS, Node version, browser)
- Logs or screenshots if available

## Feature Requests

For new features, describe:

- User problem
- Proposed solution
- Alternatives considered
- Scope and constraints

## Security

Do not commit secrets or credentials.

If you discover a security issue, report it privately to the maintainers instead of opening a public issue.
