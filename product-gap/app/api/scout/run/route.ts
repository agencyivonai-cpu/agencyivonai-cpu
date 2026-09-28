import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { scoreProduct } from '@/lib/scoring';

type Candidate = {
  name: string;
  demandScore: number;
  freshnessScore: number;
  adabilityScore: number;
  reason: string;
};

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === 'Bearer ' + secret;
}

async function extractCandidates(url: string): Promise<Candidate[]> {
  const page = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0 ProductGapResearch/1.0' },
    signal: AbortSignal.timeout(12000)
  });
  if (!page.ok) return [];
  const html = (await page.text()).slice(0, 100000);
  if (!process.env.OPENAI_API_KEY) return [];

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: 'gpt-6-luna',
    input: `You are the cheap discovery worker for Product Gap.
Extract at most 5 PHYSICAL consumer products or product categories from the page content below.
Only include items supported by the page. Ignore software-only products.
Estimate demandScore, freshnessScore and adabilityScore from 0-10 conservatively.
Return ONLY a JSON array with objects:
{"name":"...", "demandScore":0, "freshnessScore":0, "adabilityScore":0, "reason":"short evidence"}

PAGE:
${html}`
  });

  try {
    const parsed = JSON.parse(response.output_text);
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = supabaseAdmin();
  const { data: sources, error } = await db
    .from('product_gap_sources')
    .select('*')
    .eq('active', true)
    .order('tier', { ascending: true })
    .limit(6);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let added = 0;
  let scanned = 0;

  for (const source of sources || []) {
    scanned++;
    try {
      const candidates = await extractCandidates(source.url);
      const seen = new Set<string>((source.seen_names || []).map((x: string) => x.toLowerCase().trim()));
      const fresh = candidates.filter(c => c.name && !seen.has(c.name.toLowerCase().trim()));

      for (const candidate of fresh) {
        const scored = scoreProduct({
          retailPrice: 0,
          supplierCost: 0,
          shippingCost: 0,
          feePercent: 12,
          demandScore: Number(candidate.demandScore || 0),
          gapScore: 4,
          adabilityScore: Number(candidate.adabilityScore || 5),
          competitionScore: 5,
          riskScore: 5,
          supplierConfidence: 1,
          freshnessScore: Number(candidate.freshnessScore || 0)
        });

        const { error: insertError } = await db.from('product_gap_products').insert({
          name: candidate.name,
          market: source.market,
          source_url: source.url,
          demand_score: candidate.demandScore,
          gap_score: 4,
          adability_score: candidate.adabilityScore,
          competition_score: 5,
          risk_score: 5,
          freshness_score: candidate.freshnessScore,
          supplier_confidence: 1,
          score: scored.score,
          decision: scored.decision,
          margin_pct: scored.marginPct,
          gap_summary: 'Scout evidence: ' + candidate.reason,
          origin: 'auto'
        });
        if (!insertError) added++;
      }

      await db.from('product_gap_sources').update({
        seen_names: [...(source.seen_names || []), ...fresh.map(c => c.name)].slice(-100),
        last_scan_at: new Date().toISOString(),
        last_result_count: fresh.length
      }).eq('id', source.id);
    } catch {
      continue;
    }
  }

  return NextResponse.json({ ok: true, scanned, added });
}
