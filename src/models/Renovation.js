const { DatabaseController } = require('../controllers/DatabaseController.js');

class Renovation {
  constructor(data) {
    this.id = data.id;
    this.case_id = data.case_id;
    this.label = data.label;
    this.cost = data.cost;
    this.value_increase = data.value_increase;
    this.month_in_period = data.month_in_period;
  }

  static async findByCaseId(caseId) {
    const pool = await DatabaseController.getPool();
    const result = await pool.request()
      .input('caseId', caseId)
      .query('SELECT * FROM renovations WHERE case_id = @caseId ORDER BY month_in_period');

    return result.recordset.map((row) => new Renovation(row));
  }

  static async gemForCase(caseId, items) {
    const pool = await DatabaseController.getPool();

    await pool.request()
      .input('caseId', caseId)
      .query('DELETE FROM renovations WHERE case_id = @caseId');

    for (const item of items) {
      if (item.label && item.cost >= 0) {
        await pool.request()
          .input('caseId', caseId)
          .input('label', item.label)
          .input('cost', item.cost)
          .input('value_increase', item.value_increase || 0)
          .input('month_in_period', item.month_in_period || 1)
          .query(`
            INSERT INTO renovations (case_id, label, cost, value_increase, month_in_period)
            VALUES (@caseId, @label, @cost, @value_increase, @month_in_period)
          `);
      }
    }
  }
}

module.exports = { Renovation };
