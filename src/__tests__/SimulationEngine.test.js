const { SimulationEngine } = require('../services/SimulationEngine.js');

const baseInput = {
  purchasePrice: 2000000,
  purchaseCosts: [{ label: 'Tinglysning', amount: 30000 }],
  loans: [{
    amount: 1600000,
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
    monthlyRent: 12000,
    vacancyRatePct: 5,
    annualRentIncreasePct: 2,
  },
  simulationYears: 30,
  annualAppreciationPct: 2.0,
};

describe('SimulationEngine', () => {
  test('beregner udbetaling korrekt', () => {
    const result = SimulationEngine.simulate(baseInput);
    expect(result.totalInitialInvestment).toBe(430000);
  });

  test('egenkapital vokser over simuleringsperioden', () => {
    const result = SimulationEngine.simulate(baseInput);
    expect(result.yearlyResults[30].equity).toBeGreaterThan(result.yearlyResults[1].equity);
  });

  test('lejeindtægt tager højde for tomgang og årlig stigning', () => {
    const result = SimulationEngine.simulate(baseInput);
    expect(result.yearlyResults[1].annualRentalIncome).toBe(136800);
    expect(result.yearlyResults[10].annualRentalIncome).toBe(163489);
  });
});
