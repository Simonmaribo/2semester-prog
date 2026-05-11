// Udarbejdet i samspil med AI (Claude).
// Simulerer en investeringscase år-for-år.

class SimulationEngine {
  static simulate(input) {
    const totalPurchaseCosts = input.purchaseCosts.reduce((sum, c) => sum + c.amount, 0);
    const totalLoanAmount = input.loans.reduce((sum, l) => sum + l.amount, 0);
    const totalInitialInvestment = input.purchasePrice + totalPurchaseCosts - totalLoanAmount;

    let annualOperatingCosts = 0;
    for (const c of input.operatingCosts) {
      annualOperatingCosts += c.monthlyAmount * 12;
    }

    const loanBalances = input.loans.map(l => l.amount);

    const yearlyResults = [];
    let cumulativeCashflow = -totalInitialInvestment;
    let accumulatedRenovationValue = 0;

    // år 0 = købstidspunktet
    yearlyResults.push({
      year: 0,
      propertyValue: input.purchasePrice,
      totalDebt: totalLoanAmount,
      equity: input.purchasePrice - totalLoanAmount,
      annualInterestPaid: 0,
      annualPrincipalPaid: 0,
      annualLoanPayments: 0,
      annualOperatingCosts: 0,
      annualRentalIncome: 0,
      annualRenovationCosts: 0,
      annualCashflow: -totalInitialInvestment,
      cumulativeCashflow,
      roi: 0,
      afkastgrad: 0,
    });

    for (let year = 1; year <= input.simulationYears; year++) {
      const renovationValueThisYear = SimulationEngine.renoveringsVærdi(
        input.renovations, year
      );
      accumulatedRenovationValue += renovationValueThisYear;

      const propertyValue = SimulationEngine.ejendomsværdi(
        input.purchasePrice,
        input.annualAppreciationPct,
        year,
        accumulatedRenovationValue
      );

      let totalDebt = 0;
      let annualLoanPayments = 0;
      let totalRente = 0;
      let totalAfdrag = 0;

      for (let i = 0; i < input.loans.length; i++) {
        const loan = input.loans[i];
        let saldo = loanBalances[i];
        if (saldo <= 0) continue;

        const monthlyRate = loan.interestRatePct / 100 / 12;
        const globalMonthStart = (year - 1) * 12;
        let årRente = 0;
        let årAfdrag = 0;

        for (let month = 1; month <= 12; month++) {
          const globalMonth = globalMonthStart + month;
          if (globalMonth > loan.termYears * 12) break;

          const månedRente = saldo * monthlyRate;

          let månedAfdrag;
          if (globalMonth <= loan.interestOnlyYears * 12) {
            månedAfdrag = 0;
          } else {
            // efter afdragsfrihed: behandl restgælden som et nyt annuitetslån
            const remainingMonths = loan.termYears * 12 - Math.max(globalMonth - 1, loan.interestOnlyYears * 12);

            if (remainingMonths <= 0 || monthlyRate <= 0) {
              månedAfdrag = saldo;
            } else {
              const rentefaktor = Math.pow(1 + monthlyRate, remainingMonths);
              const payment = saldo * (monthlyRate * rentefaktor) / (rentefaktor - 1);
              månedAfdrag = payment - månedRente;
            }
          }

          årRente += månedRente;
          årAfdrag += månedAfdrag;
          saldo = Math.max(0, saldo - månedAfdrag);
        }

        loanBalances[i] = saldo;
        totalDebt += saldo;
        annualLoanPayments += årRente + årAfdrag;
        totalRente += årRente;
        totalAfdrag += årAfdrag;
      }

      const equity = propertyValue - totalDebt;

      let annualRentalIncome = 0;
      if (input.rental && input.rental.isRental) {
        const annualIncrease = input.rental.annualRentIncreasePct || 0;
        const adjustedMonthlyRent = input.rental.monthlyRent * Math.pow(1 + annualIncrease / 100, year - 1);
        const effectiveMonthlyRent = adjustedMonthlyRent * (1 - input.rental.vacancyRatePct / 100);
        annualRentalIncome = effectiveMonthlyRent * 12;
      }

      const renovationCostThisYear = SimulationEngine.renoveringsOmkostning(
        input.renovations, year
      );
      const annualCashflow = annualRentalIncome - annualLoanPayments - annualOperatingCosts - renovationCostThisYear;
      cumulativeCashflow += annualCashflow;

      // CAGR
      let roi = 0;
      if (totalInitialInvestment > 0 && equity > 0) {
        roi = (Math.pow(equity / totalInitialInvestment, 1 / year) - 1) * 100;
      }

      const netOperatingIncome = annualRentalIncome - annualOperatingCosts;
      let afkastgrad = 0;
      if (propertyValue > 0) {
        afkastgrad = (netOperatingIncome / propertyValue) * 100;
      }

      yearlyResults.push({
        year,
        propertyValue: Math.round(propertyValue),
        totalDebt: Math.round(totalDebt),
        equity: Math.round(equity),
        annualInterestPaid: Math.round(totalRente),
        annualPrincipalPaid: Math.round(totalAfdrag),
        annualLoanPayments: Math.round(annualLoanPayments),
        annualOperatingCosts: Math.round(annualOperatingCosts),
        annualRentalIncome: Math.round(annualRentalIncome),
        annualRenovationCosts: Math.round(renovationCostThisYear),
        annualCashflow: Math.round(annualCashflow),
        cumulativeCashflow: Math.round(cumulativeCashflow),
        roi: Math.round(roi * 100) / 100,
        afkastgrad: Math.round(afkastgrad * 100) / 100,
      });
    }

    return {
      yearlyResults,
      totalInitialInvestment: Math.round(totalInitialInvestment),
    };
  }

  static ejendomsværdi(basePrice, annualAppreciationPct, year, accumulatedRenovationValue = 0) {
    return basePrice * Math.pow(1 + annualAppreciationPct / 100, year) + accumulatedRenovationValue;
  }

  static renoveringsVærdi(renovations, year) {
    const startMonth = (year - 1) * 12 + 1;
    const endMonth = year * 12;
    let sum = 0;
    for (const r of renovations) {
      if (r.monthInPeriod >= startMonth && r.monthInPeriod <= endMonth) {
        sum += r.valueIncrease;
      }
    }
    return sum;
  }

  static renoveringsOmkostning(renovations, year) {
    const startMonth = (year - 1) * 12 + 1;
    const endMonth = year * 12;
    let sum = 0;
    for (const r of renovations) {
      if (r.monthInPeriod >= startMonth && r.monthInPeriod <= endMonth) {
        sum += r.cost;
      }
    }
    return sum;
  }
}

module.exports = { SimulationEngine };
