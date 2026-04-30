import { SimulationEngine } from '../services/SimulationEngine.js';

// Testcase: Hus til 2M, 80% lån, udlejning med 5% tomgang
const baseInput = {
  purchasePrice: 2_000_000,
  purchaseCosts: [{ label: 'Tinglysning', amount: 30_000 }],
  loans: [{
    amount: 1_600_000,
    interestRatePct: 3.0,
    termYears: 30,
    interestOnlyYears: 0,
    loanType: 'fixed',
  }],
  renovations: [],
  operatingCosts: [
    { category: 'Ejendomsskat', monthlyAmount: 2000 },
    { category: 'Forsikring', monthlyAmount: 500 },
  ],
  rental: {
    isRental: true,
    monthlyRent: 12_000,
    vacancyRatePct: 5,
    annualRentIncreasePct: 2,
  },
  simulationYears: 30,
  annualAppreciationPct: 2.0,
};

describe('SimulationEngine', () => {
  test('beregner korrekt startudbetaling (2M + 30K omk. - 1.6M lån = 430K)', () => {
    const result = SimulationEngine.simulate(baseInput);
    expect(result.totalInitialInvestment).toBe(430_000);
  });

  test('egenkapital vokser over simuleringsperioden', () => {
    const result = SimulationEngine.simulate(baseInput);
    const year1 = result.yearlyResults[1].equity;
    const year30 = result.yearlyResults[30].equity;
    expect(year30).toBeGreaterThan(year1);
  });

  test('lejeindtægt stiger årligt og tomgang fratrækkes korrekt', () => {
    const result = SimulationEngine.simulate(baseInput);

    // År 1: 12.000 kr/md × 12 × (1 − 5% tomgang) = 136.800 kr
    expect(result.yearlyResults[1].annualRentalIncome).toBe(136_800);

    // År 10: 12.000 × (1,02)^9 stigninger × 12 × 0,95 tomgang = 163.489 kr
    expect(result.yearlyResults[10].annualRentalIncome).toBe(163_489);
  });
});

