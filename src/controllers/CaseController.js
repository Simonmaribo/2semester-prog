const { InvestmentCase } = require('../models/InvestmentCase.js');
const { Property } = require('../models/Property.js');
const { PurchaseCost } = require('../models/PurchaseCost.js');
const { Loan } = require('../models/Loan.js');
const { Renovation } = require('../models/Renovation.js');
const { OperatingCost, OPERATING_COST_CATEGORIES } = require('../models/OperatingCost.js');
const { RentalSettings } = require('../models/RentalSettings.js');
const { LoanCalculator } = require('../services/LoanCalculator.js');

const VALID_TABS = ['purchase', 'financing', 'operating', 'renovations', 'summary'];

function parseRows(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  return Object.values(input);
}

class CaseController {
  static async createCase(req, res, next) {
    try {
      const { property_id, name, description } = req.body;

      if (!name) {
        res.redirect(`/properties/${property_id}`);
        return;
      }

      const property = await Property.findById(parseInt(property_id));
      if (!property || property.user_id !== req.session.userId) {
        return res.status(403).render('error', {
          title: 'Ejendomsprofil ikke fundet', message: 'Ejendomsprofil ikke fundet', error: null,
        });
      }

      const investmentCase = await InvestmentCase.create({
        property_id: parseInt(property_id),
        name,
        description,
      });

      res.redirect(`/cases/${investmentCase.id}`);
    } catch (error) {
      next(error);
    }
  }

  static async showCase(req, res, next) {
    try {
      const investmentCase = await InvestmentCase.findForUser(parseInt(req.params.id), req.session.userId);

      if (!investmentCase) {
        return res.status(404).render('error', {
          title: 'Ikke fundet', message: 'Investeringscase ikke fundet.', error: null,
        });
      }
      const property = await Property.findById(investmentCase.property_id);
      const purchaseCosts = await PurchaseCost.findByCaseId(investmentCase.id);
      const loans = await Loan.findByCaseId(investmentCase.id);
      const renovations = await Renovation.findByCaseId(investmentCase.id);
      const operatingCosts = await OperatingCost.hentForCase(investmentCase.id);
      const rentalSettings = await RentalSettings.findByCaseId(investmentCase.id);

      let tab = 'purchase';
      if (VALID_TABS.includes(req.query.tab)) {
        tab = req.query.tab;
      }

      const price = investmentCase.purchase_price || 0;

      const purchaseCostsForForm = purchaseCosts.length > 0
        ? purchaseCosts.map(c => ({ label: c.label, amount: c.amount }))
        : [
            { label: 'Tinglysningsafgift', amount: 0 },
            { label: 'Advokatudgifter', amount: 10000 },
            { label: 'Bankgebyr', amount: 5000 },
            { label: 'Køberrådgivning', amount: 0 },
          ];

      const loansForForm = loans.length > 0
        ? loans.map(l => ({
            label: l.label, amount: l.amount, interest_rate_pct: l.interest_rate_pct,
            term_years: l.term_years, interest_only_years: l.interest_only_years, loan_type: l.loan_type,
          }))
        : [
            { label: 'Realkreditlån (80%)', amount: Math.round(price * 0.80), interest_rate_pct: 3.5, term_years: 30, interest_only_years: 0, loan_type: 'fixed' },
            { label: 'Banklån (15%)', amount: Math.round(price * 0.15), interest_rate_pct: 5.0, term_years: 10, interest_only_years: 0, loan_type: 'fixed' },
          ];

      const driftBeløb = { 'Ejendomsskat': 1500, 'Forsikring': 800, 'Vedligeholdelse': 1500 };
      const operatingCostsForForm = operatingCosts.length > 0
        ? operatingCosts.map(c => ({ category: c.category, monthly_amount: c.monthly_amount }))
        : OPERATING_COST_CATEGORIES.map(cat => ({ category: cat, monthly_amount: driftBeløb[cat] || 0 }));

      const rentalForForm = rentalSettings || {
        is_rental: false, monthly_rent: 0, vacancy_rate_pct: 5, annual_rent_increase_pct: 2,
      };

      let totalPurchaseCosts = 0;
      for (const c of purchaseCostsForForm) totalPurchaseCosts += c.amount || 0;
      const totalInvestment = (investmentCase.purchase_price || 0) + totalPurchaseCosts;

      let totalLoan = 0;
      for (const l of loansForForm) totalLoan += l.amount || 0;
      const downPayment = totalInvestment - totalLoan;

      let ltv = 0;
      if (investmentCase.purchase_price > 0) {
        ltv = Math.round(totalLoan / investmentCase.purchase_price * 100);
      }

      const monthlyPayments = CaseController.calcMonthlyPayments(loansForForm);
      const worstMonthlyPayment = Math.max(monthlyPayments.during, monthlyPayments.after);

      let totalOperatingMonthly = 0;
      for (const c of operatingCostsForForm) totalOperatingMonthly += c.monthly_amount || 0;

      const vacancyRate = Math.min(0.99, (rentalForForm.vacancy_rate_pct || 0) / 100);

      let requiredMonthlyRent = 0;
      if (vacancyRate < 1) {
        requiredMonthlyRent = Math.ceil((worstMonthlyPayment + totalOperatingMonthly) / (1 - vacancyRate));
      }

      let effectiveRent = 0;
      if (rentalForForm.is_rental) {
        effectiveRent = (rentalForForm.monthly_rent || 0) * (1 - vacancyRate);
      }
      const monthlyCashflow = Math.round(effectiveRent - monthlyPayments.during - totalOperatingMonthly);

      res.render('case', {
        title: investmentCase.name,
        tab,
        investmentCase,
        property,
        purchaseCosts,
        loans,
        renovations,
        operatingCosts,
        rentalSettings,
        operatingCategories: OPERATING_COST_CATEGORIES,
        purchaseCostsForForm,
        loansForForm,
        operatingCostsForForm,
        rentalForForm,
        totals: {
          totalPurchaseCosts: totalPurchaseCosts,
          totalInvestment: totalInvestment,
          totalLoan: totalLoan,
          downPayment: downPayment,
          ltv: ltv,
          totalOperatingMonthly: totalOperatingMonthly,
          worstMonthlyPayment: worstMonthlyPayment,
          requiredMonthlyRent: requiredMonthlyRent,
          monthlyDuring: Math.round(monthlyPayments.during),
          monthlyAfter: Math.round(monthlyPayments.after),
          hasIo: monthlyPayments.hasIo,
          effectiveRent: Math.round(effectiveRent),
          monthlyCashflow: monthlyCashflow,
        },
        flashSuccess: typeof req.query.success === 'string' ? req.query.success : null,
        flashError: typeof req.query.error === 'string' ? req.query.error : null,
      });
    } catch (error) {
      next(error);
    }
  }

