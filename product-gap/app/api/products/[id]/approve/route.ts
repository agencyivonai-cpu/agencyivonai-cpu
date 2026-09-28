import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateProductionPack } from '@/lib/production-pack';

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = supabaseAdmin();

  const { data: product, error } = await db
    .from('product_gap_products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !product) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
  }

  if (product.approval_status === 'APPROVED' && product.production_job_id) {
    const { data: existingJob } = await db
      .from('product_gap_jobs')
      .select('*')
      .eq('id', product.production_job_id)
      .single();
    return NextResponse.json({ ok: true, alreadyApproved: true, job: existingJob });
  }

  if (product.score < 60 || product.margin_pct < 40) {
    return NextResponse.json(
      { error: 'Approval gate requires score ≥60 and gross margin ≥40%.' },
      { status: 409 }
    );
  }

  const pack = await generateProductionPack(product);

  const { data: job, error: jobError } = await db
    .from('product_gap_jobs')
    .insert({
      product_id: product.id,
      status: 'READY_FOR_EXECUTION',
      brand_direction: pack.brandDirection,
      offer: pack.offer,
      product_spec: pack.productSpec,
      supplier_questions: pack.supplierQuestions,
      landing_page: pack.landingPage,
      organic_plan: pack.organicPlan,
      ad_plan: pack.adPlan,
      seo_plan: pack.seoPlan,
      tracking_plan: pack.trackingPlan,
      next_actions: pack.nextActions,
      spend_gate: true,
      publish_gate: true
    })
    .select('*')
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: jobError?.message || 'Could not create production job' },
      { status: 500 }
    );
  }

  const approvedAt = new Date().toISOString();
  await db
    .from('product_gap_products')
    .update({
      approval_status: 'APPROVED',
      approved_at: approvedAt,
      production_job_id: job.id,
      updated_at: approvedAt
    })
    .eq('id', id);

  await db.from('product_gap_events').insert({
    product_id: product.id,
    job_id: job.id,
    event_type: 'APPROVED_TO_PRODUCTION',
    metadata: { score: product.score, margin_pct: product.margin_pct }
  });

  return NextResponse.json({ ok: true, job }, { status: 201 });
}
