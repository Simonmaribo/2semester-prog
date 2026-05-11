const { InvestmentCase } = require('../models/InvestmentCase.js');
const { Property } = require('../models/Property.js');
const { PurchaseCost } = require('../models/PurchaseCost.js');
const { Loan } = require('../models/Loan.js');
const { Renovation } = require('../models/Renovation.js');
const { OperatingCost } = require('../models/OperatingCost.js');
const { RentalSettings } = require('../models/RentalSettings.js');
const { SimulationEngine } = require('../services/SimulationEngine.js');

class SimulationController {
  static async showSimulation(req, res, next) {
    try {
      const caseId = parseInt(req.params.id);

      const data = await SimulationController.getCaseSimulation(caseId, req.session.userId);

      if (!data) {
        return res.status(404).render('error', {
          title: 'Ikke fundet', message: 'Investeringscase ikke fundet.', error: null,
        });
      }

      const { investmentCase, property, result } = data;

      res.render('simulation', {
        title: `Simulering: ${investmentCase.name}`,
        investmentCase,
        property,
        result,
        yearlyResults: result.yearlyResults,
        totalInitialInvestment: result.totalInitialInvestment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCaseSimulation(caseId, userId) {
    const investmentCase = await InvestmentCase.findForUser(caseId, userId);
    if (!investmentCase) {
      return null;
    }

    const property = await Property.findById(investmentCase.property_id);

    const purchaseCosts = await PurchaseCost.findByCaseId(caseId);
    const loans = await Loan.findByCaseId(caseId);
    const renovations = await Renovation.findByCaseId(caseId);
    const operatingCosts = await OperatingCost.hentForCase(caseId);
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

module.exports = { SimulationController };
