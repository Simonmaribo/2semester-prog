const { DatabaseController } = require('../controllers/DatabaseController.js');

class Property {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.address = data.address;
    this.property_type = data.property_type;
    this.build_year = data.build_year;
    this.living_area = data.living_area;
    this.rooms = data.rooms;
    this.latitude = data.latitude;
    this.longitude = data.longitude;
    this.dawa_address_id = data.dawa_address_id;
    this.created_at = data.created_at;
    this.case_count = data.case_count;
  }

  static async findByUserId(userId) {
    const pool = await DatabaseController.getPool();
    const result = await pool.request()
      .input('userId', userId)
      .query(`
        SELECT p.*,
               (SELECT COUNT(*) FROM investment_cases ic WHERE ic.property_id = p.id) AS case_count
        FROM properties p
        WHERE p.user_id = @userId
        ORDER BY p.created_at DESC
      `);

    return result.recordset.map((row) => new Property(row));
  }

  static async findById(id) {
    const pool = await DatabaseController.getPool();
    const result = await pool.request()
      .input('id', id)
      .query('SELECT * FROM properties WHERE id = @id');

    if (result.recordset.length === 0) return null;
    return new Property(result.recordset[0]);
  }

  static async create(data) {
    const pool = await DatabaseController.getPool();
    const result = await pool.request()
      .input('user_id', data.user_id)
      .input('address', data.address)
      .input('property_type', data.property_type || null)
      .input('build_year', data.build_year || null)
      .input('living_area', data.living_area || null)
      .input('rooms', data.rooms || null)
      .input('latitude', data.latitude || null)
      .input('longitude', data.longitude || null)
      .input('dawa_address_id', data.dawa_address_id || null)
      .query(`
        INSERT INTO properties (user_id, address, property_type, build_year, living_area, rooms, latitude, longitude, dawa_address_id)
        OUTPUT INSERTED.*
        VALUES (@user_id, @address, @property_type, @build_year, @living_area, @rooms, @latitude, @longitude, @dawa_address_id)
      `);

    return new Property(result.recordset[0]);
  }

  static async delete(id) {
    const pool = await DatabaseController.getPool();
    await pool.request()
      .input('id', id)
      .query('DELETE FROM properties WHERE id = @id');
  }
}

module.exports = { Property };
