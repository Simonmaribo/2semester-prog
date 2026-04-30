// Udarbejdet i samspil med AI (Claude).
//
// Annuitetsformlen:
//   M = P * r(1+r)^n / ((1+r)^n - 1)
//   M = månedlig ydelse
//   P = lånebeløb (hovedstol / principal)
//   r = månedlig rente (årlig rente / 12)
//   n = antal måneder i lånets løbetid
//

export class LoanCalculator {
  // Beregner den faste månedlige ydelse på et annuitetslån.
  static monthlyAnnuityPayment(principal, annualRatePct, termYears) {
    if (principal <= 0) return 0;

    // Hvis renten er 0, er ydelsen blot lånebeløbet fordelt over alle måneder.
    if (annualRatePct <= 0) return principal / (termYears * 12);

    const monthlyRate = annualRatePct / 100 / 12;
    const totalMonths = termYears * 12;
    const factor = Math.pow(1 + monthlyRate, totalMonths);

    // M = P * r(1+r)^n / ((1+r)^n - 1)
    return principal * (monthlyRate * factor) / (factor - 1);
  }

  // Under afdragsfrihed betales kun renter - intet afdrag.
  // Månedlig ydelse = lånebeløb × månedlig rente.
  static monthlyInterestOnlyPayment(principal, annualRatePct) {
    if (principal <= 0 || annualRatePct <= 0) return 0;
    return principal * (annualRatePct / 100 / 12);
  }

  // Når afdragsfriheden slutter, skal hele lånet afdrages på den resterende
  // løbetid. Det gør ydelsen højere end hvis man havde afdraget fra start,
  // fordi samme hovedstol nu skal betales tilbage over færre måneder.
  static postInterestOnlyPayment(
    principal,
    annualRatePct,
    termYears,
    interestOnlyMonths
  ) {
    const remainingMonths = termYears * 12 - interestOnlyMonths;
    if (remainingMonths <= 0) return 0;

    // Behandl som et nyt annuitetslån med kortere løbetid.
    const remainingYears = remainingMonths / 12;
    return LoanCalculator.monthlyAnnuityPayment(principal, annualRatePct, remainingYears);
  }

  // Hvor meget skyldes der stadig efter X måneder? Bruges til at beregne
  // egenkapital år-for-år i simuleringen.
  static remainingPrincipal(
    principal,
    annualRatePct,
    termYears,
    monthsElapsed,
    interestOnlyMonths
  ) {
    if (principal <= 0) return 0;
    if (monthsElapsed <= 0) return principal;

    const monthlyRate = annualRatePct / 100 / 12;

    // I afdragsfri periode er restgælden uændret - ingen afdrag er betalt.
    if (monthsElapsed <= interestOnlyMonths) {
      return principal;
    }

    const paymentMonths = monthsElapsed - interestOnlyMonths;
    const totalPaymentMonths = termYears * 12 - interestOnlyMonths;

    // Ved 0% rente afdrages lineært.
    if (annualRatePct <= 0) {
      const monthlyPrincipal = principal / totalPaymentMonths;
      const remaining = principal - monthlyPrincipal * paymentMonths;
      return Math.max(0, remaining);
    }

    // Restgældsformel for annuitetslån efter m ydelser:
    //   B = P * (1+r)^m - M * ((1+r)^m - 1) / r
    //   B = restgæld, P = hovedstol, r = månedlig rente,
    //   m = antal ydelser betalt, M = månedlig ydelse
    const payment = LoanCalculator.monthlyAnnuityPayment(principal, annualRatePct, totalPaymentMonths / 12);
    const factor = Math.pow(1 + monthlyRate, paymentMonths);
    const remaining = principal * factor - payment * (factor - 1) / monthlyRate;

    return Math.max(0, remaining);
  }

  // Summerer al rente betalt over hele lånets løbetid.
  static totalInterest(
    principal,
    annualRatePct,
    termYears,
    interestOnlyMonths
  ) {
    const schedule = LoanCalculator.amortizationSchedule(principal, annualRatePct, termYears, interestOnlyMonths);
    return schedule.reduce((sum, year) => sum + year.interestPaid, 0);
  }

  // Amortiseringsplan: år-for-år oversigt over rente, afdrag og restgæld.
  // Bruges til at kunne vise udviklingen i en tabel for den studerende.
  static amortizationSchedule(
    principal,
    annualRatePct,
    termYears,
    interestOnlyMonths
  ){
    const schedule = [];
    let balance = principal;
    const monthlyRate = annualRatePct / 100 / 12;

    for (let year = 1; year <= termYears; year++) {
      const startBalance = balance;
      let yearInterest = 0;
      let yearPrincipal = 0;
      let currentMonthlyPayment = 0;

      for (let month = 1; month <= 12; month++) {
        const globalMonth = (year - 1) * 12 + month;
        if (globalMonth > termYears * 12) break;

        // Rente denne måned = restgæld × månedlig rente.
        const monthInterest = balance * monthlyRate;
        let monthPrincipalPaid;

        if (globalMonth <= interestOnlyMonths) {
          // Afdragsfri periode - kun rente, intet afdrag.
          monthPrincipalPaid = 0;
          currentMonthlyPayment = monthInterest;
        } else {
          // Normal periode - fast ydelse, afdrag = ydelse − rente.
          const payment = LoanCalculator.postInterestOnlyPayment(
            principal, annualRatePct, termYears, interestOnlyMonths
          );
          monthPrincipalPaid = payment - monthInterest;
          currentMonthlyPayment = payment;
        }

        yearInterest += monthInterest;
        yearPrincipal += monthPrincipalPaid;
        balance = Math.max(0, balance - monthPrincipalPaid);
      }

      schedule.push({
        year,
        startBalance,
        interestPaid: Math.round(yearInterest * 100) / 100,
        principalPaid: Math.round(yearPrincipal * 100) / 100,
        endBalance: Math.round(balance * 100) / 100,
        monthlyPayment: Math.round(currentMonthlyPayment * 100) / 100,
      });

      if (balance <= 0) break;
    }

    return schedule;
  }
}
