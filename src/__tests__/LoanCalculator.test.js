import { LoanCalculator } from '../services/LoanCalculator.js';

describe('LoanCalculator', () => {
  test('beregner korrekt månedlig annuitetsydelse (1M DKK, 3%, 30 år)', () => {
    const payment = LoanCalculator.monthlyAnnuityPayment(1_000_000, 3.0, 30);
    // Forventet: ca. 4216 kr/md (verificeret med standard annuitetsformel)
    expect(payment).toBeCloseTo(4216.04, 0);
  });

  test('ydelse efter afdragsfri periode er højere end normal annuitet', () => {
    // Efter 10 års afdragsfri skal restgælden fordeles over 20 år → højere ydelse
    const normalPayment = LoanCalculator.monthlyAnnuityPayment(1_000_000, 3.0, 30);
    const postIoPayment = LoanCalculator.postInterestOnlyPayment(1_000_000, 3.0, 30, 120);
    expect(postIoPayment).toBeGreaterThan(normalPayment);
  });

  test('restgæld er 0 ved lånets udløb efter 30 år', () => {
    const atEnd = LoanCalculator.remainingPrincipal(1_000_000, 3.0, 30, 360, 0);
    expect(atEnd).toBeCloseTo(0, 0);
  });
});

