# PayTrack — PayPal Expense Tracker

**Track payments. Understand spending. Make smarter financial decisions.**

PayTrack is a full-stack expense tracking application that integrates PayPal Sandbox payments with manual expense tracking, interactive analytics, and rule-based financial insights.

**Live Demo:** https://paypal-expense-tracker.vercel.app/

## Features

- **GitHub Authentication:** Secure sign-in using Auth.js and GitHub OAuth.
- **PayPal Sandbox Integration:** Create and complete test payments through PayPal.
- **Manual Expense Tracking:** Record and manage expenses in USD.
- **Unified Transaction History:** View PayPal payments and manual expenses together without double-counting.
- **Interactive Analytics:** Explore spending trends across 7 days, 30 days, 3 months, and 6 months.
- **Category Breakdown:** Analyze spending with interactive donut charts and time filters.
- **Financial Insights:** View rule-based spending observations, month-over-month comparisons, and illustrative savings opportunities.
- **Responsive Dashboard:** Modern, violet-themed interface for tracking expenses.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS |
| Authentication | Auth.js v5, GitHub OAuth |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Payments | PayPal Sandbox |
| Charts | Recharts |
| Deployment | Vercel |

## How It Works

1. Sign in securely using GitHub.
2. Add a manual expense or complete a PayPal Sandbox payment.
3. PayTrack stores the completed transaction in PostgreSQL.
4. View all transactions in a unified history.
5. Explore interactive charts and spending insights.

## Getting Started

### Prerequisites

- Node.js and npm
- PostgreSQL database
- GitHub OAuth application
- PayPal Sandbox developer credentials

### Installation

```bash
git clone https://github.com/Preet-0/paypal-expense-tracker.git
cd paypal-expense-tracker
npm install
```

### Environment Variables

Create a `.env` file with the environment variables required by your configuration, including:

```env
DATABASE_URL=""
AUTH_SECRET=""
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
PAYPAL_CLIENT_ID=""
PAYPAL_CLIENT_SECRET=""
PAYPAL_MERCHANT_ID=""
```

Never commit real credentials to GitHub.

### Database Setup

```bash
npx prisma generate
npx prisma migrate deploy
```

### Run Locally

```bash
npm run dev
```

Open http://localhost:3000.

## Production Deployment

PayTrack is deployed on Vercel using Neon PostgreSQL, with GitHub OAuth authentication and PayPal Sandbox payment processing.

**Live Application:** https://paypal-expense-tracker.vercel.app/

## Project Scope

PayTrack currently supports USD transactions and uses PayPal Sandbox for payment demonstrations. Financial insights are generated through application logic rather than paid AI services.

## Future Improvements

- CSV export and reporting
- Customizable spending goals
- More advanced transaction search and filtering
- Additional financial visualizations

## License

License to be determined.
