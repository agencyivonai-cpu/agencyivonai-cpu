import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from('product_gap_sources')
    .select('*')
    .eq('active', true)
    .order('tier', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sources: data || [] });
}
