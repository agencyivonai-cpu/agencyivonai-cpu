import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const allowed = new Set([
  'IMPRESSION','CLICK','LANDING_VIEW','ADD_TO_CART','CHECKOUT','PURCHASE',
  'REFUND','RETURN','AD_SPEND','REVENUE','CREATIVE_PUBLISHED','CREATIVE_PAUSED'
]);

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!allowed.has(String(body.eventType || ''))) {
    return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data, error } = await db.from('product_gap_events').insert({
    product_id: body.productId || null,
    job_id: body.jobId || null,
    event_type: body.eventType,
    channel: body.channel || null,
    metric: body.metric || null,
    value: body.value == null ? null : Number(body.value),
    metadata: body.metadata || {}
  }).select('*').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data }, { status: 201 });
}
