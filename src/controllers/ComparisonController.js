import { InvestmentCase } from '../models/InvestmentCase.js';
import { PurchaseCost } from '../models/PurchaseCost.js';
import { Loan } from '../models/Loan.js';
import { Renovation } from '../models/Renovation.js';
import { OperatingCost } from '../models/OperatingCost.js';
import { RentalSettings } from '../models/RentalSettings.js';
import { Property } from '../models/Property.js';
import { SimulationEngine } from '../services/SimulationEngine.js';

export class ComparisonController {
  static async showComparison(req, res, next) {
    try {
      const userId = req.session.userId;
      const case1Id = req.query.case1 ? parseInt(req.query.case1) : null;
      const case2Id = req.query.case2 ? parseInt(req.query.case2) : null;

      const allCases = await InvestmentCase.findByUserId(userId);

      if (!case1Id || !case2Id) {
        res.render('comparison', {
          title: 'Sammenlign cases',
          allCases,
          comparison: null,
          user: res.locals.user,
        });
        return;
      }

      const data1 = await ComparisonController.getCaseSimulation(case1Id, userId);
      const data2 = await ComparisonController.getCaseSimulation(case2Id, userId);

      if (!data1 || !data2) {
        res.render('comparison', {
          title: 'Sammenlign cases',
          allCases,
          comparison: null,
          user: res.locals.user,
          error: 'En eller begge cases kunne ikke findes.',
        });
        return;
      }

      res.render('comparison', {
        title: 'Sammenlign cases',
        allCases,
        comparison: { case1: data1, case2: data2 },
        user: res.locals.user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCaseSimulation(caseId, userId) {
    const investmentCase = await InvestmentCase.findByIdForUser(caseId, userId);
    if (!investmentCase) return null;

    const property = await Property.findById(investmentCase.property_id);

    const purchaseCosts = await PurchaseCost.findByCaseId(caseId);
    const loans = await Loan.findByCaseId(caseId);
    const renovations = await Renovation.findByCaseId(caseId);
    const operatingCosts = await OperatingCost.findByCaseId(caseId);
    const rentalSettings = await RentalSettings.findByCaseId(caseId);

    const simulationInput = {
      purchasePrice: investmentCase.purchase_price,
      purchaseCosts: purchaseCosts.map(c => ({ label: c.label, amount: c.amount })),
      loans: loans.map(l => ({
        amount: l.amount, interestRatePct: l.interest_rate_pct,
        termYears: l.term_years, interestOnlyYears: l.interest_only_years, loanType: l.loan_type,
      })),
      renovations: renovations.map(r => ({
        cost: r.cost, valueIncrease: r.value_increase, monthInPeriod: r.month_in_period,
      })),
      operatingCosts: operatingCosts.map(c => ({ category: c.category, monthlyAmount: c.monthly_amount })),
      rental: rentalSettings ? {
        isRental: rentalSettings.is_rental, monthlyRent: rentalSettings.monthly_rent,
        vacancyRatePct: rentalSettings.vacancy_rate_pct, annualRentIncreasePct: rentalSettings.annual_rent_increase_pct,
      } : null,
      simulationYears: investmentCase.simulation_years,
      annualAppreciationPct: investmentCase.annual_appreciation_pct,
    };

    const result = SimulationEngine.simulate(simulationInput);

    return {
      investmentCase,
      property,
      result,
    };
  }
}
