// lib/forecast.ts
export function linearRegression(data: number[]) {
  if (data.length < 2) return null;

  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i + 1);
  const y = data;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
  const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0);

  const a = numerator / denominator;
  const b = meanY - a * meanX;

  const predictedNext = a * (n + 1) + b;

  return {
    slope: a,
    intercept: b,
    predictedNext,
  };
}
