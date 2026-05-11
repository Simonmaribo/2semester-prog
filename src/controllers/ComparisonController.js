const { InvestmentCase } = require('../models/InvestmentCase.js');
const { SimulationController } = require('./SimulationController.js');

class ComparisonController {
  static async showComparison(req, res) {
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
        });
      }

      const data1 = await SimulationController.getCaseSimulation(case1Id, userId);
      const data2 = await SimulationController.getCaseSimulation(case2Id, userId);

      if (!data1 || !data2) {
        return res.render('comparison', {
          title: 'Sammenlign cases',
          allCases,
          comparison: null,
          error: 'En eller begge cases kunne ikke findes.',
        });
      }

      res.render('comparison', {
        title: 'Sammenlign cases',
        allCases,
        comparison: { case1: data1, case2: data2 },
      });
    } catch (error) {
      console.error('sammenlign fejl:', error);
      res.status(500).render('error', {
        title: 'Fejl',
        message: 'Kunne ikke hente sammenligningen.',
        error: error.message,
      });
    }
  }
}

module.exports = { ComparisonController };
