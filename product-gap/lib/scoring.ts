export type Decision = 'DROP' | 'HOLD' | 'DEEP_DIVE' | 'TEST';

const clamp = (n: number, min = 0, max = 10) => Math.min(max, Math.max(min, n));

export function scoreProduct(input: {
  retailPrice: number;
  supplierCost: number;
  shippingCost: number;
  feePercent: number;
  demandScore: number;
  gapScore: number;
  adabilityScore: number;
  competitionScore: number;
  riskScore: number;
  supplierConfidence: number;
  freshnessScore: number;
}) {
  const fees = input.retailPrice * (input.feePercent / 100);
  const gross = input.retailPrice - input.supplierCost - input.shippingCost - fees;
  const marginPct = input.retailPrice > 0 ? (gross / input.retailPrice) * 100 : 0;
  const marginScore = clamp((marginPct - 20) / 6);
  const raw =
    clamp(input.demandScore) * 2 +
    clamp(input.gapScore) * 2 +
    clamp(input.adabilityScore) * 1.5 +
    marginScore * 2 +
    clamp(input.supplierConfidence) +
    clamp(input.freshnessScore) * 1.5 -
    clamp(input.competitionScore) -
    clamp(input.riskScore);
  const score = Math.round(clamp(raw, 0, 100));
  let decision: Decision = 'DROP';
  if (score >= 75 && marginPct >= 50) decision = 'TEST';
  else if (score >= 60) decision = 'DEEP_DIVE';
  else if (score >= 45) decision = 'HOLD';
  return { score, decision, marginPct: Math.round(marginPct * 100) / 100 };
}
