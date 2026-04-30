import { InvestmentCase } from '../models/InvestmentCase.js';
import { Property } from '../models/Property.js';
import { PurchaseCost } from '../models/PurchaseCost.js';
import { Loan } from '../models/Loan.js';
import { Renovation } from '../models/Renovation.js';
import { OperatingCost } from '../models/OperatingCost.js';
import { RentalSettings } from '../models/RentalSettings.js';
import { SimulationEngine } from '../services/SimulationEngine.js';

export class SimulationController {
  static async showSimulation(req, res, next) {
    try {
      const caseId = parseInt(req.params.id);
      const investmentCase = await InvestmentCase.findByIdForUser(caseId, req.session.userId);

      if (!investmentCase) {
        res.status(404).render('error', {
          title: 'Ikke fundet', message: 'Investeringscase ikke fundet.', error: null, user: res.locals.user
        });
        return;
      }

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
          amount: l.amount,
          interestRatePct: l.interest_rate_pct,
          termYears: l.term_years,
          interestOnlyYears: l.interest_only_years,
          loanType: l.loan_type,
        })),
        renovations: renovations.map(r => ({
          cost: r.cost,
          valueIncrease: r.value_increase,
          monthInPeriod: r.month_in_period,
        })),
        operatingCosts: operatingCosts.map(c => ({
          category: c.category,
          monthlyAmount: c.monthly_amount,
        })),
        rental: rentalSettings ? {
          isRental: rentalSettings.is_rental,
          monthlyRent: rentalSettings.monthly_rent,
          vacancyRatePct: rentalSettings.vacancy_rate_pct,
          annualRentIncreasePct: rentalSettings.annual_rent_increase_pct,
        } : null,
        simulationYears: investmentCase.simulation_years,
        annualAppreciationPct: investmentCase.annual_appreciation_pct,
      };

      const result = SimulationEngine.simulate(simulationInput);

      res.render('simulation', {
        title: `Simulering: ${investmentCase.name}`,
        investmentCase,
        property,
        result,
        yearlyResults: result.yearlyResults,
        totalInitialInvestment: result.totalInitialInvestment,
        user: res.locals.user,
      });
    } catch (error) {
      next(error);
    }
  }
}
