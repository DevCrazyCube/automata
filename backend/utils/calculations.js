// utils/calculations.js
// Pure math helpers for AMM and ROI calculations.

/**
 * Constant product AMM output: x * y = k, with fee applied to the input side.
 *
 * @param {number} inputAmount  Amount of the input asset being swapped in
 * @param {number} inputReserve Reserve of input asset in the pool
 * @param {number} outputReserve Reserve of output asset in the pool
 * @param {number} feePercent   Fee as a decimal (e.g. 0.0025 for 0.25%)
 * @returns {number} Amount of output asset received
 */
function getAmountOut(inputAmount, inputReserve, outputReserve, feePercent = 0.0025) {
  if (inputAmount <= 0 || inputReserve <= 0 || outputReserve <= 0) return 0;
  const inputAfterFee = inputAmount * (1 - feePercent);
  return (outputReserve * inputAfterFee) / (inputReserve + inputAfterFee);
}

/**
 * Apply slippage tolerance to derive a minimum acceptable output.
 *
 * @param {number} expectedOutput
 * @param {number} slippageTolerance e.g. 0.05 for 5%
 */
function minOutputWithSlippage(expectedOutput, slippageTolerance) {
  return expectedOutput * (1 - slippageTolerance);
}

/**
 * Simple ROI: (revenue - cost) / cost * 100.
 */
function calculateROI(cost, revenue) {
  if (cost <= 0) return 0;
  return ((revenue - cost) / cost) * 100;
}

/**
 * Round to a sensible number of decimals for display (never for math).
 */
function round(value, decimals = 4) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Sleep helper used to pace phase progress for the visualization.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  getAmountOut,
  minOutputWithSlippage,
  calculateROI,
  round,
  sleep
};
