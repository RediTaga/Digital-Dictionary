# Digital Dictionary — Neon + API (Vercel) Setup

This project can stay on **GitHub Pages** for hosting the frontend, while a **serverless API** (hosted on Vercel) talks to a **Neon Postgres** database.

## 1) Create the Neon database

1. Create a Neon project (any name).
2. Copy your connection string (DATABASE_URL) from the Neon “Connect” UI.

## 2) Create the table

Run this SQL in Neon’s SQL editor:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS dictionary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  word_lc TEXT GENERATED ALWAYS AS (lower(word)) STORED,
  definition TEXT NOT NULL,
  illustration TEXT NOT NULL,
  recording TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  CONSTRAINT dictionary_entries_word_lc_unique UNIQUE (word_lc)
);
```

## 3) Deploy the API to Vercel

This repo includes a Vercel Serverless Function at:

```
api/entries.ts
```

In Vercel:

1. Import the GitHub repo.
2. Set these Environment Variables:
   - `DATABASE_URL` = your Neon connection string
   - `API_PASSPHRASE` = (optional) any string. If set, all writes require the frontend to send this in the `X-Passphrase` header.
   - `ALLOWED_ORIGIN` = (optional) your GitHub Pages URL, e.g. `https://<user>.github.io/<repo>`. Use `*` during testing.
3. Deploy.

## 4) Point the frontend at your API

Open the app → click **Cloud** (bottom-left) → paste your API base URL:

```
https://<your-vercel-project>.vercel.app
```

If you set `API_PASSPHRASE` on the server, enter the same value in the UI.

Then click **Save** and it will pull data from the database.

## API routes

All routes are under your Vercel deployment:

- `GET    /api/entries`
- `POST   /api/entries`
- `PUT    /api/entries?id=<uuid>`
- `DELETE /api/entries?id=<uuid>`
