/**
 * Two-proportion z-test for A/B experiment significance.
 * Returns p-value (lower = more significant).
 */
export function zTestSignificance(
  controlRate: number,
  variantRate: number,
  sampleSize: number
): number {
  if (sampleSize <= 0) return 1;
  const n1 = sampleSize / 2;
  const n2 = sampleSize / 2;
  const p1 = controlRate / 100;
  const p2 = variantRate / 100;
  const pPool = (p1 * n1 + p2 * n2) / (n1 + n2);
  if (pPool <= 0 || pPool >= 1) return 1;
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  if (se === 0) return 1;
  const z = Math.abs(p2 - p1) / se;
  // Approximate two-tailed p-value using normal CDF
  const p = 2 * (1 - normalCDF(z));
  return Math.max(0, Math.min(1, p));
}

function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

export function significanceLabel(pValue: number): string {
  if (pValue < 0.01) return "Very significant (p < 0.01)";
  if (pValue < 0.05) return "Significant (p < 0.05)";
  if (pValue < 0.10) return "Marginal (p < 0.10)";
  return "Not significant";
}
