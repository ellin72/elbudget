# Elbudget

Elbudget is an AI-powered personal finance and budgeting web application built with Next.js.
It helps users track income and expenses, manage category budgets, monitor goals and debt, handle recurring items, and generate reports and insights.

## Screenshots

![Dashboard](docs/screenshots/dashboard.svg)
![Transactions](docs/screenshots/transactions.svg)
![Budgets](docs/screenshots/budgets.svg)
![Reports](docs/screenshots/reports.svg)
![Recurring](docs/screenshots/recurring.svg)

When replacing placeholders with real screenshots, use PNG at 1600x900 for visual consistency.
Use `npm run screenshots:check` before committing.
See `docs/screenshots/CHECKLIST.md` for capture standards.

## Features

- Authentication and onboarding flow
- Dashboard with financial overview widgets
- Income and expense tracking
- Budget creation and category allocation
- Budgeted vs unbudgeted transaction visibility
- Goals and savings challenge tracking
- Debt tracking
- Recurring transaction management
- Auto-sync for due recurring income
- AI insights endpoint and dashboard widget
- Reports with CSV and PDF export
- User settings and profile preferences

## Tech Stack

- Framework: Next.js 15 (App Router), React 19, TypeScript
- Styling/UI: Tailwind CSS, Radix UI, Framer Motion
- Data: Prisma ORM with SQLite
- Auth: NextAuth
- State/Data fetching: Zustand, TanStack React Query
- Validation: Zod + React Hook Form
- Charts/Reporting: Recharts, jsPDF, jspdf-autotable
- Testing: Jest, Playwright (scripts configured)

## Local Setup

### 1. Prerequisites

- Node.js 20+
- npm 10+

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the sample env file:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Then fill in values in `.env.local`.

### 4. Initialize database

For local SQLite development:

```bash
npm run db:generate
npm run db:push
```

Optional (if/when `prisma/seed.ts` exists):

```bash
npm run db:seed
```

### 5. Start development server

```bash
npm run dev
```

Open http://localhost:3000

## Environment Variables

Defined in `.env.example`:

### App and Auth

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

### Database

- `DATABASE_URL` (default local SQLite: `file:./dev.db`)

### OAuth

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### AI

- `OPENAI_API_KEY`

### Email / SMTP

- `EMAIL_SERVER_HOST`
- `EMAIL_SERVER_PORT`
- `EMAIL_SERVER_USER`
- `EMAIL_SERVER_PASSWORD`
- `EMAIL_FROM`

### Stripe

- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### App Public Config

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_APP_NAME`

### Scheduled Jobs

- `CRON_SECRET` (used to protect cron endpoint)

### Rate Limiting / Infra

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Database Setup

Prisma uses SQLite in this repository.

- Schema file: `prisma/schema.prisma`
- Datasource: SQLite via `DATABASE_URL`

Common commands:

```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:migrate    # Create/apply dev migration
npm run db:studio     # Open Prisma Studio
```

## Testing

Available scripts:

```bash
npm run test
npm run test:e2e
npm run lint
npm run type-check
```

Notes:

- Jest and Playwright scripts are present in `package.json`.
- If no tests are currently committed, these commands may pass with no test coverage or require additional test setup files depending on your local state.

## Deployment Notes

### Vercel

This project includes `vercel.json` cron configuration:

- Path: `/api/cron/recurring-income`
- Schedule: `0 5 * * *` (daily at 05:00 UTC)

For production deployment:

- Set all required environment variables in your hosting platform.
- Ensure `CRON_SECRET` is configured and matches the cron caller authorization.
- Configure `NEXTAUTH_URL` and `NEXTAUTH_SECRET` for production domain/security.
- Run `npm run build` to verify production build before deploy.

## Roadmap

- Add repository screenshots and a short product tour GIF
- Add automated unit/integration test coverage for API routes and critical UI flows
- Add Playwright E2E coverage for onboarding, budgets, transactions, recurring, and reports
- Add CI pipeline (lint, type-check, tests, build)
- Add API docs for core endpoints
- Add contribution guidelines and code style conventions
- Improve observability and error tracking for production

## Contributing

Contributions are welcome.

Please start with the contribution guide in `CONTRIBUTING.md`.

A good first contribution is to:

1. Add screenshots to the `docs/screenshots` folder
2. Add tests for one feature module
3. Improve docs for deployment and operations

## License

This project is licensed under the MIT License.
See `LICENSE` for details.
