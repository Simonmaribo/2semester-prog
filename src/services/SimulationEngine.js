// Udarbejdet i samspil med AI (Claude).
//
// Simulerer en investeringscase år-for-år (typisk 30 år).
// For hvert år beregnes:
//   - ejendomsværdi (efter værdistigning og evt. renovering)
//   - restgæld og egenkapital
//   - rente, afdrag og samlet låneydelse
//   - drifts- og renoveringsomkostninger
//   - lejeindtægt (hvis udlejning)
//   - cashflow (årligt og kumulativt)
//   - ROI (CAGR) og afkastgrad

export class SimulationEngine {
  static simulate(input) {
    // Startværdier
    const totalPurchaseCosts = input.purchaseCosts.reduce((sum, c) => sum + c.amount, 0);
    const totalLoanAmount = input.loans.reduce((sum, l) => sum + l.amount, 0);
    // Udbetaling = købspris + købsomkostninger − samlede lån
    const totalInitialInvestment = input.purchasePrice + totalPurchaseCosts - totalLoanAmount;

    const annualOperatingCosts = input.operatingCosts.reduce(
      (sum, c) => sum + c.monthlyAmount * 12, 0
    );

    // Vi holder styr på restgælden for hvert lån undervejs i simuleringen.
    const loanBalances = input.loans.map(l => l.amount);

    const yearlyResults = [];
    let cumulativeCashflow = -totalInitialInvestment;
    let accumulatedRenovationValue = 0;

    // År 0 = købstidspunktet. Negativ cashflow fordi udbetalingen er lagt.
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

    // Simulér år 1 til simulationYears.
    for (let year = 1; year <= input.simulationYears; year++) {
      // Renoveringer i året lægger deres værdiforøgelse oven i ejendomsværdien.
      const renovationValueThisYear = SimulationEngine.getRenovationValueForYear(
        input.renovations, year
      );
      accumulatedRenovationValue += renovationValueThisYear;

      // Ejendomsværdi = købspris × (1 + årlig stigning)^år + renoveringsværdi
      const propertyValue = SimulationEngine.calculatePropertyValue(
        input.purchasePrice,
        input.annualAppreciationPct,
        year,
        accumulatedRenovationValue
      );

      // Beregn rente, afdrag og ny restgæld for alle lån i året.
      let totalDebt = 0;
      let annualLoanPayments = 0;
      let totalInterestPaid = 0;
      let totalPrincipalPaid = 0;

      for (let i = 0; i < input.loans.length; i++) {
        const loan = input.loans[i];
        let balance = loanBalances[i];
        if (balance <= 0) continue;

        const monthlyRate = loan.interestRatePct / 100 / 12;
        const globalMonthStart = (year - 1) * 12;
        let yearInterest = 0;
        let yearPrincipal = 0;

        // Måned-for-måned i dette år.
        for (let month = 1; month <= 12; month++) {
          const globalMonth = globalMonthStart + month;
          if (globalMonth > loan.termYears * 12) break;

          // Rente denne måned = restgæld × månedlig rente.
          const monthInterest = balance * monthlyRate;

          let monthPrincipalPaid;
          if (globalMonth <= loan.interestOnlyYears * 12) {
            // Afdragsfri periode - kun rente, intet afdrag.
            monthPrincipalPaid = 0;
          } else {
            // Efter afdragsfriheden: ydelsen beregnes som et nyt annuitetslån
            // med den resterende løbetid og den nuværende restgæld.
            // Derfor bliver ydelsen højere end hvis man afdrog fra start.
            const remainingMonths = loan.termYears * 12 - Math.max(globalMonth - 1, loan.interestOnlyYears * 12);

            if (remainingMonths <= 0 || monthlyRate <= 0) {
              // Sidste måned - betal hele restgælden.
              monthPrincipalPaid = balance;
            } else {
              // Annuitetsformlen: M = P * r(1+r)^n / ((1+r)^n - 1)
              const factor = Math.pow(1 + monthlyRate, remainingMonths);
              const payment = balance * (monthlyRate * factor) / (factor - 1);
              // Afdrag = ydelse − rente
              monthPrincipalPaid = payment - monthInterest;
            }
          }

          yearInterest += monthInterest;
          yearPrincipal += monthPrincipalPaid;
          balance = Math.max(0, balance - monthPrincipalPaid);
        }

        // Gem restgælden til næste år.
        loanBalances[i] = balance;
        totalDebt += balance;
        annualLoanPayments += yearInterest + yearPrincipal;
        totalInterestPaid += yearInterest;
        totalPrincipalPaid += yearPrincipal;
      }

      // Egenkapital = ejendomsværdi − restgæld
      const equity = propertyValue - totalDebt;

      // Lejeindtægt (kun ved udlejning).
      let annualRentalIncome = 0;
      if (input.rental && input.rental.isRental) {
        // Huslejen stiger årligt med annualRentIncreasePct.
        const annualIncrease = input.rental.annualRentIncreasePct || 0;
        const adjustedMonthlyRent = input.rental.monthlyRent * Math.pow(1 + annualIncrease / 100, year - 1);
        // Effektiv husleje = bruttoleje − forventet tomgang.
        const effectiveMonthlyRent = adjustedMonthlyRent * (1 - input.rental.vacancyRatePct / 100);
        annualRentalIncome = effectiveMonthlyRent * 12;
      }

      // Cashflow = indtægter − udgifter for året.
      const renovationCostThisYear = SimulationEngine.getRenovationCostForYear(
        input.renovations, year
      );
      const annualCashflow = annualRentalIncome - annualLoanPayments - annualOperatingCosts - renovationCostThisYear;
      cumulativeCashflow += annualCashflow;

      // ROI (Return on Investment) som årlig gennemsnitlig vækst i egenkapital.
      // Formel (CAGR): ((slutværdi / startværdi)^(1/år) − 1) × 100
      let roi = 0;
      if (totalInitialInvestment > 0 && equity > 0) {
        roi = (Math.pow(equity / totalInitialInvestment, 1 / year) - 1) * 100;
      }

      // Afkastgrad = driftsindkomst / ejendomsværdi × 100
      // Viser hvor godt selve driften forrenter ejendommen (uafhængigt af finansiering).
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
        annualInterestPaid: Math.round(totalInterestPaid),
        annualPrincipalPaid: Math.round(totalPrincipalPaid),
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

  // Ejendomsværdi i år X = købspris × (1 + årlig stigning)^år + akkumuleret renoveringsværdi.
  static calculatePropertyValue(
    basePrice,
    annualAppreciationPct,
    year,
    accumulatedRenovationValue = 0
  ) {
    const appreciatedValue = basePrice * Math.pow(1 + annualAppreciationPct / 100, year);
    return appreciatedValue + accumulatedRenovationValue;
  }

  // Summerer værdiforøgelsen af alle renoveringer der falder inden for et givet år.
  static getRenovationValueForYear(
    renovations,
    year
  ) {
    const yearStartMonth = (year - 1) * 12 + 1;
    const yearEndMonth = year * 12;

    return renovations
      .filter(r => r.monthInPeriod >= yearStartMonth && r.monthInPeriod <= yearEndMonth)
      .reduce((sum, r) => sum + r.valueIncrease, 0);
  }

  // Summerer prisen på alle renoveringer der falder inden for et givet år.
  static getRenovationCostForYear(
    renovations,
    year
  ) {
    const yearStartMonth = (year - 1) * 12 + 1;
    const yearEndMonth = year * 12;

    return renovations
      .filter(r => r.monthInPeriod >= yearStartMonth && r.monthInPeriod <= yearEndMonth)
      .reduce((sum, r) => sum + r.cost, 0);
  }
}
