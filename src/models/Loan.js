const { DatabaseController } = require('../controllers/DatabaseController.js');

class Loan {
  constructor(data) {
    this.id = data.id;
    this.case_id = data.case_id;
    this.label = data.label;
    this.amount = data.amount;
    this.interest_rate_pct = data.interest_rate_pct;
    this.term_years = data.term_years;
    this.interest_only_years = data.interest_only_years;
    this.loan_type = data.loan_type;
  }

  static async findByCaseId(caseId) {
    const pool = await DatabaseController.getPool();
    const result = await pool.request()
      .input('caseId', caseId)
      .query('SELECT * FROM loans WHERE case_id = @caseId ORDER BY id');

    return result.recordset.map((row) => new Loan(row));
  }

  static async replaceByCaseId(caseId, items) {
    const pool = await DatabaseController.getPool();

    await pool.request()
      .input('caseId', caseId)
      .query('DELETE FROM loans WHERE case_id = @caseId');

    for (const item of items) {
      if (item.label && item.amount > 0) {
        await pool.request()
          .input('caseId', caseId)
          .input('label', item.label)
          .input('amount', item.amount)
          .input('interest_rate_pct', item.interest_rate_pct)
          .input('term_years', item.term_years)
          .input('interest_only_years', item.interest_only_years || 0)
          .input('loan_type', item.loan_type || 'fixed')
          .query(`
            INSERT INTO loans (case_id, label, amount, interest_rate_pct, term_years, interest_only_years, loan_type)
            VALUES (@caseId, @label, @amount, @interest_rate_pct, @term_years, @interest_only_years, @loan_type)
          `);
      }
    }
  }
}

module.exports = { Loan };