  static async savePurchaseData(req, res, next) {
    try {
      const caseId = parseInt(req.params.id);
      const investmentCase = await InvestmentCase.findForUser(caseId, req.session.userId);
      if (!investmentCase) {
        return res.status(403).redirect('/properties');
      }

      await InvestmentCase.update(caseId, {
        purchase_price: parseFloat(req.body.purchase_price) || 0,
        simulation_years: parseInt(req.body.simulation_years) || 30,
        annual_appreciation_pct: parseFloat(req.body.annual_appreciation_pct) || 2,
      });

      const costs = parseRows(req.body.costs).map((c) => ({
        label: (c.label || '').trim(),
        amount: parseFloat(c.amount) || 0,
      }));
      await PurchaseCost.replaceByCaseId(caseId, costs);

      res.redirect(`/cases/${caseId}?tab=financing&success=${encodeURIComponent('Købsdata gemt')}`);
    } catch (error) {
      next(error);
    }
  }

  static async saveFinancingData(req, res, next) {
    try {
      const caseId = parseInt(req.params.id);
      const investmentCase = await InvestmentCase.findForUser(caseId, req.session.userId);
      if (!investmentCase) {
        return res.status(403).redirect('/properties');
      }

      const loans = parseRows(req.body.loans)
        .map((l) => ({
          label: (l.label || '').trim(),
          amount: parseFloat(l.amount) || 0,
          interest_rate_pct: parseFloat(l.interest_rate_pct) || 0,
          term_years: parseInt(l.term_years) || 30,
          interest_only_years: parseInt(l.interest_only_years) || 0,
          loan_type: l.loan_type || 'fixed',
        }))
        .filter(l => l.label && l.amount > 0);

      if (loans.length === 0) {
        return res.redirect(`/cases/${caseId}?tab=financing&error=Tilføj+mindst+et+lån`);
      }

      await Loan.replaceByCaseId(caseId, loans);
      res.redirect(`/cases/${caseId}?tab=operating&success=${encodeURIComponent('Finansiering gemt')}`);
    } catch (error) {
      next(error);
    }
  }

