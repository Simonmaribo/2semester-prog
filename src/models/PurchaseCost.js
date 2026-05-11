const { DatabaseController } = require('../controllers/DatabaseController.js');

class PurchaseCost {
  constructor(data) {
    this.id = data.id;
    this.case_id = data.case_id;
    this.label = data.label;
    this.amount = data.amount;
  }

  static async findByCaseId(caseId) {
    const pool = await DatabaseController.getPool();
    const result = await pool.request()
      .input('caseId', caseId)
      .query('SELECT * FROM purchase_costs WHERE case_id = @caseId ORDER BY id');

    return result.recordset.map((row) => new PurchaseCost(row));
  }

  static async replaceByCaseId(caseId, items){
    const pool = await DatabaseController.getPool();

    await pool.request()
      .input('caseId', caseId)
      .query('DELETE FROM purchase_costs WHERE case_id = @caseId');

    for (const item of items) {
      if (item.label && item.amount >= 0) {
        await pool.request()
          .input('caseId', caseId)
          .input('label', item.label)
          .input('amount', item.amount)
          .query('INSERT INTO purchase_costs (case_id, label, amount) VALUES (@caseId, @label, @amount)');
      }
    }
  }
}

module.exports = { PurchaseCost };
