const { DatabaseController } = require('../controllers/DatabaseController.js');

const OPERATING_COST_CATEGORIES = [
  'Ejendomsskat',
  'Forsikring',
  'Vedligeholdelse',
  'Fællesudgifter',
  'Administration',
  'Andet',
];

class OperatingCost {
  constructor(data) {
    this.id = data.id;
    this.case_id = data.case_id;
    this.category = data.category;
    this.monthly_amount = data.monthly_amount;
  }

  static async hentForCase(caseId){
    const pool = await DatabaseController.getPool();
    const result = await pool.request()
      .input('caseId', caseId)
      .query('SELECT * FROM operating_costs WHERE case_id = @caseId ORDER BY category');

    return result.recordset.map((row) => new OperatingCost(row));
  }

  static async replaceByCaseId(caseId, items) {
    const pool = await DatabaseController.getPool();

    await pool.request()
      .input('caseId', caseId)
      .query('DELETE FROM operating_costs WHERE case_id = @caseId');

    for (const item of items) {
      if (item.category) {
        await pool.request()
          .input('caseId', caseId)
          .input('category', item.category)
          .input('monthly_amount', item.monthly_amount || 0)
          .query('INSERT INTO operating_costs (case_id, category, monthly_amount) VALUES (@caseId, @category, @monthly_amount)');
      }
    }
  }
}

module.exports = { OperatingCost, OPERATING_COST_CATEGORIES };
