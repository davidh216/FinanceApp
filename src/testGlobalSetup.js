// Runs once before Jest starts its workers, which inherit this environment.
// Tests run in a US timezone rather than UTC so date bugs that only appear
// away from UTC (like parsing "YYYY-MM-DD" as UTC midnight) show up in CI.
module.exports = async () => {
  process.env.TZ = 'America/New_York';
};
