This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment variables

Configure these in `.env.local` (or your host’s env settings):

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (e.g. `https://www.example.com`) |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset name |
| `SANITY_API_TOKEN` | Sanity API token (for server-side fetches where needed) |
| `STRIPE_SECRET_KEY` | Stripe secret key (admin dashboard revenue, checkout) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `ADMIN_PASSWORD` | Password for `/admin` (used by login API; never commit this value) |
| `GA4_PROPERTY_ID` | Numeric GA4 property ID (GA4 → Admin → Property settings) — used by `/admin/analytics` for the Data API |
| `GA4_SERVICE_ACCOUNT_KEY` | JSON key for a Google Cloud service account with access to the GA4 property; enable **Google Analytics Data API** on the GCP project and grant the account access under GA4 → Admin → Property access management. Store as a single JSON string in env (e.g. escaped or as a secret). |
| `VERCEL_TOKEN` | Vercel personal access token (account → **Tokens**) — used by **Settings → Admin password** to update `ADMIN_PASSWORD` via the Vercel REST API |
| `VERCEL_PROJECT_ID` | Vercel project ID (Project → Settings → General) for the same API calls |
| `VERCEL_TEAM_ID` | Optional. Team ID if the project belongs to a team (required for API calls scoped to that team) |

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# Es & Me
