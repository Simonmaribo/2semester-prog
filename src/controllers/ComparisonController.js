import { InvestmentCase } from '../models/InvestmentCase.js';
import { SimulationController } from './SimulationController.js';

export class ComparisonController {
  static async showComparison(req, res, next) {
    try {
      const userId = req.session.userId;
      const case1Id = req.query.case1 ? parseInt(req.query.case1) : null;
      const case2Id = req.query.case2 ? parseInt(req.query.case2) : null;

      const allCases = await InvestmentCase.findByUserId(userId);

      if (!case1Id || !case2Id) {
        return res.render('comparison', {
          title: 'Sammenlign cases',
          allCases,
          comparison: null,
          user: res.locals.user,
        });
      }

      const data1 = await SimulationController.getCaseSimulation(case1Id, userId);
      const data2 = await SimulationController.getCaseSimulation(case2Id, userId);

      if (!data1 || !data2) {
        return res.render('comparison', {
          title: 'Sammenlign cases',
          allCases,
          comparison: null,
          user: res.locals.user,
          error: 'En eller begge cases kunne ikke findes.',
        });
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
}
