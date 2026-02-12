/**
 * Projection/forecasting utilities — shared math for inventory
 * and sales projection charts.
 */

/**
 * Simple linear regression on a numeric array.
 * x-values are the array indices (0, 1, 2, …).
 */
export function linearRegression(data: number[]): { slope: number; intercept: number } {
     if (data.length === 0) return { slope: 0, intercept: 0 };

     const n = data.length;
     const sumX = data.reduce((sum, _, i) => sum + i, 0);
     const sumY = data.reduce((sum, y) => sum + y, 0);
     const sumXY = data.reduce((sum, y, i) => sum + i * y, 0);
     const sumX2 = data.reduce((sum, _, i) => sum + i * i, 0);

     const denominator = n * sumX2 - sumX * sumX;
     if (denominator === 0) return { slope: 0, intercept: sumY / n };

     const slope = (n * sumXY - sumX * sumY) / denominator;
     const intercept = (sumY - slope * sumX) / n;

     return { slope, intercept };
}

/**
 * Project future values from historical data using linear regression,
 * with optional weekend multipliers and a high-season factor.
 *
 * Used by both inventory-projection-chart and sales-projection-chart.
 */
export function projectFutureValues(
     historicalData: number[],
     futurePoints: number,
     highSeasonMultiplier: number = 1.0,
     period: 'week' | 'month' = 'week'
): number[] {
     const { slope, intercept } = linearRegression(historicalData);
     const projections: number[] = [];

     // Weekend pattern: Fri/Sat have ~40 % more demand
     const weekendMultipliers = period === 'week'
          ? [1.0, 1.0, 1.0, 1.0, 1.4, 1.4, 1.0] // Mon–Sun
          : [1.0, 1.0, 1.0, 1.0]; // Weeks

     for (let i = 0; i < futurePoints; i++) {
          const baseProjection = slope * (historicalData.length + i) + intercept;
          const dayMultiplier = period === 'week'
               ? weekendMultipliers[(i + new Date().getDay()) % 7]
               : 1.0;
          const projected = baseProjection * dayMultiplier * highSeasonMultiplier;
          projections.push(Math.max(0, Math.round(projected)));
     }

     return projections;
}
