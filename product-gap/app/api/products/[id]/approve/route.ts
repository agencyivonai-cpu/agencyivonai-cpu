import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = supabaseAdmin();
  const { data: product, error } = await db
    .from('product_gap_products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !product) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
  if (product.approval_status === 'APPROVED') return NextResponse.json({ ok: true, alreadyApproved: true });
  if (product.score < 60 || product.margin_pct < 40) {
    return NextResponse.json({ error: 'Approval gate requires score ≥60 and gross margin ≥40%.' }, { status: 409 });
  }

  const { data: job, error: jobError } = await db
    .from('product_gap_jobs')
    .insert({
      product_id: product.id,
      status: 'READY_FOR_PACK',
      spend_gate: true,
      publish_gate: true,
      next_actions: [
        'Generate evidence-backed product/OEM spec',
        'Shortlist and verify suppliers',
        'Build offer and landing page',
        'Generate organic creative matrix',
        'Prepare paid creative matrix',
        'Configure measurement before any spend'
      ]
    })
    .select('*')
    .single();

  if (jobError || !job) return NextResponse.json({ error: jobError?.message || 'Could not create job' }, { status: 500 });

  await db
    .from('product_gap_products')
    .update({ approval_status: 'APPROVED', approved_at: new Date().toISOString(), production_job_id: job.id })
    .eq('id', id);

  return NextResponse.json({ ok: true, job });
}
