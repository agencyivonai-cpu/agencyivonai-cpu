import OpenAI from 'openai';

export type ProductionPack = {
  brandDirection: string;
  offer: string;
  productSpec: string;
  supplierQuestions: string[];
  landingPage: string;
  organicPlan: string[];
  adPlan: string[];
  seoPlan: string[];
  trackingPlan: string[];
  nextActions: string[];
};

function fallbackPack(product: Record<string, unknown>): ProductionPack {
  const name = String(product.name || 'Approved product');
  const gap = String(product.gap_summary || 'Validated customer pain to solve');
  return {
    brandDirection: 'Single-product utility brand. Lead with the solved problem, not novelty.',
    offer: name + ' — a better version built around: ' + gap,
    productSpec: 'Convert the validated complaint clusters into must-have OEM requirements before supplier outreach. Do not weaken the spec to hit a lower unit cost.',
    supplierQuestions: [
      'Can you meet the exact gap-fixing specification?',
      'What is MOQ for a sample and for branded production?',
      'Unit price at 50 / 100 / 500 units?',
      'Available certifications for UK/EU?',
      'Defect rate and replacement policy?',
      'Production lead time and shipping options?',
      'Can packaging/manuals be private labelled?',
      'Can you provide recent QC evidence and material specifications?'
    ],
    landingPage: 'Problem → why common versions fail → specific improvement → demonstration → proof → offer → FAQ → risk reversal.',
    organicPlan: [
      'Pain-first 8s demo: show the common failure, then the improved mechanism.',
      'Competitor teardown: three things cheap versions get wrong.',
      'One-feature close-up with a single measurable promise.',
      'Comment-reply video answering the biggest objection.',
      'Before/after workflow with identical task and timer.',
      'Unboxing focused on build quality and detail shots.',
      'Stress test around the highest-frequency complaint.',
      'Who this is NOT for / who gets the most value.',
      'FAQ montage: three concerns in 15 seconds.',
      'Founder-style reason we chose this specification.'
    ],
    adPlan: [
      'Problem agitation → visual fix → CTA.',
      'Side-by-side comparison → proof → CTA.',
      'UGC testimonial structure based on validated complaint.',
      'Feature demo with price anchor.',
      'Objection-first creative.',
      'Short retargeting proof/FAQ creative.'
    ],
    seoPlan: [
      'Create a crawlable product page around problem + category intent.',
      'Publish comparison page versus the common legacy design.',
      'Publish FAQ pages from recurring review complaints.',
      'Use descriptive product/spec copy rather than keyword stuffing.',
      'Add structured product/FAQ data when evidence and pricing are final.',
      'Track search terms and expand only around converting intent.'
    ],
    trackingPlan: [
      'Impression → click CTR by creative.',
      'Landing view → add-to-cart rate.',
      'Add-to-cart → checkout rate.',
      'Checkout → purchase conversion.',
      'CAC and contribution margin after fees/shipping.',
      'Refund/return rate by complaint category.',
      'If CTR falls but CVR holds: refresh creative, keep offer.',
      'If CTR holds but CVR falls: fix offer/page/product proof.',
      'If traffic and search demand both fall: reduce spend and promote next candidate.'
    ],
    nextActions: [
      'Confirm product spec against review evidence.',
      'Verify at least three suppliers.',
      'Order sample only after a separate spend approval.',
      'Build landing page and tracking.',
      'Create organic content batch.',
      'Prepare paid test campaigns without publishing.',
      'Approve public publishing separately.',
      'Approve ad spend separately.',
      'Feed results back into Product Gap scoring.'
    ]
  };
}

export async function generateProductionPack(product: Record<string, unknown>): Promise<ProductionPack> {
  if (!process.env.OPENAI_API_KEY) return fallbackPack(product);

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: 'gpt-6-luna',
      input: [
        {
          role: 'system',
          content: 'You are the production planner inside Product Gap. Never invent verification. Preserve human gates before supplier payments, inventory purchases, paid-media spend, or public auto-publishing. Return only valid JSON.'
        },
        {
          role: 'user',
          content: `Create an execution-ready ecommerce production pack from this approved product record:

${JSON.stringify(product)}

Return JSON with exactly these keys:
brandDirection: string
offer: string
productSpec: string
supplierQuestions: string[]
landingPage: string
organicPlan: string[] with 10 hook + shot + CTA concepts
adPlan: string[] with 6 test hypotheses and stop/continue signals
seoPlan: string[]
trackingPlan: string[] including adaptation rules when sales decline
nextActions: string[] ordered from validation to launch.

Label assumptions. Do not state supplier facts, compliance, performance, demand or customer claims as verified unless present in the product record.`
        }
      ]
    });

    const parsed = JSON.parse(response.output_text) as ProductionPack;
    if (!parsed.offer || !Array.isArray(parsed.organicPlan)) return fallbackPack(product);
    return parsed;
  } catch {
    return fallbackPack(product);
  }
}
