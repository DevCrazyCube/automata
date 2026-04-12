// test/run-smoke.js
// End-to-end smoke test. Runs all 6 phases in simulation mode using a
// fake Socket.io server so the automation can be exercised without
// network I/O. Exits non-zero on any error.

const { runAutomation } = require('../automation-wrapper');

function makeFakeIo() {
  const events = [];
  return {
    events,
    emit(event, payload) {
      events.push({ event, payload });
    }
  };
}

(async () => {
  const io = makeFakeIo();
  // Shorten delays for test speed.
  process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'warn';
  try {
    const report = await runAutomation({ io, configOverride: { mode: 'simulation' } });
    const eventTypes = [...new Set(io.events.map((e) => e.event))].sort();

    const phaseStarts = io.events.filter((e) => e.event === 'phase_started').length;
    const phaseCompletes = io.events.filter((e) => e.event === 'phase_completed').length;

    if (phaseStarts !== 6 || phaseCompletes !== 6) {
      console.error('FAIL: expected 6 phase_started and 6 phase_completed events, got',
        { phaseStarts, phaseCompletes });
      process.exit(1);
    }

    if (!report.success) {
      console.error('FAIL: report.success was false', report);
      process.exit(1);
    }

    console.log('SMOKE TEST PASSED');
    console.log('  events emitted    :', io.events.length);
    console.log('  unique event types:', eventTypes.join(', '));
    console.log('  duration (s)      :', report.duration);
    console.log('  revenue (USDT)    :', report.revenue);
    console.log('  profit  (USDT)    :', report.totalProfit);
    console.log('  roi     (%)       :', report.roi);
    process.exit(0);
  } catch (error) {
    console.error('SMOKE TEST FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
