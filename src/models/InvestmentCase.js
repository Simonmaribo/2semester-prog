const { DatabaseController } = require('../controllers/DatabaseController.js');

class InvestmentCase {
  constructor(data) {
    this.id = data.id;
    this.property_id = data.property_id;
    this.name = data.name;
    this.description = data.description;
    this.purchase_price = data.purchase_price;
    this.simulation_years = data.simulation_years;
    this.annual_appreciation_pct = data.annual_appreciation_pct;
    this.created_at = data.created_at;
  }

  static async findByPropertyId(propertyId) {
    const pool = await DatabaseController.getPool();
    const result = await pool.request()
      .input('propertyId', propertyId)
      .query('SELECT * FROM investment_cases WHERE property_id = @propertyId ORDER BY created_at DESC');

    return result.recordset.map((row) => new InvestmentCase(row));
  }

  static async findByUserId(userId) {
    const pool = await DatabaseController.getPool();
    const result = await pool.request()
      .input('userId', userId)
      .query(`
        SELECT ic.*, p.address AS property_address
        FROM investment_cases ic
        JOIN properties p ON ic.property_id = p.id
        WHERE p.user_id = @userId
        ORDER BY ic.created_at DESC
      `);

    return result.recordset.map((row) => new InvestmentCase(row));
  }

  static async findById(id) {
    const pool = await DatabaseController.getPool();
    const result = await pool.request()
      .input('id', id)
      .query('SELECT * FROM investment_cases WHERE id = @id');

    if (result.recordset.length === 0) return null;
    return new InvestmentCase(result.recordset[0]);
  }

  static async findForUser(id, userId) {
    const pool = await DatabaseController.getPool();
    const result = await pool.request()
      .input('id', id)
      .input('userId', userId)
      .query(`
        SELECT ic.*
        FROM investment_cases ic
        JOIN properties p ON p.id = ic.property_id
        WHERE ic.id = @id AND p.user_id = @userId
      `);

    if (result.recordset.length === 0) return null;
    return new InvestmentCase(result.recordset[0]);
  }

  static async create(data) {
    const pool = await DatabaseController.getPool();
    const result = await pool.request()
      .input('property_id', data.property_id)
      .input('name', data.name)
      .input('description', data.description || null)
      .query(`
        INSERT INTO investment_cases (property_id, name, description)
        OUTPUT INSERTED.*
        VALUES (@property_id, @name, @description)
      `);

    return new InvestmentCase(result.recordset[0]);
  }

  static async update(id, data) {
    const existing = await InvestmentCase.findById(id);
    if (!existing) return;

    const pool = await DatabaseController.getPool();
    await pool.request()
      .input('id', id)
      .input('name', data.name ?? existing.name)
      .input('description', data.description ?? existing.description)
      .input('purchase_price', data.purchase_price ?? existing.purchase_price)
      .input('simulation_years', data.simulation_years ?? existing.simulation_years)
      .input('annual_appreciation_pct', data.annual_appreciation_pct ?? existing.annual_appreciation_pct)
      .query(`
        UPDATE investment_cases
        SET name = @name,
            description = @description,
            purchase_price = @purchase_price,
            simulation_years = @simulation_years,
            annual_appreciation_pct = @annual_appreciation_pct
        WHERE id = @id
      `);
  }

  static async delete(id) {
    const pool = await DatabaseController.getPool();
    await pool.request()
      .input('id', id)
      .query('DELETE FROM investment_cases WHERE id = @id');
  }

  static async duplicate(id, newName) {
    const pool = await DatabaseController.getPool();

    const original = await pool.request()
      .input('id', id)
      .query('SELECT * FROM investment_cases WHERE id = @id');

    if (original.recordset.length === 0) {
      throw new Error('Case ikke fundet');
    }

    const orig = original.recordset[0];

    const newCase = await pool.request()
      .input('property_id', orig.property_id)
      .input('name', newName)
      .input('description', orig.description)
      .input('purchase_price', orig.purchase_price)
      .input('simulation_years', orig.simulation_years)
      .input('annual_appreciation_pct', orig.annual_appreciation_pct)
      .query(`
        INSERT INTO investment_cases (property_id, name, description, purchase_price, simulation_years, annual_appreciation_pct)
        OUTPUT INSERTED.*
        VALUES (@property_id, @name, @description, @purchase_price, @simulation_years, @annual_appreciation_pct)
      `);

    const newCaseId = newCase.recordset[0].id;

    // kopier alle tilknyttede data over til den nye case
    await pool.request()
      .input('oldCaseId', id)
      .input('newCaseId', newCaseId)
      .query(`
        INSERT INTO purchase_costs (case_id, label, amount)
        SELECT @newCaseId, label, amount FROM purchase_costs WHERE case_id = @oldCaseId
      `);

    await pool.request()
      .input('oldCaseId', id)
      .input('newCaseId', newCaseId)
      .query(`
        INSERT INTO loans (case_id, label, amount, interest_rate_pct, term_years, interest_only_years, loan_type)
        SELECT @newCaseId, label, amount, interest_rate_pct, term_years, interest_only_years, loan_type FROM loans WHERE case_id = @oldCaseId
      `);

    await pool.request()
      .input('oldCaseId', id)
      .input('newCaseId', newCaseId)
      .query(`
        INSERT INTO renovations (case_id, label, cost, value_increase, month_in_period)
        SELECT @newCaseId, label, cost, value_increase, month_in_period FROM renovations WHERE case_id = @oldCaseId
      `);

    await pool.request()
      .input('oldCaseId', id)
      .input('newCaseId', newCaseId)
      .query(`
        INSERT INTO operating_costs (case_id, category, monthly_amount)
        SELECT @newCaseId, category, monthly_amount FROM operating_costs WHERE case_id = @oldCaseId
      `);

    await pool.request()
      .input('oldCaseId', id)
      .input('newCaseId', newCaseId)
      .query(`
        INSERT INTO rental_settings (case_id, is_rental, monthly_rent, vacancy_rate_pct, annual_rent_increase_pct)
        SELECT @newCaseId, is_rental, monthly_rent, vacancy_rate_pct, annual_rent_increase_pct FROM rental_settings WHERE case_id = @oldCaseId
      `);

    return new InvestmentCase(newCase.recordset[0]);
  }
}

module.exports = { InvestmentCase };
