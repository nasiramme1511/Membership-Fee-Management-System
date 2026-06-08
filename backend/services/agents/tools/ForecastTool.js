const { sequelize } = require('../../../config/db');
const { getEthiopianYear } = require('../../../utils/ethiopianCalendar');

class ForecastTool {
  /**
   * Generates a collection forecast for the next period.
   * Compares Moving Average, Linear Regression, and Seasonal Trend using MAPE backtesting,
   * selecting the optimal model and yielding a confidence score.
   */
  static async forecastRevenue(user) {
    const Q = sequelize.QueryTypes.SELECT;
    const currentYear = getEthiopianYear();
    const esc = (val) => sequelize.escape(val);

    let scopeClause = '';
    if (user && user.role === 'sector_officer' && user.sectorUnitId) {
      scopeClause = ` AND m.sectorUnitId = ${esc(user.sectorUnitId)} `;
    }

    // Fetch monthly collections for past 2 years to get a clean timeline
    const history = await sequelize.query(`
      SELECT p.periodYear AS year, p.periodMonth AS month, COALESCE(SUM(p.amount), 0) AS total
      FROM payments p
      JOIN members m ON p.memberDbId = m.id
      WHERE p.status = 'Paid' AND p.periodYear >= ${esc(currentYear - 2)} ${scopeClause.replace(/m\./g, 'm.')}
      GROUP BY p.periodYear, p.periodMonth
      ORDER BY p.periodYear ASC, p.periodMonth ASC
    `, { type: Q });

    // Format historical data as a sequence of numbers
    const series = history.map(h => Number(h.total));
    const rawData = history.map(h => ({
      name: `${h.month}/${h.year}`,
      amount: Number(h.total)
    }));

    if (series.length < 3) {
      // Fallback for insufficient data
      const avg = series.length > 0 ? series.reduce((a, b) => a + b, 0) / series.length : 10000;
      return {
        predictedRevenue: Math.round(avg),
        confidence: 70,
        trend: 'Stable',
        modelUsed: 'Historical Average (Fallback)',
        historicalData: rawData,
        message: 'Insufficient historical periods to backtest advanced forecasting models. Showing baseline average.'
      };
    }

    // Define the three forecasting algorithms
    const runMovingAverage = (data, windowSize = 3) => {
      if (data.length < windowSize) return data[data.length - 1];
      const slice = data.slice(-windowSize);
      return slice.reduce((a, b) => a + b, 0) / windowSize;
    };

    const runLinearRegression = (data) => {
      const n = data.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      for (let i = 0; i < n; i++) {
        const x = i + 1;
        const y = data[i];
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
      }
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      return {
        forecast: slope * (n + 1) + intercept,
        slope
      };
    };

    const runSeasonalTrend = (data, historyObjects) => {
      // Ethiopian calendar has 13 months. If we have > 13 months, look back 13 months.
      if (data.length >= 13) {
        const lookback = data[data.length - 13];
        // Calculate general growth rate of the last 3 months vs same period 13 months ago
        let sumCurrent = 0;
        let sumPrev = 0;
        for (let i = 1; i <= 3; i++) {
          sumCurrent += data[data.length - i];
          sumPrev += data[data.length - i - 13];
        }
        const growthFactor = sumPrev > 0 ? sumCurrent / sumPrev : 1;
        return lookback * growthFactor;
      }
      // Fallback: apply last-month trend growth rate
      const growth = data[data.length - 1] / (data[data.length - 2] || 1);
      return data[data.length - 1] * (growth > 0.5 && growth < 2 ? growth : 1.02);
    };

    // Backtest models to compute Mean Absolute Percentage Error (MAPE)
    // We will simulate forecasting for the last 3 months
    const backtestMonths = Math.min(3, series.length - 2);
    let errorMA = 0;
    let errorLR = 0;
    let errorST = 0;

    for (let t = series.length - backtestMonths; t < series.length; t++) {
      const trainData = series.slice(0, t);
      const actual = series[t];

      // MA
      const predMA = runMovingAverage(trainData);
      errorMA += Math.abs((actual - predMA) / (actual || 1));

      // LR
      const predLR = runLinearRegression(trainData).forecast;
      errorLR += Math.abs((actual - predLR) / (actual || 1));

      // ST
      const predST = runSeasonalTrend(trainData, history.slice(0, t));
      errorST += Math.abs((actual - predST) / (actual || 1));
    }

    const mapeMA = (errorMA / backtestMonths) * 100;
    const mapeLR = (errorLR / backtestMonths) * 100;
    const mapeST = (errorST / backtestMonths) * 100;

    // Pick best model based on lowest MAPE
    let bestModel = 'Moving Average';
    let minMape = mapeMA;
    let predictedRevenue = runMovingAverage(series);

    if (mapeLR < minMape) {
      bestModel = 'Linear Regression';
      minMape = mapeLR;
      predictedRevenue = runLinearRegression(series).forecast;
    }
    if (mapeST < minMape) {
      bestModel = 'Seasonal Trend Detection';
      minMape = mapeST;
      predictedRevenue = runSeasonalTrend(series, history);
    }

    // Clamp confidence score: 100 - minMape
    const confidence = Math.max(50, Math.min(99, Math.round(100 - minMape)));

    // Calculate overall trend direction from LR slope
    const lrResult = runLinearRegression(series);
    const trend = lrResult.slope > 1000 ? 'Increasing' : lrResult.slope < -1000 ? 'Decreasing' : 'Stable';

    // Round predicted revenue
    predictedRevenue = Math.max(0, Math.round(predictedRevenue));

    return {
      predictedRevenue,
      confidence,
      trend,
      modelUsed: bestModel,
      historicalData: rawData,
      mape: Number(minMape.toFixed(2))
    };
  }
}

module.exports = ForecastTool;
