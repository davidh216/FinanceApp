// The date every test runs on. Mock data and "this month" calculations both
// read the current date, so pinning it makes totals the same on every run.
// Mid-month and mid-day, so a slow test run can't cross a date boundary.
export const TEST_TODAY = new Date(2025, 5, 15, 12, 0, 0); // 15 June 2025

// Replaces the global Date so that `new Date()` and `Date.now()` start from
// TEST_TODAY. The clock still advances normally from there, so timers and
// elapsed-time measurements keep working.
export const pinClock = (today: Date = TEST_TODAY) => {
  const RealDate = Date;
  const offset = today.getTime() - RealDate.now();

  class PinnedDate extends RealDate {
    constructor(...args: unknown[]) {
      if (args.length === 0) {
        super(RealDate.now() + offset);
      } else {
        // @ts-expect-error: forwarding Date's overloaded constructor arguments
        super(...args);
      }
    }

    static now() {
      return RealDate.now() + offset;
    }
  }

  global.Date = PinnedDate as DateConstructor;
};
