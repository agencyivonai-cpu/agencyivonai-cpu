'use client';

import { useEffect, useState } from 'react';

type Product = {
  id: string;
  name: string;
  market: string;
  score: number;
  decision: string;
  margin_pct: number;
  approval_status: string;
  gap_summary: string | null;
};

type Job = {
  id: string;
  product_id: string;
  status: string;
  offer: string | null;
  brand_direction: string | null;
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  async function load() {
    const [p, j] = await Promise.all([fetch('/api/products'), fetch('/api/jobs')]);
    if (p.ok) setProducts((await p.json()).products);
    if (j.ok) setJobs((await j.json()).jobs);
  }

  useEffect(() => { void load(); }, []);

  async function approve(id: string) {
    setBusy(id);
    setMessage('');
    const res = await fetch('/api/products/' + id + '/approve', { method: 'POST' });
    const body = await res.json();
    if (!res.ok) setMessage(body.error || 'Approval blocked');
    else setMessage('Approved. Production job created. Spend and publish gates remain locked.');
    await load();
    setBusy(null);
  }

  return (
    <main className="shell">
      <header>
        <div className="eyebrow">PRODUCT GAP / CONTROL</div>
        <h1>Find. Approve. Produce. Learn.</h1>
        <p>Discovery → evidence → JEV score → approval gate → production pack → measurement loop.</p>
      </header>

      {message && <div className="notice">{message}</div>}

      <section className="stats">
        <div><span>Candidates</span><b>{products.length}</b></div>
        <div><span>Test-ready</span><b>{products.filter(p => p.decision === 'TEST').length}</b></div>
        <div><span>Approved</span><b>{products.filter(p => p.approval_status === 'APPROVED').length}</b></div>
        <div><span>Production jobs</span><b>{jobs.length}</b></div>
      </section>

      <section>
        <h2>Opportunity queue</h2>
        <div className="grid">
          {products.map(product => (
            <article key={product.id}>
              <div className="row"><span>{product.market}</span><strong>{product.score}</strong></div>
              <h3>{product.name}</h3>
              <div className="badge">{product.decision.replace('_', ' ')}</div>
              <p>{product.gap_summary || 'Needs deeper evidence.'}</p>
              <small>{product.margin_pct}% gross margin before CAC</small>
              <button
                disabled={busy === product.id || product.approval_status === 'APPROVED' || product.score < 60 || product.margin_pct < 40}
                onClick={() => void approve(product.id)}
              >
                {product.approval_status === 'APPROVED' ? 'APPROVED' : 'APPROVE → PRODUCTION'}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Production machine</h2>
        <div className="grid">
          {jobs.map(job => (
            <article key={job.id}>
              <div className="badge">{job.status}</div>
              <h3>{job.brand_direction || 'Production pack'}</h3>
              <p>{job.offer || 'Pack generation pending.'}</p>
              <small>Spend gate ON · Publish gate ON</small>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
