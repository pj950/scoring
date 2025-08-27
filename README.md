<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1LaIElkNF6h2Bh_EKj0XZPsLz6GdIykne

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Setup

- Configure your database: set `DATABASE_URL` in your environment.
- Initialize schema: run the SQL in `schema.sql` once.
- If you are upgrading from an older schema, run any files in `migrations/`.
- For local API proxying, run `vercel dev` on port 3000 so Vite proxy `server.proxy['/api']` works.
