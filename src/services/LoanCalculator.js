// Udarbejdet i samspil med AI (Claude).
// Annuitetsformel: M = P * r(1+r)^n / ((1+r)^n - 1)

class LoanCalculator {
  static månedligYdelse(hovedstol, rentePct, løbetidÅr) {
    if (hovedstol <= 0) return 0;
    if (rentePct <= 0) return hovedstol / (løbetidÅr * 12);

    const monthlyRate = rentePct / 100 / 12;
    const totalMonths = løbetidÅr * 12;
    const rentefaktor = Math.pow(1 + monthlyRate, totalMonths);
    return hovedstol * (monthlyRate * rentefaktor) / (rentefaktor - 1);
  }

  static afdragsfriYdelse(hovedstol, rentePct) {
    if (hovedstol <= 0 || rentePct <= 0) return 0;
    return hovedstol * (rentePct / 100 / 12);
  }

  // når afdragsfriheden slutter fordeles restgælden over den resterende løbetid
  static ydelseEfterAfdragsfri(hovedstol, rentePct, løbetidÅr, afdragsfriMdr) {
    const remainingMonths = løbetidÅr * 12 - afdragsfriMdr;
    if (remainingMonths <= 0) return 0;
    return LoanCalculator.månedligYdelse(hovedstol, rentePct, remainingMonths / 12);
  }

  static restgæld(hovedstol, rentePct, løbetidÅr, månederGået, afdragsfriMdr) {
    if (hovedstol <= 0) return 0;
    if (månederGået <= 0) return hovedstol;
    if (månederGået <= afdragsfriMdr) return hovedstol;

    const monthlyRate = rentePct / 100 / 12;
    const paymentMonths = månederGået - afdragsfriMdr;
    const totalPaymentMonths = løbetidÅr * 12 - afdragsfriMdr;

    if (rentePct <= 0) {
      const monthly = hovedstol / totalPaymentMonths;
      return Math.max(0, hovedstol - monthly * paymentMonths);
    }

    const payment = LoanCalculator.månedligYdelse(hovedstol, rentePct, totalPaymentMonths / 12);
    const rentefaktor = Math.pow(1 + monthlyRate, paymentMonths);
    return Math.max(0, hovedstol * rentefaktor - payment * (rentefaktor - 1) / monthlyRate);
  }

  static samletRente(hovedstol, rentePct, løbetidÅr, afdragsfriMdr) {
    const plan = LoanCalculator.ydelsesplan(hovedstol, rentePct, løbetidÅr, afdragsfriMdr);
    return plan.reduce((sum, y) => sum + y.rente, 0);
  }

  // år-for-år tabel: rente, afdrag, restgæld
  static ydelsesplan(hovedstol, rentePct, løbetidÅr, afdragsfriMdr) {
    const plan = [];
    let saldo = hovedstol;
    const monthlyRate = rentePct / 100 / 12;

    for (let year = 1; year <= løbetidÅr; year++) {
      const startSaldo = saldo;
      let årRente = 0;
      let årAfdrag = 0;
      let månedligYdelse = 0;

      for (let month = 1; month <= 12; month++) {
        const globalMonth = (year - 1) * 12 + month;
        if (globalMonth > løbetidÅr * 12) break;

        const månedRente = saldo * monthlyRate;
        let månedAfdrag;

        if (globalMonth <= afdragsfriMdr) {
          månedAfdrag = 0;
          månedligYdelse = månedRente;
        } else {
          const payment = LoanCalculator.ydelseEfterAfdragsfri(
            hovedstol, rentePct, løbetidÅr, afdragsfriMdr
          );
          månedAfdrag = payment - månedRente;
          månedligYdelse = payment;
        }

        årRente += månedRente;
        årAfdrag += månedAfdrag;
        saldo = Math.max(0, saldo - månedAfdrag);
      }

      plan.push({
        year,
        startSaldo,
        rente: Math.round(årRente * 100) / 100,
        afdrag: Math.round(årAfdrag * 100) / 100,
        slutSaldo: Math.round(saldo * 100) / 100,
        månedligYdelse: Math.round(månedligYdelse * 100) / 100,
      });

      if (saldo <= 0) break;
    }

    return plan;
  }
}

module.exports = { LoanCalculator };
