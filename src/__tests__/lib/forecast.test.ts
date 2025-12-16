import { linearRegression } from '@/lib/forecast';

describe('linearRegression', () => {
  it('should return null for data with less than 2 points', () => {
    expect(linearRegression([])).toBeNull();
    expect(linearRegression([100])).toBeNull();
  });

  it('should calculate linear regression for valid data', () => {
    const data = [100, 150, 200, 250, 300];
    const result = linearRegression(data);

    expect(result).not.toBeNull();
    expect(result).toHaveProperty('slope');
    expect(result).toHaveProperty('intercept');
    expect(result).toHaveProperty('predictedNext');
    expect(typeof result?.slope).toBe('number');
    expect(typeof result?.intercept).toBe('number');
    expect(typeof result?.predictedNext).toBe('number');
  });

  it('should predict next value correctly for increasing trend', () => {
    const data = [100, 200, 300, 400];
    const result = linearRegression(data);

    expect(result).not.toBeNull();
    // With an increasing trend, predictedNext should be greater than the last value
    expect(result?.predictedNext).toBeGreaterThan(400);
  });

  it('should predict next value correctly for decreasing trend', () => {
    const data = [400, 300, 200, 100];
    const result = linearRegression(data);

    expect(result).not.toBeNull();
    // With a decreasing trend, predictedNext should be less than the last value
    expect(result?.predictedNext).toBeLessThan(100);
  });

  it('should handle constant values', () => {
    const data = [100, 100, 100, 100];
    const result = linearRegression(data);

    expect(result).not.toBeNull();
    expect(result?.slope).toBeCloseTo(0, 5);
    expect(result?.predictedNext).toBeCloseTo(100, 5);
  });

  it('should calculate correct slope for simple linear data', () => {
    const data = [1, 2, 3, 4, 5];
    const result = linearRegression(data);

    expect(result).not.toBeNull();
    // Slope should be close to 1 for this perfect linear progression
    expect(result?.slope).toBeCloseTo(1, 5);
  });
});

