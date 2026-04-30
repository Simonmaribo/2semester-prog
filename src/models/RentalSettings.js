import { DatabaseController } from '../controllers/DatabaseController.js';

export class RentalSettings {
  constructor(data) {
    this.id = data.id;
    this.case_id = data.case_id;
    this.is_rental = data.is_rental;
    this.monthly_rent = data.monthly_rent;
    this.vacancy_rate_pct = data.vacancy_rate_pct;
    this.annual_rent_increase_pct = data.annual_rent_increase_pct;
  }

  static async findByCaseId(caseId) {
    const pool = await DatabaseController.getPool();
    const result = await pool.request()
      .input('caseId', caseId)
      .query('SELECT * FROM rental_settings WHERE case_id = @caseId');

    if (result.recordset.length === 0) return null;
    return new RentalSettings(result.recordset[0]);
  }

  static async upsert(caseId, data) {
    const pool = await DatabaseController.getPool();

    const existing = await pool.request()
      .input('caseId', caseId)
      .query('SELECT id FROM rental_settings WHERE case_id = @caseId');

    if (existing.recordset.length > 0) {
      await pool.request()
        .input('caseId', caseId)
        .input('is_rental', data.is_rental ? 1 : 0)
        .input('monthly_rent', data.monthly_rent || 0)
        .input('vacancy_rate_pct', data.vacancy_rate_pct || 5)
        .input('annual_rent_increase_pct', data.annual_rent_increase_pct || 2)
        .query(`
          UPDATE rental_settings
          SET is_rental = @is_rental, monthly_rent = @monthly_rent,
              vacancy_rate_pct = @vacancy_rate_pct, annual_rent_increase_pct = @annual_rent_increase_pct
          WHERE case_id = @caseId
        `);
    } else {
      await pool.request()
        .input('caseId', caseId)
        .input('is_rental', data.is_rental ? 1 : 0)
        .input('monthly_rent', data.monthly_rent || 0)
        .input('vacancy_rate_pct', data.vacancy_rate_pct || 5)
        .input('annual_rent_increase_pct', data.annual_rent_increase_pct || 2)
        .query(`
          INSERT INTO rental_settings (case_id, is_rental, monthly_rent, vacancy_rate_pct, annual_rent_increase_pct)
          VALUES (@caseId, @is_rental, @monthly_rent, @vacancy_rate_pct, @annual_rent_increase_pct)
        `);
    }
  }
}
