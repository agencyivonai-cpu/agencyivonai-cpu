# Product Gap

Autonomous product opportunity engine.

## Architecture

Discovery → evidence → JEV score → human APPROVE → production job → content/store/ad preparation → measurement → adapt/kill/scale.

### Safety gates

APPROVE creates digital production work only. It does **not**:
- purchase samples
- purchase inventory
- launch paid ads
- auto-publish public content

Those stay behind separate spend/publish gates.

## Data

Uses the existing Supabase project with isolated tables:

- product_gap_products
- product_gap_sources
- product_gap_jobs
- product_gap_events

RLS is enabled and anon/authenticated grants are revoked. Server access is via service role only.

## Vercel setup

Root directory: `product-gap`

Environment variables:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- OPENAI_API_KEY (for AI production-pack generation)
- CRON_SECRET

## Current source strategy

Tier A: fresh launches / trend velocity.
Tier B: marketplace cross-checks.
Review mining and supplier research are only run on shortlisted candidates to control cost.