  static async saveOperatingAndRental(req, res, next) {
    try {
      const caseId = parseInt(req.params.id);
      const investmentCase = await InvestmentCase.findForUser(caseId, req.session.userId);
      if (!investmentCase) {
        return res.status(404).send('Case ikke fundet');
      }

      const items = parseRows(req.body.operating_costs).map((c) => ({
        category: (c.category || '').trim(),
        monthly_amount: parseFloat(c.monthly_amount) || 0,
      }));
      await OperatingCost.replaceByCaseId(caseId, items);

      await RentalSettings.upsert(caseId, {
        is_rental: req.body.is_rental === 'on' || req.body.is_rental === '1' || req.body.is_rental === 'true',
        monthly_rent: parseFloat(req.body.monthly_rent) || 0,
        vacancy_rate_pct: parseFloat(req.body.vacancy_rate_pct) || 5,
        annual_rent_increase_pct: parseFloat(req.body.annual_rent_increase_pct) || 2,
      });

      res.redirect(`/cases/${caseId}?tab=renovations&success=${encodeURIComponent('Drift og udlejning gemt')}`);
    } catch (error) {
      next(error);
    }
  }

  static async saveRenovationsData(req, res, next) {
    try {
      const caseId = parseInt(req.params.id);
      const investmentCase = await InvestmentCase.findForUser(caseId, req.session.userId);
      if (!investmentCase) {
        return res.status(403).redirect('/properties');
      }

      // TODO: validere at month_in_period < simulation_years * 12
      const renovations = parseRows(req.body.renovations).map((r) => ({
        label: (r.label || '').trim(),
        cost: parseFloat(r.cost) || 0,
        value_increase: parseFloat(r.value_increase) || 0,
        month_in_period: parseInt(r.month_in_period) || 1,
      }));
      await Renovation.gemForCase(caseId, renovations);

      res.redirect(`/cases/${caseId}?tab=summary&success=${encodeURIComponent('Renoveringer gemt')}`);
    } catch (error) {
      next(error);
    }
  }

  static async deleteCase(req, res, next) {
    try {
      const investmentCase = await InvestmentCase.findForUser(parseInt(req.params.id), req.session.userId);
      if (!investmentCase) {
        return res.status(403).redirect('/properties');
      }

      const propertyId = investmentCase.property_id;
      await InvestmentCase.delete(investmentCase.id);
      res.redirect(`/properties/${propertyId}`);
    } catch (error) {
      next(error);
    }
  }

  static async duplicateCase(req, res, next) {
    try {
      const investmentCase = await InvestmentCase.findForUser(parseInt(req.params.id), req.session.userId);
      if (!investmentCase) {
        return res.status(403).redirect('/properties');
      }

      const newName = req.body.name || `${investmentCase.name} (kopi)`;
      const newCase = await InvestmentCase.duplicate(investmentCase.id, newName);
      res.redirect(`/cases/${newCase.id}`);
    } catch (error) {
      next(error);
    }
  }

  static calcMonthlyPayments(loans) {
    let during = 0;
    let after = 0;
    let hasIo = false;

    for (const l of loans) {
      if (!l.amount || l.amount <= 0) continue;

      const ioMonths = (l.interest_only_years || 0) * 12;
      const fullPayment = LoanCalculator.månedligYdelse(l.amount, l.interest_rate_pct, l.term_years);

      if (ioMonths > 0) {
        hasIo = true;
        during += LoanCalculator.afdragsfriYdelse(l.amount, l.interest_rate_pct);
        after += LoanCalculator.ydelseEfterAfdragsfri(l.amount, l.interest_rate_pct, l.term_years, ioMonths);
      } else {
        during += fullPayment;
        after += fullPayment;
      }
    }

    return { during, after, hasIo };
  }
}

module.exports = { CaseController };
