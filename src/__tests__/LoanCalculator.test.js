const { LoanCalculator } = require('../services/LoanCalculator.js');

describe('LoanCalculator', () => {
  test('månedlig ydelse på 1 million ved 3% rente over 30 år', () => {
    const payment = LoanCalculator.månedligYdelse(1000000, 3.0, 30);
    expect(payment).toBeCloseTo(4216.04, 0);
  });

  test('ydelse er højere efter afdragsfri periode', () => {
    const normal = LoanCalculator.månedligYdelse(1000000, 3.0, 30);
    const efter = LoanCalculator.ydelseEfterAfdragsfri(1000000, 3.0, 30, 120);
    expect(efter).toBeGreaterThan(normal);
  });

  test('restgæld er 0 efter 30 år', () => {
    expect(LoanCalculator.restgæld(1000000, 3.0, 30, 360, 0)).toBeCloseTo(0, 0);
  });
});
