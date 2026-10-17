# KrishiSahay — Team Vertex

A hackathon MVP scaffold based on the Team Vertex presentation: compare mandi options by estimated net return, explore shared transport, calculate spoilage-aware profit, record a preliminary human-reviewed visual grade, and compare sell-now/wait considerations.

## Important scope notes

- This is a runnable starter/demo, not a deployed website.
- All built-in mandi figures are hypothetical demo data. The UI explicitly labels them as **DEMO DATA — NOT LIVE**.
- The three PPT example outcomes for 4 quintals are nearby ₹4,600, distant own truck ₹4,900, and distant shared truck ₹6,300. The Profit Calculator shows these as a separate worked example.
- KisanGrade image upload currently previews the photo and records a manual preliminary grade in the UI. It does **not** claim to run a trained image model.
- AI explanations are optional. Profit totals are calculated in application code and cannot be overridden by the LLM.
- Real market data, actual driver matching/booking, persistent harvest save/load, and production auth flow require configuration and additional integration.

## Stack mapping

- **Frontend:** Next.js / React / TypeScript / CSS; build and refine in Replit AI. Use Codium/Qodo as a coding assistant for review and tests.
- **Builder.io:** use for visual design/content editing or Builder integrations. It is not the database or the main business-logic backend.
- **AI layer:** Vercel AI SDK in `app/api/recommend/route.ts`, using structured output and Zod validation.
- **Database + Auth:** Supabase. `supabase/schema.sql` provides an initial schema and row-level security policies. Auth modal supports sign-in/sign-up when env vars are configured.
- **Debugging/observability:** use Mentalify during your debugging workflow; Highlight.io is listed as an optional observability dependency. Complete project-specific SDK setup from the current Highlight docs before treating it as enabled.

## Run locally / in Replit

1. Create a new Replit Node.js project or import this project.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local`.
4. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY` (only needed for the optional AI explanation)
5. In Supabase SQL Editor, run `supabase/schema.sql`.
6. Run `npm run dev`.

Do not expose service-role keys in the browser. Use only the Supabase anon/publishable key on the client, with RLS policies enabled. Store secret keys only in server-side environment variables.

## Builder.io usage

Connect the repository to your Builder.io workflow if you use its visual editing/code generation tools. Preserve the existing calculations, auth boundaries, API validation, and demo-data labels. Do not let visual regeneration replace working logic with nonfunctional mockups. `NEXT_PUBLIC_BUILDER_API_KEY` is reserved for an optional Builder integration; it is not required to run this starter.

## Vercel AI SDK behavior

`POST /api/recommend` receives current harvest details and already-computed market estimates. If `OPENAI_API_KEY` is missing, it returns a clear configuration message; the deterministic calculator remains usable. The model is instructed not to invent market data or alter financial totals.

## Pre-demo checklist

- [ ] Add Supabase env vars and test sign-in/sign-up.
- [ ] Verify RLS in Supabase with two different test users.
- [ ] Add a trusted market-price source before claiming prices are live; display source and timestamp.
- [ ] Test negative, empty, and very large quantities/costs.
- [ ] Test the profit example: ₹4,800 − ₹200 = ₹4,600; ₹7,200 − ₹2,000 − ₹300 = ₹4,900; ₹7,200 − ₹600 − ₹300 = ₹6,300.
- [ ] Confirm image upload file type/size checks and keep grade human-reviewed.
- [ ] Configure Highlight.io with your actual project ID and current SDK instructions before claiming observability is active.
- [ ] Run `npm run build` and fix all errors before deployment.
