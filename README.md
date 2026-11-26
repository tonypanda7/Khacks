# FixProof

> AI-powered civic issue tracking for Chennai — citizens report road hazards with geotagged photos, AI classifies and groups them, authorities fix and verify via Proof-of-Fix.

**🏗️ Built for K! Hacks 4.0 Round 1**

## Architecture

```
┌─────────────────────────────────────┐
│          Vercel (Next.js)           │
│  Pages + API Routes + Prisma ORM   │
└──────────┬──────────────┬───────────┘
           │              │
    ┌──────▼──────┐  ┌────▼─────────┐
    │  Supabase   │  │  AI Service  │
    │  Postgres   │  │  (FastAPI)   │
    │  + pgvector │  │  OpenRouter  │
    │  + Storage  │  │  API         │
    └─────────────┘  └──────────────┘
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker (optional, for local Supabase)

### 1. Install dependencies

```bash
# Web app
cd apps/web
npm install

# AI service
cd ../../services/ai
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your Supabase and OpenRouter credentials
```

### 3. Set up database

```bash
cd apps/web
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Run locally

```bash
# Terminal 1: AI service
cd services/ai
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2: Web app
cd apps/web
npm run dev
```

### 5. Deploy to Vercel

```bash
vercel --prod
```

Set these environment variables in Vercel:
- `DATABASE_URL` — Supabase pooled connection string
- `DIRECT_URL` — Supabase direct connection string
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AI_SERVICE_URL` — URL of deployed AI service
- `SESSION_SECRET` — Random 32+ char string

## Screens

| Screen | Path | Role |
|--------|------|------|
| Login | `/login` | Both |
| Map (home) | `/map` | Both |
| Upload report | `/upload` | User |
| Issue detail | `/issues/[id]` | Both |
| Authority queue | `/queue` | Authority |
| Fix submission | `/fix/[id]` | Authority |
| Metrics | `/metrics` | Both |

## AI Features (via OpenRouter)

All AI scoring uses open-weights models via OpenRouter. No hand-written heuristics.

- **Classification**: Category (pothole/drainage/garbage) + severity 1-5
- **Duplicate Detection**: Embedding similarity + VLM same-defect judgement
- **Priority Scoring**: Context-aware priority 0-100 with rationale
- **Routing**: Auto-route to responsible Chennai departments
- **Proof-of-Fix**: Pairwise verification against evidence bundle

## Stand-ins & Limitations

> [!NOTE]
> This is a hackathon prototype. The following are stand-ins:

- **Auth**: Demo-only (two buttons, no passwords). Labelled as demo convenience.
- **SLA hours**: Placeholder values — not verified against Chennai corporation citizen charter.
- **Authorities**: Seeded from public knowledge — `verified: false` on all entries.
- **Seed data**: 20 issues marked with `SEED` badge, excluded from metrics.
- **Image storage**: Local filesystem (Supabase Storage in production).

## Evaluation

Run eval scripts from `eval/`:
```bash
python eval/scripts/classify_eval.py
python eval/scripts/pof_eval.py
# Results written to eval/out/report.md
```

## License

Hackathon project — no licence declared yet.
